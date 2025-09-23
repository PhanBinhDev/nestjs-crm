import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { ResponseNoDataDto } from '@/common/dto/response/response-no-data.dto';
import { ResponseDto } from '@/common/dto/response/response.dto';
import { Uuid } from '@/common/types/common.type';
import { ErrorCode } from '@/constants/error-code.constant';
import {
  ActivityLogActionEnum,
  ActivityLogQueryType,
  AssignmentStatus,
  ParticipantStatus,
  QueryType,
} from '@/database/enum/activity.enum';
import { ValidationException } from '@/exceptions/validation.exception';
import { BaseService } from '@/services/base.service';
import { paginate } from '@/utils/offset-pagination';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, Repository } from 'typeorm';
import { SemesterEntity } from '../semester/entities/semester.entity';
import { UserEntity } from '../users/entities/user.entity';
import { ActivityAssigneeResDto } from './dto/activity-assignee.res.dto';
import { ActivityFeedbackResDto } from './dto/activity-feedback.res.dto';
import { ActivityLogResDto } from './dto/activity-log.res.dto';
import { ActivityResDto } from './dto/activity.res.dto';
import { AssignUserToActivityDto } from './dto/assign-user-to-activity.dto';
import { AttachFileDto } from './dto/attach-file.dto';
import { AttachFileResDto } from './dto/attach-file.res.dto';
import { CreateActivityFeedbackDto } from './dto/create-activity-feedback.dto';
import { CreateActivityLogDto } from './dto/create-activity-log.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { QueryActivityLogDto } from './dto/query-activity-log.dto';
import { QueryActivityDto } from './dto/query-activity.dto';
import { UpdateActivityStatusDto } from './dto/update-activity-status.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { UpdateParticipantReqDto } from './dto/update-participant.req.dto';
import { ActivityAssigneeEntity } from './entities/activity-assignee.entity';
import {
  ActivityChecklistEntity,
  ActivityChecklistItemEntity,
} from './entities/activity-checklist.entity';
import { ActivityFeedbackEntity } from './entities/activity-feedback.entity';
import { ActivityFileEntity } from './entities/activity-file.entity';
import { ActivityLogEntity } from './entities/activity-log.entity';
import { ActivityParticipantEntity } from './entities/activity-participant.entity';
import { ActivityEntity } from './entities/activity.entity';

@Injectable()
export class ActivitiesService extends BaseService<ActivityEntity> {
  constructor(
    @InjectRepository(ActivityEntity)
    private readonly activityRepo: Repository<ActivityEntity>,
    @InjectRepository(ActivityFileEntity)
    private readonly activityFileRepo: Repository<ActivityFileEntity>,
    @InjectRepository(ActivityParticipantEntity)
    private readonly participantRepo: Repository<ActivityParticipantEntity>,
    @InjectRepository(ActivityFeedbackEntity)
    private readonly activityFeedbackRepo: Repository<ActivityFeedbackEntity>,
    @InjectRepository(ActivityAssigneeEntity)
    private readonly activityAssigneeRepo: Repository<ActivityAssigneeEntity>,
    @InjectRepository(SemesterEntity)
    private readonly semesterRepo: Repository<SemesterEntity>,
    @InjectRepository(ActivityChecklistEntity)
    private readonly activityChecklistRepo: Repository<ActivityChecklistEntity>,
    @InjectRepository(ActivityChecklistItemEntity)
    private readonly activityChecklistItemRepo: Repository<ActivityChecklistItemEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(ActivityLogEntity)
    private readonly activityLogRepository: Repository<ActivityLogEntity>,
  ) {
    super(activityRepo);
  }

  async getActivityLogs(
    activityId: string,
    query: QueryActivityLogDto,
  ): Promise<ActivityLogResDto[]> {
    const qb = this.activityLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user')
      .leftJoinAndSelect('log.parentLog', 'parentLog')
      .where('log.activityId = :activityId', { activityId })
      .orderBy('log.createdAt', 'DESC');

    // Apply filters
    if (query.action) {
      qb.andWhere('log.action = :action', { action: query.action });
    }

    if (query.userId) {
      qb.andWhere('log.userId = :userId', { userId: query.userId });
    }

    const logs = await qb.getMany();

    return plainToInstance(ActivityLogResDto, logs, {
      excludeExtraneousValues: true,
    });
  }

