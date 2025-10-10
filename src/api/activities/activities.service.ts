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
import { ReactionType } from '@/database/enum/comments.enum';
import { ValidationException } from '@/exceptions/validation.exception';
import { BaseService } from '@/services/base.service';
import { LinkPreviewService } from '@/services/link-preview.service';
import { buildPaginator } from '@/utils/cursor-pagination';
import { paginate } from '@/utils/offset-pagination';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { merge } from 'lodash';
import { DataSource, In, Not, Repository } from 'typeorm';
import { FileEntity } from '../files/entities/files.entity';
import { NotificationEntity } from '../notification/entities/notification.entity';
import { SemesterEntity } from '../semester/entities/semester.entity';
import { StagesEntity } from '../stages/entities/stage.entity';
import { UserEntity } from '../users/entities/user.entity';
import { ActivityAssigneeDto } from './dto/activity-assignee.dto';
import { ActivityAssigneeResDto } from './dto/activity-assignee.res.dto';
import { ActivityChecklistResDto } from './dto/activity-checklist.res.dto';
import { ActivityCommentResDto } from './dto/activity-comment.res.dto';
import { ActivityFeedbackResDto } from './dto/activity-feedback.res.dto';
import { ActivityLinkResDto } from './dto/activity-link.res.dto';
import { ActivityLogResDto } from './dto/activity-log.res.dto';
import { ActivityResDto } from './dto/activity.res.dto';
import { AddActivityLinkDto } from './dto/add-activity-link.dto';
import { AssignUserToActivityDto } from './dto/assign-user-to-activity.dto';
import { CategoryResDto } from './dto/category.res.dto';
import { CategoryDto } from './dto/category.res.dto copy';
import { CreateActivityFeedbackDto } from './dto/create-activity-feedback.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import {
  CreateChecklistDto,
  CreateChecklistItemDto,
} from './dto/create-checklist.req.dto';
import { CreateActivityCommentDto } from './dto/create-comment.dto';
import { CreateEventFeedbackDto } from './dto/create-event-feedback.dto';
import { EventFeedbackResDto } from './dto/event-feedback.res.dto';
import { QueryActivityLogDto } from './dto/query-activity-log.dto';
import { QueryActivityDto } from './dto/query-activity.dto';
import { UpdateActivityStatusDto } from './dto/update-activity-status.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { UpdateChecklistDto } from './dto/update-checklist.req.dto';
import { UpdateActivityCommentDto } from './dto/update-comment.dto';
import { UpdateParticipantReqDto } from './dto/update-participant.req.dto';
import { ActivityAssigneeEntity } from './entities/activity-assignee.entity';
import { ActivityCategoryEntity } from './entities/activity-category.entity';
import {
  ActivityChecklistEntity,
  ActivityChecklistItemEntity,
} from './entities/activity-checklist.entity';
import { ActivityCommentReactionEntity } from './entities/activity-comments-reaction.entity';
import { ActivityCommentEntity } from './entities/activity-comments.entity';
import { ActivityFeedbackEntity } from './entities/activity-feedback.entity';
import { ActivityFileEntity } from './entities/activity-file.entity';
import { ActivityFollowEntity } from './entities/activity-follow.entity';
import { ActivityLinkEntity } from './entities/activity-link.entity';
import { ActivityLogEntity } from './entities/activity-log.entity';
import { ActivityParticipantEntity } from './entities/activity-participant.entity';
import { ActivityEntity } from './entities/activity.entity';
import { EventFeedbackEntity } from './entities/event-feedback.entity';

import { Logger } from '@nestjs/common';
import { ActivityProgressResDto } from './dto/activity-progres.res.dto';

