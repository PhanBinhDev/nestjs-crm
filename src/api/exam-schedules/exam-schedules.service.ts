import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { ResponseDto } from '@/common/dto/response/response.dto';
import { ExamSchedule } from './entities/exam-schedule.entity';
import {
  ImportExamScheduleDto,
  ImportExamSchedulesResponseDto,
} from './dto/import-exam-schedule.dto';

@Injectable()
export class ExamSchedulesService {
  private readonly logger = new Logger(ExamSchedulesService.name);

  constructor(
    @InjectRepository(ExamSchedule)
    private readonly examScheduleRepository: Repository<ExamSchedule>,
  ) {}

  async importExamSchedules(
    file: Express.Multer.File,
  ): Promise<ResponseDto<ImportExamSchedulesResponseDto>> {
    if (!file) {
      throw new BadRequestException('Vui lòng upload file Excel');
    }

    // Kiểm tra file extension
    const allowedExtensions = ['.xlsx', '.xls'];
    const fileExtension = file.originalname
      .toLowerCase()
      .substring(file.originalname.lastIndexOf('.'));

    if (!allowedExtensions.includes(fileExtension)) {
      throw new BadRequestException(
        'Chỉ hỗ trợ file Excel (.xlsx, .xls)',
      );
    }

    try {
      this.logger.log('Bắt đầu đọc file Excel...');
      // Đọc file Excel
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      
      // CHỈ ĐỌC SHEET ĐẦU TIÊN (sheet được chỉ định khi export từ Google Sheets)
      // Khi export từ Google Sheets với gid, file sẽ chỉ chứa sheet đó
      if (workbook.SheetNames.length === 0) {
        throw new BadRequestException('File Excel không có sheet nào');
      }
      
      // Chỉ đọc sheet đầu tiên, bỏ qua các sheet khác
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      if (workbook.SheetNames.length > 1) {
        this.logger.warn(
          `File Excel có ${workbook.SheetNames.length} sheets, chỉ đọc sheet đầu tiên: "${sheetName}". Các sheet khác sẽ bị bỏ qua: ${workbook.SheetNames.slice(1).join(', ')}`,
        );
      } else {
        this.logger.log(`Đã đọc file, sheet: ${sheetName} (tổng số: 1 sheet)`);
      }

      // Đọc header row trực tiếp từ worksheet (dòng 2, index 1)
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      const headerRow: string[] = [];
      
      // Đọc dòng thứ 2 (index 1) làm header row (bỏ qua dòng 1)
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 1, c: col }); // r: 1 = dòng thứ 2
        const cell = worksheet[cellAddress];
        const headerValue = cell ? (cell.w || cell.v || '').toString().trim() : '';
        headerRow.push(headerValue);
      }
      
      this.logger.log(`Header row từ worksheet (dòng 2): ${JSON.stringify(headerRow)}`);
      
      // Chuyển đổi thành JSON với tên cột từ header row ở dòng 2
      // Đọc tất cả dữ liệu từ dòng 2 trở đi
      const allData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1, // Đọc thành array of arrays
        defval: '', // Giá trị mặc định cho cell trống
        raw: false, // Parse dates và numbers
      });
      
      if (allData.length < 2) {
        throw new BadRequestException('File Excel phải có ít nhất 1 dòng header và 1 dòng dữ liệu');
      }
      
      // Lấy header từ dòng thứ 2 (index 1)
      const headerRowData = allData[1] as any[];
      
      // Hàm normalize để tìm kiếm chính xác hơn
      const normalizeKey = (key: string): string => {
        return key
          .trim()
          .replace(/\s+/g, ' ')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase();
      };
      
      // Danh sách các cột cần thiết (chỉ các cột màu đỏ)
      const requiredColumns = [
        'STT',
        'Ngày thi',
        'Ca',
        'Tòa nhà',
        'Campus',
        'Phòng thi',
        'Mã môn',
        'Mã ca thi',
        'Loại thi',
        'LỚP',
        'Giảng viên',
        'Bộ môn',
        'GIÁM THỊ 1',
        'GIÁM THỊ 2',
      ];
      
      // Chỉ tìm và map các cột cần thiết (không lưu tất cả các cột)
      const columnMap: { [key: string]: number } = {};
      
      headerRowData.forEach((header, index) => {
        if (!header) return;
        const headerStr = header.toString().trim();
        if (!headerStr) return;
        
        // Tìm xem header này có match với cột cần thiết nào không
        for (const requiredCol of requiredColumns) {
          const normalizedHeader = normalizeKey(headerStr);
          const normalizedRequired = normalizeKey(requiredCol);
          
          if (normalizedHeader === normalizedRequired ||
              headerStr === requiredCol ||
              headerStr.toLowerCase() === requiredCol.toLowerCase() ||
              (normalizedHeader.includes('ngay') && normalizedHeader.includes('thi') && requiredCol === 'Ngày thi') ||
              (normalizedHeader === 'ca' && requiredCol === 'Ca')) {
            columnMap[requiredCol] = index;
            break;
          }
        }
      });
      
      this.logger.log(`Tìm thấy ${Object.keys(columnMap).length} cột cần thiết: ${Object.keys(columnMap).join(', ')}`);
      
      // Kiểm tra các cột bắt buộc
      if (!columnMap['Ngày thi']) {
        throw new BadRequestException(
          'File Excel thiếu cột bắt buộc: "Ngày thi". Vui lòng kiểm tra lại header row.',
        );
      }
      if (!columnMap['Ca']) {
        throw new BadRequestException(
          'File Excel thiếu cột bắt buộc: "Ca". Vui lòng kiểm tra lại header row.',
        );
      }

      // Hàm helper để lấy giá trị từ row array theo column index
      const getValueByIndex = (row: any[], columnName: string): any => {
        const colIndex = columnMap[columnName];
        if (colIndex === undefined) return undefined;
        
        // Kiểm tra row có đủ độ dài không
        if (!row || row.length <= colIndex) return undefined;
        
        const value = row[colIndex];
        
        // Xử lý nhiều trường hợp: undefined, null, empty string, whitespace
        if (value === undefined || value === null) return undefined;
        
        // Nếu là string, trim và kiểm tra empty
        if (typeof value === 'string') {
          const trimmed = value.trim();
          return trimmed !== '' ? trimmed : undefined;
        }
        
        // Nếu là number, kiểm tra NaN
        if (typeof value === 'number') {
          return isNaN(value) ? undefined : value;
        }
        
        // Các type khác, trả về nguyên giá trị
        return value;
      };

      const getStringValue = (row: any[], columnName: string): string | null => {
        const value = getValueByIndex(row, columnName);
        return value !== undefined ? String(value).trim() || null : null;
      };

      // Parse và validate trực tiếp từ allData (không tạo rawData array để tiết kiệm memory)
      const totalRows = allData.length - 2; // Trừ đi 2 dòng đầu (dòng 1 và dòng 2 header)
      this.logger.log(`Tổng số dòng trong file: ${totalRows}`);
      
      const errors: Array<{ row: number; error: string }> = [];
      const validSchedules: ExamSchedule[] = [];
      
      // Logic dừng sớm: Nếu gặp nhiều dòng trống liên tiếp (10 dòng), dừng parsing
      const MAX_EMPTY_ROWS = 10;
      let emptyRowCount = 0;
      let lastDataRow = 2; // Track dòng cuối cùng có dữ liệu
      let lastProcessedIndex = 2; // Track index cuối cùng đã xử lý
      let foundFirstDataRow = false; // Track xem đã tìm thấy dòng dữ liệu đầu tiên chưa
      
      for (let i = 2; i < allData.length; i++) {
        lastProcessedIndex = i;
        const row = allData[i] as any[];
        const rowNumber = i + 1; // Số dòng trong Excel (bắt đầu từ 1)
        
        // Log tiến trình mỗi 100 dòng
        const currentRowIndex = i - 1; // Index trong data (bỏ qua 2 dòng đầu)
        if (currentRowIndex % 100 === 0 || i === allData.length - 1) {
          this.logger.log(`Đang parse dòng ${currentRowIndex + 1}/${totalRows}...`);
        }

        try {
          // Validate dữ liệu bắt buộc (chỉ lấy các cột cần thiết)
          // Kiểm tra STT trước để đảm bảo đây là dòng dữ liệu hợp lệ (không phải dữ liệu ẩn hoặc dòng trống)
          const stt = getValueByIndex(row, 'STT');
          const ngayThi = getValueByIndex(row, 'Ngày thi');
          const ca = getValueByIndex(row, 'Ca');
          
          // Nếu không có STT hoặc STT không phải là số hợp lệ -> có thể là dòng trống hoặc dữ liệu ẩn
          if (!stt) {
            // Kiểm tra xem có bất kỳ dữ liệu nào khác không
            let hasAnyData = false;
            for (const colName of Object.keys(columnMap)) {
              if (colName === 'STT') continue; // Bỏ qua STT
              const value = getValueByIndex(row, colName);
              if (value !== undefined && value !== null && value !== '') {
                hasAnyData = true;
                break;
              }
            }
            
            // Nếu không có dữ liệu nào -> bỏ qua
            if (!hasAnyData) {
              if (!foundFirstDataRow) {
                continue;
              }
              emptyRowCount++;
              if (emptyRowCount >= MAX_EMPTY_ROWS) {
                this.logger.log(
                  `Gặp ${MAX_EMPTY_ROWS} dòng trống liên tiếp tại dòng ${rowNumber}. Dừng parsing. Dòng cuối cùng có dữ liệu: ${lastDataRow}`,
                );
                break;
              }
              continue;
            }
          }
          
          // Validate STT là số hợp lệ (nếu có)
          if (stt) {
            const sttNumber = typeof stt === 'number' ? stt : parseInt(String(stt));
            if (isNaN(sttNumber) || sttNumber < 1) {
              // STT không hợp lệ -> có thể là dữ liệu ẩn hoặc dòng không hợp lệ
              this.logger.warn(`Row ${rowNumber}: STT không hợp lệ "${stt}", bỏ qua dòng này`);
              continue; // Bỏ qua dòng có STT không hợp lệ
            }
          }
          
          // Kiểm tra xem dòng có phải là dòng trống hoàn toàn không
          // Nếu cả Ngày thi và Ca đều trống -> bỏ qua dòng này (không coi là lỗi)
          if (!ngayThi && !ca) {
            // Kiểm tra xem có bất kỳ dữ liệu nào khác trong dòng không
            let hasAnyData = false;
            for (const colName of Object.keys(columnMap)) {
              const value = getValueByIndex(row, colName);
              if (value !== undefined && value !== null && value !== '') {
                hasAnyData = true;
                break;
              }
            }
            
            // Nếu không có dữ liệu nào -> đây là dòng trống
            if (!hasAnyData) {
              // Nếu chưa tìm thấy dòng dữ liệu đầu tiên, bỏ qua các dòng trống ở đầu
              if (!foundFirstDataRow) {
                continue; // Bỏ qua dòng trống ở đầu file (trước khi có dữ liệu)
              }
              
              emptyRowCount++;
              
              // Nếu đã tìm thấy dữ liệu và gặp nhiều dòng trống liên tiếp, dừng parsing
              if (emptyRowCount >= MAX_EMPTY_ROWS) {
                this.logger.log(
                  `Gặp ${MAX_EMPTY_ROWS} dòng trống liên tiếp tại dòng ${rowNumber}. Dừng parsing. Dòng cuối cùng có dữ liệu: ${lastDataRow}`,
                );
                break; // Dừng vòng lặp
              }
              
              continue; // Bỏ qua dòng trống, không thêm vào errors
            }
          }
          
          // Reset empty row count khi gặp dòng có dữ liệu
          emptyRowCount = 0;
          lastDataRow = rowNumber;
          foundFirstDataRow = true; // Đã tìm thấy dòng dữ liệu đầu tiên
          
          // Nếu có một phần dữ liệu nhưng thiếu phần bắt buộc -> báo lỗi
          if (!ngayThi || !ca) {
            // Log chi tiết để debug
            const ngayThiRaw = row[columnMap['Ngày thi']];
            const caRaw = row[columnMap['Ca']];
            this.logger.warn(
              `Row ${rowNumber}: Ngày thi="${ngayThiRaw}" (type: ${typeof ngayThiRaw}), Ca="${caRaw}" (type: ${typeof caRaw})`,
            );
            throw new Error('Thiếu thông tin bắt buộc: Ngày thi hoặc Ca');
          }

          // Parse ngày thi
          // Excel có thể parse date theo MM/DD/YYYY (US format) hoặc DD/MM/YYYY (VN format)
          // Ưu tiên parse từ string để đảm bảo đúng format DD/MM/YYYY
          let examDate: Date;
          try {
            const dateValue = ngayThi;
            if (!dateValue) {
              throw new Error('Ngày thi không được để trống');
            }

            // Ưu tiên parse từ string (format DD/MM/YYYY) để tránh nhầm lẫn
            if (typeof dateValue === 'string') {
              const dateStr = dateValue.trim();
              // Thử parse DD/MM/YYYY trước
              const parts = dateStr.split('/');
              if (parts.length === 3) {
                const day = parseInt(parts[0]);
                const month = parseInt(parts[1]);
                const year = parseInt(parts[2]);
                
                // Validate: nếu day > 12 thì chắc chắn là DD/MM/YYYY
                // Nếu day <= 12 và month <= 12, cần kiểm tra thêm
                if (day > 12) {
                  // Chắc chắn là DD/MM/YYYY
                  examDate = new Date(year, month - 1, day);
                } else if (month > 12) {
                  // Chắc chắn là MM/DD/YYYY (nhầm lẫn), swap lại
                  examDate = new Date(year, day - 1, month);
                } else {
                  // Không chắc chắn, ưu tiên DD/MM/YYYY (format Việt Nam)
                  examDate = new Date(year, month - 1, day);
                }
              } else {
                throw new Error('Định dạng ngày không hợp lệ (cần DD/MM/YYYY)');
              }
            } else if (dateValue instanceof Date) {
              // Excel đã parse thành Date object
              // Giữ nguyên vì Excel đã parse đúng theo locale
              examDate = dateValue;
            } else if (typeof dateValue === 'number') {
              // Excel serial date number
              const excelEpoch = new Date(1899, 11, 30);
              examDate = new Date(
                excelEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000,
              );
            } else {
              // Fallback: convert to string và parse
              const dateStr = dateValue.toString().trim();
              const parts = dateStr.split('/');
              if (parts.length === 3) {
                const day = parseInt(parts[0]);
                const month = parseInt(parts[1]);
                const year = parseInt(parts[2]);
                
                if (day > 12) {
                  examDate = new Date(year, month - 1, day);
                } else if (month > 12) {
                  examDate = new Date(year, day - 1, month);
                } else {
                  examDate = new Date(year, month - 1, day);
                }
              } else {
                throw new Error('Định dạng ngày không hợp lệ (cần DD/MM/YYYY)');
              }
            }

            if (isNaN(examDate.getTime())) {
              throw new Error('Ngày thi không hợp lệ');
            }
          } catch (error) {
            throw new Error(`Ngày thi không hợp lệ: ${error.message}`);
          }

          // Parse ca thi - xử lý nhiều format
          let examSession: number;
          try {
            const caValue = ca;
            
            if (typeof caValue === 'number') {
              // Đã là number
              examSession = Math.floor(caValue);
            } else if (typeof caValue === 'string') {
              // Parse từ string
              const trimmed = caValue.trim();
              examSession = parseInt(trimmed);
              
              // Nếu parse không thành công, thử parse float rồi floor
              if (isNaN(examSession)) {
                const floatValue = parseFloat(trimmed);
                if (!isNaN(floatValue)) {
                  examSession = Math.floor(floatValue);
                } else {
                  throw new Error(`Không thể parse "${trimmed}" thành số`);
                }
              }
            } else {
              // Thử convert sang string rồi parse
              examSession = parseInt(String(caValue));
              if (isNaN(examSession)) {
                throw new Error(`Giá trị ca thi không hợp lệ: ${caValue} (type: ${typeof caValue})`);
              }
            }
            
            // Validate số hợp lệ
            if (isNaN(examSession) || examSession < 1) {
              throw new Error(`Ca thi phải là số nguyên >= 1, nhận được: ${examSession}`);
            }
          } catch (error) {
            throw new Error(`Ca thi không hợp lệ: ${error.message}`);
          }

          // Tạo exam schedule entity (chỉ lấy các cột cần thiết)
          // Filter: Kiểm tra xem dòng có đủ dữ liệu để được coi là hợp lệ không
          // Các cột quan trọng nhất (ít nhất 1 trong số này phải có dữ liệu)
          const criticalColumns = [
            'Mã môn',
            'LỚP',
            'Phòng thi',
            'Giảng viên',
          ];
          
          let hasCriticalData = false;
          for (const colName of criticalColumns) {
            const value = getValueByIndex(row, colName);
            if (value !== undefined && value !== null && value !== '') {
              hasCriticalData = true;
              break;
            }
          }
          
          // Nếu không có bất kỳ cột quan trọng nào có dữ liệu, bỏ qua dòng này
          if (!hasCriticalData) {
            this.logger.warn(
              `Row ${rowNumber}: Không có dữ liệu ở các cột quan trọng (Mã môn, LỚP, Phòng thi, Giảng viên), bỏ qua dòng này (có thể là dữ liệu ẩn)`,
            );
            continue;
          }
          
          // Đếm tổng số cột có dữ liệu (không trống)
          let filledColumnsCount = 0;
          const allDataColumns = [
            'Tòa nhà',
            'Campus',
            'Phòng thi',
            'Mã môn',
            'Mã ca thi',
            'Loại thi',
            'LỚP',
            'Giảng viên',
            'Bộ môn',
            'GIÁM THỊ 1',
            'GIÁM THỊ 2',
          ];
          
          for (const colName of allDataColumns) {
            const value = getValueByIndex(row, colName);
            if (value !== undefined && value !== null && value !== '') {
              filledColumnsCount++;
            }
          }
          
          // Nếu có ít hơn 2 cột có dữ liệu (ngoài Ngày thi và Ca), có thể là dữ liệu ẩn
          // Ngày thi và Ca đã được validate trước đó
          if (filledColumnsCount < 2) {
            this.logger.warn(
              `Row ${rowNumber}: Chỉ có ${filledColumnsCount} cột có dữ liệu (cần tối thiểu 2), bỏ qua dòng này (có thể là dữ liệu ẩn)`,
            );
            continue;
          }
          
          // Filter: Chỉ import các lịch thi có ngày thi từ tháng 8/2025 trở đi đến hết năm 2026
          // Điều này giúp loại bỏ các dữ liệu cũ hoặc dữ liệu ẩn có ngày thi không hợp lệ
          const examYear = examDate.getFullYear();
          
          // Chỉ import từ tháng 8/2025 trở đi (01/08/2025)
          const minDate = new Date(2025, 7, 1); // Tháng 8/2025 (month 7 = August, day 1)
          
          if (examDate < minDate) {
            this.logger.warn(
              `Row ${rowNumber}: Ngày thi ${examDate.toISOString().split('T')[0]} < 01/08/2025, bỏ qua (có thể là dữ liệu ẩn)`,
            );
            continue;
          }
          
          // Không import quá xa trong tương lai (không quá năm 2026)
          if (examYear > 2026) {
            this.logger.warn(
              `Row ${rowNumber}: Ngày thi ${examDate.toISOString().split('T')[0]} có năm > 2026, bỏ qua (có thể là dữ liệu ẩn)`,
            );
            continue;
          }

          const examSchedule = this.examScheduleRepository.create({
            examDate,
            examSession,
            building: getStringValue(row, 'Tòa nhà'),
            campus: getStringValue(row, 'Campus'),
            room: getStringValue(row, 'Phòng thi'),
            subjectCode: getStringValue(row, 'Mã môn'),
            sessionCode: getStringValue(row, 'Mã ca thi'),
            examType: getStringValue(row, 'Loại thi'),
            className: getStringValue(row, 'LỚP'),
            lecturer: getStringValue(row, 'Giảng viên'),
            department: getStringValue(row, 'Bộ môn'),
            examiner1: getStringValue(row, 'GIÁM THỊ 1'),
            examiner2: getStringValue(row, 'GIÁM THỊ 2'),
          });

          validSchedules.push(examSchedule);
          
          // Log mỗi 50 records để theo dõi (bao gồm ngày thi để kiểm tra)
          if (validSchedules.length % 50 === 0) {
            this.logger.log(
              `Đã parse ${validSchedules.length} records hợp lệ (dòng ${rowNumber}, ngày: ${examDate.toISOString().split('T')[0]})`,
            );
          }
          
          // Log ngày thi của 10 records đầu tiên để debug
          if (validSchedules.length <= 10) {
            this.logger.log(
              `Record ${validSchedules.length}: STT=${stt || 'N/A'}, Ngày thi=${examDate.toISOString().split('T')[0]}, Ca=${examSession}`,
            );
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          errors.push({
            row: rowNumber,
            error: errorMessage || 'Lỗi không xác định',
          });
          this.logger.warn(
            `Failed to parse row ${rowNumber}: ${errorMessage}`,
          );
        }
      }

      // Log kết quả parsing chi tiết
      const totalParsedRows = lastProcessedIndex - 1; // Số dòng đã được xử lý (trừ 2 dòng header)
      this.logger.log(
        `Hoàn thành parsing: ${totalParsedRows} dòng đã xử lý, ${validSchedules.length} records hợp lệ, ${errors.length} records lỗi`,
      );
      
      // Thống kê các ngày thi được import
      const dateStats: { [key: string]: number } = {};
      validSchedules.forEach((schedule) => {
        const dateStr = schedule.examDate.toISOString().split('T')[0];
        dateStats[dateStr] = (dateStats[dateStr] || 0) + 1;
      });
      this.logger.log(
        `Thống kê ngày thi: ${JSON.stringify(dateStats)}`,
      );
      
      if (validSchedules.length > 100) {
        this.logger.warn(
          `⚠️ CẢNH BÁO: Phát hiện ${validSchedules.length} records hợp lệ - có thể nhiều hơn dữ liệu thực tế. Dòng đầu tiên có dữ liệu: ${foundFirstDataRow ? 'đã tìm thấy' : 'chưa tìm thấy'}, dòng cuối: ${lastDataRow}. Các ngày thi: ${Object.keys(dateStats).join(', ')}`,
        );
      }
      
      // Batch save tất cả records hợp lệ (chunk 100 records/lần để tránh quá tải)
      this.logger.log(`Bắt đầu lưu ${validSchedules.length} records vào database...`);
      const BATCH_SIZE = 100;
      let successCount = 0;

      for (let i = 0; i < validSchedules.length; i += BATCH_SIZE) {
        const batch = validSchedules.slice(i, i + BATCH_SIZE);
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(validSchedules.length / BATCH_SIZE);
        
        try {
          this.logger.log(`Đang lưu batch ${batchNumber}/${totalBatches} (${batch.length} records)...`);
          await this.examScheduleRepository.save(batch);
          successCount += batch.length;
          this.logger.log(`Batch ${batchNumber} đã lưu thành công`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.logger.error(`Lỗi khi lưu batch ${batchNumber}: ${errorMessage}`);
          
          // Nếu là database connection error, throw ngay
          if (errorMessage.includes('ETIMEDOUT') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('connection')) {
            throw new BadRequestException(
              `Lỗi kết nối database khi lưu batch ${batchNumber}. Vui lòng kiểm tra kết nối database và thử lại.`,
            );
          }
          
          // Thêm lỗi cho tất cả records trong batch này
          const startRow = i + 2;
          for (let j = 0; j < batch.length; j++) {
            errors.push({
              row: startRow + j,
              error: `Lỗi khi lưu vào database: ${errorMessage}`,
            });
          }
        }
      }

      const failureCount = errors.length;
      this.logger.log(`Hoàn thành import: ${successCount} thành công, ${failureCount} thất bại`);

      const response: ImportExamSchedulesResponseDto = {
        successCount,
        failureCount,
        errors,
      };

      return new ResponseDto({
        data: response,
        message: `Import thành công ${successCount} lịch thi, ${failureCount} lịch thi thất bại`,
      });
    } catch (error) {
      this.logger.error('Error importing exam schedules:', error);
      
      // Nếu là database connection error
      if (error instanceof Error) {
        if (error.message.includes('ETIMEDOUT') || error.message.includes('ECONNREFUSED') || error.message.includes('connection')) {
          throw new BadRequestException(
            'Không thể kết nối đến database. Vui lòng kiểm tra cấu hình database và thử lại.',
          );
        }
      }
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(
        `Lỗi xử lý file: ${errorMessage}`,
      );
    }
  }

  async importExamSchedulesFromUrl(
    url: string,
  ): Promise<ResponseDto<ImportExamSchedulesResponseDto>> {
    try {
      // Validate và convert URL sang export format
      let exportUrl: string;
      try {
        const urlObj = new URL(url);
        
        // Kiểm tra là Google Sheets URL
        if (
          !urlObj.hostname.includes('docs.google.com') ||
          !urlObj.pathname.includes('/spreadsheets/')
        ) {
          throw new BadRequestException(
            'URL không phải là Google Sheets. Vui lòng cung cấp URL Google Sheets hợp lệ.',
          );
        }

        // Extract spreadsheet ID từ pathname
        // Format: /spreadsheets/d/{SPREADSHEET_ID}/edit hoặc /spreadsheets/d/{SPREADSHEET_ID}/export
        const spreadsheetIdMatch = urlObj.pathname.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (!spreadsheetIdMatch) {
          throw new BadRequestException(
            'Không thể tìm thấy Spreadsheet ID trong URL.',
          );
        }
        const spreadsheetId = spreadsheetIdMatch[1];

                 // Lấy gid từ URL (có thể ở query params hoặc hash)
         // Nếu không có gid, sẽ export sheet đầu tiên mặc định
         let gid: string | null = null;
         
         // Thử lấy từ query params
         gid = urlObj.searchParams.get('gid');
         
         // Nếu không có trong query, thử lấy từ hash (#gid=...)
         if (!gid && urlObj.hash) {
           const hashMatch = urlObj.hash.match(/[#&]gid=([0-9]+)/);
           if (hashMatch) {
             gid = hashMatch[1];
           }
         }

         // Tạo export URL
         // Nếu có gid, export sheet được chỉ định
         // Nếu không có gid, export sheet đầu tiên (Sheet1) mặc định
         if (gid) {
           exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=xlsx&gid=${gid}`;
           this.logger.log(
             `Export sheet với gid=${gid} từ spreadsheet ${spreadsheetId} (CHỈ sheet này sẽ được export)`,
           );
         } else {
           exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=xlsx`;
           this.logger.log(
             `Không có gid trong URL, export sheet đầu tiên (Sheet1) mặc định từ spreadsheet ${spreadsheetId}`,
           );
         }

        this.logger.log(`Converted URL: ${url} -> ${exportUrl}`);
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw error;
        }
        throw new BadRequestException('Định dạng URL không hợp lệ');
      }

      // Download file từ export URL
      this.logger.log(`Downloading file from: ${exportUrl}`);
      const response = await axios.get(exportUrl, {
        responseType: 'arraybuffer',
        timeout: 60000, // Tăng timeout cho file lớn
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      if (response.status !== 200) {
        throw new BadRequestException(
          `Không thể tải file từ URL: ${response.statusText}`,
        );
      }

      const buffer = Buffer.from(response.data);

      // Tạo mock file object
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'import_from_url.xlsx',
        encoding: '7bit',
        mimetype:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        buffer: buffer,
        size: buffer.length,
        stream: null,
        destination: null,
        filename: null,
        path: null,
      };

      return await this.importExamSchedules(mockFile);
    } catch (error) {
      this.logger.error('Error importing exam schedules from URL:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Lỗi xử lý URL: ${error.message}`,
      );
    }
  }
}