  async create(
    dto: CreateActivityDto,
    userId: Uuid,
  ): Promise<ResponseDto<ActivityResDto>> {
    return this.dataSource.transaction(async (manager) => {
      const userCreator = await manager.getRepository(UserEntity).findOne({
        where: { id: userId },
      });

      if (!userCreator) {
        throw new ValidationException(ErrorCode.E003);
      }

      if (dto.type === 'event' && !dto.location) {
        throw new BadRequestException('Event phải có location');
      }

      const activityRepo = manager.getRepository(ActivityEntity);
      const checklistRepo = manager.getRepository(ActivityChecklistEntity);
      const checklistItemRepo = manager.getRepository(
        ActivityChecklistItemEntity,
      );
      // Add this line - get the activity log repository from the manager
      const activityLogRepo = manager.getRepository(ActivityLogEntity);

      const count = await activityRepo.count({
        where: { stageId: dto.stageId },
      });

      const activity = activityRepo.create({
        ...dto,
        position: count + 1,
      });
      const savedActivity = await activityRepo.save(activity);

      // Log activity creation - Main activity
      const mainActivityLog = activityLogRepo.create({
        activity: savedActivity,
        user: userCreator,
        action: ActivityLogActionEnum.CREATED,
        message: 'Tạo hoạt động mới',
        metadata: {
          type: 'MAIN_ACTIVITY',
          activityType: dto.type,
        },
      });
      await activityLogRepo.save(mainActivityLog);

      // Handle subtasks and logging
      if (dto.subtask?.length > 0) {
        const subActivities: ActivityEntity[] = [];
        const logs: ActivityLogEntity[] = [];

        for (const task of dto.subtask) {
          const subActivity = activityRepo.create({
            parentId: savedActivity.id,
            name: task,
            type: dto.type,
            stageId: dto.stageId,
            workspaceId: dto.workspaceId,
            createdBy: userId,
          });
          const savedSubActivity = await activityRepo.save(subActivity);
          subActivities.push(savedSubActivity);

          const log = activityLogRepo.create({
            activity: savedActivity, // Log vào main activity thay vì sub activity
            user: userCreator,
            action: ActivityLogActionEnum.CREATED,
            message: `Tạo công việc phụ: ${task}`,
            metadata: {
              type: ActivityLogQueryType.SUB_TASK,
              subTaskId: savedSubActivity.id,
              subTaskName: task,
            },
          });
          logs.push(log);
        }

        if (logs.length > 0) {
          await activityLogRepo.save(logs);
        }
      }

      // TODO: Log tương tự như subtask cho checklist
      if (dto.checklist?.length > 0) {
        const checklistLogs: ActivityLogEntity[] = [];

        for (const checklistDto of dto.checklist) {
          const checklist = checklistRepo.create({
            activityId: savedActivity.id,
            name: checklistDto.name,
          });
          const savedChecklist = await checklistRepo.save(checklist);

          // Log checklist creation
          const checklistLog = activityLogRepo.create({
            activity: savedActivity,
            user: userCreator,
            action: ActivityLogActionEnum.CREATED,
            message: `Tạo checklist: ${checklistDto.name}`,
            metadata: {
              type: 'CHECKLIST',
              checklistId: savedChecklist.id,
              checklistName: checklistDto.name,
              itemsCount: checklistDto.items?.length || 0,
            },
          });
          checklistLogs.push(checklistLog);

          if (checklistDto.items?.length > 0) {
            const items = checklistDto.items.map((item) =>
              checklistItemRepo.create({
                checklistId: savedChecklist.id,
                content: item.content,
                isDone: item.isDone || false,
              }),
            );
            await checklistItemRepo.save(items);

            // Log checklist items creation
            const itemsLog = activityLogRepo.create({
              activity: savedActivity,
              user: userCreator,
              action: ActivityLogActionEnum.CREATED,
              message: `Thêm ${checklistDto.items.length} mục vào checklist "${checklistDto.name}"`,
              metadata: {
                type: 'CHECKLIST_ITEMS',
                checklistId: savedChecklist.id,
                checklistName: checklistDto.name,
                itemsCount: checklistDto.items.length,
                items: checklistDto.items.map((item) => ({
                  content: item.content,
                  isDone: item.isDone || false,
                })),
              },
            });
            checklistLogs.push(itemsLog);
          }
        }

        // Save all checklist logs
        if (checklistLogs.length > 0) {
          await activityLogRepo.save(checklistLogs);
        }
      }

      const result = await activityRepo.findOne({
        where: { id: savedActivity.id },
        relations: ['subActivities'],
      });

      return new ResponseDto<ActivityResDto>({
        data: plainToInstance(ActivityResDto, result, {
          excludeExtraneousValues: true,
        }),
        message: 'Tạo hoạt động thành công',
      });
    });
  }
  async findAll(
    query: QueryActivityDto,
  ): Promise<OffsetPaginatedDto<ActivityResDto>> {
    const qb = this.activityRepo
      .createQueryBuilder('activity')
      .andWhere('activity.workspaceId = :workspaceId', {
        workspaceId: query.workspaceId,
      })
      .leftJoinAndSelect('activity.participants', 'participants')
      .leftJoinAndSelect('participants.user', 'participantUser')
      .leftJoinAndSelect('activity.files', 'files')
      .leftJoinAndSelect('activity.feedbacks', 'feedbacks')
      .leftJoinAndSelect('feedbacks.user', 'feedbackUser')
      .leftJoinAndSelect('activity.assignees', 'assignees')
      .leftJoinAndSelect('assignees.user', 'assigneeUser')
      .leftJoinAndSelect('activity.semester', 'semester')
      .leftJoinAndSelect('activity.subActivities', 'subActivities')
      .leftJoinAndSelect('activity.checklists', 'checklists')
      .leftJoinAndSelect('checklists.items', 'items');

    if (!query.includeSubTasks) {
      qb.andWhere('activity.parentId IS NULL');
    }

    if (query.q) {
      qb.andWhere(
        'activity.name ILIKE :search OR activity.description ILIKE :search',
        { search: `%${query.q}%` },
      );
    }
    if (query.type) qb.andWhere('activity.type = :type', { type: query.type });
    if (query.priority)
      qb.andWhere('activity.priority = :priority', {
        priority: query.priority,
      });
    if (query.stageId)
      qb.andWhere('activity.stageId = :stageId', { stageId: query.stageId });
    if (query.category)
      qb.andWhere('activity.category = :category', {
        category: query.category,
      });
    if (query.mandatory !== undefined)
      qb.andWhere('activity.mandatory = :mandatory', {
        mandatory: query.mandatory,
      });
    if (query.startTimeFrom)
      qb.andWhere('activity.startTime >= :startTimeFrom', {
        startTimeFrom: query.startTimeFrom,
      });
    if (query.endTimeTo)
      qb.andWhere('activity.endTime <= :endTimeTo', {
        endTimeTo: query.endTimeTo,
      });
    if (query.createdBy)
      qb.andWhere('activity.createdBy = :createdBy', {
        createdBy: query.createdBy,
      });
    qb.orderBy('activity.createdAt', 'DESC');

    const [activities, metaDto] = await paginate<ActivityEntity>(qb, query, {
      skipCount: false,
      takeAll: true,
    });

    return new OffsetPaginatedDto({
      data: plainToInstance(ActivityResDto, activities, {
        excludeExtraneousValues: true,
      }),
      meta: metaDto,
      message: 'Lấy danh sách hoạt động thành công',
    });
  }

