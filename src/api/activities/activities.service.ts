import { CursorPaginationDto } from '@/common/dto/cursor-pagination/cursor-pagination.dto';
import { PageOptionsDto } from '@/common/dto/cursor-pagination/page-options.dto';
import { CursorPaginatedDto } from '@/common/dto/cursor-pagination/paginated.dto';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { ResponseNoDataDto } from '@/common/dto/response/response-no-data.dto';
import { ResponseDto } from '@/common/dto/response/response.dto';
import { Uuid } from '@/common/types/common.type';
import { ErrorCode } from '@/constants/error-code.constant';
import {
  ActivityLogActionEnum,
  ActivityLogQueryType,
  ActivityType,
  AssigneeRole,
  AssignmentStatus,
  ParticipantStatus,
  QueryType,
} from '@/database/enum/activity.enum';
import { ValidationException } from '@/exceptions/validation.exception';
import { BaseService } from '@/services/base.service';
import { buildPaginator } from '@/utils/cursor-pagination';
import { paginate } from '@/utils/offset-pagination';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, Repository } from 'typeorm';
import { FileEntity } from '../files/entities/files.entity';
import { NotificationEntity } from '../notification/entities/notification.entity';
import { SemesterEntity } from '../semester/entities/semester.entity';
import { StagesEntity } from '../stages/entities/stage.entity';
import { UserEntity } from '../users/entities/user.entity';
import { ActivityAssigneeDto } from './dto/activity-assignee.dto';
import { ActivityAssigneeResDto } from './dto/activity-assignee.res.dto';
import { ActivityCommentResDto } from './dto/activity-comment.res.dto';
import { ActivityFeedbackResDto } from './dto/activity-feedback.res.dto';
import { ActivityLogResDto } from './dto/activity-log.res.dto';
import { ActivityResDto } from './dto/activity.res.dto';
import { AssignUserToActivityDto } from './dto/assign-user-to-activity.dto';
import { CategoryResDto } from './dto/category.res.dto';
import { CategoryDto } from './dto/category.res.dto copy';
import { CreateActivityFeedbackDto } from './dto/create-activity-feedback.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { CreateActivityCommentDto } from './dto/create-comment.dto';
import { CreateEventFeedbackDto } from './dto/create-event-feedback.dto';
import { EventFeedbackResDto } from './dto/event-feedback.res.dto';
import { QueryActivityLogDto } from './dto/query-activity-log.dto';
import { QueryActivityDto } from './dto/query-activity.dto';
import { UpdateActivityStatusDto } from './dto/update-activity-status.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { UpdateActivityCommentDto } from './dto/update-comment.dto';
import { UpdateParticipantReqDto } from './dto/update-participant.req.dto';
import { ActivityAssigneeEntity } from './entities/activity-assignee.entity';
import { ActivityCategoryEntity } from './entities/activity-category.entity';
import {
  ActivityChecklistEntity,
  ActivityChecklistItemEntity,
} from './entities/activity-checklist.entity';
import { ActivityCommentEntity } from './entities/activity-comments.entity';
import { ActivityFeedbackEntity } from './entities/activity-feedback.entity';
import { ActivityFileEntity } from './entities/activity-file.entity';
import { ActivityLogEntity } from './entities/activity-log.entity';
import { ActivityParticipantEntity } from './entities/activity-participant.entity';
import { ActivityEntity } from './entities/activity.entity';
import { EventFeedbackEntity } from './entities/event-feedback.entity';

@Injectable()
export class ActivitiesService extends BaseService<ActivityEntity> {
  constructor(
    @InjectRepository(ActivityEntity)
    private readonly activityRepo: Repository<ActivityEntity>,
    @InjectRepository(ActivityParticipantEntity)
    private readonly participantRepo: Repository<ActivityParticipantEntity>,
    @InjectRepository(ActivityFeedbackEntity)
    private readonly activityFeedbackRepo: Repository<ActivityFeedbackEntity>,
    @InjectRepository(ActivityAssigneeEntity)
    private readonly activityAssigneeRepo: Repository<ActivityAssigneeEntity>,
    @InjectRepository(SemesterEntity)
    private readonly semesterRepo: Repository<SemesterEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(ActivityLogEntity)
    private readonly activityLogRepository: Repository<ActivityLogEntity>,
    @InjectRepository(EventFeedbackEntity)
    private readonly eventFeedbackRepo: Repository<EventFeedbackEntity>,
    @InjectRepository(ActivityCategoryEntity)
    private readonly activityCategoryRepo: Repository<ActivityCategoryEntity>,
    @InjectRepository(StagesEntity)
    private readonly stageRepo: Repository<StagesEntity>,

    @InjectRepository(ActivityCommentEntity)
    private readonly activityCommentRepo: Repository<ActivityCommentEntity>,
    @InjectRepository(ActivityFileEntity)
    private readonly activityFileRepo: Repository<ActivityFileEntity>,
  ) {
    super(activityRepo);
  }

