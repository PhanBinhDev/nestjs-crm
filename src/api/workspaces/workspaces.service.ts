import { CloudinaryService } from '@/cloudinary/cloudinary.service';
import { ResponseNoDataDto } from '@/common/dto/response/response-no-data.dto';
import { ResponseDto } from '@/common/dto/response/response.dto';
import { IWorkspaceMemberJob } from '@/common/interfaces/job.interface';
import { Uuid } from '@/common/types/common.type';
import { AllConfigType } from '@/config/config.type';
import { WORKSPACE_INVITE_TTL } from '@/constants/app.constant';
import { CacheKey } from '@/constants/cache.constant';
import { JobName, QueueName } from '@/constants/job.constant';
import { NotificationType } from '@/database/enum/notifications.enum';
import {
  MemberType,
  WorkspaceMemberStatus,
  WorkspaceRole,
} from '@/database/enum/workspace.enum';
import { createCacheKey } from '@/utils/cache.util';
import { upperCaseFirst } from '@/utils/index.util';
import { InjectQueue } from '@nestjs/bullmq';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { Cache } from 'cache-manager';
import { plainToInstance } from 'class-transformer';
import { randomBytes } from 'crypto';
import ms from 'ms';
import { Brackets, DataSource, In, Repository } from 'typeorm';
import { FileEntity } from '../files/entities/files.entity';
import { SendPushNotificationDto } from '../notification/dto/send-push-notification.dto';
import { StagesService } from '../stages/stages.service';
import { UserEntity } from '../users/entities/user.entity';
import { BaseWorkspaceResDto } from './dto/base-workspace.res.dto';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { QueryWorkspaceDetailDto } from './dto/query-workspace-detail.dto';
import { QueryWorkspaceMembersReqDto } from './dto/query-workspace-members.req.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { WorkspaceDetailsResDto } from './dto/workspace-details.res.dto';
import { WorkspaceMemberResDto } from './dto/workspace-member.res.dto';
import { WorkspaceMembers } from './entities/workspace-members.entity';
import { Workspaces } from './entities/workspace.entity';
import { WorkspaceRoleHierarchy } from './utils/workspace-role-hierarchy';

@Injectable()
export class WorkspacesService {
  private readonly logger = new Logger(WorkspacesService.name);

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
    @InjectQueue(QueueName.EMAIL)
    private readonly emailQueue: Queue<IWorkspaceMemberJob, any, string>,
    @InjectQueue(QueueName.NOTIFICATION)
    private readonly notificationQueue: Queue,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly configService: ConfigService<AllConfigType>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async getCurrentMemberInfo(
    workspaceId: Uuid,
    userId: Uuid,
  ): Promise<ResponseDto<WorkspaceMemberResDto>> {
    const member = await this.membersRepository.findOne({
      where: { workspaceId, userId, status: WorkspaceMemberStatus.ACTIVE },
    });
    if (!member) throw new NotFoundException('Không tìm thấy thành viên');
    return new ResponseDto<WorkspaceMemberResDto>({
      data: plainToInstance(WorkspaceMemberResDto, member, {
        excludeExtraneousValues: true,
      }),
      message: 'Thông tin thành viên',
    });
  }