  async findSubActivities(
    parentId: Uuid,
  ): Promise<ResponseDto<ActivityResDto[]>> {
    const activities = await this.activityRepo.find({
      where: { parentId },
    });

    return new ResponseDto<ActivityResDto[]>({
      data: plainToInstance(ActivityResDto, activities, {
        excludeExtraneousValues: true,
      }),
      message: 'Lấy danh sách sub-activities thành công',
    });
  }

  async updateStatus(
    id: Uuid,
    dto: UpdateActivityStatusDto,
    userId: Uuid,
  ): Promise<ResponseDto<ActivityResDto>> {
    return this.dataSource.transaction(async () => {
      const activity = await this.activityRepo.findOneOrFail({ where: { id } });
      const user = await this.userRepo.findOneOrFail({ where: { id: userId } });

      const newValue = activity.status;
      const oldValue = dto.status;

      const payload = {
        action: ActivityLogActionEnum.UPDATED,
        message: `Cập nhật trạng thái từ ${oldValue} sang ${newValue}`,
        user,
        newValue,
        oldValue,
        activity,
      };

      const activityLog = this.activityLogRepository.create(payload);
      await this.activityLogRepository.save(activityLog);

      activity.status = dto.status;
      await this.activityRepo.save(activity);

      return new ResponseDto<ActivityResDto>({
        data: plainToInstance(ActivityResDto, activity, {
          excludeExtraneousValues: true,
        }),
        message: 'Cập nhật trạng thái hoạt động thành công',
      });
    });
  }

