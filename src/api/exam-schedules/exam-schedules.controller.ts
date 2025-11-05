import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { ExamSchedulesService } from './exam-schedules.service';
import {
  ImportExamSchedulesFromUrlDto,
  ImportExamSchedulesResponseDto,
} from './dto/import-exam-schedule.dto';
import { ApiAuth } from '@/decorators/http.decorators';
import { UserRole } from '@/database/enum/user.enum';
import { Roles } from '@/decorators/roles.decorator';

@ApiTags('Exam Schedules')
@Controller('exam-schedules')
export class ExamSchedulesController {
  constructor(
    private readonly examSchedulesService: ExamSchedulesService,
  ) {}

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  @ApiAuth({
    summary: 'Import lịch thi từ file Excel',
    description:
      'Upload file Excel để import lịch thi hàng loạt. Chỉ đọc các cột màu đỏ (header). Trả về kết quả import với số lượng thành công/thất bại và danh sách lỗi chi tiết.',
    type: ImportExamSchedulesResponseDto,
  })
  @Roles(UserRole.SUPERADMIN, UserRole.CNBM, UserRole.TM)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description:
            'File Excel (.xlsx, .xls) với các cột: Ngày thi, Ca, Tòa nhà, Campus, Phòng thi, Mã môn, Mã ca thi, Loại thi, LỚP, Giảng viên, Bộ môn, GIÁM THỊ 1, GIÁM THỊ 2',
        },
      },
    },
  })
        importExamSchedules(@UploadedFile() file: Express.Multer.File) {
        return this.examSchedulesService.importExamSchedules(file);
      }

      @Post('import-url')
      @Roles(UserRole.SUPERADMIN, UserRole.CNBM, UserRole.TM)
      @ApiAuth({
        summary: 'Import lịch thi từ Google Sheets URL',
        description:
          'Import lịch thi từ URL Google Sheets. Nếu URL có gid (sheet ID), sẽ export sheet được chỉ định. Nếu không có gid, sẽ export sheet đầu tiên (Sheet1) mặc định. Chỉ đọc các cột màu đỏ (header). Trả về kết quả import với số lượng thành công/thất bại và danh sách lỗi chi tiết.',
        type: ImportExamSchedulesResponseDto,
      })
      @ApiConsumes('application/json')
      @ApiBody({
        schema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description:
                'URL Google Sheets. Nếu có gid (sheet ID) trong query params hoặc hash, sẽ export sheet đó. Nếu không có gid, sẽ export sheet đầu tiên. Ví dụ: .../edit?gid=1713901710 hoặc .../edit?usp=sharing',
              example:
                'https://docs.google.com/spreadsheets/d/1crFisuk7tGQuSjCeprSjY1UlkE8mxn_6_r1ypfWmdX4/edit?usp=sharing',
            },
          },
          required: ['url'],
        },
      })
  importExamSchedulesFromUrl(@Body() dto: ImportExamSchedulesFromUrlDto) {
    return this.examSchedulesService.importExamSchedulesFromUrl(dto.url);
  }
}

