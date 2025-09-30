import { ResponseNoDataDto } from '@/common/dto/response/response-no-data.dto';
import { ResponseDto } from '@/common/dto/response/response.dto';
import { Uuid } from '@/common/types/common.type';
import { WorkspaceRole } from '@/database/enum/workspace.enum';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, In, Repository } from 'typeorm';
import { StagesService } from '../stages/stages.service';
import { UploadService } from '../upload/upload.service';
import { UserEntity } from '../users/entities/user.entity';
import { BaseWorkspaceResDto } from './dto/base-workspace.res.dto';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { QueryWorkspaceDetailDto } from './dto/query-workspace-detail.dto';
import { WorkspaceDetailsResDto } from './dto/workspace-details.res.dto';
import { WorkspaceMemberResDto } from './dto/workspace-member.res.dto';
import { WorkspaceMembers } from './entities/workspace-members.entity';
import { Workspaces } from './entities/workspace.entity';

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectRepository(Workspaces)
    private readonly workspaceRepository: Repository<Workspaces>,
    @InjectRepository(WorkspaceMembers)
    private readonly membersRepository: Repository<WorkspaceMembers>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly stagesService: StagesService,
    private readonly uploadService: UploadService,
  ) {}

  async invite(
    workspaceId: Uuid,
    inviteMemberDto: InviteMemberDto,
  ): Promise<ResponseNoDataDto> {
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
      relations: ['members'],
    });

    if (!workspace) {
      throw new BadRequestException('Workspace not found');
    }

    const membersToInvite = await this.userRepository.findBy({
      id: In(inviteMemberDto.userIds),
    });
    if (membersToInvite.length === 0) {
      throw new BadRequestException('No valid user IDs provided');
    }

    const invitations = membersToInvite.map((user) =>
      this.membersRepository.create({
        workspaceId,
        userId: user.id,
        role: WorkspaceRole.MEMBER,
      }),
    );

    await this.membersRepository.save(invitations);

    return new ResponseNoDataDto({
      message: 'Invitations sent successfully',
    });
  }

  async remove(id: Uuid, currentUserId: Uuid): Promise<ResponseNoDataDto> {
    const workspace = await this.workspaceRepository.findOne({
      where: { id },
      relations: ['members'],
    });

    if (!workspace) {
      throw new BadRequestException('Workspace not found');
    }

    const isOwner = workspace.ownerId === currentUserId;
    if (!isOwner) {
      throw new BadRequestException(
        'Bạn không có quyền xóa không gian làm việc này',
      );
    }

    if (workspace.members.length > 1) {
      throw new BadRequestException(
        'Không thể xóa không gian làm việc khi còn thành viên khác',
      );
    }

    const ownedWorkspacesCount = await this.workspaceRepository.count({
      where: { ownerId: currentUserId },
    });

    if (ownedWorkspacesCount <= 1) {
      throw new BadRequestException(
        'Không thể xóa workspace cuối cùng của bạn. Mỗi người dùng phải có ít nhất một workspace.',
      );
    }

    await this.workspaceRepository.remove(workspace);

    return new ResponseNoDataDto({
      message: 'Xóa không gian làm việc thành công',
    });
  }

  async create(
    dto: CreateWorkspaceDto,
    ownerId: Uuid,
  ): Promise<ResponseDto<BaseWorkspaceResDto>> {
    return await this.dataSource.transaction(async (manager) => {
      const { members, avatar, ...body } = dto;

      // Chỉ lưu avatar nếu có giá trị (không phải chuỗi rỗng)
      const workspaceData = {
        ...body,
        ownerId,
        ...(avatar && avatar.trim() !== '' ? { avatar } : {}),
      };

      const workspace = this.workspaceRepository.create(workspaceData);
      const savedWorkspace = await manager.save(workspace);

      await this.stagesService.initDefaultStages(savedWorkspace.id, manager);

      const ownerMember = this.membersRepository.create({
        workspaceId: savedWorkspace.id,
        userId: ownerId,
        role: WorkspaceRole.OWNER,
      });
      await manager.save(ownerMember);

      if (members && members.length > 0) {
        const users = await manager.find(this.userRepository.target, {
          where: { id: In(members) },
        });

        if (users.length !== members.length) {
          const foundUserIds = users.map((user) => user.id);
          const missingUserIds = members.filter(
            (id) => !foundUserIds.includes(id),
          );
          throw new BadRequestException(
            `Không tìm thấy người dùng với ID: ${missingUserIds.join(', ')}`,
          );
        }

        const membersToAdd = members.map((userId) =>
          this.membersRepository.create({
            workspaceId: savedWorkspace.id,
            userId,
            role: WorkspaceRole.MEMBER,
          }),
        );

        await manager.save(membersToAdd);
      }

      return new ResponseDto<BaseWorkspaceResDto>({
        data: plainToInstance(BaseWorkspaceResDto, savedWorkspace, {
          excludeExtraneousValues: true,
        }),
        message: 'Tạo không gian làm việc thành công',
      });
    });
  }

  async findAll(userId: Uuid): Promise<ResponseDto<BaseWorkspaceResDto[]>> {
    const workspaces = await this.workspaceRepository
      .createQueryBuilder('workspace')
      .leftJoin('workspace.members', 'members')
      .where('workspace.ownerId = :userId', { userId })
      .orWhere('members.userId = :userId', { userId })
      .distinct(true)
      .getMany();

    return new ResponseDto<BaseWorkspaceResDto[]>({
      data: plainToInstance(BaseWorkspaceResDto, workspaces, {
        excludeExtraneousValues: true,
      }),
      message: 'Lấy danh sách không gian làm việc thành công',
    });
  }

  async findOne(
    id: Uuid,
    currentUserId: Uuid,
    query: QueryWorkspaceDetailDto,
  ): Promise<ResponseDto<WorkspaceDetailsResDto>> {
    const relations = ['owner'];
    if (query.includeViewSettings) {
      relations.push('settingsView');
    }

    if (query.includeMembers) {
      relations.push('members', 'members.user');
    }

    let workspace = await this.workspaceRepository.findOne({
      where: { id },
      select: ['id', 'visibility', 'ownerId'],
    });

    if (!workspace) {
      throw new BadRequestException('Workspace not found');
    }

    if (workspace.visibility === 'private') {
      workspace = await this.workspaceRepository.findOne({
        where: [
          { id, ownerId: currentUserId },
          { id, members: { userId: currentUserId } },
        ],
        relations,
      });

      if (!workspace) {
        throw new BadRequestException(
          'Bạn không phải là thành viên của workspace này',
        );
      }
    } else {
      workspace = await this.workspaceRepository.findOne({
        where: { id },
        relations,
      });
    }

    return new ResponseDto<WorkspaceDetailsResDto>({
      data: plainToInstance(WorkspaceDetailsResDto, workspace, {
        excludeExtraneousValues: true,
      }),
      message: 'Lấy thông tin không gian làm việc thành công',
    });
  }

  async update(
    id: Uuid,
    dto: CreateWorkspaceDto,
    avatar?: Express.Multer.File,
  ): Promise<ResponseDto<BaseWorkspaceResDto>> {
    const { members: _members, ...body } = dto;

    // Upload avatar nếu có
    if (avatar) {
      const avatarPath = await this.uploadService.saveFile(avatar);
      body.avatar = avatarPath;
    }

    await this.workspaceRepository.update(id, body);
    const updatedWorkspace = await this.workspaceRepository.findOne({
      where: { id },
    });
    return new ResponseDto<BaseWorkspaceResDto>({
      data: plainToInstance(BaseWorkspaceResDto, updatedWorkspace, {
        excludeExtraneousValues: true,
      }),
      message: 'Cập nhật không gian làm việc thành công',
    });
  }

  async findMembers(id: Uuid, currentUserId: Uuid, q: string) {
    const isInWorkspace = await this.checkUserInWorkspace(currentUserId, id);
    if (!isInWorkspace) {
      throw new BadRequestException(
        'Bạn không có quyền xem thành viên của không gian làm việc này',
      );
    }

    const queryBuilder = this.membersRepository
      .createQueryBuilder('member')
      .leftJoinAndSelect('member.user', 'user')
      .where('member.workspaceId = :workspaceId', { workspaceId: id });

    if (q) {
      queryBuilder.andWhere('(user.name ILIKE :q OR user.email ILIKE :q)', {
        q: `%${q}%`,
      });
    }

    const members = await queryBuilder.getMany();

    return new ResponseDto<WorkspaceMemberResDto[]>({
      data: plainToInstance(WorkspaceMemberResDto, members, {
        excludeExtraneousValues: true,
      }),
      message: 'Lấy danh sách thành viên không gian làm việc thành công',
    });
  }

  private async checkUserInWorkspace(
    userId: Uuid,
    workspaceId: Uuid,
  ): Promise<boolean> {
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
      relations: ['members'],
    });
    if (!workspace) {
      return false;
    }
    return workspace.members.some((member) => member.userId === userId);
  }
}