  async findById(id: Uuid): Promise<ResponseDto<ActivityResDto>> {
    const activity = await this.activityRepo.findOneOrFail({
      where: { id },
      relations: [
        'participants',
        'participants.user',
        'files',
        'feedbacks',
        'feedbacks.user',
        'assignees',
        'assignees.user',
      ],
    });
    return new ResponseDto<ActivityResDto>({
      data: plainToInstance(ActivityResDto, activity, {
        excludeExtraneousValues: true,
      }),
      message: 'Lấy thông tin hoạt động thành công',
    });
  }

  // TODO: log delete
  async deleteActivity(id: Uuid, userId: Uuid): Promise<ResponseNoDataDto> {
    return this.dataSource.transaction(async (manager) => {
      const activityRepo = manager.getRepository(ActivityEntity);
      const activityLogRepo = manager.getRepository(ActivityLogEntity);
      const activityFileRepo = manager.getRepository(ActivityFileEntity);
      const userRepo = manager.getRepository(UserEntity);

      // Lấy thông tin activity cần xóa
      const activity = await activityRepo.findOne({
        where: { id },
        relations: ['files', 'parent'],
      });

      if (!activity) {
        throw new NotFoundException('Hoạt động không tồn tại');
      }

      // Lấy thông tin user thực hiện xóa
      const user = await userRepo.findOneOrFail({ where: { id: userId } });

      // CHECK NẾU MÀ NÓ CÓ PARENT ID -> nghĩa là đang delete sub task -> ghi log
      if (activity.parentId) {
        const deleteSubTaskLog = activityLogRepo.create({
          activity: { id: activity.parentId } as ActivityEntity, // Log vào parent activity
          user,
          action: ActivityLogActionEnum.DELETED,
          message: `Xóa công việc phụ: ${activity.name}`,
          metadata: {
            type: ActivityLogQueryType.SUB_TASK,
            deletedSubTaskId: activity.id,
            deletedSubTaskName: activity.name,
          },
        });
        await activityLogRepo.save(deleteSubTaskLog);
      } else {
        // Nếu là main activity thì log vào chính nó
        const deleteActivityLog = activityLogRepo.create({
          activity,
          user,
          action: ActivityLogActionEnum.DELETED,
          message: `Xóa hoạt động: ${activity.name}`,
          metadata: {
            // Fix: Sử dụng string literal thay vì enum không tồn tại
            type: 'MAIN_ACTIVITY',
            deletedActivityName: activity.name,
          },
        });
        await activityLogRepo.save(deleteActivityLog);
      }

      // TODO: handle clear file manually here
      if (activity.files && activity.files.length > 0) {
        // Xóa các file records trong database
        await activityFileRepo.delete({ activityId: id });
        console.log(
          `Đã xóa ${activity.files.length} file(s) liên quan đến activity ${id}`,
        );
      }

      // Xóa activity
      await activityRepo.delete(id);

      return new ResponseNoDataDto({
        message: activity.parentId
          ? 'Xóa công việc phụ thành công'
          : 'Xóa hoạt động thành công',
      });
    });
  }

