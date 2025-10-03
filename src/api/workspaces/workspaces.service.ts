import { ResponseNoDataDto } from '@/common/dto/response/response-no-data.dto';
import { ResponseDto } from '@/common/dto/response/response.dto';
import { IWorkspaceMemberJob } from '@/common/interfaces/job.interface';
import { Uuid } from '@/common/types/common.type';
import { AllConfigType } from '@/config/config.type';
import { WORKSPACE_INVITE_TTL } from '@/constants/app.constant';
import { CacheKey } from '@/constants/cache.constant';
import { JobName, QueueName } from '@/constants/job.constant';
import {
  WorkspaceMemberStatus,
  WorkspaceRole,
} from '@/database/enum/workspace.enum';
import { createCacheKey } from '@/utils/cache.util';
import { InjectQueue } from '@nestjs/bullmq';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { Cache } from 'cache-manager';
import { plainToInstance } from 'class-transformer';
import { randomBytes } from 'crypto';
import ms from 'ms';
import { DataSource, In, Repository } from 'typeorm';
import { StagesService } from '../stages/stages.service';
import { UploadService } from '../upload/upload.service';
import { UserEntity } from '../users/entities/user.entity';
import { BaseWorkspaceResDto } from './dto/base-workspace.res.dto';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { QueryWorkspaceDetailDto } from './dto/query-workspace-detail.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { WorkspaceDetailsResDto } from './dto/workspace-details.res.dto';
import { WorkspaceMemberResDto } from './dto/workspace-member.res.dto';
import { WorkspaceMembers } from './entities/workspace-members.entity';
import { Workspaces } from './entities/workspace.entity';
import { WorkspaceRoleHierarchy } from './utils/workspace-role-hierarchy';

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
    @InjectQueue(QueueName.EMAIL)
    private readonly emailQueue: Queue<IWorkspaceMemberJob, any, string>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly configService: ConfigService<AllConfigType>,
  ) {}

  async verifyInviteToken(
    token: string,
    userId: Uuid,
  ): Promise<ResponseNoDataDto> {
    const cacheKey = createCacheKey(CacheKey.WORKSPACE_INVITE, token);
    const cachedData = await this.cacheManager.store.get<string>(cacheKey);

    if (!cachedData) {
      throw new BadRequestException('Token không hợp lệ hoặc đã hết hạn');
    }

    const { workspaceId, userId: invitedUserId } = JSON.parse(cachedData);

    if (userId !== invitedUserId) {
      throw new BadRequestException('Token không hợp lệ cho người dùng này');
    }

    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
      relations: ['members'],
    });
    if (!workspace) {
      throw new BadRequestException('Workspace không tồn tại');
    }

    const isMember = workspace.members.some((m) => m.userId === userId);
    if (isMember) {
      return new ResponseNoDataDto({
        message: 'Bạn đã là thành viên của workspace này.',
      });
    }

    const newMember = this.membersRepository.create({
      workspaceId,
      userId,
      role: WorkspaceRole.MEMBER,
      status: WorkspaceMemberStatus.ACTIVE,
    });
    await this.membersRepository.save(newMember);

    await this.cacheManager.store.del(cacheKey);

    return new ResponseNoDataDto({ message: 'Tham gia workspace thành công.' });
  }

  async invite(
    workspaceId: Uuid,
    inviteMemberDto: InviteMemberDto,
    userId: Uuid,
  ): Promise<ResponseNoDataDto> {
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
      relations: ['members', 'owner'],
    });

    if (!workspace) {
      throw new BadRequestException('Workspace not found');
    }

    const isOwner = workspace.owner.id === userId;
    const isAdminMember = workspace.members.some(
      (m) => m.userId === userId && m.role === WorkspaceRole.ADMIN,
    );

    if (!isOwner && !isAdminMember) {
      throw new BadRequestException(
        'Bạn không có quyền mời thành viên vào không gian làm việc này',
      );
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
        status: WorkspaceMemberStatus.PENDING,
      }),
    );

    await this.membersRepository.save(invitations);

    const baseURL = this.configService.getOrThrow('app.frontendUrl', {
      infer: true,
    });

    await Promise.all(
      membersToInvite.map(async (user) => {
        const token = randomBytes(32).toString('hex');
        const inviteLink = `${baseURL}/invite-members?token=${token}`;

        await this.cacheManager.store.set(
          createCacheKey(CacheKey.WORKSPACE_INVITE, token),
          JSON.stringify({
            workspaceId: workspace.id,
            userId: user.id,
          }),
          ms(WORKSPACE_INVITE_TTL),
        );

        await this.emailQueue.add(JobName.WORKSPACE_INVITATION, {
          workspaceName: workspace.name,
          inviteLink,
          ownerName: workspace.owner.name,
          email: user.email,
        });
      }),
    );

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

    const isOwner = workspace.owner.id === currentUserId;
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
      where: {
        owner: {
          id: currentUserId,
        },
      },
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

      const owner = await manager.findOne(UserEntity, {
        where: { id: ownerId },
      });

      const workspaceData = {
        ...body,
        owner,
        ...(avatar && avatar.trim() !== '' ? { avatar } : {}),
      };

      const workspace = this.workspaceRepository.create(workspaceData);
      const savedWorkspace = await manager.save(workspace);

      await this.stagesService.initDefaultStages(savedWorkspace.id, manager);

      const ownerMember = this.membersRepository.create({
        workspaceId: savedWorkspace.id,
        userId: ownerId,
        role: WorkspaceRole.OWNER,
        status: WorkspaceMemberStatus.ACTIVE,
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

        const membersToAdd = members.map((userId) => {
          return this.membersRepository.create({
            workspaceId: savedWorkspace.id,
            userId,
            role: WorkspaceRole.MEMBER,
            status: WorkspaceMemberStatus.PENDING,
          });
        });

        await manager.save(membersToAdd);

        const baseURL = this.configService.getOrThrow('app.frontendUrl', {
          infer: true,
        });

        await Promise.all(
          users.map(async (user) => {
            const token = randomBytes(32).toString('hex');
            const inviteLink = `${baseURL}/invite-members?token=${token}`;

            await this.cacheManager.store.set(
              createCacheKey(CacheKey.WORKSPACE_INVITE, token),
              JSON.stringify({
                workspaceId: savedWorkspace.id,
                userId: user.id,
              }),
              ms(WORKSPACE_INVITE_TTL),
            );

            await this.emailQueue.add(JobName.WORKSPACE_INVITATION, {
              workspaceName: savedWorkspace.name,
              inviteLink,
              ownerName: owner.name,
              email: user.email,
            });
          }),
        );
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
      .leftJoinAndSelect('workspace.members', 'members')
      .where('workspace.ownerId = :userId', { userId })
      .orWhere('members.userId = :userId', { userId })
      .distinct(true)
      .getMany();

    const workspacesWithCount = workspaces.map((ws) => ({
      ...ws,
      membersCount: ws.members ? ws.members.length : 0,
    }));

    return new ResponseDto<BaseWorkspaceResDto[]>({
      data: plainToInstance(BaseWorkspaceResDto, workspacesWithCount, {
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
      select: ['id', 'visibility'],
      relations,
    });

    if (!workspace) {
      throw new BadRequestException('Workspace not found');
    }

    if (workspace.visibility === 'private') {
      workspace = await this.workspaceRepository.findOne({
        where: [
          { id, owner: { id: currentUserId } },
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

  /**
   * Remove a member from workspace
   * Only users with higher role can remove members with lower roles
   */
  async removeMember(
    workspaceId: Uuid,
    userIdToRemove: Uuid,
    currentUserId: Uuid,
  ): Promise<ResponseNoDataDto> {
    // Find workspace with all members and owner
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
      relations: ['owner', 'members', 'members.user'],
    });

    if (!workspace) {
      throw new NotFoundException('Workspace không tồn tại');
    }

    // Check if current user is in the workspace
    const currentUserMember = workspace.members.find(
      (member) => member.userId === currentUserId,
    );

    if (!currentUserMember && workspace.owner.id !== currentUserId) {
      throw new ForbiddenException('Bạn không có quyền truy cập workspace này');
    }

    // Check if user to remove exists in workspace
    const memberToRemove = workspace.members.find(
      (member) => member.userId === userIdToRemove,
    );

    if (!memberToRemove) {
      throw new NotFoundException(
        'Người dùng không phải là thành viên của workspace này',
      );
    }

    // Prevent self-removal
    if (currentUserId === userIdToRemove) {
      throw new BadRequestException('Bạn không thể tự xóa chính mình');
    }

    // Determine current user's role
    const currentUserRole =
      workspace.owner.id === currentUserId
        ? WorkspaceRole.OWNER
        : currentUserMember.role;

    // Check role hierarchy permissions
    if (
      !WorkspaceRoleHierarchy.canManageRole(
        currentUserRole,
        memberToRemove.role,
      )
    ) {
      throw new ForbiddenException(
        'Bạn không có quyền xóa thành viên có vai trò này',
      );
    }

    // Remove the member
    await this.membersRepository.remove(memberToRemove);

    return new ResponseNoDataDto({
      message: 'Xóa thành viên khỏi workspace thành công',
    });
  }

  /**
   * Update member role in workspace
   * Only users with higher role can update members with lower roles
   */
  async updateMemberRole(
    workspaceId: Uuid,
    userIdToUpdate: Uuid,
    updateDto: UpdateMemberRoleDto,
    currentUserId: Uuid,
  ): Promise<ResponseDto<WorkspaceMemberResDto>> {
    // Find workspace with all members and owner
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
      relations: ['owner', 'members', 'members.user'],
    });

    if (!workspace) {
      throw new NotFoundException('Workspace không tồn tại');
    }

    // Check if current user is in the workspace
    const currentUserMember = workspace.members.find(
      (member) => member.userId === currentUserId,
    );

    if (!currentUserMember && workspace.owner.id !== currentUserId) {
      throw new ForbiddenException('Bạn không có quyền truy cập workspace này');
    }

    // Check if user to update exists in workspace
    const memberToUpdate = workspace.members.find(
      (member) => member.userId === userIdToUpdate,
    );

    if (!memberToUpdate) {
      throw new NotFoundException(
        'Người dùng không phải là thành viên của workspace này',
      );
    }

    // Prevent changing owner role
    if (workspace.owner.id === userIdToUpdate) {
      throw new BadRequestException(
        'Không thể thay đổi vai trò của chủ sở hữu workspace',
      );
    }

    // Prevent self role change
    if (currentUserId === userIdToUpdate) {
      throw new BadRequestException(
        'Bạn không thể thay đổi vai trò của chính mình',
      );
    }

    // Determine current user's role
    const currentUserRole =
      workspace.owner.id === currentUserId
        ? WorkspaceRole.OWNER
        : currentUserMember.role;

    // Check if current user can manage the target member's current role
    if (
      !WorkspaceRoleHierarchy.canManageRole(
        currentUserRole,
        memberToUpdate.role,
      )
    ) {
      throw new ForbiddenException(
        'Bạn không có quyền quản lý thành viên có vai trò này',
      );
    }

    // Check if current user can assign the new role
    if (
      !WorkspaceRoleHierarchy.canAssignRole(currentUserRole, updateDto.role)
    ) {
      throw new ForbiddenException('Bạn không có quyền gán vai trò này');
    }

    // Update the member's role
    memberToUpdate.role = updateDto.role;
    const updatedMember = await this.membersRepository.save(memberToUpdate);

    // Reload with user data for response
    const memberWithUser = await this.membersRepository.findOne({
      where: { id: updatedMember.id },
      relations: ['user'],
    });

    return new ResponseDto<WorkspaceMemberResDto>({
      data: plainToInstance(WorkspaceMemberResDto, memberWithUser, {
        excludeExtraneousValues: true,
      }),
      message: 'Cập nhật vai trò thành viên thành công',
    });
  }
}