@Injectable()
export class ActivitiesService extends BaseService<ActivityEntity> {
  private readonly logger = new Logger(ActivitiesService.name);

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
    @InjectRepository(ActivityCommentReactionEntity)
    private readonly activityCommentReactionRepo: Repository<ActivityCommentReactionEntity>,
    @InjectRepository(ActivityLinkEntity)
    private readonly activityLinkRepo: Repository<ActivityLinkEntity>,
    @InjectRepository(ActivityChecklistEntity)
    private readonly activityChecklistRepo: Repository<ActivityChecklistEntity>,
    @InjectRepository(ActivityFollowEntity)
    private readonly activityFollowRepo: Repository<ActivityFollowEntity>,
    private readonly linkPreviewService: LinkPreviewService,
  ) {
    super(activityRepo);
  }

  async getActivityFollowers(activityId: Uuid) {
    const follows = await this.activityFollowRepo.find({
      where: { activityId },
      relations: ['user'],
    });
    return new ResponseDto({
      data: follows,
      message: 'Lấy danh sách người theo dõi thành công',
    });
  }

  async getMyFollowedActivities(userId: Uuid) {
    const follows = await this.activityFollowRepo.find({
      where: { userId },
      relations: ['activity'],
    });
    const activities = follows.map((f) => f.activity);
    return new ResponseDto({
      data: activities,
      message: 'Lấy danh sách activity đã theo dõi thành công',
    });
  }

  async batchFollow(activityId: Uuid, userIds: Uuid[], actorId: Uuid) {
    try {
      const activity = await this.activityRepo.findOne({
        where: { id: activityId },
      });
      if (!activity) {
        throw new NotFoundException('Activity không tồn tại');
      }

      const values = userIds.map((uid) => ({
        activityId,
        userId: uid,
        createdBy: actorId,
      }));

      if (values.length === 0) {
        return new ResponseDto({
          data: { activityId, userIds: [] },
          message: 'Không có userId nào',
        });
      }

      await this.activityFollowRepo
        .createQueryBuilder()
        .insert()
        .into(ActivityFollowEntity)
        .values(values)
        .onConflict('("activityId", "userId") DO NOTHING')
        .execute();

      return new ResponseDto({
        data: { activityId, userIds },
        message: 'Theo dõi thành công',
      });
    } catch (error) {
      this.logger.error('Error in batchFollow:', error);
      throw error;
    }
  }

  async batchUnfollow(activityId: Uuid, userIds: Uuid[]) {
    try {
      if (!userIds?.length) {
        return new ResponseDto({
          data: { activityId, userIds: [] },
          message: 'Không có userId nào',
        });
      }

      await this.activityFollowRepo
        .createQueryBuilder()
        .delete()
        .from(ActivityFollowEntity)
        .where('"activityId" = :activityId', { activityId })
        .andWhere('"userId" IN (:...userIds)', { userIds })
        .execute();

      return new ResponseDto({
        data: { activityId, userIds },
        message: 'Bỏ theo dõi thành công',
      });
    } catch (error) {
      this.logger.error('Error in batchUnfollow:', error);
      throw error;
    }
  }

  async getActivityProgress(
    activityId: Uuid,
  ): Promise<ResponseDto<ActivityProgressResDto>> {
    const activity = await this.activityRepo.findOne({
      where: { id: activityId },
      relations: [
        'stage',
        'subActivities',
        'subActivities.stage',
        'checklists',
        'checklists.items',
      ],
    });

    if (!activity) {
      throw new NotFoundException('Hoạt động không tồn tại');
    }

    const progressDetails = this.calculateDetailedProgress(activity);

    return new ResponseDto<ActivityProgressResDto>({
      data: plainToInstance(ActivityProgressResDto, progressDetails, {
        excludeExtraneousValues: true,
      }),
      message: 'Tính toán progress thành công',
    });
  }

  async deleteChecklistItem(
    activityId: Uuid,
    checklistId: Uuid,
    itemId: Uuid,
  ): Promise<ResponseDto<ActivityChecklistResDto>> {
    return this.dataSource.transaction(async (manager) => {
      const activityRepo = manager.getRepository(ActivityEntity);
      const checklistRepo = manager.getRepository(ActivityChecklistEntity);
      const checklistItemRepo = manager.getRepository(
        ActivityChecklistItemEntity,
      );

      const activity = await activityRepo.findOne({
        where: { id: activityId },
      });

      if (!activity) {
        throw new NotFoundException('Hoạt động không tồn tại');
      }

      const checklist = await checklistRepo.findOne({
        where: { id: checklistId, activityId },
      });

      if (!checklist) {
        throw new NotFoundException('Checklist không tồn tại');
      }

      const item = await checklistItemRepo.findOne({
        where: { id: itemId, checklistId },
      });

      if (!item) {
        throw new NotFoundException('Item không tồn tại trong checklist');
      }

      await checklistItemRepo.remove(item);

      const updatedChecklist = await checklistRepo.findOne({
        where: { id: checklistId },
        relations: ['items'],
        order: {
          items: {
            createdAt: 'ASC',
          },
        },
      });

      const totalItems = updatedChecklist.items?.length || 0;
      const completedItems =
        updatedChecklist.items?.filter((item) => item.isDone).length || 0;
      const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

      const processedChecklist = {
        ...updatedChecklist,
        totalItems,
        completedItems,
        progress: Math.round(progress * 100) / 100,
      };

      return new ResponseDto<ActivityChecklistResDto>({
        data: plainToInstance(ActivityChecklistResDto, processedChecklist, {
          excludeExtraneousValues: true,
        }),
        message: 'Xóa item thành công',
      });
    });
  }

  async addChecklistItem(
    activityId: Uuid,
    checklistId: Uuid,
    dto: CreateChecklistItemDto,
  ): Promise<ResponseDto<ActivityChecklistResDto>> {
    return this.dataSource.transaction(async (manager) => {
      const activityRepo = manager.getRepository(ActivityEntity);
      const checklistRepo = manager.getRepository(ActivityChecklistEntity);
      const checklistItemRepo = manager.getRepository(
        ActivityChecklistItemEntity,
      );

      const activity = await activityRepo.findOne({
        where: { id: activityId },
      });

      if (!activity) {
        throw new NotFoundException('Hoạt động không tồn tại');
      }

      const checklist = await checklistRepo.findOne({
        where: { id: checklistId, activityId },
      });

      if (!checklist) {
        throw new NotFoundException('Checklist không tồn tại');
      }

      const newItem = checklistItemRepo.create({
        checklistId,
        content: dto.content,
        isDone: dto.isDone || false,
      });

      await checklistItemRepo.save(newItem);

      const updatedChecklist = await checklistRepo.findOne({
        where: { id: checklistId },
        relations: ['items'],
        order: {
          items: {
            createdAt: 'ASC',
          },
        },
      });

      const totalItems = updatedChecklist.items?.length || 0;
      const completedItems =
        updatedChecklist.items?.filter((item) => item.isDone).length || 0;
      const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

      const processedChecklist = {
        ...updatedChecklist,
        totalItems,
        completedItems,
        progress: Math.round(progress * 100) / 100,
      };

      return new ResponseDto<ActivityChecklistResDto>({
        data: plainToInstance(ActivityChecklistResDto, processedChecklist, {
          excludeExtraneousValues: true,
        }),
        message: 'Thêm mục mới vào checklist thành công',
      });
    });
  }

  async deleteChecklist(
    activityId: Uuid,
    checklistId: Uuid,
  ): Promise<ResponseNoDataDto> {
    return this.dataSource.transaction(async (manager) => {
      const activityRepo = manager.getRepository(ActivityEntity);
      const checklistRepo = manager.getRepository(ActivityChecklistEntity);
      const checklistItemRepo = manager.getRepository(
        ActivityChecklistItemEntity,
      );

      const activity = await activityRepo.findOne({
        where: { id: activityId },
      });

      if (!activity) {
        throw new NotFoundException('Hoạt động không tồn tại');
      }

      const checklist = await checklistRepo.findOne({
        where: { id: checklistId, activityId },
        relations: ['items'],
      });

      if (!checklist) {
        throw new NotFoundException('Checklist không tồn tại');
      }

      if (checklist.items?.length > 0) {
        await checklistItemRepo.delete({
          checklistId,
        });
      }

      await checklistRepo.remove(checklist);

      return new ResponseNoDataDto({
        message: 'Xóa checklist thành công',
      });
    });
  }

  async createChecklist(
    activityId: Uuid,
    dto: CreateChecklistDto,
  ): Promise<ResponseDto<ActivityChecklistResDto>> {
    return this.dataSource.transaction(async (manager) => {
      const activityRepo = manager.getRepository(ActivityEntity);
      const checklistRepo = manager.getRepository(ActivityChecklistEntity);
      const checklistItemRepo = manager.getRepository(
        ActivityChecklistItemEntity,
      );

      const activity = await activityRepo.findOne({
        where: { id: activityId },
      });

      if (!activity) {
        throw new NotFoundException('Hoạt động không tồn tại');
      }

      const checklist = checklistRepo.create({
        activityId,
        name: dto.name,
      });

      const savedChecklist = await checklistRepo.save(checklist);

      if (dto.items?.length > 0) {
        const items = dto.items.map((itemDto) =>
          checklistItemRepo.create({
            checklistId: savedChecklist.id,
            content: itemDto.content,
            isDone: itemDto.isDone || false,
          }),
        );

        await checklistItemRepo.save(items);
      }

      const checklistWithItems = await checklistRepo.findOne({
        where: { id: savedChecklist.id },
        relations: ['items'],
        order: {
          items: {
            createdAt: 'ASC',
          },
        },
      });

      const totalItems = checklistWithItems.items?.length || 0;
      const completedItems =
        checklistWithItems.items?.filter((item) => item.isDone).length || 0;
      const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

      const processedChecklist = {
        ...checklistWithItems,
        totalItems,
        completedItems,
        progress: Math.round(progress * 100) / 100,
      };

      return new ResponseDto<ActivityChecklistResDto>({
        data: plainToInstance(ActivityChecklistResDto, processedChecklist, {
          excludeExtraneousValues: true,
        }),
        message: 'Tạo checklist thành công',
      });
    });
  }

  async updateChecklist(
    activityId: Uuid,
    checklistId: Uuid,
    dto: UpdateChecklistDto,
  ): Promise<ResponseDto<ActivityChecklistResDto>> {
    return this.dataSource.transaction(async (manager) => {
      const activityRepo = manager.getRepository(ActivityEntity);
      const checklistRepo = manager.getRepository(ActivityChecklistEntity);
      const checklistItemRepo = manager.getRepository(
        ActivityChecklistItemEntity,
      );

      const activity = await activityRepo.findOne({
        where: { id: activityId },
      });

      if (!activity) {
        throw new NotFoundException('Hoạt động không tồn tại');
      }

      const checklist = await checklistRepo.findOne({
        where: { id: checklistId, activityId },
        relations: ['items'],
      });

      if (!checklist) {
        throw new NotFoundException('Checklist không tồn tại');
      }

      if (dto.name) {
        checklist.name = dto.name;
        await checklistRepo.save(checklist);
      }

      if (dto.items?.length > 0) {
        const existingItemsMap = new Map(
          checklist.items?.map((item) => [item.id, item]) || [],
        );

        for (const itemDto of dto.items) {
          const existingItem = existingItemsMap.get(itemDto.id);

          if (existingItem) {
            merge(existingItem, {
              content: itemDto.content,
              isDone: itemDto.isDone,
            });
            await checklistItemRepo.save(existingItem);
          }
        }
      }

      const updatedChecklist = await checklistRepo.findOne({
        where: { id: checklistId },
        relations: ['items'],
        order: {
          items: {
            createdAt: 'ASC',
          },
        },
      });

      const totalItems = updatedChecklist.items?.length || 0;
      const completedItems =
        updatedChecklist.items?.filter((item) => item.isDone).length || 0;
      const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

      const processedChecklist = {
        ...updatedChecklist,
        totalItems,
        completedItems,
        progress: Math.round(progress * 100) / 100,
      };

      return new ResponseDto<ActivityChecklistResDto>({
        data: plainToInstance(ActivityChecklistResDto, processedChecklist, {
          excludeExtraneousValues: true,
        }),
        message: 'Cập nhật checklist thành công',
      });
    });
  }

  async getChecklists(
    activityId: Uuid,
  ): Promise<ResponseDto<ActivityChecklistResDto[]>> {
    const activity = await this.activityRepo.findOne({
      where: { id: activityId },
    });

    if (!activity) {
      throw new NotFoundException('Hoạt động không tồn tại');
    }

    const qb = this.activityChecklistRepo
      .createQueryBuilder('checklist')
      .leftJoinAndSelect('checklist.items', 'items')
      .where('checklist.activityId = :activityId', { activityId })
      .orderBy('checklist.createdAt', 'DESC')
      .addOrderBy('items.createdAt', 'DESC');

    const checklists = await qb.getMany();

    const processedChecklists = checklists.map((checklist) => {
      const totalItems = checklist.items?.length || 0;
      const completedItems =
        checklist.items?.filter((item) => item.isDone).length || 0;
      const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

      return {
        ...checklist,
        totalItems,
        completedItems,
        progress: Math.round(progress * 100) / 100,
      };
    });

    return new ResponseDto<ActivityChecklistResDto[]>({
      data: plainToInstance(ActivityChecklistResDto, processedChecklists, {
        excludeExtraneousValues: true,
      }),
      message: 'Lấy danh sách checklist thành công',
    });
  }

  async toggleReactionOnComment(
    activityId: Uuid,
    commentId: Uuid,
    userId: Uuid,
    type: ReactionType,
  ): Promise<ResponseDto<ActivityCommentResDto>> {
    return this.dataSource.transaction(async (manager) => {
      const activityRepo = manager.getRepository(ActivityEntity);
      const commentRepo = manager.getRepository(ActivityCommentEntity);
      const reactionRepo = manager.getRepository(ActivityCommentReactionEntity);
      const userRepo = manager.getRepository(UserEntity);

      const activity = await activityRepo.findOne({
        where: { id: activityId },
      });

      if (!activity) {
        throw new NotFoundException('Hoạt động không tồn tại');
      }

      const comment = await commentRepo.findOne({
        where: { id: commentId, activityId },
      });

      if (!comment) {
        throw new NotFoundException('Bình luận không tồn tại');
      }

      const user = await userRepo.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('Người dùng không tồn tại');
      }

      const reaction = await reactionRepo.findOne({
        where: { commentId, userId },
      });

      if (reaction) {
        if (reaction.type === type) {
          await reactionRepo.remove(reaction);
        } else {
          reaction.type = type;
          await reactionRepo.save(reaction);
        }
      } else {
        const newReaction = reactionRepo.create({
          commentId,
          userId,
          type,
        });
        await reactionRepo.save(newReaction);
      }

      const commentWithRelations = await commentRepo.findOne({
        where: { id: commentId },
        relations: ['user', 'reactions', 'reactions.user'],
      });

      if (!commentWithRelations) {
        throw new Error('Failed to retrieve comment with reactions');
      }

      const processedComment = {
        ...commentWithRelations,
        reactionCounts: this.aggregateCommentReactions(
          commentWithRelations.reactions || [],
        ).counts,
        reactionSummary: this.aggregateCommentReactions(
          commentWithRelations.reactions || [],
        ).summary,
      };

      return new ResponseDto<ActivityCommentResDto>({
        data: plainToInstance(ActivityCommentResDto, processedComment, {
          excludeExtraneousValues: true,
        }),
        message: 'Cập nhật phản ứng thành công',
      });
    });
  }

  async getUserReactionOnComment(
    activityId: Uuid,
    commentId: Uuid,
    userId: Uuid,
  ): Promise<ResponseDto<{ hasReacted: boolean; type?: ReactionType }>> {
    const activity = await this.activityRepo.findOne({
      where: { id: activityId },
    });

    if (!activity) {
      throw new NotFoundException('Hoạt động không tồn tại');
    }

    const comment = await this.activityCommentRepo.findOne({
      where: { id: commentId, activityId },
    });

    if (!comment) {
      throw new NotFoundException('Bình luận không tồn tại');
    }

    // Query directly for better performance than loading all reactions
    const userReaction = await this.activityCommentReactionRepo.findOne({
      where: { commentId, userId },
      select: ['type'],
    });

    return new ResponseDto<{ hasReacted: boolean; type?: ReactionType }>({
      data: {
        hasReacted: !!userReaction,
        type: userReaction?.type,
      },
      message: 'Lấy thông tin phản ứng thành công',
    });
  }

  async createComment(
    activityId: Uuid,
    createCommentDto: CreateActivityCommentDto,
    userId: Uuid,
  ): Promise<ResponseDto<ActivityCommentResDto>> {
    return this.dataSource.transaction(async (manager) => {
      const activityRepo = manager.getRepository(ActivityEntity);
      const userRepo = manager.getRepository(UserEntity);
      const commentRepo = manager.getRepository(ActivityCommentEntity);
      const activityLogRepo = manager.getRepository(ActivityLogEntity);

      const activity = await activityRepo.findOne({
        where: { id: activityId },
      });

      if (!activity) {
        throw new NotFoundException('Hoạt động không tồn tại');
      }

      const user = await userRepo.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('Người dùng không tồn tại');
      }

      if (createCommentDto.parentCommentId) {
        const parentComment = await commentRepo.findOne({
          where: { id: createCommentDto.parentCommentId, activityId },
        });

        if (!parentComment) {
          throw new NotFoundException('Bình luận cha không tồn tại');
        }
      }

      const comment = commentRepo.create({
        activityId,
        userId,
        content: createCommentDto.content,
        parentCommentId: createCommentDto.parentCommentId,
      });

      const savedComment = await commentRepo.save(comment);

      const activityLog = activityLogRepo.create({
        activity,
        user,
        action: ActivityLogActionEnum.COMMENT_CREATED,
        message: `${user.name} Đã thêm bình luận mới`,
      });

      await activityLogRepo.save(activityLog);

      const commentWithRelations = await commentRepo.findOne({
        where: { id: savedComment.id },
        relations: ['user', 'reactions', 'reactions.user'],
      });

      if (!commentWithRelations) {
        throw new Error('Failed to retrieve saved comment');
      }

      return new ResponseDto<ActivityCommentResDto>({
        data: plainToInstance(ActivityCommentResDto, commentWithRelations, {
          excludeExtraneousValues: true,
        }),
        message: 'Tạo bình luận thành công',
      });
    });
  }

  async getComments(
    activityId: Uuid,
    query: PageOptionsDto,
    currentUserId: Uuid,
  ): Promise<ResponseDto<ActivityCommentResDto[]>> {
    const activity = await this.activityRepo.findOne({
      where: { id: activityId },
    });

    if (!activity) {
      throw new NotFoundException('Hoạt động không tồn tại');
    }

    const qb = this.activityCommentRepo
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('comment.reactions', 'reactions')
      .leftJoinAndSelect('reactions.user', 'reactionUser')
      .leftJoinAndSelect('comment.replies', 'replies')
      .leftJoinAndSelect('replies.user', 'replyUser')
      .leftJoinAndSelect('replies.reactions', 'replyReactions')
      .leftJoinAndSelect('replyReactions.user', 'replyReactionUser')
      .where('comment.activityId = :activityId', { activityId })
      .andWhere('comment.parentCommentId IS NULL');

    const allowedSortFields = ['createdAt', 'content'];
    const sortField = allowedSortFields.includes(query.sortBy || '')
      ? query.sortBy
      : 'createdAt';
    const sortOrder = query.order || 'DESC';

    qb.orderBy(`comment.${sortField}`, sortOrder as 'ASC' | 'DESC');
    qb.addOrderBy('replies.createdAt', 'ASC');

    const comments = await qb.getMany();

    const processedComments = comments.map((comment) => {
      const reactionsByType = this.aggregateCommentReactions(
        comment.reactions || [],
      );

      // Xử lý replies với hasUserReacted
      const processedReplies =
        comment.replies?.map((reply) => {
          const replyReactionsByType = this.aggregateCommentReactions(
            reply.reactions || [],
          );

          const userReplyReaction = reply.reactions?.find(
            (r) => r.userId === currentUserId,
          );

          return {
            ...reply,
            reactionCounts: replyReactionsByType.counts,
            reactionSummary: replyReactionsByType.summary,
            currentUserReaction: userReplyReaction
              ? userReplyReaction.type
              : null,
            hasUserReacted: !!userReplyReaction,
          };
        }) || [];

      const userReaction = comment.reactions?.find(
        (r) => r.userId === currentUserId,
      );

      return {
        ...comment,
        reactionCounts: reactionsByType.counts,
        reactionSummary: reactionsByType.summary,
        currentUserReaction: userReaction ? userReaction.type : null,
        hasUserReacted: !!userReaction,
        replies: processedReplies,
      };
    });

    return new ResponseDto<ActivityCommentResDto[]>({
      data: plainToInstance(ActivityCommentResDto, processedComments, {
        excludeExtraneousValues: true,
      }),
      message: 'Lấy danh sách bình luận thành công',
    });
  }

  async getReplies(
    activityId: Uuid,
    commentId: Uuid,
    query: PageOptionsDto,
    currentUserId: Uuid, // Thêm currentUserId parameter
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
      .leftJoinAndSelect('comment.reactions', 'reactions')
      .leftJoinAndSelect('reactions.user', 'reactionUser')
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

    // Xử lý data để thêm reaction information
    const processedData = data.map((reply) => {
      const reactionsByType = this.aggregateCommentReactions(
        reply.reactions || [],
      );

      const userReaction = reply.reactions?.find(
        (r) => r.userId === currentUserId,
      );

      return {
        ...reply,
        reactionCounts: reactionsByType.counts,
        reactionSummary: reactionsByType.summary,
        currentUserReaction: userReaction ? userReaction.type : null,
        hasUserReacted: !!userReaction,
      };
    });

    const metaDto = new CursorPaginationDto(
      totalRecords,
      cursor.afterCursor,
      cursor.beforeCursor,
      query,
    );

    return new CursorPaginatedDto<ActivityCommentResDto>({
      data: plainToInstance(ActivityCommentResDto, processedData, {
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
    return this.dataSource.transaction(async (manager) => {
      const activityRepo = manager.getRepository(ActivityEntity);
      const commentRepo = manager.getRepository(ActivityCommentEntity);
      const activityLogRepo = manager.getRepository(ActivityLogEntity);
      const userRepo = manager.getRepository(UserEntity);

      // Validate activity exists
      const activity = await activityRepo.findOne({
        where: { id: activityId },
      });

      if (!activity) {
        throw new NotFoundException('Hoạt động không tồn tại');
      }

      const comment = await commentRepo.findOne({
        where: { id: commentId, activityId },
        relations: ['user'],
      });

      if (!comment) {
        throw new NotFoundException('Bình luận không tồn tại');
      }

      if (comment.userId !== userId) {
        throw new BadRequestException('Bạn chỉ có thể sửa bình luận của mình');
      }

      const user = await userRepo.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('Người dùng không tồn tại');
      }

      if (!updateCommentDto.content || updateCommentDto.content.trim() === '') {
        throw new BadRequestException('Nội dung bình luận không được để trống');
      }

      const oldContent = comment.content;

      comment.content = updateCommentDto.content.trim();
      comment.isEdited = true;
      comment.editedAt = new Date();

      await commentRepo.save(comment);

      const activityLog = activityLogRepo.create({
        activity,
        user,
        action: ActivityLogActionEnum.COMMENT_UPDATED,
        message: `${user.name} đã cập nhật bình luận`,
        metadata: {
          type: ActivityLogActionEnum.COMMENT_UPDATED,
          comment,
          oldContent,
          newContent: updateCommentDto.content,
        },
      });

      await activityLogRepo.save(activityLog);

      const commentWithRelations = await commentRepo.findOne({
        where: { id: commentId },
        relations: ['user', 'reactions', 'reactions.user'],
      });

      if (!commentWithRelations) {
        throw new Error('Failed to retrieve updated comment');
      }

      const processedComment = {
        ...commentWithRelations,
        reactionCounts: this.aggregateCommentReactions(
          commentWithRelations.reactions || [],
        ).counts,
        reactionSummary: this.aggregateCommentReactions(
          commentWithRelations.reactions || [],
        ).summary,
      };

      return new ResponseDto<ActivityCommentResDto>({
        data: plainToInstance(ActivityCommentResDto, processedComment, {
          excludeExtraneousValues: true,
        }),
        message: 'Cập nhật bình luận thành công',
      });
    });
  }

  async deleteComment(
    activityId: Uuid,
    commentId: Uuid,
    userId: Uuid,
  ): Promise<ResponseNoDataDto> {
    return this.dataSource.transaction(async (manager) => {
      const activityRepo = manager.getRepository(ActivityEntity);
      const commentRepo = manager.getRepository(ActivityCommentEntity);
      const userRepo = manager.getRepository(UserEntity);
      const activityLogRepo = manager.getRepository(ActivityLogEntity);

      const activity = await activityRepo.findOne({
        where: { id: activityId },
        relations: ['workspace', 'workspace.owner'],
      });

      if (!activity) {
        throw new NotFoundException('Hoạt động không tồn tại');
      }

      const comment = await commentRepo.findOne({
        where: { id: commentId, activityId },
        relations: ['user', 'replies'],
      });

      if (!comment) {
        throw new NotFoundException('Bình luận không tồn tại');
      }

      const user = await userRepo.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('Người dùng không tồn tại');
      }

      const isCommentCreator = comment.userId === userId;
      const isWorkspaceOwner = activity.workspace?.owner.id === userId;

      if (!isCommentCreator && !isWorkspaceOwner) {
        throw new BadRequestException(
          'Bạn không có quyền xóa bình luận này. Chỉ người tạo bình luận hoặc quản lý workspace mới có quyền xóa.',
        );
      }

      const contentBackup = comment.content;
      const commentCreator = comment.user;

      await commentRepo.remove(comment);

      const activityLog = activityLogRepo.create({
        activity,
        user,
        action: ActivityLogActionEnum.COMMENT_DELETED,
        message: isCommentCreator
          ? `${user.name} đã xóa bình luận của chính mình: "${contentBackup}"`
          : `${user.name} đã xóa bình luận của ${commentCreator.name}: "${contentBackup}"`,
        metadata: {
          type: ActivityLogActionEnum.COMMENT_DELETED,
          comment,
          deletedByAuthor: isCommentCreator,
        },
      });

      await activityLogRepo.save(activityLog);

      return new ResponseNoDataDto({
        message: 'Xóa bình luận thành công',
      });
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
            });
          }),
        );

        await notificationRepo.save(notifications);
      }

      // Remove follows from activityData before creating ActivityEntity
      const { assignees: _, follows: __, ...activityData } = dto;
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

      // Handle follows
      if (dto.follows?.length) {
        const activityFollowRepo = manager.getRepository(ActivityFollowEntity);
        const follows = dto.follows.map((userId) => ({
          activityId: savedActivity.id,
          userId,
          createdBy: userId,
        }));

        await activityFollowRepo
          .createQueryBuilder()
          .insert()
          .into(ActivityFollowEntity)
          .values(follows)
          .onConflict('("activityId", "userId") DO NOTHING')
          .execute();

        // Log follow actions
        const followLog = activityLogRepo.create({
          activity: savedActivity,
          user: userCreator,
          action: ActivityLogActionEnum.FOLLOW,
          message: `Thêm ${follows.length} người theo dõi`,
          metadata: {
            type: 'FOLLOW',
            userIds: dto.follows,
          },
        });
        await activityLogRepo.save(followLog);
      }

      const result = await activityRepo.findOne({
        where: { id: savedActivity.id },
        relations: [
          'subActivities',
          'assignees',
          'assignees.user',
          'files',
          'files.file',
          'follows',
          'follows.user',
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
      .leftJoinAndSelect('activity.workspace', 'workspace')
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

    // Base filter - luôn có WHERE clause
    qb.where('1 = 1');

    // Only filter by workspace if workspaceId is provided
    if (query.workspaceId) {
      qb.andWhere('activity.workspaceId = :workspaceId', {
        workspaceId: query.workspaceId,
      });
    }

    // Filter by assigneeId - FIX: Cần kiểm tra assignee có tồn tại không
    if (query.assigneeId) {
      // Chỉ lấy activities mà có assignee này
      qb.andWhere(
        'EXISTS (SELECT 1 FROM activity_assignees aa WHERE aa."activityId" = activity.id AND aa."userId"::varchar = :assigneeId)',
        { assigneeId: query.assigneeId },
      );
    }

    // Filter by stageGroupStatus - sửa lại logic
    if (query.stageGroupStatus) {
      qb.andWhere('stage.stageGroup = :stageGroupStatus', {
        stageGroupStatus: query.stageGroupStatus,
      });
    }

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
    if (query.categoryId)
      qb.andWhere('activity.categoryId = :categoryId', {
        categoryId: query.categoryId,
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
      relations: [
        'stage',
        'assignees',
        'assignees.user',
        'files',
        'files.file',
      ],
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
      const activityCommentRepo = manager.getRepository(ActivityCommentEntity);
      const activityReactionRepo = manager.getRepository(
        ActivityCommentReactionEntity,
      );
      const activityAssigneeRepo = manager.getRepository(
        ActivityAssigneeEntity,
      );
      const activityParticipantRepo = manager.getRepository(
        ActivityParticipantEntity,
      );
      const activityFeedbackRepo = manager.getRepository(
        ActivityFeedbackEntity,
      );
      const eventFeedbackRepo = manager.getRepository(EventFeedbackEntity);
      const activityFileRepo = manager.getRepository(ActivityFileEntity);
      const activityChecklistRepo = manager.getRepository(
        ActivityChecklistEntity,
      );
      const activityChecklistItemRepo = manager.getRepository(
        ActivityChecklistItemEntity,
      );
      const userRepo = manager.getRepository(UserEntity);

      const activity = await activityRepo.findOne({
        where: { id },
        relations: ['parent', 'subActivities'],
      });

      if (!activity) {
        throw new NotFoundException('Hoạt động không tồn tại');
      }

      const user = await userRepo.findOneOrFail({ where: { id: userId } });
      const activityName = activity.name;
      const isSubActivity = !!activity.parentId;

      const comments = await activityCommentRepo.find({
        where: { activityId: id },
        select: ['id'],
      });

      const commentIds = comments.map((c) => c.id);

      if (commentIds.length > 0) {
        await activityReactionRepo.delete({
          commentId: In(commentIds),
        });

        await activityCommentRepo.delete({ activityId: id });
      }

      const checklists = await activityChecklistRepo.find({
        where: { activityId: id },
        select: ['id'],
      });

      const checklistIds = checklists.map((c) => c.id);

      if (checklistIds.length > 0) {
        await activityChecklistItemRepo.delete({
          checklistId: In(checklistIds),
        });
        await activityChecklistRepo.delete({ activityId: id });
      }

      await Promise.all([
        activityAssigneeRepo.delete({ activityId: id }),
        activityParticipantRepo.delete({ activityId: id }),
        activityFeedbackRepo.delete({ activityId: id }),
        eventFeedbackRepo.delete({ activityId: id }),
        activityFileRepo.delete({ activityId: id }),
      ]);

      if (activity.subActivities && activity.subActivities.length > 0) {
        for (const subActivity of activity.subActivities) {
          await this.deleteActivity(subActivity.id, userId);
        }
      }

      if (isSubActivity) {
        const parentActivity = await activityRepo.findOne({
          where: { id: activity.parentId },
        });

        if (parentActivity) {
          const deleteSubTaskLog = activityLogRepo.create({
            activity: parentActivity,
            user,
            action: ActivityLogActionEnum.DELETE_SUB_TASK,
            message: `Xóa công việc phụ: ${activityName}`,
            metadata: {
              type: ActivityLogActionEnum.DELETE_SUB_TASK,
              subtask: activity,
            },
          });
          await activityLogRepo.save(deleteSubTaskLog);
        }
      }

      await activityLogRepo.delete({
        activity: {
          id,
        },
        action: Not(ActivityLogActionEnum.DELETED),
      });

      await activityRepo.delete(id);

      return new ResponseNoDataDto({
        message: isSubActivity
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
    currentUserId: Uuid,
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
    const qb = this.activityRepo
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.workspace', 'workspace')
      .leftJoinAndSelect('activity.assignees', 'assignees')
      .leftJoinAndSelect('assignees.user', 'assigneeUser')
      .leftJoinAndSelect('activity.stage', 'stage')
      .leftJoinAndSelect('activity.category', 'category')
      .leftJoinAndSelect('activity.subActivities', 'subActivities')
      .leftJoinAndSelect('subActivities.stage', 'subStage')
      .leftJoinAndSelect('activity.checklists', 'checklists')
      .leftJoinAndSelect('checklists.items', 'items')
      .leftJoinAndSelect('activity.files', 'files')
      .leftJoinAndSelect('files.file', 'file');

    switch (type) {
      case QueryType.CREATED_BY_ME:
        qb.where('activity.createdBy = :userId', { userId });
        break;

      case QueryType.ASSIGNED_TO_ME:
        qb.where(
          'EXISTS (SELECT 1 FROM activity_assignees aa WHERE aa."activityId" = activity.id AND aa."userId"::varchar = :userId)',
          { userId },
        );
        break;

      case QueryType.ASSIGNED_BY_STAGE_GROUP:
        qb.where(
          'EXISTS (SELECT 1 FROM activity_assignees aa WHERE aa."activityId" = activity.id AND aa."userId"::varchar = :userId)',
          { userId },
        );
        break;

      case QueryType.OVERDUE: {
        // Activities quá hạn - KHÔNG bao gồm task ở cột done và closed
        const now = new Date();
        qb.where(
          '(EXISTS (SELECT 1 FROM activity_assignees aa WHERE aa."activityId" = activity.id AND aa."userId"::varchar = :userId) OR activity."createdBy" = :userId)',
          { userId },
        )
          .andWhere('activity.endTime IS NOT NULL')
          .andWhere('activity.endTime < :now', { now })
          .andWhere('stage.stageGroup NOT IN (:...excludedGroups)', {
            excludedGroups: ['done', 'closed'],
          });
        break;
      }

      case QueryType.IN_PROGRESS:
        // Activities đang in progress - dựa vào stageGroup
        qb.where(
          '(EXISTS (SELECT 1 FROM activity_assignees aa WHERE aa."activityId" = activity.id AND aa."userId"::varchar = :userId) OR activity."createdBy" = :userId)',
          { userId },
        ).andWhere('stage.stageGroup = :activeGroup', {
          activeGroup: 'active',
        });
        break;

      case QueryType.TODAY: {
        // Activities diễn ra hôm nay
        const today = new Date();
        const startOfDay = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
        );
        const endOfDay = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          23,
          59,
          59,
          999,
        );

        qb.where(
          '(EXISTS (SELECT 1 FROM activity_assignees aa WHERE aa."activityId" = activity.id AND aa."userId"::varchar = :userId) OR activity."createdBy" = :userId)',
          { userId },
        ).andWhere(
          '(' +
            '(activity.startTime >= :startOfDay AND activity.startTime <= :endOfDay) OR ' +
            '(activity.endTime >= :startOfDay AND activity.endTime <= :endOfDay) OR ' +
            '(activity.startTime <= :startOfDay AND activity.endTime >= :endOfDay)' +
            ')',
          { startOfDay, endOfDay },
        );
        break;
      }

      case QueryType.COMPLETED:
        // Activities đã hoàn thành - CHỈ lấy done, KHÔNG lấy closed
        qb.where(
          '(EXISTS (SELECT 1 FROM activity_assignees aa WHERE aa."activityId" = activity.id AND aa."userId"::varchar = :userId) OR activity."createdBy" = :userId)',
          { userId },
        )
          .andWhere('stage.stageGroup = :doneGroup', {
            doneGroup: 'done',
          })
          .andWhere('stage.stageGroup != :closedGroup', {
            closedGroup: 'closed',
          });
        break;

      case QueryType.TODO:
        // Activities cần làm - chưa bắt đầu hoặc đang chờ
        qb.where(
          '(EXISTS (SELECT 1 FROM activity_assignees aa WHERE aa."activityId" = activity.id AND aa."userId"::varchar = :userId) OR activity."createdBy" = :userId)',
          { userId },
        ).andWhere('stage.stageGroup = :notStartedGroup', {
          notStartedGroup: 'not_started',
        });
        break;

      case QueryType.ALL:
        // Lấy tất cả activities - không filter theo user
        qb.where('1 = 1');
        break;

      default:
        // Fallback
        qb.where(
          '(EXISTS (SELECT 1 FROM activity_assignees aa WHERE aa."activityId" = activity.id AND aa."userId"::varchar = :userId) OR activity."createdBy" = :userId)',
          { userId },
        );
        break;
    }

    // Apply additional filters
    if (
      query.stageGroupStatus &&
      type !== QueryType.COMPLETED &&
      type !== QueryType.IN_PROGRESS &&
      type !== QueryType.OVERDUE &&
      type !== QueryType.TODO
    ) {
      // Chỉ áp dụng stageGroupStatus filter khi KHÔNG phải COMPLETED, IN_PROGRESS, OVERDUE, hoặc TODO
      // vì các loại này đã có logic riêng cho stageGroup
      qb.andWhere('stage.stageGroup = :stageGroupStatus', {
        stageGroupStatus: query.stageGroupStatus,
      });
    }

    if (query.workspaceId) {
      qb.andWhere('activity.workspaceId = :workspaceId', {
        workspaceId: query.workspaceId,
      });
    }

    if (query.assigneeId) {
      // Chỉ áp dụng filter assigneeId cho ALL và CREATED_BY_ME
      if (type === QueryType.ALL || type === QueryType.CREATED_BY_ME) {
        qb.andWhere(
          'EXISTS (SELECT 1 FROM activity_assignees aa WHERE aa."activityId" = activity.id AND aa."userId"::varchar = :assigneeId)',
          { assigneeId: query.assigneeId },
        );
      }
    }

    if (query.q) {
      qb.andWhere(
        'activity.name ILIKE :search OR activity.description ILIKE :search',
        { search: `%${query.q}%` },
      );
    }

    if (query.type) {
      qb.andWhere('activity.type = :type', { type: query.type });
    }

    if (query.priority) {
      qb.andWhere('activity.priority = :priority', {
        priority: query.priority,
      });
    }

    if (query.stageId) {
      qb.andWhere('activity.stageId = :stageId', { stageId: query.stageId });
    }

    if (query.categoryId) {
      qb.andWhere('activity.categoryId = :categoryId', {
        categoryId: query.categoryId,
      });
    }

    if (query.mandatory !== undefined) {
      qb.andWhere('activity.mandatory = :mandatory', {
        mandatory: query.mandatory,
      });
    }

    if (query.startTimeFrom) {
      qb.andWhere('activity.startTime >= :startTimeFrom', {
        startTimeFrom: query.startTimeFrom,
      });
    }

    if (query.endTimeTo) {
      qb.andWhere('activity.endTime <= :endTimeTo', {
        endTimeTo: query.endTimeTo,
      });
    }

    if (!query.includeSubTasks) {
      qb.andWhere('activity.parentId IS NULL');
    }

    qb.orderBy('activity.createdAt', 'DESC');

    const [activities, metaDto] = await paginate<ActivityEntity>(qb, query, {
      skipCount: false,
      takeAll: false,
    });

    const activitiesWithProgress = activities.map((activity) => {
      const progress = this.calculateProgress(activity);
      return {
        ...activity,
        progress,
      };
    });

    return new OffsetPaginatedDto({
      data: plainToInstance(ActivityResDto, activitiesWithProgress, {
        excludeExtraneousValues: true,
      }),
      meta: metaDto,
      message: 'Lấy danh sách công việc thành công',
    });
  }
  async createEventFeedback(
    activityId: Uuid,
    dto: CreateEventFeedbackDto,
  ): Promise<ResponseDto<EventFeedbackResDto>> {
    const activity = await this.activityRepo.findOneOrFail({
      where: { id: activityId },
    });

    if (activity.type !== ActivityType.EVENT) {
      throw new BadRequestException(
        'Chỉ có thể đánh giá cho sự kiện (event), không phải công việc (task)',
      );
    }

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

  async addLinkToActivity(
    activityId: Uuid,
    dto: AddActivityLinkDto,
    userId: Uuid,
  ): Promise<ResponseDto<ActivityLinkResDto>> {
    const activity = await this.activityRepo.findOne({
      where: { id: activityId },
    });

    if (!activity) {
      throw new NotFoundException('Activity không tồn tại');
    }

    // Fetch link preview data
    let linkPreviewData = null;
    if (this.linkPreviewService.isValidUrl(dto.url)) {
      try {
        linkPreviewData = await this.linkPreviewService.getPreview(dto.url);
      } catch (error) {
        this.logger.warn(
          `Failed to fetch preview for ${dto.url}:`,
          error.message,
        );
      }
    }

    const link = this.activityLinkRepo.create({
      activityId,
      title: dto.title,
      url: dto.url,
      description: dto.description,
      createdBy: userId,
      // Lưu metadata từ link preview
      thumbnail: linkPreviewData
        ? this.linkPreviewService.getBestThumbnail(linkPreviewData.images || [])
        : undefined,
      siteName: linkPreviewData?.siteName,
      siteDescription: linkPreviewData?.description,
      favicon: linkPreviewData?.favicon,
      metadata: linkPreviewData
        ? {
            originalTitle: linkPreviewData.title,
            allImages: linkPreviewData.images,
            fetchedAt: new Date().toISOString(),
          }
        : undefined,
    });

    const savedLink = await this.activityLinkRepo.save(link);

    // Load lại với relations để có thông tin creator
    const linkWithCreator = await this.activityLinkRepo.findOne({
      where: { id: savedLink.id },
      relations: ['creator'],
    });

    // Transform data cho response
    const responseData = {
      ...linkWithCreator,
      linkPreview: linkPreviewData
        ? {
            thumbnail: linkWithCreator.thumbnail,
            siteName: linkWithCreator.siteName,
            siteDescription: linkWithCreator.siteDescription,
            favicon: linkWithCreator.favicon,
          }
        : undefined,
    };

    return new ResponseDto<ActivityLinkResDto>({
      data: plainToInstance(ActivityLinkResDto, responseData, {
        excludeExtraneousValues: true,
      }),
      message: 'Thêm link thành công',
    });
  }

  async getActivityLinks(
    activityId: Uuid,
  ): Promise<ResponseDto<ActivityLinkResDto[]>> {
    const activity = await this.activityRepo.findOne({
      where: { id: activityId },
    });

    if (!activity) {
      throw new NotFoundException('Activity không tồn tại');
    }

    const links = await this.activityLinkRepo.find({
      where: { activityId },
      relations: ['creator'],
      order: { createdAt: 'DESC' },
    });

    // Transform data để include link preview
    const linksWithPreview = links.map((link) => ({
      ...link,
      linkPreview:
        link.thumbnail || link.siteName || link.siteDescription
          ? {
              thumbnail: link.thumbnail,
              siteName: link.siteName,
              siteDescription: link.siteDescription,
              favicon: link.favicon,
            }
          : undefined,
    }));

    return new ResponseDto<ActivityLinkResDto[]>({
      data: plainToInstance(ActivityLinkResDto, linksWithPreview, {
        excludeExtraneousValues: true,
      }),
      message: 'Lấy danh sách link thành công',
    });
  }

  async updateActivityLink(
    activityId: Uuid,
    linkId: Uuid,
    dto: AddActivityLinkDto,
  ): Promise<ResponseDto<ActivityLinkResDto>> {
    const activity = await this.activityRepo.findOne({
      where: { id: activityId },
    });

    if (!activity) {
      throw new NotFoundException('Activity không tồn tại');
    }

    const link = await this.activityLinkRepo.findOne({
      where: { id: linkId, activityId },
      relations: ['creator'],
    });

    if (!link) {
      throw new NotFoundException('Link không tồn tại');
    }

    // Nếu URL thay đổi, fetch preview mới
    const shouldUpdatePreview = link.url !== dto.url;
    let linkPreviewData = null;

    if (shouldUpdatePreview && this.linkPreviewService.isValidUrl(dto.url)) {
      try {
        linkPreviewData = await this.linkPreviewService.getPreview(dto.url);
      } catch (error) {
        this.logger.warn(
          `Failed to fetch preview for ${dto.url}:`,
          error.message,
        );
      }
    }

    // Cập nhật thông tin
    link.title = dto.title;
    link.url = dto.url;
    link.description = dto.description;

    if (shouldUpdatePreview && linkPreviewData) {
      link.thumbnail = this.linkPreviewService.getBestThumbnail(
        linkPreviewData.images || [],
      );
      link.siteName = linkPreviewData.siteName;
      link.siteDescription = linkPreviewData.description;
      link.favicon = linkPreviewData.favicon;
      link.metadata = {
        originalTitle: linkPreviewData.title,
        allImages: linkPreviewData.images,
        fetchedAt: new Date().toISOString(),
      };
    }

    const updatedLink = await this.activityLinkRepo.save(link);

    const responseData = {
      ...updatedLink,
      linkPreview:
        updatedLink.thumbnail ||
        updatedLink.siteName ||
        updatedLink.siteDescription
          ? {
              thumbnail: updatedLink.thumbnail,
              siteName: updatedLink.siteName,
              siteDescription: updatedLink.siteDescription,
              favicon: updatedLink.favicon,
            }
          : undefined,
    };

    return new ResponseDto<ActivityLinkResDto>({
      data: plainToInstance(ActivityLinkResDto, responseData, {
        excludeExtraneousValues: true,
      }),
      message: 'Cập nhật link thành công',
    });
  }

  async removeLinkFromActivity(
    activityId: Uuid,
    linkId: Uuid,
  ): Promise<ResponseNoDataDto> {
    const activity = await this.activityRepo.findOne({
      where: { id: activityId },
    });

    if (!activity) {
      throw new NotFoundException('Activity không tồn tại');
    }

    const link = await this.activityLinkRepo.findOne({
      where: {
        id: linkId,
        activityId,
      },
    });

    if (!link) {
      throw new NotFoundException('Link không tồn tại');
    }

    await this.activityLinkRepo.remove(link);

    return new ResponseNoDataDto({
      message: 'Xóa link thành công',
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

    if (dto.type !== undefined && dto.type !== oldValues.type) {
      logPromises.push(
        activityLogRepo.save(
          activityLogRepo.create({
            activity,
            user,
            action: ActivityLogActionEnum.UPDATED,
            message: `Thay đổi loại hoạt động từ ${oldValues.type} sang ${dto.type}`,
            metadata: {
              type: 'TYPE_CHANGE',
              field: 'type',
            },
          }),
        ),
      );
    }

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
            message: dto.description
              ? `Cập nhật mô tả hoạt động thành "${dto.description}"`
              : 'Xóa mô tả hoạt động',
            metadata: {
              type: 'DESCRIPTION_CHANGE',
            },
          }),
        ),
      );
    }

    if (dto.location !== undefined && dto.location !== oldValues.location) {
      logPromises.push(
        activityLogRepo.save(
          activityLogRepo.create({
            activity,
            user,
            action: ActivityLogActionEnum.UPDATED,
            message: `Cập nhập địa điểm từ "${oldValues.location || 'chưa có'}" thành "${dto.location || 'chưa có'}"`,
            metadata: {
              type: 'LOCATION_CHANGE',
            },
          }),
        ),
      );
    }

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
            metadata: {
              type: 'ONLINE_LINK_CHANGE',
            },
          }),
        ),
      );
    }

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
            metadata: {
              type: 'ESTIMATE_TIME_CHANGE',
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
            metadata: {
              type: 'INSTRUCTOR_COUNT_CHANGE',
            },
          }),
        ),
      );
    }

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
            message: `${user.name} thay đổi số lượng sinh viên từ ${oldValues.studentCount || 0} sang ${dto.studentCount}`,
            metadata: {
              type: 'STUDENT_COUNT_CHANGE',
            },
          }),
        ),
      );
    }

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
              metadata: {
                type: 'TIME_CHANGE',
                field: 'startTime',
                value: newStartTime,
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
              metadata: {
                type: 'TIME_CHANGE',
                field: 'endTime',
                value: newEndTime,
              },
            }),
          ),
        );
      }
    }

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

    if (logPromises.length > 0) {
      await Promise.all(logPromises);
    }
  }

  private aggregateCommentReactions(
    reactions: ActivityCommentReactionEntity[],
  ) {
    const counts: Record<string, number> = {};

    const summary: Record<
      string,
      {
        count: number;
        users: Array<{ id: string; name: string; avatar?: string }>;
      }
    > = {};

    reactions.forEach((reaction) => {
      const type = reaction.type;

      counts[type] = (counts[type] || 0) + 1;

      if (!summary[type]) {
        summary[type] = { count: 0, users: [] };
      }

      summary[type].count++;

      if (reaction.user) {
        summary[type].users.push({
          id: reaction.userId,
          name: reaction.user.name || '',
          avatar: reaction.user.avatar,
        });
      }
    });

    return { counts, summary };
  }

  private calculateDetailedProgress(activity: ActivityEntity): {
    progress: number;
    details: {
      subTasksProgress: number;
      checklistsProgress: number;
      stageCompleted: boolean;
      totalSubTasks: number;
      completedSubTasks: number;
      totalChecklistItems: number;
      completedChecklistItems: number;
    };
  } {
    const stageCompleted = activity.stage?.isCompleted || false;

    const subTasks = activity.subActivities || [];
    const totalSubTasks = subTasks.length;
    const completedSubTasks = subTasks.filter(
      (sub) => sub.stage?.isCompleted,
    ).length;
    const subTasksProgress =
      totalSubTasks > 0 ? (completedSubTasks / totalSubTasks) * 100 : 0;

    let totalChecklistItems = 0;
    let completedChecklistItems = 0;

    const checklists = activity.checklists || [];
    checklists.forEach((checklist) => {
      const items = checklist.items || [];
      items.forEach((item) => {
        totalChecklistItems++;
        if (item.isDone) {
          completedChecklistItems++;
        }
      });
    });

    const checklistsProgress =
      totalChecklistItems > 0
        ? (completedChecklistItems / totalChecklistItems) * 100
        : 0;

    let totalProgress = 0;
    let weightCount = 0;

    if (totalSubTasks > 0) {
      totalProgress += subTasksProgress;
      weightCount++;
    }

    if (totalChecklistItems > 0) {
      totalProgress += checklistsProgress;
      weightCount++;
    }

    if (weightCount === 0) {
      totalProgress = stageCompleted ? 100 : 0;
    } else {
      totalProgress = totalProgress / weightCount;
    }

    if (stageCompleted) {
      totalProgress = Math.max(totalProgress, 100);
    }

    return {
      progress: Math.round(totalProgress * 100) / 100,
      details: {
        subTasksProgress: Math.round(subTasksProgress * 100) / 100,
        checklistsProgress: Math.round(checklistsProgress * 100) / 100,
        stageCompleted,
        totalSubTasks,
        completedSubTasks,
        totalChecklistItems,
        completedChecklistItems,
      },
    };
  }
}
