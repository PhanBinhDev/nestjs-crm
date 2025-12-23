import { CloudinaryService } from '@/cloudinary/cloudinary.service';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { ResponseDto } from '@/common/dto/response/response.dto';
import { Uuid } from '@/common/types/common.type';
import { UserRole } from '@/database/enum/user.enum';
import {
  WorkspaceMemberStatus,
  WorkspaceRole,
  WorkspaceVisibility,
} from '@/database/enum/workspace.enum';
import { upperCaseFirst } from '@/utils/index.util';
import { paginate } from '@/utils/offset-pagination';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import * as XLSX from 'xlsx';
import { FileEntity } from '../files/entities/files.entity';
import { StagesService } from '../stages/stages.service';
import { WorkspaceMembers } from '../workspaces/entities/workspace-members.entity';
import { Workspaces } from '../workspaces/entities/workspace.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { ImportUserDto, ImportUsersResponseDto } from './dto/import-users.dto';
import { QueryUserDto } from './dto/query-user.tdo';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResDto } from './dto/user.res.dto';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UserService {
  private roleHierarchy = {
    [UserRole.SUPERADMIN]: 4,
    [UserRole.TM]: 3,
    [UserRole.CNBM]: 2,
    [UserRole.GV]: 1,
  };

  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly stageService: StagesService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  private canUpdateUser(currentRole: UserRole, targetRole: UserRole): boolean {
    return this.roleHierarchy[currentRole] >= this.roleHierarchy[targetRole];
  }

  private canAssignRole(currentRole: UserRole, newRole: UserRole): boolean {
    return this.roleHierarchy[currentRole] > this.roleHierarchy[newRole];
  }

  async create(
    data: CreateUserDto,
    avatar?: Express.Multer.File,
  ): Promise<ResponseDto<UserResDto>> {
    let uploadedPublicId: string | null = null;

    return await this.userRepository.manager
      .transaction(async (manager) => {
        const userRepo = manager.getRepository(UserEntity);
        const workspaceRepo = manager.getRepository(Workspaces);
        const workspaceMemberRepo = manager.getRepository(WorkspaceMembers);
        const fileRepo = manager.getRepository(FileEntity);

        const existingUser = await userRepo.findOne({
          where: { email: data.email },
        });
        if (existingUser) {
          throw new BadRequestException('Email đã tồn tại trong hệ thống');
        }

        const user = userRepo.create(data);
        const savedUser = await userRepo.save(user);

        const workspace = workspaceRepo.create({
          name: `${upperCaseFirst(savedUser.name)}'s Workspace`,
          owner: savedUser,
          visibility: WorkspaceVisibility.PRIVATE,
        });
        const savedWorkspace = await workspaceRepo.save(workspace);

        const workspaceMember = workspaceMemberRepo.create({
          user: savedUser,
          workspace: savedWorkspace,
          role: WorkspaceRole.OWNER,
          status: WorkspaceMemberStatus.ACTIVE,
        });
        await workspaceMemberRepo.save(workspaceMember);

        if (avatar) {
          const folder = `users/${savedUser.id}`;
          const fileName = avatar.originalname;

          const uploadResult = await this.cloudinaryService.uploadToFolder(
            avatar,
            folder,
            fileName,
          );

          if (!('url' in uploadResult)) {
            throw new BadRequestException('Upload avatar thất bại');
          }

          uploadedPublicId = uploadResult.public_id;

          savedUser.avatar = uploadResult.url;

          const fileEntity = fileRepo.create({
            url: uploadResult.url,
            originalName: avatar.originalname,
            mimeType: avatar.mimetype,
            size: uploadResult.bytes,
            fileName: fileName,
            uploadedBy: savedUser.id,
            metadata: {
              public_id: uploadResult.public_id,
              format: uploadResult.format,
              resource_type: uploadResult.resource_type,
              width: uploadResult.width,
              height: uploadResult.height,
              bytes: uploadResult.bytes,
            },
          });
          await fileRepo.save(fileEntity);
          await userRepo.save(savedUser);
        }

        await this.stageService.initDefaultStages(savedWorkspace.id, manager);

        return new ResponseDto({
          data: plainToInstance(UserResDto, savedUser, {
            excludeExtraneousValues: true,
          }),
          message: 'Tạo người dùng thành công',
        });
      })
      .catch(async (error) => {
        if (uploadedPublicId) {
          try {
            await this.cloudinaryService.deleteFile(uploadedPublicId);
          } catch {
            this.logger.warn(
              `Cannot rollback uploaded avatar on Cloudinary: ${uploadedPublicId}`,
            );
          }
        }
        throw error;
      });
  }

  async findOne(id: Uuid): Promise<ResponseDto<UserResDto | null>> {
    const user = await this.userRepository.findOne({
      where: { id, isActive: true },
      relations: {
        assignedActivities: {
          activity: true,
        },
      },
    });

    if (!user)
      return new ResponseDto({
        data: null,
        message: 'User not found',
      });

    return new ResponseDto({
      data: plainToInstance(UserResDto, user, {
        excludeExtraneousValues: true,
      }),
      message: 'User retrieved successfully',
    });
  }

  async findAll(reqDto: QueryUserDto): Promise<OffsetPaginatedDto<UserResDto>> {
    const query = this.userRepository.createQueryBuilder('user');

    if (reqDto.q) {
      query.andWhere('user.name ILIKE :search OR user.email ILIKE :search', {
        search: `%${reqDto.q}%`,
      });
    }

    const allowedSortFields = [
      'name',
      'email',
      'phone',
      'createdAt',
      'updatedAt',
    ];

    if (reqDto.sortBy) {
      const sortField = allowedSortFields.includes(reqDto.sortBy)
        ? reqDto.sortBy
        : 'createdAt';

      if (!allowedSortFields.includes(reqDto.sortBy)) {
        this.logger.warn(
          `Invalid sortBy field '${reqDto.sortBy}', defaulting to 'createdAt'`,
        );
      }

      query.addOrderBy(`user.${sortField}`, reqDto.order || 'DESC');
    } else {
      query.addOrderBy('user.createdAt', reqDto.order || 'DESC');
    }

    if (reqDto.role && reqDto.role.length > 0) {
      query.andWhere('user.role IN (:...roles)', { roles: reqDto.role });
    }

    if (reqDto.isActive !== undefined && reqDto.isActive.length > 0) {
      query.andWhere('user.isActive IN (:...isActiveValues)', {
        isActiveValues: reqDto.isActive,
      });
    }

    const [users, metaDto] = await paginate<UserEntity>(query, reqDto, {
      skipCount: false,
      takeAll: false,
    });

    return new OffsetPaginatedDto({
      data: plainToInstance(UserResDto, users, {
        excludeExtraneousValues: true,
      }),
      meta: metaDto,
      message: 'Users retrieved successfully',
    });
  }

  async findOneByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({
      where: {
        email,
        isActive: true,
      },
    });
  }

  async findOneUserEmail(email: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({
      where: {
        email,
      },
    });
  }

  async remove(id: Uuid): Promise<ResponseDto<void>> {
    await this.userRepository.findOneByOrFail({ id });
    await this.userRepository.delete(id);

    return new ResponseDto({
      data: null,
      message: 'User deleted successfully',
    });
  }

  async importUsers(
    file: Express.Multer.File,
  ): Promise<ResponseDto<ImportUsersResponseDto>> {
    if (!file) {
      throw new BadRequestException('Please upload an Excel file');
    }

    // Kiểm tra file extension
    const allowedExtensions = ['.xlsx', '.xls'];
    const fileExtension = file.originalname
      .toLowerCase()
      .substring(file.originalname.lastIndexOf('.'));

    if (!allowedExtensions.includes(fileExtension)) {
      throw new BadRequestException(
        'Only Excel files (.xlsx, .xls) are supported',
      );
    }

    try {
      // Đọc file Excel
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Chuyển đổi thành array of arrays để tìm header
      const allData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1, // Đọc thành array of arrays
        defval: '', // Giá trị mặc định cho cell trống
        raw: false,
      });

      if (allData.length < 2) {
        throw new BadRequestException(
          'File Excel phải có ít nhất 1 dòng header và 1 dòng dữ liệu',
        );
      }

      // Hàm normalize để tìm kiếm
      const normalizeKey = (key: string): string => {
        if (!key) return '';
        return key
          .trim()
          .replace(/\s+/g, ' ')
          .replace(/\u00A0/g, ' ')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase();
      };

      // Danh sách các cột cần thiết
      const columnMappings = {
        name: [
          'Họ và tên',
          'Họ Tên',
          'Họ tên',
          'Họ Và Tên',
          'Name',
          'Full Name',
          'Hoten',
          'Ho va ten',
          'Ho ten',
        ],
        username: ['Username', 'Tên đăng nhập', 'Tendangnhap', 'Ten dang nhap'],
        email: ['Email', 'email', 'EMAIL'],
        phone: [
          'Số điện thoại',
          'Phone',
          'Phone Number',
          'Sodienthoai',
          'SDT',
          'So dien thoai',
        ],
        role: ['Vai trò', 'Role', 'Vaitro', 'Vai tro'],
        dateOfBirth: [
          'Ngày sinh',
          'Date of Birth',
          'DateOfBirth',
          'Ngaysinh',
          'DOB',
          'Ngay sinh',
        ],
        major: ['Chuyên ngành', 'Major', 'Chuyennganh', 'Chuyen nganh'],
        avatar: ['Avatar', 'Ảnh đại diện', 'Anhdaidien', 'Anh dai dien'],
      };

      // Log dữ liệu thô từ file để debug
      this.logger.error('Raw data from Excel (first 5 rows):');
      for (let i = 0; i < Math.min(5, allData.length); i++) {
        const row = allData[i] as any[];
        this.logger.error(`Row ${i}: ${JSON.stringify(row)}`);
      }

      // Tìm header row - duyệt từ trên xuống để tìm hàng đầu tiên có đủ cột
      let headerRowIndex = -1;
      let headerRowData: any[] = [];

      for (
        let rowIndex = 0;
        rowIndex < allData.length && rowIndex < 10;
        rowIndex++
      ) {
        const row = allData[rowIndex] as any[];
        let matchedColumns = 0;
        const matchedColumnNames: string[] = [];

        for (let cellIndex = 0; cellIndex < row.length; cellIndex++) {
          const cell = row[cellIndex];
          if (!cell) continue;
          const cellStr = String(cell).trim();
          if (!cellStr) continue;

          this.logger.error(
            `  Checking cell [${rowIndex},${cellIndex}]: "${cellStr}"`,
          );

          // Kiểm tra xem cell này match với bất kỳ cột nào không
          for (const [columnKey, possibleNames] of Object.entries(
            columnMappings,
          )) {
            for (const possibleName of possibleNames) {
              const normalized = normalizeKey(cellStr);
              const normalizedPossible = normalizeKey(possibleName);

              if (normalized === normalizedPossible) {
                this.logger.error(
                  `    ✓ Matched: "${cellStr}" === "${possibleName}" (${columnKey})`,
                );
                matchedColumns++;
                matchedColumnNames.push(columnKey);
                break;
              }
            }
          }
        }

        this.logger.error(
          `Row ${rowIndex}: ${matchedColumns} matched columns - [${matchedColumnNames.join(', ')}]`,
        );

        // Nếu hàng này có ít nhất 3 cột match, đó là header
        if (matchedColumns >= 3) {
          headerRowIndex = rowIndex;
          headerRowData = row;
          this.logger.error(
            `✓ Found header at row ${rowIndex + 1} with ${matchedColumns} matched columns`,
          );
          break;
        }
      }

      if (headerRowIndex === -1 || headerRowData.length === 0) {
        this.logger.error(
          'Header not found. Checked data:',
          allData.slice(0, 10),
        );
        throw new BadRequestException(
          'Không tìm thấy header row trong file Excel. Vui lòng kiểm tra lại file.',
        );
      }

      // Map các cột
      const columnMap: { [key: string]: number } = {};

      this.logger.error(
        `Mapping columns from header: ${JSON.stringify(headerRowData)}`,
      );

      headerRowData.forEach((header, index) => {
        if (!header) return;

        const headerStr = String(header).trim();
        const normalizedHeader = normalizeKey(headerStr);

        this.logger.error(
          `  Mapping [${index}] "${headerStr}" (normalized: "${normalizedHeader}")`,
        );

        for (const [columnKey, possibleNames] of Object.entries(
          columnMappings,
        )) {
          if (columnMap[columnKey] !== undefined) continue;

          for (const possibleName of possibleNames) {
            const normalizedPossible = normalizeKey(possibleName);

            if (normalizedHeader === normalizedPossible) {
              columnMap[columnKey] = index;
              this.logger.error(
                `    ✓ Mapped "${columnKey}" to index ${index}`,
              );
              break;
            }
          }
        }
      });

      this.logger.error(`Final columnMap: ${JSON.stringify(columnMap)}`);

      // Kiểm tra các cột bắt buộc
      if (
        columnMap['name'] === undefined ||
        columnMap['email'] === undefined ||
        columnMap['phone'] === undefined ||
        columnMap['role'] === undefined
      ) {
        this.logger.error(
          `Missing required columns - name: ${columnMap['name']}, email: ${columnMap['email']}, phone: ${columnMap['phone']}, role: ${columnMap['role']}`,
        );
        throw new BadRequestException(
          'File Excel thiếu cột bắt buộc. Vui lòng kiểm tra lại header row.',
        );
      }

      // Parse dữ liệu từ hàng sau header
      const rawData: any[] = [];
      for (let i = headerRowIndex + 1; i < allData.length; i++) {
        const row = allData[i] as any[];

        // Bỏ qua hàng trống
        if (row.every((cell) => !cell || String(cell).trim() === '')) {
          if (rawData.length > 0) break; // Dừng khi gặp hàng trống sau dữ liệu
          continue;
        }

        const mappedRow = {
          Name: row[columnMap['name']] || '',
          Username: row[columnMap['username']] || '',
          Email: row[columnMap['email']] || '',
          Phone: row[columnMap['phone']] || '',
          Role: row[columnMap['role']] || '',
          DateOfBirth: row[columnMap['dateOfBirth']] || '',
          Major: row[columnMap['major']] || '',
          Avatar: row[columnMap['avatar']] || '',
        };

        rawData.push(mappedRow);
      }

      if (rawData.length === 0) {
        throw new BadRequestException('File Excel không có dữ liệu');
      }

      const importResults: ImportUserDto[] = [];
      const errors: Array<{ row: number; email: string; error: string }> = [];
      let successCount = 0;
      let failureCount = 0;

      // Xử lý từng row
      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i] as any;
        const rowNumber = i + 2; // +2 vì bỏ qua header và index bắt đầu từ 0

        try {
          // Debug: Log dữ liệu thực tế từ Excel
          this.logger.debug(`Row ${rowNumber} raw data:`, {
            Name: row.Name,
            Username: row.Username,
            Email: row.Email,
            Phone: row.Phone,
            Role: row.Role,
            DateOfBirth: row.DateOfBirth,
            Major: row.Major,
            Avatar: row.Avatar,
          });

          // Map dữ liệu từ Excel vào DTO
          const userData: ImportUserDto = {
            name: row.Name?.toString()?.trim(),
            username: row.Username?.toString()?.trim() || undefined,
            email: row.Email?.toString()?.trim(),
            phone: row.Phone?.toString()?.trim(),
            role: this.mapRoleFromExcel(row.Role?.toString()?.trim()),
            dateOfBirth: row.DateOfBirth?.toString()?.trim() || undefined,
            major: row.Major?.toString()?.trim() || undefined,
            avatar: row.Avatar?.toString()?.trim() || undefined,
          };

          // Validate dữ liệu
          if (
            !userData.name ||
            !userData.email ||
            !userData.phone ||
            !userData.role
          ) {
            throw new Error(
              'Missing required information (name, email, phone, role)',
            );
          }

          // Kiểm tra email đã tồn tại
          const existingUser = await this.findOneByEmail(userData.email);
          if (existingUser) {
            throw new Error('Email already exists in the system');
          }

          // Tạo user mới
          const newUser = this.userRepository.create({
            name: userData.name,
            username: userData.username, // Username sẽ được tự động tạo nếu không có
            email: userData.email,
            phone: userData.phone,
            role: userData.role,
            dateOfBirth: userData.dateOfBirth
              ? new Date(userData.dateOfBirth)
              : undefined,
            major: userData.major,
            avatar: userData.avatar,
            isActive: true,
          });

          await this.userRepository.save(newUser);
          successCount++;
          importResults.push(userData);
        } catch (error) {
          failureCount++;
          errors.push({
            row: rowNumber,
            email: row.Email?.toString()?.trim() || 'N/A',
            error: error.message || 'Unknown error',
          });
        }
      }

      const response: ImportUsersResponseDto = {
        successCount,
        failureCount,
        errors,
      };

      return new ResponseDto({
        data: response,
        message: `Successfully imported ${successCount} users, ${failureCount} users failed`,
      });
    } catch (error) {
      this.logger.error('Error importing users:', error);
      throw new BadRequestException(`Error processing file: ${error.message}`);
    }
  }

  async importUsersFromUrl(
    url: string,
  ): Promise<ResponseDto<ImportUsersResponseDto>> {
    try {
      let downloadUrl = url;

      try {
        const urlObj = new URL(url);

        // Kiểm tra nếu là Google Sheets URL
        if (
          urlObj.hostname.includes('docs.google.com') &&
          urlObj.pathname.includes('/spreadsheets/')
        ) {
          // Extract spreadsheet ID from URL
          // Format: /spreadsheets/d/{spreadsheetId}/...
          const spreadsheetIdMatch = urlObj.pathname.match(
            /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
          );

          if (!spreadsheetIdMatch) {
            throw new BadRequestException('Invalid Google Sheets URL format');
          }

          const spreadsheetId = spreadsheetIdMatch[1];
          // Chuyển sang export URL format
          downloadUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=xlsx`;
        } else if (!urlObj.protocol.match(/^https?:/)) {
          throw new BadRequestException('URL must use HTTP or HTTPS protocol');
        }
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw error;
        }
        throw new BadRequestException('Invalid URL format');
      }

      const response = await axios.get(downloadUrl, {
        responseType: 'arraybuffer',
        timeout: 30000,
      });

      if (response.status !== 200) {
        throw new BadRequestException(
          `Failed to download file from URL: ${response.statusText}`,
        );
      }

      const buffer = Buffer.from(response.data);

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

      return await this.importUsers(mockFile);
    } catch (error) {
      this.logger.error('Error importing users from URL:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Error processing URL: ${error.message}`);
    }
  }

  private mapRoleFromExcel(roleString: string): UserRole {
    if (!roleString) {
      throw new Error('Role cannot be empty');
    }

    const roleMap: { [key: string]: UserRole } = {
      SUPERADMIN: UserRole.SUPERADMIN,
      TM: UserRole.TM,
      CNBM: UserRole.CNBM,
      GV: UserRole.GV,
      'Super Admin': UserRole.SUPERADMIN,
      'super admin': UserRole.SUPERADMIN,
      'SUPER ADMIN': UserRole.SUPERADMIN,
      'Trưởng môn': UserRole.TM,
      'Chủ nhiệm bộ môn': UserRole.CNBM,
      'Giảng viên': UserRole.GV,
      'trưởng môn': UserRole.TM,
      'chủ nhiệm bộ môn': UserRole.CNBM,
      'giảng viên': UserRole.GV,
    };

    const mappedRole = roleMap[roleString];
    if (!mappedRole) {
      throw new Error(
        `Invalid role: ${roleString}. Supported roles: TM, CNBM, GV`,
      );
    }

    return mappedRole;
  }

  async update(
    id: Uuid,
    dto: UpdateUserDto,
    currentUserRole: UserRole,
    avatar?: Express.Multer.File,
  ): Promise<ResponseDto<UserResDto>> {
    let uploadedPublicId: string | null = null;

    return await this.userRepository.manager
      .transaction(async (manager) => {
        const userRepo = manager.getRepository(UserEntity);
        const fileRepo = manager.getRepository(FileEntity);

        const userToUpdate = await userRepo.findOneByOrFail({ id });

        if (!this.canUpdateUser(currentUserRole, userToUpdate.role)) {
          throw new ForbiddenException(
            "You do not have permission to update this user's information",
          );
        }

        const oldAvatarUrl = userToUpdate.avatar;

        Object.assign(userToUpdate, dto);

        if (dto.removeAvatar) {
          if (oldAvatarUrl) {
            const oldFile = await fileRepo.findOne({
              where: { url: oldAvatarUrl },
            });
            if (oldFile) {
              if (oldFile.metadata?.public_id) {
                await this.cloudinaryService.deleteFile(
                  oldFile.metadata.public_id,
                );
              }
              await manager.delete(FileEntity, oldFile.id);
            }
            userToUpdate.avatar = null;
          }
        }

        if (avatar) {
          const folder = `users/${id}`;
          const fileName = avatar.originalname;

          if (oldAvatarUrl) {
            const oldFile = await fileRepo.findOne({
              where: { url: oldAvatarUrl },
            });
            if (oldFile) {
              if (oldFile.metadata?.public_id) {
                await this.cloudinaryService.deleteFile(
                  oldFile.metadata.public_id,
                );
              }
              await manager.delete(FileEntity, oldFile.id);
            }
          }

          const uploadResult = await this.cloudinaryService.uploadToFolder(
            avatar,
            folder,
            fileName,
          );

          if (!('url' in uploadResult)) {
            throw new BadRequestException('Upload avatar thất bại');
          }

          uploadedPublicId = uploadResult.public_id;
          userToUpdate.avatar = uploadResult.url;

          const fileEntity = fileRepo.create({
            url: uploadResult.url,
            originalName: avatar.originalname,
            mimeType: avatar.mimetype,
            size: uploadResult.bytes,
            fileName: fileName,
            uploadedBy: id,
            metadata: {
              public_id: uploadResult.public_id,
              format: uploadResult.format,
              resource_type: uploadResult.resource_type,
              width: uploadResult.width,
              height: uploadResult.height,
              bytes: uploadResult.bytes,
            },
          });
          await fileRepo.save(fileEntity);
        }

        const saved = await userRepo.save(userToUpdate);
        return new ResponseDto({
          data: plainToInstance(UserResDto, saved, {
            excludeExtraneousValues: true,
          }),
          message: 'User updated successfully',
        });
      })
      .catch(async (error) => {
        if (uploadedPublicId) {
          try {
            await this.cloudinaryService.deleteFile(uploadedPublicId);
          } catch {
            this.logger.warn(
              `Cannot rollback uploaded avatar on Cloudinary: ${uploadedPublicId}`,
            );
          }
        }
        throw error;
      });
  }

  async toggleActive(
    id: Uuid,
    currentUserId: Uuid,
    currentUserRole: UserRole,
  ): Promise<ResponseDto<UserResDto>> {
    if (id === currentUserId) {
      throw new ForbiddenException(
        'Bạn không thể tự thay đổi trạng thái của mình',
      );
    }
    const user = await this.userRepository.findOneByOrFail({ id });
    if (
      currentUserRole !== UserRole.SUPERADMIN &&
      !this.canUpdateUser(currentUserRole, user.role)
    ) {
      throw new ForbiddenException(
        'Bạn không có quyền thay đổi trạng thái người dùng này',
      );
    }

    if (
      user.role === UserRole.SUPERADMIN &&
      currentUserRole !== UserRole.SUPERADMIN
    ) {
      throw new ForbiddenException(
        'Chỉ SUPERADMIN mới có thể thay đổi trạng thái SUPERADMIN khác',
      );
    }

    user.isActive = !user.isActive;
    await this.userRepository.save(user);
    return new ResponseDto({
      data: plainToInstance(UserResDto, user, {
        excludeExtraneousValues: true,
      }),
      message: 'Cập nhật trạng thái người dùng thành công',
    });
  }
  async exportUsers(
    fields?: string[],
    limit?: number,
  ): Promise<{ buffer: Buffer; filename: string }> {
    let users = await this.userRepository.find();
    if (limit && limit > 0) {
      users = users.slice(0, limit);
    }

    const defaultFields = [
      'name',
      'username',
      'email',
      'phone',
      'role',
      'dateOfBirth',
      'major',
      'avatar',
    ];
    const exportFields = fields && fields.length > 0 ? fields : defaultFields;

    const data = users.map((u) => {
      const row: any = {};
      for (const field of exportFields) {
        if (field === 'dateOfBirth') {
          row[field] = u.dateOfBirth
            ? typeof u.dateOfBirth === 'string'
              ? u.dateOfBirth
              : u.dateOfBirth.toISOString().split('T')[0]
            : '';
        } else {
          row[field] = u[field];
        }
      }
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(data, { header: exportFields });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const filename = `users_export_${Date.now()}.xlsx`;
    return { buffer, filename };
  }
}