  async updateActivity(
    id: Uuid,
    dto: UpdateActivityDto,
    userId: Uuid, // Thêm userId để biết ai thực hiện update
  ): Promise<ResponseDto<ActivityResDto>> {
    return await this.dataSource.transaction(async (manager) => {
      const activityRepo = manager.getRepository(ActivityEntity);
      const activityLogRepo = manager.getRepository(ActivityLogEntity);
      const userRepo = manager.getRepository(UserEntity);

      const activity = await activityRepo.findOneOrFail({ where: { id } });
      const user = await userRepo.findOneOrFail({ where: { id: userId } });

      const oldStageId = activity.stageId;
      const oldPosition = activity.position;
      const newStageId = dto.stageId ?? activity.stageId;
      const newPosition = dto.position ?? activity.position;

      // Logic di chuyển position (giữ nguyên như cũ)
      const hasStageChange = dto.stageId && dto.stageId !== oldStageId;
      const hasPositionChange =
        dto.position !== undefined && dto.position !== oldPosition;

      if (hasStageChange) {
        await Promise.all([
          activityRepo
            .createQueryBuilder()
            .update(ActivityEntity)
            .set({ position: () => 'position - 1' })
            .where('stageId = :oldStageId', { oldStageId })
            .andWhere('position > :oldPosition', { oldPosition })
            .execute(),

          activityRepo
            .createQueryBuilder()
            .update(ActivityEntity)
            .set({ position: () => 'position + 1' })
            .where('stageId = :newStageId', { newStageId })
            .andWhere('position >= :newPosition', { newPosition })
            .execute(),
        ]);
      } else if (hasPositionChange) {
        if (oldPosition < newPosition) {
          await activityRepo
            .createQueryBuilder()
            .update(ActivityEntity)
            .set({ position: () => 'position - 1' })
            .where('stageId = :stageId', { stageId: newStageId })
            .andWhere('position > :oldPosition', { oldPosition })
            .andWhere('position <= :newPosition', { newPosition })
            .execute();
        } else {
          await activityRepo
            .createQueryBuilder()
            .update(ActivityEntity)
            .set({ position: () => 'position + 1' })
            .where('stageId = :stageId', { stageId: newStageId })
            .andWhere('position >= :newPosition', { newPosition })
            .andWhere('position < :oldPosition', { oldPosition })
            .execute();
        }
      }

      // Update activity
      Object.assign(activity, dto);
      await activityRepo.save(activity);

      // TODO: check nếu có stageId nghĩa là change column -> ghi log
      if (dto.stageId && dto.stageId !== oldStageId) {
        // Log stage change
        const stageChangeLog = activityLogRepo.create({
          activity,
          user,
          action: ActivityLogActionEnum.UPDATED,
          message: `Chuyển hoạt động từ stage ${oldStageId} sang ${newStageId}`,
          oldValue: oldStageId,
          newValue: newStageId,
          metadata: {
            type: 'STAGE_CHANGE',
            field: 'stageId',
            oldStageId,
            newStageId,
          },
        });
        await activityLogRepo.save(stageChangeLog);
      }

      // Log other significant changes
      const logPromises = [];

      // Log name change
      if (dto.name && dto.name !== activity.name) {
        const nameChangeLog = activityLogRepo.create({
          activity,
          user,
          action: ActivityLogActionEnum.UPDATED,
          message: `Đổi tên hoạt động từ "${activity.name}" thành "${dto.name}"`,
          oldValue: activity.name,
          newValue: dto.name,
          metadata: {
            type: 'NAME_CHANGE',
            field: 'name',
          },
        });
        logPromises.push(activityLogRepo.save(nameChangeLog));
      }

      // Log priority change
      if (dto.priority && dto.priority !== activity.priority) {
        const priorityChangeLog = activityLogRepo.create({
          activity,
          user,
          action: ActivityLogActionEnum.UPDATED,
          message: `Thay đổi độ ưu tiên từ ${activity.priority} sang ${dto.priority}`,
          oldValue: activity.priority,
          newValue: dto.priority,
          metadata: {
            type: 'PRIORITY_CHANGE',
            field: 'priority',
          },
        });
        logPromises.push(activityLogRepo.save(priorityChangeLog));
      }

      // Log time changes
      if (
        dto.startTime &&
        new Date(dto.startTime).getTime() !==
          (activity.startTime instanceof Date
            ? activity.startTime.getTime()
            : new Date(activity.startTime).getTime())
      ) {
        const startTimeLog = activityLogRepo.create({
          activity,
          user,
          action: ActivityLogActionEnum.UPDATED,
          message: `Cập nhật thời gian bắt đầu`,
          oldValue: activity.startTime,
          newValue: dto.startTime,
          metadata: {
            type: 'TIME_CHANGE',
            field: 'startTime',
          },
        });
        logPromises.push(activityLogRepo.save(startTimeLog));
      }

      if (
        dto.endTime &&
        new Date(dto.endTime).getTime() !==
          (activity.endTime instanceof Date
            ? activity.endTime.getTime()
            : new Date(activity.endTime).getTime())
      ) {
        const endTimeLog = activityLogRepo.create({
          activity,
          user,
          action: ActivityLogActionEnum.UPDATED,
          message: `Cập nhật thời gian kết thúc`,
          oldValue: activity.endTime,
          newValue: dto.endTime,
          metadata: {
            type: 'TIME_CHANGE',
            field: 'endTime',
          },
        });
        logPromises.push(activityLogRepo.save(endTimeLog));
      }

      // Execute all log saves
      if (logPromises.length > 0) {
        await Promise.all(logPromises);
      }

      return new ResponseDto<ActivityResDto>({
        data: plainToInstance(ActivityResDto, activity, {
          excludeExtraneousValues: true,
        }),
        message: 'Cập nhật hoạt động thành công',
      });
    });
  }