  async requestJoin(
    workspaceId: Uuid,
    userId: Uuid,
  ): Promise<ResponseNoDataDto> {
    const existed = await this.membersRepository.findOne({
      where: [
        { workspaceId, userId, status: WorkspaceMemberStatus.PENDING },
        { workspaceId, userId, status: WorkspaceMemberStatus.ACTIVE },
      ],
    });
    if (existed)
      throw new BadRequestException('Bạn đã là thành viên hoặc đã gửi yêu cầu');

    const member = this.membersRepository.create({
      workspaceId,
      userId,
      role: WorkspaceRole.MEMBER,
      status: WorkspaceMemberStatus.PENDING,
      type: MemberType.REQUEST_JOIN,
    });
    await this.membersRepository.save(member);

    const admins = await this.membersRepository.find({
      where: {
        workspaceId,
        role: In([WorkspaceRole.OWNER, WorkspaceRole.ADMIN]),
        status: WorkspaceMemberStatus.ACTIVE,
      },
      relations: ['user'],
    });

    for (const admin of admins) {
      const notificationData: SendPushNotificationDto = {
        userId: admin.user.id,
        title: 'Có yêu cầu tham gia mới',
        message: `Người dùng ${member.user.name} đã gửi yêu cầu tham gia không gian làm việc "${member.workspace.name}"`,
        type: NotificationType.WORKSPACE,
        data: {
          uri: `/settings/workspaces/${workspaceId}`,
          tab: 'members/requests',
        },
      };
      await this.notificationQueue.add(
        JobName.WORKSPACE_REQUEST_JOIN,
        notificationData,
        {
          attempts: 3,
          removeOnComplete: true,
          backoff: { type: 'exponential', delay: 5000 },
        },
      );
    }

    return new ResponseNoDataDto({
      message: 'Đã gửi yêu cầu tham gia workspace',
    });
  }

  async listJoinRequests(
    workspaceId: Uuid,
  ): Promise<ResponseDto<WorkspaceMemberResDto[]>> {
    const requests = await this.membersRepository.find({
      where: {
        workspaceId,
        status: WorkspaceMemberStatus.PENDING,
        type: MemberType.REQUEST_JOIN,
      },
      relations: ['user'],
    });
    return new ResponseDto<WorkspaceMemberResDto[]>({
      data: plainToInstance(WorkspaceMemberResDto, requests, {
        excludeExtraneousValues: true,
      }),
      message: 'Danh sách yêu cầu join workspace',
    });
  }

  async acceptJoinRequest(
    workspaceId: Uuid,
    userId: Uuid,
    currentUserId: Uuid,
  ): Promise<ResponseNoDataDto> {
    const member = await this.membersRepository.findOne({
      where: {
        workspaceId,
        userId,
        status: WorkspaceMemberStatus.PENDING,
        type: MemberType.REQUEST_JOIN,
      },
      relations: ['user', 'workspace'],
    });
    if (!member) throw new BadRequestException('Không có yêu cầu join hợp lệ');
    member.status = WorkspaceMemberStatus.ACTIVE;
    await this.membersRepository.save(member);

    await this.notificationQueue.add(JobName.WORKSPACE_ACCEPTED, {
      userId,
      title: 'Yêu cầu tham gia đã được chấp nhận',
      message: `Bạn đã được duyệt tham gia không gian làm việc "${member.workspace.name}"`,
      type: NotificationType.WORKSPACE,
      senderId: currentUserId,
      data: {
        uri: `/workspaces/${workspaceId}`,
      },
    });

    return new ResponseNoDataDto({
      message: 'Đã duyệt yêu cầu tham gia workspace',
    });
  }

  async rejectJoinRequest(
    workspaceId: Uuid,
    userId: Uuid,
    currentUserId: Uuid,
  ): Promise<ResponseNoDataDto> {
    const member = await this.membersRepository.findOne({
      where: {
        workspaceId,
        userId,
        status: WorkspaceMemberStatus.PENDING,
        type: MemberType.REQUEST_JOIN,
      },
      relations: ['user', 'workspace'],
    });
    if (!member) throw new BadRequestException('Không có yêu cầu join hợp lệ');
    await this.membersRepository.remove(member);

    await this.notificationQueue.add(JobName.WORKSPACE_DECLINED, {
      userId,
      title: 'Yêu cầu tham gia đã bị từ chối',
      message: `Bạn đã bị từ chối tham gia không gian làm việc "${member.workspace.name}"`,
      type: NotificationType.WORKSPACE,
      senderId: currentUserId,
      data: {
        uri: `/workspaces/${workspaceId}`,
      },
    });

    return new ResponseNoDataDto({
      message: 'Đã từ chối yêu cầu tham gia workspace',
    });
  }

  async rejectInvitation(
    workspaceId: Uuid,
    userId: Uuid,
  ): Promise<ResponseNoDataDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    const member = await this.membersRepository.findOne({
      where: {
        workspaceId,
        userId,
        status: WorkspaceMemberStatus.PENDING,
        type: MemberType.INVITE,
      },
      relations: ['workspace'],
    });
    if (!member) throw new BadRequestException('Không có lời mời hợp lệ');

