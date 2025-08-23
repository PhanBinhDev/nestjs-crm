import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { ResponseDto } from '@/common/dto/response/response.dto';
import { Uuid } from '@/common/types/common.type';
import { UserRole } from '@/database/enum/user.enum';
import { paginate } from '@/utils/offset-pagination';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import * as XLSX from 'xlsx';
import { CreateUserDto } from './dto/create-user.dto';
import { ImportUserDto, ImportUsersResponseDto } from './dto/import-users.dto';
import { QueryUserDto } from './dto/query-user.tdo';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResDto } from './dto/user.res.dto';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UserService {
  private roleHierarchy = {
    [UserRole.TM]: 3,
    [UserRole.CNBM]: 2,
    [UserRole.GV]: 1,
  };

  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  private canUpdateUser(currentRole: UserRole, targetRole: UserRole): boolean {
    return this.roleHierarchy[currentRole] >= this.roleHierarchy[targetRole];
  }

  private canAssignRole(currentRole: UserRole, newRole: UserRole): boolean {
    return this.roleHierarchy[currentRole] > this.roleHierarchy[newRole];
  }

  async create(data: CreateUserDto): Promise<ResponseDto<UserResDto>> {
    const user = this.userRepository.create(data);
    await this.userRepository.save(user);
    return new ResponseDto({
      data: plainToInstance(UserResDto, user, {
        excludeExtraneousValues: true,
      }),
      message: 'Tạo người dùng thành công',
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

  private mapRoleFromExcel(roleString: string): UserRole {
    if (!roleString) {
      throw new Error('Role cannot be empty');
    }

    const roleMap: { [key: string]: UserRole } = {
      TM: UserRole.TM,
      CNBM: UserRole.CNBM,
      GV: UserRole.GV,
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
  ): Promise<ResponseDto<UserResDto>> {
    const userToUpdate = await this.userRepository.findOneByOrFail({ id });

    if (!userToUpdate) {
      throw new NotFoundException('User not found');
    }

    // Check role hierarchy
    if (!this.canUpdateUser(currentUserRole, userToUpdate.role)) {
      throw new ForbiddenException(
        "You do not have permission to update this user's information",
      );
    }

    if (dto.role && dto.role !== userToUpdate.role) {
      if (currentUserRole !== UserRole.TM) {
        throw new ForbiddenException(
          'Only the Head of Department can change roles',
        );
      }

      // Cannot assign a role higher than your own
      if (!this.canAssignRole(currentUserRole, dto.role)) {
        throw new ForbiddenException(
          'You cannot assign a role higher than your own',
        );
      }
    }

    Object.assign(userToUpdate, dto);
    await this.userRepository.save(userToUpdate);

    return new ResponseDto({
      data: plainToInstance(UserResDto, userToUpdate, {
        excludeExtraneousValues: true,
      }),
      message: 'User updated successfully',
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
    if (!this.canUpdateUser(currentUserRole, user.role)) {
      throw new ForbiddenException(
        'Bạn không có quyền thay đổi trạng thái người dùng này',
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
}