  async createComment(
    activityId: Uuid,
    createCommentDto: CreateActivityCommentDto,
    userId: Uuid,
  ): Promise<ResponseDto<ActivityCommentResDto>> {
    const activity = await this.activityRepo.findOne({
      where: { id: activityId },
    });

    if (!activity) {
      throw new NotFoundException('Hoạt động không tồn tại');
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    if (
      createCommentDto.parentCommentId &&
      createCommentDto.parentCommentId.trim() !== ''
    ) {
      const parentComment = await this.activityCommentRepo.findOne({
        where: { id: createCommentDto.parentCommentId as Uuid, activityId },
      });

      if (!parentComment) {
        throw new NotFoundException('Bình luận cha không tồn tại');
      }
    }

    const comment = this.activityCommentRepo.create({
      activityId,
      userId,
      content: createCommentDto.content,
      parentCommentId:
        createCommentDto.parentCommentId &&
        createCommentDto.parentCommentId.trim() !== ''
          ? (createCommentDto.parentCommentId as Uuid)
          : null,
    });

    const savedComment = await this.activityCommentRepo.save(comment);

    const commentWithUser = await this.activityCommentRepo.findOne({
      where: { id: savedComment.id },
      relations: ['user'],
    });

    await this.createCommentLog(
      activity,
      user,
      ActivityLogActionEnum.COMMENT_CREATED,
      'Đã thêm bình luận mới',
    );

    return new ResponseDto<ActivityCommentResDto>({
      data: plainToInstance(ActivityCommentResDto, commentWithUser, {
        excludeExtraneousValues: true,
      }),
      message: 'Tạo bình luận thành công',
    });
  }

  async getComments(
    activityId: Uuid,
  ): Promise<ResponseDto<ActivityCommentResDto[]>> {
    const activity = await this.activityRepo.findOne({
      where: { id: activityId },
    });

    if (!activity) {
      throw new NotFoundException('Hoạt động không tồn tại');
    }

    const comments = await this.activityCommentRepo.find({
      where: { activityId, parentCommentId: null },
      relations: ['user', 'replies', 'replies.user'],
      order: { createdAt: 'DESC' },
    });

    return new ResponseDto<ActivityCommentResDto[]>({
      data: plainToInstance(ActivityCommentResDto, comments, {
        excludeExtraneousValues: true,
      }),
      message: 'Lấy danh sách bình luận thành công',
    });
  }

  async getReplies(
    activityId: Uuid,
    commentId: Uuid,
    query: PageOptionsDto,
  ): Promise<CursorPaginatedDto<ActivityCommentResDto>> {
    const activity = await this.activityRepo.findOne({
      where: { id: activityId },
    });

    if (!activity) {
      throw new NotFoundException('Hoạt động không tồn tại');
    }

    const parentComment = await this.activityCommentRepo.findOne({
      where: { id: commentId, activityId },
    });

    if (!parentComment) {
      throw new NotFoundException('Không tìm thấy bình luận');
    }

    const qb = this.activityCommentRepo
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .where('comment.parentCommentId = :parentCommentId', {
        parentCommentId: commentId,
      })
      .andWhere('comment.activityId = :activityId', { activityId });

    const allowedSortFields = ['createdAt', 'content'];
    const sortField = allowedSortFields.includes(query.sortBy || '')
      ? query.sortBy
      : 'createdAt';

    qb.orderBy(`comment.${sortField}`, query.order || 'ASC');

    const paginator = buildPaginator({
      entity: ActivityCommentEntity,
      alias: 'comment',
      query: {
        limit: query.limit,
        order: query.order,
        afterCursor: query.afterCursor,
        beforeCursor: query.beforeCursor,
      },
    });

    const totalRecords = await qb.getCount();

    const { data, cursor } = await paginator.paginate(qb);

    const metaDto = new CursorPaginationDto(
      totalRecords,
      cursor.afterCursor,
      cursor.beforeCursor,
      query,
    );

    return new CursorPaginatedDto<ActivityCommentResDto>({
      data: plainToInstance(ActivityCommentResDto, data, {
        excludeExtraneousValues: true,
      }),
      meta: metaDto,
      message: 'Lấy danh sách replies thành công',
    });
  }

  async updateComment(
    activityId: Uuid,
    commentId: Uuid,
    updateCommentDto: UpdateActivityCommentDto,
    userId: Uuid,
  ): Promise<ResponseDto<ActivityCommentResDto>> {
    const activity = await this.activityRepo.findOne({
      where: { id: activityId },
    });

    if (!activity) {
      throw new NotFoundException('Hoạt động không tồn tại');
    }

    const comment = await this.activityCommentRepo.findOne({
      where: { id: commentId, activityId },
      relations: ['user'],
    });

    if (!comment) {
      throw new NotFoundException('Bình luận không tồn tại');
    }

    // Chỉ cho phép người tạo comment sửa
    if (comment.userId !== userId) {
      throw new BadRequestException('Bạn chỉ có thể sửa bình luận của mình');
    }

    const oldContent = comment.content;
    comment.content = updateCommentDto.content;
    comment.isEdited = true;
    comment.editedAt = new Date();

    const updatedComment = await this.activityCommentRepo.save(comment);

    // Tạo log cho việc cập nhật comment
    await this.createCommentLog(
      activity,
      comment.user,
      ActivityLogActionEnum.COMMENT_UPDATED,
      `Đã cập nhật bình luận từ "${oldContent}" thành "${updateCommentDto.content}"`,
    );

    return new ResponseDto<ActivityCommentResDto>({
      data: plainToInstance(ActivityCommentResDto, updatedComment, {
        excludeExtraneousValues: true,
      }),
      message: 'Cập nhật bình luận thành công',
    });
  }

  async deleteComment(
    activityId: Uuid,
    commentId: Uuid,
    userId: Uuid,
  ): Promise<ResponseNoDataDto> {
    const activity = await this.activityRepo.findOne({
      where: { id: activityId },
    });

    if (!activity) {
      throw new NotFoundException('Hoạt động không tồn tại');
    }

    const comment = await this.activityCommentRepo.findOne({
      where: { id: commentId, activityId },
      relations: ['user', 'replies'],
    });

    if (!comment) {
      throw new NotFoundException('Bình luận không tồn tại');
    }

    // Chỉ cho phép người tạo comment xóa
    if (comment.userId !== userId) {
      throw new BadRequestException('Bạn chỉ có thể xóa bình luận của mình');
    }

    const contentBackup = comment.content;

    // Xóa comment (cascade sẽ xóa các replies)
    await this.activityCommentRepo.remove(comment);

    // Tạo log cho việc xóa comment
    await this.createCommentLog(
      activity,
      comment.user,
      ActivityLogActionEnum.COMMENT_DELETED,
      `Đã xóa bình luận: "${contentBackup}"`,
    );

    return new ResponseNoDataDto({ message: 'Xóa bình luận thành công' });
  }

  private async createCommentLog(
    activity: ActivityEntity,
    user: UserEntity,
    action: ActivityLogActionEnum,
    description: string,
  ): Promise<void> {
    const log = this.activityLogRepository.create({
      activity,
      user,
      action,
      message: description,
    });

    await this.activityLogRepository.save(log);
  }

  async addReaction(
    activityId: Uuid,
    commentId: Uuid,
    _userId: Uuid,
  ): Promise<ResponseDto<ActivityCommentResDto>> {
    // Kiểm tra activity có tồn tại không
    const activity = await this.activityRepo.findOne({
      where: { id: activityId },
    });

    if (!activity) {
      throw new NotFoundException('Hoạt động không tồn tại');
    }

    // Kiểm tra comment có tồn tại không
    const comment = await this.activityCommentRepo.findOne({
      where: { id: commentId, activityId },
      relations: ['user'],
    });

    if (!comment) {
      throw new NotFoundException('Không tìm thấy bình luận');
    }

    // Khởi tạo reactions nếu chưa có
    if (!comment.reactions) {
      comment.reactions = {};
    }

    // Khởi tạo tym count nếu chưa có
    if (!comment.reactions.tym) {
      comment.reactions.tym = 0;
    }

    // Tăng số lượng tym
    comment.reactions.tym += 1;

    // Đánh dấu flag cho TypeORM nhận biết thay đổi jsonb
    comment.reactions = { ...comment.reactions };

    const updatedComment = await this.activityCommentRepo.save(comment);

    return new ResponseDto<ActivityCommentResDto>({
      data: plainToInstance(ActivityCommentResDto, updatedComment, {
        excludeExtraneousValues: true,
      }),
      message: 'Thêm reaction thành công',
    });
  }

  async removeReaction(
    activityId: Uuid,
    commentId: Uuid,
    _userId: Uuid,
  ): Promise<ResponseDto<ActivityCommentResDto>> {
    // Kiểm tra activity có tồn tại không
    const activity = await this.activityRepo.findOne({
      where: { id: activityId },
    });

    if (!activity) {
      throw new NotFoundException('Hoạt động không tồn tại');
    }

    // Kiểm tra comment có tồn tại không
    const comment = await this.activityCommentRepo.findOne({
      where: { id: commentId, activityId },
      relations: ['user'],
    });

    if (!comment) {
      throw new NotFoundException('Không tìm thấy bình luận');
    }

    // Kiểm tra có reactions không
    if (
      !comment.reactions ||
      !comment.reactions.tym ||
      comment.reactions.tym <= 0
    ) {
      throw new BadRequestException('Bình luận này chưa có reaction nào');
    }

    // Giảm số lượng tym
    comment.reactions.tym = Math.max(0, comment.reactions.tym - 1);

    // Đánh dấu flag cho TypeORM nhận biết thay đổi jsonb
    comment.reactions = { ...comment.reactions };

    const updatedComment = await this.activityCommentRepo.save(comment);

    return new ResponseDto<ActivityCommentResDto>({
      data: plainToInstance(ActivityCommentResDto, updatedComment, {
        excludeExtraneousValues: true,
      }),
      message: 'Bỏ reaction thành công',
    });
  }

  async getActivityCategories(): Promise<ResponseDto<CategoryResDto[]>> {
    const categories = await this.activityCategoryRepo.find();
    return new ResponseDto<CategoryResDto[]>({
      data: plainToInstance(CategoryResDto, categories, {
        excludeExtraneousValues: true,
      }),
      message: 'Lấy danh sách danh mục hoạt động thành công',
    });
  }

  async createActivityCategory(
    createCategoryDto: CategoryDto,
  ): Promise<ResponseDto<CategoryResDto>> {
    const category = this.activityCategoryRepo.create(createCategoryDto);
    await this.activityCategoryRepo.save(category);
    return new ResponseDto<CategoryResDto>({
      data: plainToInstance(CategoryResDto, category, {
        excludeExtraneousValues: true,
      }),
      message: 'Tạo danh mục hoạt động thành công',
    });
  }

  async getActivityLogs(
    activityId: string,
    query: QueryActivityLogDto,
  ): Promise<ActivityLogResDto[]> {
    const qb = this.activityLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user')
      .leftJoinAndSelect('log.parentLog', 'parentLog')
      .leftJoinAndSelect('log.activity', 'activity')
      .where('log.activityId = :activityId', { activityId })
      .orderBy('log.createdAt', 'DESC');

    if (query.action) {
      qb.andWhere('log.action = :action', { action: query.action });
    }

    if (query.userId) {
      qb.andWhere('log.userId = :userId', { userId: query.userId });
    }

    const logs = await qb.getMany();

    const transformedLogs = await Promise.all(
      logs.map(async (log) => {
        const transformedLog = plainToInstance(ActivityLogResDto, log, {
          excludeExtraneousValues: true,
        });

        if (log.activity?.stageId) {
          try {
            const stageResult = await this.dataSource
              .createQueryBuilder()
              .select('stage.title', 'title')
              .from('stages', 'stage')
              .where('stage.id = :stageId', { stageId: log.activity.stageId })
              .getRawOne();

            transformedLog.stageName = stageResult?.title || null;
          } catch (error) {
            console.error('Error getting stage name:', error);
            transformedLog.stageName = null;
          }
        } else {
          transformedLog.stageName = null;
        }

        if (
          log.metadata?.type === 'STAGE_CHANGE' &&
          (log.metadata.oldStageId || log.metadata.newStageId)
        ) {
          try {
            const stageQuery = this.dataSource
              .createQueryBuilder()
              .select(['stage.id AS id', 'stage.title AS title'])
              .from('stages', 'stage')
              .where('stage.id IN (:...ids)', {
                ids: [log.metadata.oldStageId, log.metadata.newStageId].filter(
                  Boolean,
                ),
              });

            const stages = await stageQuery.getRawMany();

            const oldStage = stages.find(
              (s) => s.id === log.metadata.oldStageId,
            );
            const newStage = stages.find(
              (s) => s.id === log.metadata.newStageId,
            );

            if (transformedLog.metadata) {
              transformedLog.metadata = {
                ...transformedLog.metadata,
                oldStageName: oldStage?.title || null,
                newStageName: newStage?.title || null,
              };
            }

            if (oldStage && newStage) {
              transformedLog.message = `Chuyển hoạt động từ stage ${oldStage.title} sang ${newStage.title}`;
            }
          } catch (error) {
            console.error('Error resolving stage names:', error);
          }
        }

        return transformedLog;
      }),
    );

    return transformedLogs;
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

      const activityRepo = manager.getRepository(ActivityEntity);
      const checklistRepo = manager.getRepository(ActivityChecklistEntity);
      const checklistItemRepo = manager.getRepository(
        ActivityChecklistItemEntity,
      );
      const activityLogRepo = manager.getRepository(ActivityLogEntity);
      const notificationRepo = manager.getRepository(NotificationEntity);

      const count = await activityRepo.count({
        where: { stageId: dto.stageId },
      });

      let assignees: ActivityAssigneeEntity[] = [];
      if (dto.assignees?.length > 0) {
        const assigneeRepo = manager.getRepository(ActivityAssigneeEntity);
        assignees = dto.assignees.map((assigneeDto) =>
          assigneeRepo.create({
            userId: assigneeDto.userId,
            role: assigneeDto.role || AssigneeRole.COLLABORATOR,
            note: assigneeDto.note,
            assignedAt: new Date(),
            assignedBy: userId,
            status: AssignmentStatus.PENDING,
          }),
        );

        const notifications = await Promise.all(
          dto.assignees.map(async (assigneeDto) => {
            const userAssignee = await this.userRepo.findOne({
              where: { id: assigneeDto.userId },
            });

            return notificationRepo.create({
              userId: assigneeDto.userId,
              title: `Có ${dto.type === ActivityType.TASK ? 'công việc' : 'sự kiện'} mới`,
              message: `Bạn được giao ${dto.type === ActivityType.TASK ? 'công việc' : 'sự kiện'} "${dto.name}"`,
              sender: userCreator,
              user: userAssignee,
              workspaceId: dto.workspaceId,
            });
          }),
        );

        await notificationRepo.save(notifications);
      }

      const { assignees: _, ...activityData } = dto;
      const activity = activityRepo.create({
        ...activityData,
        position: count + 1,
        assignees: assignees,
      });
      const savedActivity = await activityRepo.save(activity);

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
            activity: savedActivity,
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

        if (checklistLogs.length > 0) {
          await activityLogRepo.save(checklistLogs);
        }
      }

      // Handle file attachments
      if (dto.attachments && dto.attachments.length > 0) {
        const activityFileRepo = manager.getRepository(ActivityFileEntity);
        const fileLogs: ActivityLogEntity[] = [];

        console.log('Processing file attachments:', dto.attachments);

        for (const fileId of dto.attachments) {
          try {
            // Validate fileId format
            if (!fileId || typeof fileId !== 'string') {
              console.error('Invalid fileId:', fileId);
              continue;
            }

            // Verify file exists by URL (frontend sends URL, not ID)
            const file = await manager.getRepository(FileEntity).findOne({
              where: { url: fileId },
            });

            if (!file) {
              console.error('File not found:', fileId);
              continue;
            }

            // Create ActivityFileEntity
            const activityFile = activityFileRepo.create({
              activityId: savedActivity.id,
              fileId: file.id, // Use actual file ID, not URL
              createdBy: userId,
            });

            const savedActivityFile = await activityFileRepo.save(activityFile);
            console.log(
              'ActivityFile saved successfully:',
              savedActivityFile.id,
            );

            // Log file attachment
            const fileLog = activityLogRepo.create({
              activity: savedActivity,
              user: userCreator,
              action: ActivityLogActionEnum.CREATED,
              message: `Đính kèm file: ${file.originalName}`,
              metadata: {
                type: 'FILE_ATTACHMENT',
                fileId: file.id,
                fileName: file.originalName,
              },
            });
            fileLogs.push(fileLog);
          } catch (error) {
            console.error('Error saving activity file:', error);
            // Don't throw error, just log it and continue
            console.error('Skipping file attachment due to error');
          }
        }

        if (fileLogs.length > 0) {
          await activityLogRepo.save(fileLogs);
        }
      }

      const result = await activityRepo.findOne({
        where: { id: savedActivity.id },
        relations: [
          'subActivities',
          'assignees',
          'assignees.user',
          'files',
          'files.file',
        ],
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
      .leftJoinAndSelect('activity.feedbacks', 'feedbacks')
      .leftJoinAndSelect('feedbacks.user', 'feedbackUser')
      .leftJoinAndSelect('activity.assignees', 'assignees')
      .leftJoinAndSelect('assignees.user', 'assigneeUser')
      .leftJoinAndSelect('activity.semester', 'semester')
      .leftJoinAndSelect('activity.subActivities', 'subActivities')
      .leftJoinAndSelect('subActivities.stage', 'subStage')
      .leftJoinAndSelect('activity.checklists', 'checklists')
      .leftJoinAndSelect('checklists.items', 'items')
      .leftJoinAndSelect('activity.files', 'files')
      .leftJoinAndSelect('files.file', 'file')
      .leftJoinAndSelect('activity.category', 'category')
      .leftJoinAndSelect('activity.stage', 'stage');

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

    const activitiesWithProgress = activities.map((activity) => {
      const progress = this.calculateProgress(activity);
      return { ...activity, progress };
    });

    return new OffsetPaginatedDto({
      data: plainToInstance(ActivityResDto, activitiesWithProgress, {
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

    const activitiesWithProgress = activities.map((activity) => {
      const progress = this.calculateProgress(activity);
      return { ...activity, progress };
    });

    return new ResponseDto<ActivityResDto[]>({
      data: plainToInstance(ActivityResDto, activitiesWithProgress, {
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
        'feedbacks',
        'feedbacks.user',
        'assignees',
        'assignees.user',
        'stage',
        'subActivities',
        'subActivities.stage',
        'files',
        'files.file',
        'category',
      ],
    });

    const progress = this.calculateProgress(activity);

    return new ResponseDto<ActivityResDto>({
      data: plainToInstance(
        ActivityResDto,
        { ...activity, progress },
        {
          excludeExtraneousValues: true,
        },
      ),
      message: 'Lấy thông tin hoạt động thành công',
    });
  }

  async deleteActivity(id: Uuid, userId: Uuid): Promise<ResponseNoDataDto> {
    return this.dataSource.transaction(async (manager) => {
      const activityRepo = manager.getRepository(ActivityEntity);
      const activityLogRepo = manager.getRepository(ActivityLogEntity);
      const userRepo = manager.getRepository(UserEntity);

      const activity = await activityRepo.findOne({
        where: { id },
        relations: ['parent'],
      });

      if (!activity) {
        throw new NotFoundException('Hoạt động không tồn tại');
      }

      const user = await userRepo.findOneOrFail({ where: { id: userId } });

      if (activity.parentId) {
        const parentActivity = await activityRepo.findOne({
          where: { id: activity.parentId },
        });

        const deleteSubTaskLog = activityLogRepo.create({
          activity: parentActivity,
          user,
          action: ActivityLogActionEnum.DELETED,
          message: `Xóa công việc phụ: ${activity.name}`,
        });
        await activityLogRepo.save(deleteSubTaskLog);
      } else {
        const deleteActivityLog = activityLogRepo.create({
          activity,
          user,
          action: ActivityLogActionEnum.DELETED,
          message: `Xóa hoạt động: ${activity.name}`,
        });
        await activityLogRepo.save(deleteActivityLog);
      }

      await activityRepo.delete(id);

      return new ResponseNoDataDto({
        message: activity.parentId
          ? 'Xóa hoạt động phụ thành công'
          : 'Xóa hoạt động thành công',
      });
    });
  }

  async updateActivity(
    id: Uuid,
    dto: UpdateActivityDto,
    userId: Uuid,
  ): Promise<ResponseDto<ActivityResDto>> {
    return await this.dataSource.transaction(async (manager) => {
      const activityRepo = manager.getRepository(ActivityEntity);
      const activityLogRepo = manager.getRepository(ActivityLogEntity);
      const activityAssigneeRepo = manager.getRepository(
        ActivityAssigneeEntity,
      );
      const userRepo = manager.getRepository(UserEntity);

      const activity = await activityRepo.findOneOrFail({
        where: { id },
        relations: ['assignees', 'assignees.user'],
      });
      const user = await userRepo.findOneOrFail({ where: { id: userId } });

      const oldValues = {
        stageName: activity.stage?.title,
        stageId: activity.stageId,
        position: activity.position,
        name: activity.name,
        priority: activity.priority,
        startTime: activity.startTime,
        endTime: activity.endTime,
        type: activity.type,
        description: activity.description,
        location: activity.location,
        onlineLink: activity.onlineLink,
        mandatory: activity.mandatory,
        categoryId: activity?.category?.id,
        categoryName: activity?.category?.name,
        parentId: activity.parentId,
        estimateTime: activity.estimateTime,
        semesterId: activity.semesterId,
        instructorCount: activity.instructorCount,
        studentCount: activity.studentCount,
        assignees: activity.assignees || [],
      };

      await this.handlePositionAndStageChanges(dto, oldValues, activityRepo);

      if (dto.assignees !== undefined) {
        await this.updateActivityAssignees(
          activity.id,
          dto.assignees,
          activityAssigneeRepo,
        );
      }

      Object.assign(activity, {
        ...dto,
        assignees: undefined,
      });
      await activityRepo.save(activity);

      await this.createActivityUpdateLogs(
        activity,
        user,
        dto,
        oldValues,
        activityLogRepo,
      );

      return new ResponseDto<ActivityResDto>({
        data: plainToInstance(ActivityResDto, activity, {
          excludeExtraneousValues: true,
        }),
        message: 'Cập nhật hoạt động thành công',
      });
    });
  }

  private async handlePositionAndStageChanges(
    dto: UpdateActivityDto,
    oldValues: any,
    activityRepo: Repository<ActivityEntity>,
  ): Promise<void> {
    const hasStageChange =
      dto.stageId !== undefined && dto.stageId !== oldValues.stageId;
    const hasPositionChange =
      dto.position !== undefined && dto.position !== oldValues.position;

    if (hasStageChange) {
      await Promise.all([
        activityRepo
          .createQueryBuilder()
          .update(ActivityEntity)
          .set({ position: () => 'position - 1' })
          .where('stageId = :oldStageId', { oldStageId: oldValues.stageId })
          .andWhere('position > :oldPosition', {
            oldPosition: oldValues.position,
          })
          .execute(),

        activityRepo
          .createQueryBuilder()
          .update(ActivityEntity)
          .set({ position: () => 'position + 1' })
          .where('stageId = :newStageId', { newStageId: dto.stageId })
          .andWhere('position >= :newPosition', {
            newPosition: dto.position ?? oldValues.position,
          })
          .execute(),
      ]);
    } else if (hasPositionChange && !hasStageChange) {
      const stageId = dto.stageId ?? oldValues.stageId;
      const oldPosition = oldValues.position;
      const newPosition = dto.position!;

      if (oldPosition < newPosition) {
        await activityRepo
          .createQueryBuilder()
          .update(ActivityEntity)
          .set({ position: () => 'position - 1' })
          .where('stageId = :stageId', { stageId })
          .andWhere('position > :oldPosition', { oldPosition })
          .andWhere('position <= :newPosition', { newPosition })
          .execute();
      } else if (oldPosition > newPosition) {
        await activityRepo
          .createQueryBuilder()
          .update(ActivityEntity)
          .set({ position: () => 'position + 1' })
          .where('stageId = :stageId', { stageId })
          .andWhere('position >= :newPosition', { newPosition })
          .andWhere('position < :oldPosition', { oldPosition })
          .execute();
      }
    }
  }

  private async updateActivityAssignees(
    activityId: Uuid,
    newAssignees: ActivityAssigneeDto[],
    activityAssigneeRepo: Repository<ActivityAssigneeEntity>,
  ): Promise<void> {
    await activityAssigneeRepo.delete({ activityId });

    if (newAssignees && newAssignees.length > 0) {
      const assigneeEntities = newAssignees.map((assigneeDto) =>
        activityAssigneeRepo.create({
          activityId,
          userId: assigneeDto.userId,
          role: assigneeDto.role || AssigneeRole.COLLABORATOR,
        }),
      );
      await activityAssigneeRepo.save(assigneeEntities);
    }
  }

  private async createActivityUpdateLogs(
    activity: ActivityEntity,
    user: UserEntity,
    dto: UpdateActivityDto,
    oldValues: any,
    activityLogRepo: Repository<ActivityLogEntity>,
  ): Promise<void> {
    const newStage = dto.stageId
      ? await this.stageRepo.findOne({ where: { id: dto.stageId } })
      : null;

    const logPromises: Promise<ActivityLogEntity>[] = [];

    if (dto.stageId !== undefined && dto.stageId !== oldValues.stageId) {
      logPromises.push(
        activityLogRepo.save(
          activityLogRepo.create({
            activity,
            user,
            action: ActivityLogActionEnum.UPDATED,
            message: `Chuyển hoạt động từ stage ${oldValues.stageName} sang ${newStage?.title}`,
            oldValue: oldValues.stageId,
            newValue: dto.stageId,
            metadata: {
              type: 'STAGE_CHANGE',
              field: 'stageId',
              oldStageId: oldValues.stageId,
              newStageId: dto.stageId,
            },
          }),
        ),
      );
    }

    // Log name change
    if (dto.name !== undefined && dto.name !== oldValues.name) {
      logPromises.push(
        activityLogRepo.save(
          activityLogRepo.create({
            activity,
            user,
            action: ActivityLogActionEnum.UPDATED,
            message: `Đổi tên hoạt động từ "${oldValues.name}" thành "${dto.name}"`,
            oldValue: oldValues.name,
            newValue: dto.name,
            metadata: {
              type: 'NAME_CHANGE',
              field: 'name',
            },
          }),
        ),
      );
    }

    // Log priority change
    if (dto.priority !== undefined && dto.priority !== oldValues.priority) {
      logPromises.push(
        activityLogRepo.save(
          activityLogRepo.create({
            activity,
            user,
            action: ActivityLogActionEnum.UPDATED,
            message: `Thay đổi độ ưu tiên từ ${oldValues.priority} sang ${dto.priority}`,
            oldValue: oldValues.priority,
            newValue: dto.priority,
            metadata: {
              type: 'PRIORITY_CHANGE',
              field: 'priority',
            },
          }),
        ),
      );
    }

    // Log type change
    if (dto.type !== undefined && dto.type !== oldValues.type) {
      logPromises.push(
        activityLogRepo.save(
          activityLogRepo.create({
            activity,
            user,
            action: ActivityLogActionEnum.UPDATED,
            message: `Thay đổi loại hoạt động từ ${oldValues.type} sang ${dto.type}`,
            oldValue: oldValues.type,
            newValue: dto.type,
            metadata: {
              type: 'TYPE_CHANGE',
              field: 'type',
            },
          }),
        ),
      );
    }

    // Log description change
    if (
      dto.description !== undefined &&
      dto.description !== oldValues.description
    ) {
      logPromises.push(
        activityLogRepo.save(
          activityLogRepo.create({
            activity,
            user,
            action: ActivityLogActionEnum.UPDATED,
            message: `Cập nhật mô tả hoạt động`,
            oldValue: oldValues.description,
            newValue: dto.description,
            metadata: {
              type: 'DESCRIPTION_CHANGE',
              field: 'description',
            },
          }),
        ),
      );
    }

    // Log location change
    if (dto.location !== undefined && dto.location !== oldValues.location) {
      logPromises.push(
        activityLogRepo.save(
          activityLogRepo.create({
            activity,
            user,
            action: ActivityLogActionEnum.UPDATED,
            message: `Thay đổi địa điểm từ "${oldValues.location || 'không có'}" sang "${dto.location || 'không có'}"`,
            oldValue: oldValues.location,
            newValue: dto.location,
            metadata: {
              type: 'LOCATION_CHANGE',
              field: 'location',
            },
          }),
        ),
      );
    }

    // Log online link change
    if (
      dto.onlineLink !== undefined &&
      dto.onlineLink !== oldValues.onlineLink
    ) {
      logPromises.push(
        activityLogRepo.save(
          activityLogRepo.create({
            activity,
            user,
            action: ActivityLogActionEnum.UPDATED,
            message: `Cập nhật link online`,
            oldValue: oldValues.onlineLink,
            newValue: dto.onlineLink,
            metadata: {
              type: 'ONLINE_LINK_CHANGE',
              field: 'onlineLink',
            },
          }),
        ),
      );
    }

    // Log mandatory change
    if (dto.mandatory !== undefined && dto.mandatory !== oldValues.mandatory) {
      logPromises.push(
        activityLogRepo.save(
          activityLogRepo.create({
            activity,
            user,
            action: ActivityLogActionEnum.UPDATED,
            message: `Thay đổi tính bắt buộc từ ${oldValues.mandatory ? 'có' : 'không'} sang ${dto.mandatory ? 'có' : 'không'}`,
            oldValue: oldValues.mandatory,
            newValue: dto.mandatory,
            metadata: {
              type: 'MANDATORY_CHANGE',
              field: 'mandatory',
            },
          }),
        ),
      );
    }

    // Log estimate time change
    if (
      dto.estimateTime !== undefined &&
      dto.estimateTime !== oldValues.estimateTime
    ) {
      logPromises.push(
        activityLogRepo.save(
          activityLogRepo.create({
            activity,
            user,
            action: ActivityLogActionEnum.UPDATED,
            message: `Thay đổi thời gian ước tính từ ${oldValues.estimateTime || 0} phút sang ${dto.estimateTime} phút`,
            oldValue: oldValues.estimateTime,
            newValue: dto.estimateTime,
            metadata: {
              type: 'ESTIMATE_TIME_CHANGE',
              field: 'estimateTime',
            },
          }),
        ),
      );
    }

    if (
      dto.instructorCount !== undefined &&
      dto.instructorCount !== oldValues.instructorCount
    ) {
      logPromises.push(
        activityLogRepo.save(
          activityLogRepo.create({
            activity,
            user,
            action: ActivityLogActionEnum.UPDATED,
            message: `Thay đổi số lượng giảng viên từ ${oldValues.instructorCount || 0} sang ${dto.instructorCount}`,
            oldValue: oldValues.instructorCount,
            newValue: dto.instructorCount,
            metadata: {
              type: 'INSTRUCTOR_COUNT_CHANGE',
              field: 'instructorCount',
            },
          }),
        ),
      );
    }

    // Log student count change
    if (
      dto.studentCount !== undefined &&
      dto.studentCount !== oldValues.studentCount
    ) {
      logPromises.push(
        activityLogRepo.save(
          activityLogRepo.create({
            activity,
            user,
            action: ActivityLogActionEnum.UPDATED,
            message: `Thay đổi số lượng sinh viên từ ${oldValues.studentCount || 0} sang ${dto.studentCount}`,
            oldValue: oldValues.studentCount,
            newValue: dto.studentCount,
            metadata: {
              type: 'STUDENT_COUNT_CHANGE',
              field: 'studentCount',
            },
          }),
        ),
      );
    }

    // Log time changes
    if (dto.startTime !== undefined) {
      const oldStartTime =
        oldValues.startTime instanceof Date
          ? oldValues.startTime.getTime()
          : new Date(oldValues.startTime).getTime();
      const newStartTime = new Date(dto.startTime).getTime();

      if (newStartTime !== oldStartTime) {
        logPromises.push(
          activityLogRepo.save(
            activityLogRepo.create({
              activity,
              user,
              action: ActivityLogActionEnum.UPDATED,
              message: `Cập nhật thời gian bắt đầu`,
              oldValue: oldValues.startTime,
              newValue: dto.startTime,
              metadata: {
                type: 'TIME_CHANGE',
                field: 'startTime',
              },
            }),
          ),
        );
      }
    }

    if (dto.endTime !== undefined) {
      const oldEndTime =
        oldValues.endTime instanceof Date
          ? oldValues.endTime.getTime()
          : new Date(oldValues.endTime).getTime();
      const newEndTime = new Date(dto.endTime).getTime();

      if (newEndTime !== oldEndTime) {
        logPromises.push(
          activityLogRepo.save(
            activityLogRepo.create({
              activity,
              user,
              action: ActivityLogActionEnum.UPDATED,
              message: `Cập nhật thời gian kết thúc`,
              oldValue: oldValues.endTime,
              newValue: dto.endTime,
              metadata: {
                type: 'TIME_CHANGE',
                field: 'endTime',
              },
            }),
          ),
        );
      }
    }

    // Log assignee changes
    if (dto.assignees !== undefined) {
      const oldAssigneeIds = oldValues.assignees
        .map((a: any) => a.userId)
        .sort();
      const newAssigneeIds = dto.assignees.map((a) => a.userId).sort();

      if (JSON.stringify(oldAssigneeIds) !== JSON.stringify(newAssigneeIds)) {
        logPromises.push(
          activityLogRepo.save(
            activityLogRepo.create({
              activity,
              user,
              action: ActivityLogActionEnum.UPDATED,
              message: `Cập nhật danh sách người được gán`,
              oldValue: JSON.stringify(oldAssigneeIds),
              newValue: JSON.stringify(newAssigneeIds),
              metadata: {
                type: 'ASSIGNEE_CHANGE',
                field: 'assignees',
                oldAssignees: oldAssigneeIds,
                newAssignees: newAssigneeIds,
              },
            }),
          ),
        );
      }
    }

    // Execute all log saves
    if (logPromises.length > 0) {
      await Promise.all(logPromises);
    }
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
    currentUserId: Uuid, // Thêm để biết ai thực hiện assign
  ): Promise<ResponseDto<ActivityAssigneeEntity[]>> {
    return this.dataSource.transaction(async (manager) => {
      const activityRepo = manager.getRepository(ActivityEntity);
      const activityAssigneeRepo = manager.getRepository(
        ActivityAssigneeEntity,
      );
      const activityLogRepo = manager.getRepository(ActivityLogEntity);
      const userRepo = manager.getRepository(UserEntity);

      const userIds = Array.isArray(dto.userId) ? dto.userId : [dto.userId];
      const assignees: ActivityAssigneeEntity[] = [];

      console.log('Assigning users to activity:', id, userIds, dto);

      const activity = await activityRepo.findOneOrFail({ where: { id } });
      const currentUser = await userRepo.findOneOrFail({
        where: { id: currentUserId },
      });

      const logs: ActivityLogEntity[] = [];

      for (const userId of userIds) {
        let assignee = await activityAssigneeRepo.findOne({
          where: { activityId: id, userId },
        });

        const assignedUser = await userRepo.findOne({ where: { id: userId } });

        if (assignee) {
          // Nếu đã có thì update role/note nếu truyền vào
          if (dto.role) assignee.role = dto.role;
          if (dto.note) assignee.note = dto.note;
          assignee.assignedAt = new Date();

          // Log update assignee
          const updateLog = activityLogRepo.create({
            activity,
            user: currentUser,
            action: ActivityLogActionEnum.UPDATED,
            message: `Cập nhật phân công cho ${assignedUser?.name || userId}`,
            metadata: {
              type: 'ASSIGNMENT_UPDATE',
              assignedUserId: userId,
              assignedUserName: assignedUser?.name,
              role: dto.role,
              note: dto.note,
            },
          });
          logs.push(updateLog);
        } else {
          // Nếu chưa có thì tạo mới
          assignee = activityAssigneeRepo.create({
            activityId: id,
            userId,
            role: dto.role,
            note: dto.note,
            assignedAt: new Date(),
            status: AssignmentStatus.PENDING,
          });

          // Log new assignment
          const assignLog = activityLogRepo.create({
            activity,
            user: currentUser,
            action: ActivityLogActionEnum.CREATED,
            message: `Phân công cho ${assignedUser?.name || userId}`,
            metadata: {
              type: 'ASSIGNMENT_CREATE',
              assignedUserId: userId,
              assignedUserName: assignedUser?.name,
              role: dto.role,
              note: dto.note,
              status: AssignmentStatus.PENDING,
            },
          });
          logs.push(assignLog);
        }

        await activityAssigneeRepo.save(assignee);
        assignees.push(assignee);
      }

      // Save all logs
      if (logs.length > 0) {
        await activityLogRepo.save(logs);
      }

      return new ResponseDto<ActivityAssigneeEntity[]>({
        data: assignees,
        message: 'Gán người dùng vào hoạt động thành công',
      });
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
    currentUserId: Uuid, // Thêm parameter
  ): Promise<ResponseNoDataDto> {
    return this.dataSource.transaction(async (manager) => {
      const activityAssigneeRepo = manager.getRepository(
        ActivityAssigneeEntity,
      );
      const activityLogRepo = manager.getRepository(ActivityLogEntity);
      const userRepo = manager.getRepository(UserEntity);
      const activityRepo = manager.getRepository(ActivityEntity);

      const assignee = await activityAssigneeRepo.findOne({
        where: { activityId, userId },
      });
      if (!assignee) {
        throw new NotFoundException('Assignee not found');
      }

      const activity = await activityRepo.findOneOrFail({
        where: { id: activityId },
      });
      const currentUser = await userRepo.findOneOrFail({
        where: { id: currentUserId },
      });
      const assignedUser = await userRepo.findOne({ where: { id: userId } });

      // Log before delete
      const deleteLog = activityLogRepo.create({
        activity,
        user: currentUser,
        action: ActivityLogActionEnum.DELETED,
        message: `Xóa phân công của ${assignedUser?.name || userId}`,
        oldValue: {
          role: assignee.role,
          note: assignee.note,
          assignedAt: assignee.assignedAt,
          status: assignee.status,
        },
        metadata: {
          type: 'ASSIGNMENT_DELETE',
          assignedUserId: userId,
          assignedUserName: assignedUser?.name,
          deletedRole: assignee.role,
          deletedNote: assignee.note,
        },
      });
      await activityLogRepo.save(deleteLog);

      await activityAssigneeRepo.remove(assignee);

      return new ResponseNoDataDto({
        message: 'Xóa người được giao thành công',
      });
    });
  }

  async updateAssignee(
    activityId: Uuid,
    userId: Uuid,
    dto: AssignUserToActivityDto,
    currentUserId: Uuid, // Thêm parameter
  ): Promise<ResponseDto<ActivityAssigneeResDto>> {
    return this.dataSource.transaction(async (manager) => {
      const activityAssigneeRepo = manager.getRepository(
        ActivityAssigneeEntity,
      );
      const activityLogRepo = manager.getRepository(ActivityLogEntity);
      const userRepo = manager.getRepository(UserEntity);
      const activityRepo = manager.getRepository(ActivityEntity);

      const assignee = await activityAssigneeRepo.findOne({
        where: { activityId, userId },
      });
      if (!assignee) {
        throw new NotFoundException('Người được giao không tồn tại');
      }

      const activity = await activityRepo.findOneOrFail({
        where: { id: activityId },
      });
      const currentUser = await userRepo.findOneOrFail({
        where: { id: currentUserId },
      });
      const assignedUser = await userRepo.findOne({ where: { id: userId } });

      // Store old values for logging
      const oldRole = assignee.role;
      const oldNote = assignee.note;

      // Cập nhật thông tin người thực hiện
      assignee.role = dto.role;
      assignee.note = dto.note;
      await activityAssigneeRepo.save(assignee);

      // Log the update
      const updateLog = activityLogRepo.create({
        activity,
        user: currentUser,
        action: ActivityLogActionEnum.UPDATED,
        message: `Cập nhật phân công của ${assignedUser?.name || userId}`,
        oldValue: { role: oldRole, note: oldNote },
        newValue: { role: dto.role, note: dto.note },
        metadata: {
          type: 'ASSIGNMENT_UPDATE',
          assignedUserId: userId,
          assignedUserName: assignedUser?.name,
          changes: {
            role: { from: oldRole, to: dto.role },
            note: { from: oldNote, to: dto.note },
          },
        },
      });
      await activityLogRepo.save(updateLog);

      return new ResponseDto<ActivityAssigneeResDto>({
        data: plainToInstance(ActivityAssigneeResDto, assignee, {
          excludeExtraneousValues: true,
        }),
        message: 'Cập nhật người được giao thành công',
      });
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

  // Event Feedback Methods
  async createEventFeedback(
    activityId: Uuid,
    dto: CreateEventFeedbackDto,
  ): Promise<ResponseDto<EventFeedbackResDto>> {
    // Kiểm tra activity tồn tại và phải là event
    const activity = await this.activityRepo.findOneOrFail({
      where: { id: activityId },
    });

    if (activity.type !== ActivityType.EVENT) {
      throw new BadRequestException(
        'Chỉ có thể đánh giá cho sự kiện (event), không phải công việc (task)',
      );
    }

    // Kiểm tra đã có feedback với email này chưa
    const existingFeedback = await this.eventFeedbackRepo.findOne({
      where: { activityId, email: dto.email },
    });

    if (existingFeedback) {
      throw new BadRequestException('Email này đã đánh giá sự kiện này rồi');
    }

    return await this.dataSource.transaction(async (manager) => {
      const feedback = manager.create(EventFeedbackEntity, {
        activityId,
        email: dto.email,
        numPhone: dto.numPhone,
        fullName: dto.fullName,
        studentId: dto.studentId,
        rating: dto.rating,
        comments: dto.comments,
        image: dto.image,
      });

      const savedFeedback = await manager.save(feedback);

      return new ResponseDto<EventFeedbackResDto>({
        data: plainToInstance(EventFeedbackResDto, savedFeedback, {
          excludeExtraneousValues: true,
        }),
        message: 'Tạo đánh giá sự kiện thành công',
      });
    });
  }

  async getEventFeedbacksByActivityId(
    activityId: Uuid,
  ): Promise<ResponseDto<EventFeedbackResDto[]>> {
    const activity = await this.activityRepo.findOneOrFail({
      where: { id: activityId },
    });

    if (activity.type !== ActivityType.EVENT) {
      throw new BadRequestException(
        'Chỉ có thể lấy đánh giá cho sự kiện (event), không phải công việc (task)',
      );
    }

    const feedbacks = await this.eventFeedbackRepo.find({
      where: { activityId },
      order: { submittedAt: 'DESC' },
    });

    return new ResponseDto<EventFeedbackResDto[]>({
      data: plainToInstance(EventFeedbackResDto, feedbacks, {
        excludeExtraneousValues: true,
      }),
      message: 'Lấy danh sách đánh giá sự kiện thành công',
    });
  }

  async getEventFeedbackById(
    feedbackId: Uuid,
  ): Promise<ResponseDto<EventFeedbackResDto>> {
    const feedback = await this.eventFeedbackRepo.findOneOrFail({
      where: { id: feedbackId },
    });

    return new ResponseDto<EventFeedbackResDto>({
      data: plainToInstance(EventFeedbackResDto, feedback, {
        excludeExtraneousValues: true,
      }),
      message: 'Lấy đánh giá sự kiện thành công',
    });
  }

  async getEventFeedbackStats(activityId: Uuid): Promise<ResponseDto<any>> {
    // Kiểm tra activity tồn tại và phải là event
    const activity = await this.activityRepo.findOneOrFail({
      where: { id: activityId },
    });

    if (activity.type !== ActivityType.EVENT) {
      throw new BadRequestException(
        'Chỉ có thể lấy thống kê đánh giá cho sự kiện (event), không phải công việc (task)',
      );
    }

    // Lấy tất cả feedbacks để tính toán thống kê
    const feedbacks = await this.eventFeedbackRepo.find({
      where: { activityId },
      select: ['rating'],
    });

    const totalFeedbacks = feedbacks.length;

    if (totalFeedbacks === 0) {
      return new ResponseDto({
        data: {
          totalFeedbacks: 0,
          averageRating: 0,
          ratingDistribution: {},
        },
        message: 'Lấy thống kê đánh giá sự kiện thành công',
      });
    }

    // Tính điểm trung bình
    const ratingValues = feedbacks.map((f) => f.rating);
    const averageRating =
      ratingValues.reduce((sum, rating) => sum + rating, 0) / totalFeedbacks;

    // Tính phân bố điểm
    const ratingDistribution = feedbacks.reduce(
      (acc, feedback) => {
        const rating = feedback.rating;
        acc[rating] = (acc[rating] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return new ResponseDto({
      data: {
        totalFeedbacks,
        averageRating: Math.round(averageRating * 100) / 100, // Làm tròn 2 chữ số thập phân
        ratingDistribution,
      },
      message: 'Lấy thống kê đánh giá sự kiện thành công',
    });
  }

  /**
   * Tính progress của activity
   * @param activity Activity entity với relations đã load
   * @returns Progress percentage (0-100)
   */
  private calculateProgress(activity: ActivityEntity): number {
    const hasSubActivities = activity.subActivities?.length > 0;
    const hasChecklists = activity.checklists?.length > 0;

    if (!hasSubActivities && !hasChecklists) {
      return activity.stage?.isCompleted ? 100 : 0;
    }

    let totalWeight = 0;
    let completedWeight = 0;

    if (hasSubActivities) {
      const subTaskCount = activity.subActivities.length;
      const subTaskWeight = 100 / (subTaskCount + 1);

      // Tính progress của các subtask
      activity.subActivities.forEach((subActivity) => {
        totalWeight += subTaskWeight;
        if (subActivity.stage?.isCompleted) {
          completedWeight += subTaskWeight;
        }
      });

      // Thêm weight cho task chính
      totalWeight += subTaskWeight;
      if (activity.stage?.isCompleted) {
        completedWeight += subTaskWeight;
      }
    }

    // Case 3: Task có checklists
    if (hasChecklists) {
      let totalChecklistItems = 0;
      let completedChecklistItems = 0;

      activity.checklists.forEach((checklist) => {
        if (checklist.items?.length > 0) {
          checklist.items.forEach((item) => {
            totalChecklistItems++;
            if (item.isDone) {
              completedChecklistItems++;
            }
          });
        }
      });

      if (totalChecklistItems > 0) {
        // Nếu có cả subtask và checklist, chia weight
        if (hasSubActivities) {
          const checklistWeight = 50;
          const subTaskActualWeight = 50;

          // Rescale subtask progress
          const subTaskProgress =
            totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0;
          completedWeight = (subTaskProgress * subTaskActualWeight) / 100;
          totalWeight = subTaskActualWeight;

          // Add checklist progress
          const checklistProgress =
            (completedChecklistItems / totalChecklistItems) * checklistWeight;
          completedWeight += checklistProgress;
          totalWeight += checklistWeight;
        } else {
          // Chỉ có checklist
          const itemWeight = 100 / (totalChecklistItems + 1); // +1 cho task chính

          completedWeight = completedChecklistItems * itemWeight;
          totalWeight = totalChecklistItems * itemWeight;

          // Thêm weight cho task chính
          totalWeight += itemWeight;
          if (activity.stage?.isCompleted) {
            completedWeight += itemWeight;
          }
        }
      }
    }

    // Tính phần trăm cuối cùng
    const progress =
      totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0;

    // Làm tròn đến 2 chữ số thập phân
    return Math.round(progress * 100) / 100;
  }
}