  private async logActivity(dto: CreateActivityLogDto) {
    const activityLog = this.activityLogRepository.create(dto);
    await this.activityLogRepository.save(activityLog);
  }

  async attachFile(
    id: Uuid,
    dto: AttachFileDto,
  ): Promise<ResponseDto<ActivityResDto>> {
    return await this.activityRepo.manager.transaction(async (manager) => {
      const activityFile = manager.create(ActivityFileEntity, {
        activityId: id,
        fileUrl: dto.fileUrl,
        fileName: dto.fileName,
      });

      await this.activityFileRepo.save(activityFile);

      const updatedActivity = await manager.findOneOrFail(ActivityEntity, {
        where: { id },
        relations: ['files'],
      });

      return new ResponseDto<ActivityResDto>({
        data: plainToInstance(ActivityResDto, updatedActivity, {
          excludeExtraneousValues: true,
        }),
        message: 'Đính kèm tệp thành công',
      });
    });
  }

  async getFiles(id: Uuid): Promise<ResponseDto<AttachFileResDto[]>> {
    const files = await this.activityFileRepo.find({
      where: { activityId: id },
    });

    if (files.length === 0) {
      return new ResponseDto<AttachFileResDto[]>({
        data: [],
        message: 'Không tìm thấy tệp nào cho hoạt động này',
      });
    }

    return new ResponseDto<AttachFileResDto[]>({
      data: plainToInstance(AttachFileResDto, files, {
        excludeExtraneousValues: true,
      }),
      message: 'Lấy danh sách tệp thành công',
    });
  }

