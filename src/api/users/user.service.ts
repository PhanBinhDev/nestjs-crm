import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { ResponseDto } from '@/common/dto/response/response.dto';
import { Uuid } from '@/common/types/common.type';
import { UserRole } from '@/database/enum/user.enum';
import { paginate } from '@/utils/offset-pagination';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUserDto } from './dto/query-user.tdo';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResDto } from './dto/user.res.dto';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  private canUpdateUser(currentRole: UserRole, targetRole: UserRole): boolean {
    const roleHierarchy = {
      [UserRole.TM]: 3,
      [UserRole.CNBM]: 2,
      [UserRole.GV]: 1,
    };

    return roleHierarchy[currentRole] >= roleHierarchy[targetRole];
  }

  private canAssignRole(currentRole: UserRole, newRole: UserRole): boolean {
    const roleHierarchy = {
      [UserRole.TM]: 3,
      [UserRole.CNBM]: 2,
      [UserRole.GV]: 1,
    };

    return roleHierarchy[currentRole] > roleHierarchy[newRole];
  }

  async create(data: CreateUserDto): Promise<ResponseDto<UserResDto>> {
    const user = this.userRepository.create(data);
    await this.userRepository.save(user);
    return new ResponseDto({
      data: plainToInstance(UserResDto, user, {
        excludeExtraneousValues: true,
      }),
      message: 'User created successfully',
    });
  }

  async findOne(id: Uuid): Promise<ResponseDto<UserResDto | null>> {
    const user = await this.userRepository.findOne({
      where: { id, isActive: true },
    });

    if (!user)
      return new ResponseDto({
        data: null,
        message: 'Người dùng không tồn tại',
      });

    return new ResponseDto({
      data: plainToInstance(UserResDto, user, {
        excludeExtraneousValues: true,
      }),
      message: 'Lấy người dùng thành công',
    });
  }

  async findAll(reqDto: QueryUserDto): Promise<OffsetPaginatedDto<UserResDto>> {
    const query = this.userRepository
      .createQueryBuilder('user')
      .where('user.isActive = :isActive', { isActive: true });

    if (reqDto.q) {
      query.andWhere('user.name ILIKE :search OR user.email ILIKE :search', {
        search: `%${reqDto.q}%`,
      });
    }

    if (reqDto.order) {
      query.orderBy(`user.name`, reqDto.order);
    }

    if (reqDto.role) {
      query.andWhere('user.role = :role', { role: reqDto.role });
    }

    if (reqDto.isActive !== undefined) {
      query.andWhere('user.isActive = :isActive', {
        isActive: reqDto.isActive,
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
      message: 'Lấy danh sách người dùng thành công',
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

  async remove(id: Uuid): Promise<ResponseDto<void>> {
    await this.userRepository.findOneByOrFail({ id });
    await this.userRepository.delete(id);

    return new ResponseDto({
      data: null,
      message: 'Xóa người dùng thành công',
    });
  }

  async importUsers(file: Express.Multer.File): Promise<ResponseDto<void>> {
    if (!file)
      return new ResponseDto({
        data: null,
        message: 'No file uploaded',
      });

    // const records =

    // return;
  }

  async update(
    id: Uuid,
    dto: UpdateUserDto,
    currentUserRole: UserRole,
  ): Promise<ResponseDto<UserResDto>> {
    const userToUpdate = await this.userRepository.findOneByOrFail({ id });

    if (!userToUpdate) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    // Check role hierarchy
    if (!this.canUpdateUser(currentUserRole, userToUpdate.role)) {
      throw new ForbiddenException(
        'Bạn không có quyền cập nhật thông tin của người dùng này',
      );
    }

    // Special validation for role updates
    if (dto.role && dto.role !== userToUpdate.role) {
      // Only TM can change roles
      if (currentUserRole !== UserRole.TM) {
        throw new ForbiddenException(
          'Chỉ Trưởng môn mới có quyền thay đổi vai trò',
        );
      }

      // Cannot assign a role higher than your own
      if (!this.canAssignRole(currentUserRole, dto.role)) {
        throw new ForbiddenException(
          'Không thể gán vai trò cao hơn vai trò của bạn',
        );
      }
    }

    Object.assign(userToUpdate, dto);
    await this.userRepository.save(userToUpdate);

    return new ResponseDto({
      data: plainToInstance(UserResDto, userToUpdate, {
        excludeExtraneousValues: true,
      }),
      message: 'Cập nhật người dùng thành công',
    });
  }
}
