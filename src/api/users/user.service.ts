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

  async create(data: CreateUserDto): Promise<ResponseDto<UserResDto>> {
    return this.userRepository.manager.transaction(async (manager) => {
      const userRepo = manager.getRepository(UserEntity);
      const workspaceRepo = manager.getRepository(Workspaces);
      const workspaceMemberRepo = manager.getRepository(WorkspaceMembers);

      const existingUser = await userRepo.findOne({
        where: { email: data.email },
      });
      if (existingUser) {
        throw new BadRequestException('Email đã tồn tại trong hệ thống');
      }
      const user = userRepo.create(data);
      await userRepo.save(user);

      const workspace = workspaceRepo.create({
        name: `${upperCaseFirst(user.name)}'s Workspace`,
        owner: user,
        visibility: WorkspaceVisibility.PRIVATE,
      });
      const savedWorkspace = await workspaceRepo.save(workspace);

      const workspaceMember = workspaceMemberRepo.create({
        user,
        workspace: savedWorkspace,
        role: WorkspaceRole.OWNER,
        status: WorkspaceMemberStatus.ACTIVE,
      });
      await workspaceMemberRepo.save(workspaceMember);

      await this.stageService.initDefaultStages(savedWorkspace.id, manager);

      return new ResponseDto({
        data: plainToInstance(UserResDto, user, {
          excludeExtraneousValues: true,
        }),
        message: 'Tạo người dùng thành công',
      });
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

      // Chuyển đổi thành JSON với tên cột
      const rawData = XLSX.utils.sheet_to_json(worksheet, {
        header: [
          'Name',
          'Username',
          'Email',
          'Phone',
          'Role',
          'DateOfBirth',
          'Major',
          'Avatar',
        ],
        range: 1, // Bỏ qua header row
      });

      if (rawData.length === 0) {
        throw new BadRequestException('Excel file contains no data');
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
      try {
        const urlObj = new URL(url);
        if (
          !urlObj.hostname.includes('docs.google.com') ||
          !urlObj.pathname.includes('/spreadsheets/') ||
          urlObj.searchParams.get('format') !== 'xlsx'
        ) {
          throw new BadRequestException(
            'Invalid Google Sheets URL. URL must be in export format: /export?format=xlsx',
          );
        }
      } catch {
        throw new BadRequestException('Invalid URL format');
      }

      const response = await axios.get(url, {
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
    let oldPublicId: string | null = null;

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

        // lấy avatar cũ trước khi overwrite
        const oldAvatarUrl = userToUpdate.avatar;

        // map dto -> entity
        Object.assign(userToUpdate, dto);

        if (avatar) {
          const folder = `users/${id}`;
          const fileName = avatar.originalname;

          const uploadResult = await this.cloudinaryService.uploadToFolder(
            avatar,
            folder,
            fileName,
          );

          if (!('secure_url' in uploadResult)) {
            throw new BadRequestException('Upload avatar thất bại');
          }

          // lưu public id để rollback khi transaction lỗi
          uploadedPublicId = uploadResult.public_id;

          // cập nhật user avatar url
          userToUpdate.avatar = uploadResult.secure_url;

          // tạo bản ghi FileEntity
          const fileEntity = fileRepo.create({
            url: uploadResult.secure_url,
            originalName: avatar.originalname,
            mimeType: avatar.mimetype,
            size: uploadResult.bytes,
            fileName: fileName,
            uploadedBy: id,
            // workspaceId left null for user avatars
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

          if (oldAvatarUrl) {
            const oldFile = await fileRepo.findOne({
              where: { url: oldAvatarUrl },
            });
            if (oldFile) {
              oldPublicId = oldFile.metadata?.public_id || null;
              await manager.delete(FileEntity, oldFile.id);
            }
          }
        }

        const saved = await userRepo.save(userToUpdate);
        return new ResponseDto({
          data: plainToInstance(UserResDto, saved, {
            excludeExtraneousValues: true,
          }),
          message: 'User updated successfully',
        });
      })
      .then(async (res) => {
        if (oldPublicId) {
          try {
            await this.cloudinaryService.deleteFile(oldPublicId);
          } catch {
            this.logger.warn(
              `Cannot delete old avatar on Cloudinary: ${oldPublicId}`,
            );
          }
        }
        return res;
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