  async updateParticipants(id: Uuid, dto: UpdateParticipantReqDto) {
    const activity = await this.activityRepo.findOne({
      where: { id },
    });
    if (!activity) {
      throw new NotFoundException('Hoạt động không tồn tại');
    }
    let participant = await this.participantRepo.findOne({
      where: { activityId: id, userId: dto.userId },
    });
    if (participant) {
      participant.role = dto.role;
    } else {
      participant = this.participantRepo.create({
        activityId: id,
        userId: dto.userId,
        role: dto.role,
        status: ParticipantStatus.ACCEPTED,
      });
    }
    await this.participantRepo.save(participant);
    return participant;
  }
  async getFeedbacksByActivityId(
    activityId: Uuid,
  ): Promise<ResponseDto<ActivityFeedbackResDto[]>> {
    const feedbacks = await this.activityFeedbackRepo.find({
      where: { activityId },
      relations: ['user'],
      order: { submittedAt: 'DESC' },
    });
    return new ResponseDto<ActivityFeedbackResDto[]>({
      data: plainToInstance(ActivityFeedbackResDto, feedbacks, {
        excludeExtraneousValues: true,
      }),
      message: 'Lấy danh sách phản hồi thành công',
    });
  }
  async createFeedback(
    activityId: Uuid,
    userId: Uuid,
    dto: CreateActivityFeedbackDto,
  ) {
    // Kiểm tra activity tồn tại
    await this.activityRepo.findOneOrFail({ where: { id: activityId } });

    const feedback = this.activityFeedbackRepo.create({
      activityId,
      userId,
      content: dto.content,
    });
    await this.activityFeedbackRepo.save(feedback);

    return new ResponseDto<ActivityFeedbackResDto>({
      data: plainToInstance(ActivityFeedbackResDto, feedback, {
        excludeExtraneousValues: true,
      }),
      message: 'Tạo phản hồi thành công',
    });
  }

  async assignUserToActivity(
    id: Uuid,
    dto: AssignUserToActivityDto,
  ): Promise<ResponseDto<ActivityAssigneeEntity[]>> {
    const userIds = Array.isArray(dto.userId) ? dto.userId : [dto.userId];
    const assignees: ActivityAssigneeEntity[] = [];

    console.log('Assigning users to activity:', id, userIds, dto);

    await this.activityRepo.findOneOrFail({ where: { id } });

    for (const userId of userIds) {
      let assignee = await this.activityAssigneeRepo.findOne({
        where: { activityId: id, userId },
      });

      if (assignee) {
        // Nếu đã có thì update role/note nếu truyền vào
        if (dto.role) assignee.role = dto.role;
        if (dto.note) assignee.note = dto.note;
        assignee.assignedAt = new Date();
      } else {
        // Nếu chưa có thì tạo mới
        assignee = this.activityAssigneeRepo.create({
          activityId: id,
          userId,
          role: dto.role,
          note: dto.note,
          assignedAt: new Date(),
          status: AssignmentStatus.PENDING,
        });
      }
      await this.activityAssigneeRepo.save(assignee);
      assignees.push(assignee);
    }

    return new ResponseDto<ActivityAssigneeEntity[]>({
      data: assignees,
      message: 'Gán người dùng vào hoạt động thành công',
    });
  }

  async getAssigneesByActivityId(
    activityId: Uuid,
  ): Promise<ResponseDto<ActivityAssigneeResDto[]>> {
    const assignees = await this.activityAssigneeRepo.find({
      where: { activityId },
      relations: ['user'],
    });
    return new ResponseDto<ActivityAssigneeResDto[]>({
      data: plainToInstance(ActivityAssigneeResDto, assignees, {
        excludeExtraneousValues: true,
      }),
      message: 'Lấy danh sách người được giao thành công',
    });
  }

  async deleteAssignee(
    activityId: Uuid,
    userId: Uuid,
  ): Promise<ResponseNoDataDto> {
    const assignee = await this.activityAssigneeRepo.findOne({
      where: { activityId, userId },
    });
    if (!assignee) {
      throw new NotFoundException('Assignee not found');
    }
    await this.activityAssigneeRepo.remove(assignee);
    return new ResponseNoDataDto({
      message: 'Xóa người được giao thành công',
    });
  }