    const workspaceName = member.workspace?.name ?? '';

    await this.membersRepository.remove(member);

    const admins = await this.membersRepository.find({
      where: {
        workspaceId,
        role: In([WorkspaceRole.OWNER, WorkspaceRole.ADMIN]),
        status: WorkspaceMemberStatus.ACTIVE,
      },
      relations: ['user'],
    });

    for (const admin of admins) {
      const notificationData: SendPushNotificationDto = {
        userId: admin.userId,
        title: `${upperCaseFirst(user.name)} đã từ chối lời mời`,
        message: `Thành viên ${user.name} đã từ chối tham gia không gian làm việc "${upperCaseFirst(workspaceName)}"`,
        type: NotificationType.WORKSPACE,
        senderId: user.id,
        data: {
          uri: `/workspaces/${workspaceId}`,
        },
      };

      await this.notificationQueue.add(
        JobName.WORKSPACE_DECLINED,
        notificationData,
        {
          attempts: 3,
          removeOnComplete: true,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        },
      );
    }

    return new ResponseNoDataDto({
      message: 'Bạn đã từ chối lời mời tham gia workspace',
    });
  }

  async acceptInvitation(
    workspaceId: Uuid,
    userId: Uuid,
  ): Promise<ResponseNoDataDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    const member = await this.membersRepository.findOne({
      where: {
        workspaceId,
        userId,
        status: WorkspaceMemberStatus.PENDING,
        type: MemberType.INVITE,
      },
      relations: ['workspace', 'workspace.owner'],
    });

    if (!member) throw new BadRequestException('Không có lời mời hợp lệ');

    member.status = WorkspaceMemberStatus.ACTIVE;
    await this.membersRepository.save(member);

    const admins = await this.membersRepository.find({
      where: {
        workspaceId,
        role: In([WorkspaceRole.OWNER, WorkspaceRole.ADMIN]),
        status: WorkspaceMemberStatus.ACTIVE,
      },
      relations: ['user'],
    });

    for (const admin of admins) {
      const notificationData: SendPushNotificationDto = {
        userId: admin.userId,
        title: `${upperCaseFirst(user.name)} đã chấp nhận lời mời`,
        message: `Thành viên ${user.name} đã tham gia không gian làm việc "${upperCaseFirst(member.workspace.name)}"`,
        type: NotificationType.WORKSPACE,
        senderId: user.id,
        data: {
          uri: `/workspaces/${workspaceId}`,
        },
      };

      await this.notificationQueue.add(
        JobName.WORKSPACE_ACCEPTED,
        notificationData,
        {
          attempts: 3,
          removeOnComplete: true,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        },
      );
    }

    return new ResponseNoDataDto({
      message: 'Bạn đã tham gia workspace thành công',
    });
  }

  async leaveWorkspace(
    workspaceId: Uuid,
    userId: Uuid,
  ): Promise<ResponseNoDataDto> {
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
    });
    if (!workspace)
      throw new NotFoundException('Không gian làm việc không tồn tại');

    if (workspace.owner.id === userId) {
      throw new BadRequestException(
        'Owner phải chuyển quyền trước khi rời khỏi workspace',
      );
    }

    const member = await this.membersRepository.findOne({
      where: { workspaceId, userId, status: WorkspaceMemberStatus.ACTIVE },
    });
    if (!member)
      throw new BadRequestException('Bạn không phải thành viên đang hoạt động');

    await this.dataSource.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .delete()
        .from('activity_assignees')
        .where('userId = :userId', { userId })
        .andWhere(
          `activityId IN (SELECT id FROM activities WHERE workspaceId = :workspaceId)`,
          { workspaceId },
        )
        .execute();

      await manager.remove(member);
    });

    return new ResponseNoDataDto({
      message: 'Rời khỏi không gian làm việc thành công',
    });
  }

  async transferOwnership(
    workspaceId: Uuid,
    currentOwnerId: Uuid,
    newOwnerId: Uuid,
  ): Promise<ResponseNoDataDto> {
    return await this.dataSource.transaction(async (manager) => {
      const workspace = await manager.findOne(Workspaces, {
        where: { id: workspaceId },
        relations: ['owner', 'members'],
      });
      if (!workspace) throw new NotFoundException('Workspace không tồn tại');
      if (workspace.owner.id !== currentOwnerId) {
        throw new ForbiddenException('Bạn không phải owner');
      }
      if (currentOwnerId === newOwnerId) {
        throw new BadRequestException('Không thể chuyển quyền cho chính mình');
      }

      const newOwnerMember = workspace.members.find(
        (m) =>
          m.userId === newOwnerId && m.status === WorkspaceMemberStatus.ACTIVE,
      );

      if (!newOwnerMember) {
        throw new BadRequestException(
          'Người nhận quyền phải là thành viên đang hoạt động',
        );
      }

      workspace.owner = await manager.findOne(UserEntity, {
        where: { id: newOwnerId },
      });
      await manager.save(workspace);

      await manager.update(
        WorkspaceMembers,
        { workspaceId, userId: currentOwnerId },
        { role: WorkspaceRole.ADMIN },
      );
      await manager.update(
        WorkspaceMembers,
        { workspaceId, userId: newOwnerId },
        { role: WorkspaceRole.OWNER },
      );

      return new ResponseNoDataDto({
        message: 'Chuyển quyền owner thành công',
      });
    });
  }

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

    const existingMembers = await this.membersRepository.find({
      where: {
        workspaceId,
        userId: In(inviteMemberDto.userIds),
        status: In([
          WorkspaceMemberStatus.PENDING,
          WorkspaceMemberStatus.ACTIVE,
        ]),
      },
    });

    const usersToInvite = membersToInvite.filter(
      (user) => !existingMembers.some((m) => m.userId === user.id),
    );

    if (usersToInvite.length === 0) {
      throw new BadRequestException(
        'Tất cả người dùng đã là thành viên hoặc đã có lời mời pending',
      );
    }

    const invitations = usersToInvite.map((user) =>
      this.membersRepository.create({
        workspaceId,
        userId: user.id,
        role: WorkspaceRole.MEMBER,
        status: WorkspaceMemberStatus.PENDING,
        type: MemberType.INVITE,
        createdBy: userId,
      }),
    );

    await this.membersRepository.save(invitations);

    const baseURL = this.configService.getOrThrow('app.frontendUrl', {
      infer: true,
    });

    await Promise.all(
      usersToInvite.map(async (user) => {
        const token = randomBytes(32).toString('hex');
        const inviteLink = `${baseURL}/invite-members/${token}`;

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

        const notificationData: SendPushNotificationDto = {
          userId: user.id,
          title: 'Lời mời tham gia không gian làm việc',
          message: `Bạn đã được mời tham gia không gian làm việc "${workspace.name}"`,
          senderId: workspace.owner.id,
          type: NotificationType.WORKSPACE,
          data: {
            uri: `/invite-members/${token}`,
            workspaceId: workspace.id,
          },
        };

        await this.notificationQueue.add(
          JobName.WORKSPACE_INVITATION,
          notificationData,
          {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 5000,
            },
            removeOnComplete: true,
          },
        );
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
    avatar?: Express.Multer.File,
  ): Promise<ResponseDto<BaseWorkspaceResDto>> {
    let uploadedPublicId: string | null = null;

    return await this.dataSource
      .transaction(async (manager) => {
        const { members, ...body } = dto;

        const owner = await manager.findOne(UserEntity, {
          where: { id: ownerId },
        });

        const workspace = this.workspaceRepository.create({
          ...body,
          owner,
        });
        const savedWorkspace = await manager.save(workspace);

        if (avatar) {
          const folder = `workspaces/${savedWorkspace.id}`;
          const fileName = avatar.originalname;

          const uploadResult = await this.cloudinaryService.uploadToFolder(
            avatar,
            folder,
            fileName,
          );

          if ('url' in uploadResult) {
            uploadedPublicId = uploadResult.public_id;

            const fileEntity = manager.create(FileEntity, {
              url: uploadResult.url,
              originalName: avatar.originalname,
              mimeType: avatar.mimetype,
              size: uploadResult.bytes,
              fileName: fileName,
              uploadedBy: ownerId,
              workspaceId: savedWorkspace.id,
              metadata: {
                public_id: uploadResult.public_id,
                format: uploadResult.format,
                resource_type: uploadResult.resource_type,
                width: uploadResult.width,
                height: uploadResult.height,
                bytes: uploadResult.bytes,
              },
            });
            await manager.save(FileEntity, fileEntity);

            await manager.update(Workspaces, savedWorkspace.id, {
              avatar: uploadResult.url,
            });
            savedWorkspace.avatar = uploadResult.url;
          }
        }

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

              const notificationData: SendPushNotificationDto = {
                userId: user.id,
                title: 'Lời mời tham gia không gian làm việc',
                message: `Bạn đã được mời tham gia không gian làm việc "${workspace.name}"`,
                senderId: workspace.owner.id,
                type: NotificationType.WORKSPACE,
                data: {
                  uri: `/invite-members/${token}`,
                  workspace,
                },
              };

              await this.notificationQueue.add(
                JobName.WORKSPACE_INVITATION,
                notificationData,
                {
                  attempts: 3,
                  backoff: {
                    type: 'exponential',
                    delay: 5000,
                  },
                  removeOnComplete: true,
                },
              );
            }),
          );
        }

        return new ResponseDto<BaseWorkspaceResDto>({
          data: plainToInstance(BaseWorkspaceResDto, savedWorkspace, {
            excludeExtraneousValues: true,
          }),
          message: 'Tạo không gian làm việc thành công',
        });
      })
      .catch(async (error) => {
        if (uploadedPublicId) {
          try {
            await this.cloudinaryService.deleteFile(uploadedPublicId);
          } catch {
            this.logger.warn(
              `Cannot rollback file on Cloudinary: ${uploadedPublicId}`,
            );
          }
        }
        throw error;
      });
  }

  async findAll(userId: Uuid): Promise<ResponseDto<BaseWorkspaceResDto[]>> {
    const workspaces = await this.workspaceRepository
      .createQueryBuilder('workspace')
      .leftJoinAndSelect('workspace.members', 'members')
      .leftJoinAndSelect('workspace.owner', 'owner')
      .where('workspace.ownerId = :userId', { userId })
      .orWhere(`members.userId = :userId AND members.status = :status`, {
        userId,
        status: WorkspaceMemberStatus.ACTIVE,
      })
      .distinct(true)
      .getMany();

    const workspacesWithCount = workspaces.map((ws) => ({
      ...ws,
      ownerName: ws.owner?.name,
      membersCount: ws.members
        ? ws.members.filter((m) => m.status === WorkspaceMemberStatus.ACTIVE)
            .length
        : 0,
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
    const qb = this.workspaceRepository
      .createQueryBuilder('workspace')
      .where('workspace.id = :id', { id })
      .leftJoinAndSelect('workspace.owner', 'owner')
      .leftJoin('workspace.members', 'members');

    if (query.includeMembers) {
      qb.addSelect('members').leftJoinAndSelect('members.user', 'user');
    }

    qb.andWhere(
      new Brackets((qb) => {
        qb.where('workspace.visibility = :public', { public: 'public' })
          .orWhere('workspace.ownerId = :userId', { userId: currentUserId })
          .orWhere('members.userId = :userId', { userId: currentUserId });
      }),
    );

    const workspace = await qb.getOne();

    if (!workspace) {
      throw new BadRequestException(
        'Workspace không tồn tại hoặc bạn không có quyền truy cập',
      );
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
    dto: UpdateWorkspaceDto,
    currentUserId: Uuid,
    avatar?: Express.Multer.File,
  ): Promise<ResponseDto<BaseWorkspaceResDto>> {
    const { members: _members, removeAvatar, ...body } = dto;
    let uploadedPublicId: string | null = null;

    return await this.dataSource
      .transaction(async (manager) => {
        if (removeAvatar) {
          const workspace = await manager.findOne(Workspaces, {
            where: { id },
          });
          if (workspace?.avatar) {
            const oldFile = await manager.findOne(FileEntity, {
              where: { url: workspace.avatar },
            });
            if (oldFile) {
              if (oldFile.metadata?.public_id) {
                await this.cloudinaryService.deleteFile(
                  oldFile.metadata.public_id,
                );
              }
              await manager.delete(FileEntity, oldFile.id);
            }
            body.avatar = null;
          }
        }

        if (avatar) {
          const folder = `workspaces/${id}`;
          const fileName = avatar.originalname;

          const workspace = await manager.findOne(Workspaces, {
            where: { id },
          });

          if (workspace?.avatar) {
            const oldFile = await manager.findOne(FileEntity, {
              where: { url: workspace.avatar },
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

          if ('url' in uploadResult) {
            body.avatar = uploadResult.url;
            uploadedPublicId = uploadResult.public_id;

            const fileEntity = manager.create(FileEntity, {
              url: uploadResult.url,
              originalName: avatar.originalname,
              mimeType: avatar.mimetype,
              size: uploadResult.bytes,
              fileName: fileName,
              uploadedBy: currentUserId,
              workspaceId: id,
              metadata: {
                public_id: uploadResult.public_id,
                format: uploadResult.format,
                resource_type: uploadResult.resource_type,
                width: uploadResult.width,
                height: uploadResult.height,
                bytes: uploadResult.bytes,
              },
            });
            await manager.save(FileEntity, fileEntity);
          }
        }

        await manager.update(Workspaces, id, body);
        const updatedWorkspace = await manager.findOne(Workspaces, {
          where: { id },
        });

        return new ResponseDto<BaseWorkspaceResDto>({
          data: plainToInstance(BaseWorkspaceResDto, updatedWorkspace, {
            excludeExtraneousValues: true,
          }),
          message: 'Cập nhật không gian làm việc thành công',
        });
      })
      .catch(async (error) => {
        if (uploadedPublicId) {
          try {
            await this.cloudinaryService.deleteFile(uploadedPublicId);
          } catch {
            this.logger.warn(
              `Cannot rollback file on Cloudinary: ${uploadedPublicId}`,
            );
          }
        }
        throw error;
      });
  }

  async findMembers(
    id: Uuid,
    currentUserId: Uuid,
    query: QueryWorkspaceMembersReqDto,
  ) {
    const isInWorkspace = await this.checkUserInWorkspace(currentUserId, id);
    if (!isInWorkspace) {
      throw new BadRequestException(
        'Bạn không có quyền xem thành viên của không gian làm việc này',
      );
    }

    const qb = this.membersRepository
      .createQueryBuilder('member')
      .leftJoinAndSelect('member.user', 'user')
      .where('member.workspaceId = :workspaceId', { workspaceId: id });

    const statusFilter = query.status ?? WorkspaceMemberStatus.ACTIVE;
    qb.andWhere('member.status = :statusFilter', { statusFilter });

    if (query.type) {
      qb.andWhere('member.type = :typeFilter', {
        typeFilter: query.type,
      });
    }

    if (query.q) {
      qb.andWhere('(user.name ILIKE :q OR user.email ILIKE :q)', {
        q: `%${query.q}%`,
      });
    }

    if (query.role) {
      qb.andWhere('member.role = :roleFilter', {
        roleFilter: query.role,
      });
    }

    const allowedSortFields = ['name', 'email', 'createdAt'];
    const sortField = allowedSortFields.includes(query.sortBy || '')
      ? query.sortBy
      : 'createdAt';
    const sortOrder = (query.order || 'DESC').toUpperCase() as 'ASC' | 'DESC';

    if (sortField === 'name') {
      qb.orderBy('user.name', sortOrder);
    } else if (sortField === 'email') {
      qb.orderBy('user.email', sortOrder);
    } else {
      qb.orderBy(`member.${sortField}`, sortOrder);
    }

    const members = await qb.getMany();

    const totalActive = await this.membersRepository.count({
      where: {
        workspaceId: id,
        status: WorkspaceMemberStatus.ACTIVE,
      },
    });

    const totalPending = await this.membersRepository.count({
      where: {
        workspaceId: id,
        status: WorkspaceMemberStatus.PENDING,
      },
    });

    return new ResponseDto<WorkspaceMemberResDto[]>({
      data: plainToInstance(WorkspaceMemberResDto, members, {
        excludeExtraneousValues: true,
      }),
      metadata: {
        totalActive,
        totalPending,
      },
      message: 'Lấy danh sách thành viên không gian làm việc thành công',
    });
  }

  async findInvitations(
    userId: Uuid,
  ): Promise<ResponseDto<BaseWorkspaceResDto[]>> {
    const invitations = await this.workspaceRepository
      .createQueryBuilder('workspace')
      .leftJoin('workspace.members', 'member')
      .where('member.userId = :userId', { userId })
      .andWhere('member.status = :status', {
        status: WorkspaceMemberStatus.PENDING,
      })
      .getMany();

    return new ResponseDto<BaseWorkspaceResDto[]>({
      data: plainToInstance(BaseWorkspaceResDto, invitations, {
        excludeExtraneousValues: true,
      }),
      message: 'Lấy danh sách lời mời tham gia không gian làm việc thành công',
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

  async removeMember(
    workspaceId: Uuid,
    userIdToRemove: Uuid,
    currentUserId: Uuid,
  ): Promise<ResponseNoDataDto> {
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
      relations: ['owner', 'members', 'members.user'],
    });

    if (!workspace) {
      throw new NotFoundException('Workspace không tồn tại');
    }

    const currentUserMember = workspace.members.find(
      (member) => member.userId === currentUserId,
    );

    if (!currentUserMember && workspace.owner.id !== currentUserId) {
      throw new ForbiddenException('Bạn không có quyền truy cập workspace này');
    }

    const memberToRemove = workspace.members.find(
      (member) => member.userId === userIdToRemove,
    );

    if (!memberToRemove) {
      throw new NotFoundException(
        'Người dùng không phải là thành viên của workspace này',
      );
    }

    if (currentUserId === userIdToRemove) {
      throw new BadRequestException('Bạn không thể tự xóa chính mình');
    }

    // Determine current user's role
    const currentUserRole =
      workspace.owner.id === currentUserId
        ? WorkspaceRole.OWNER
        : currentUserMember.role;

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

    await this.membersRepository.remove(memberToRemove);

    return new ResponseNoDataDto({
      message: 'Xóa thành viên khỏi workspace thành công',
    });
  }

  async updateMemberRole(
    workspaceId: Uuid,
    userIdToUpdate: Uuid,
    updateDto: UpdateMemberRoleDto,
    currentUserId: Uuid,
  ): Promise<ResponseDto<WorkspaceMemberResDto>> {
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
      relations: ['owner', 'members', 'members.user'],
    });

    if (!workspace) {
      throw new NotFoundException('Workspace không tồn tại');
    }

    const currentUserMember = workspace.members.find(
      (member) => member.userId === currentUserId,
    );

    if (!currentUserMember && workspace.owner.id !== currentUserId) {
      throw new ForbiddenException('Bạn không có quyền truy cập workspace này');
    }

    const memberToUpdate = workspace.members.find(
      (member) => member.userId === userIdToUpdate,
    );

    if (!memberToUpdate) {
      throw new NotFoundException(
        'Người dùng không phải là thành viên của workspace này',
      );
    }

    if (workspace.owner.id === userIdToUpdate) {
      throw new BadRequestException(
        'Không thể thay đổi vai trò của chủ sở hữu workspace',
      );
    }

    if (currentUserId === userIdToUpdate) {
      throw new BadRequestException(
        'Bạn không thể thay đổi vai trò của chính mình',
      );
    }

    const currentUserRole =
      workspace.owner.id === currentUserId
        ? WorkspaceRole.OWNER
        : currentUserMember.role;

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

    if (
      !WorkspaceRoleHierarchy.canAssignRole(currentUserRole, updateDto.role)
    ) {
      throw new ForbiddenException('Bạn không có quyền gán vai trò này');
    }

    memberToUpdate.role = updateDto.role;
    const updatedMember = await this.membersRepository.save(memberToUpdate);

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

  async revokeInvitation(
    workspaceId: Uuid,
    userId: Uuid,
    currentUserId: Uuid,
  ): Promise<ResponseNoDataDto> {
    return await this.dataSource.transaction(async (manager) => {
      const workspace = await manager.findOne(Workspaces, {
        where: { id: workspaceId },
        relations: ['owner', 'members'],
      });

      if (!workspace) {
        throw new NotFoundException('Workspace không tồn tại');
      }

      const isOwner = workspace.owner.id === currentUserId;
      const currentUserMember = workspace.members.find(
        (m) => m.userId === currentUserId,
      );

      const isAdmin =
        currentUserMember &&
        currentUserMember.role === WorkspaceRole.ADMIN &&
        currentUserMember.status === WorkspaceMemberStatus.ACTIVE;

      if (!isOwner && !isAdmin) {
        throw new ForbiddenException(
          'Chỉ Owner hoặc Admin mới có quyền thu hồi lời mời',
        );
      }

      const invitation = await manager.findOne(WorkspaceMembers, {
        where: {
          workspaceId,
          userId,
          status: WorkspaceMemberStatus.PENDING,
          type: MemberType.INVITE,
        },
        relations: ['user', 'workspace'],
      });

      if (!invitation) {
        throw new NotFoundException(
          'Không tìm thấy lời mời hợp lệ hoặc lời mời đã được chấp nhận/từ chối',
        );
      }

      await manager.remove(WorkspaceMembers, invitation);

      const cacheKeyPattern = createCacheKey(CacheKey.WORKSPACE_INVITE, '*');
      const store = this.cacheManager.store as any;

      if (store.keys) {
        const keys = await store.keys(cacheKeyPattern);
        for (const key of keys) {
          const cachedData = await this.cacheManager.store.get<string>(key);
          if (cachedData) {
            const data = JSON.parse(cachedData);
            if (data.workspaceId === workspaceId && data.userId === userId) {
              await this.cacheManager.store.del(key);
              this.logger.log(`Deleted invite token cache: ${key}`);
            }
          }
        }
      }

      await manager
        .createQueryBuilder()
        .softDelete()
        .from('notifications')
        .where('userId = :userId', { userId })
        .andWhere('type = :type', { type: NotificationType.WORKSPACE })
        .andWhere("data->>'workspaceId' = :workspaceId", { workspaceId })
        .andWhere("title LIKE '%Lời mời%'")
        .andWhere('deletedAt IS NULL')
        .execute();

      this.logger.log(
        `Revoked invitation for user ${userId} from workspace ${workspaceId} by ${currentUserId}`,
      );

      return new ResponseNoDataDto({
        message: 'Thu hồi lời mời thành công',
      });
    });
  }

  async listPendingInvitations(
    workspaceId: Uuid,
    currentUserId: Uuid,
  ): Promise<ResponseDto<WorkspaceMemberResDto[]>> {
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
      relations: ['owner', 'members'],
    });

    if (!workspace) {
      throw new NotFoundException('Workspace không tồn tại');
    }

    const isOwner = workspace.owner.id === currentUserId;
    const currentUserMember = workspace.members.find(
      (m) => m.userId === currentUserId,
    );

    const isAdmin =
      currentUserMember &&
      currentUserMember.role === WorkspaceRole.ADMIN &&
      currentUserMember.status === WorkspaceMemberStatus.ACTIVE;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'Chỉ Owner hoặc Admin mới có quyền xem danh sách lời mời',
      );
    }

    const invitations = await this.membersRepository.find({
      where: {
        workspaceId,
        status: WorkspaceMemberStatus.PENDING,
        type: MemberType.INVITE,
      },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    return new ResponseDto<WorkspaceMemberResDto[]>({
      data: plainToInstance(WorkspaceMemberResDto, invitations, {
        excludeExtraneousValues: true,
      }),
      message: 'Lấy danh sách lời mời thành công',
    });
  }
}