  async updateAssignee(
    activityId: Uuid,
    userId: Uuid,
    dto: AssignUserToActivityDto,
  ): Promise<ResponseDto<ActivityAssigneeResDto>> {
    const assignee = await this.activityAssigneeRepo.findOne({
      where: { activityId, userId },
    });
    if (!assignee) {
      throw new NotFoundException('Người được giao không tồn tại');
    }
    // Cập nhật thông tin người thực hiện
    assignee.role = dto.role;
    assignee.note = dto.note;
    await this.activityAssigneeRepo.save(assignee);
    return new ResponseDto<ActivityAssigneeResDto>({
      data: plainToInstance(ActivityAssigneeResDto, assignee, {
        excludeExtraneousValues: true,
      }),
      message: 'Cập nhật người được giao thành công',
    });
  }

  async linkActivityToSemester(
    activityId: Uuid,
    semesterId: Uuid,
  ): Promise<ResponseDto<ActivityResDto>> {
    const activity = await this.activityRepo.findOneOrFail({
      where: { id: activityId },
    });

    const semester = await this.semesterRepo.findOneOrFail({
      where: { id: semesterId },
    });

    activity.semester = semester;
    await this.activityRepo.save(activity);

    return new ResponseDto<ActivityResDto>({
      data: plainToInstance(ActivityResDto, activity, {
        excludeExtraneousValues: true,
      }),
      message: 'Gán hoạt động vào kỳ học thành công',
    });
  }

  async unlinkActivityFromSemester(
    activityId: Uuid,
    semesterId: Uuid,
  ): Promise<ResponseNoDataDto> {
    // Kiểm tra activity tồn tại
    const activity = await this.activityRepo.findOneOrFail({
      where: { id: activityId },
      relations: ['semester'],
    });

    if (!activity.semester || activity.semester.id !== semesterId) {
      throw new NotFoundException('Hoạt động không được gán vào kỳ học này');
    }

    // Xóa liên kết với kỳ học
    activity.semester = null;
    await this.activityRepo.save(activity);

    return new ResponseNoDataDto({
      message: 'Xóa liên kết với kỳ học thành công',
    });
  }

  async findFilteredActivities(
    userId: Uuid,
    query: QueryActivityDto,
    type: QueryType,
  ): Promise<OffsetPaginatedDto<ActivityResDto>> {
    const qb = this.activityRepo.createQueryBuilder('activity');

    switch (type) {
      case QueryType.CREATED_BY_ME:
        qb.where('activity.createdBy = :userId', { userId });
        break;
      case QueryType.ASSIGNED_TO_ME:
        qb.leftJoin('activity.assignees', 'assignee').where(
          'assignee.userId = :userId',
          { userId },
        );
        break;
      case QueryType.OVERDUE:
        qb.leftJoin('activity.assignees', 'assignee')
          .where('assignee.userId = :userId', { userId })
          .andWhere('activity.endTime < :now', { now: new Date() })
          .andWhere('activity.status != :completed', {
            completed: 'completed',
          });
        break;
      case QueryType.TODAY: {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        qb.leftJoin('activity.assignees', 'assignee')
          .where('assignee.userId = :userId', { userId })
          .andWhere('activity.startTime >= :today', { today })
          .andWhere('activity.startTime < :tomorrow', { tomorrow });
        break;
      }
      case QueryType.COMPLETED:
        qb.leftJoin('activity.assignees', 'assignee')
          .where('assignee.userId = :userId', { userId })
          .andWhere('activity.status = :completed', { completed: 'completed' });
        break;
      default:
        break;
    }

    qb.orderBy('activity.createdAt', 'DESC');
    const [activities, metaDto] = await paginate<ActivityEntity>(qb, query, {
      skipCount: false,
      takeAll: false,
    });
    return new OffsetPaginatedDto({
      data: plainToInstance(ActivityResDto, activities, {
        excludeExtraneousValues: true,
      }),
      meta: metaDto,
      message: 'Lấy danh sách công việc thành công',
    });
  }
}
