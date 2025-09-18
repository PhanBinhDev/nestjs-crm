import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { ResponseNoDataDto } from '@/common/dto/response/response-no-data.dto';
import { ResponseDto } from '@/common/dto/response/response.dto';
import { Uuid } from '@/common/types/common.type';
import {
  AssignmentStatus,
  ParticipantStatus,
  QueryType,
} from '@/database/enum/activity.enum';
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
import { ActivityAssigneeResDto } from './dto/activity-assignee.res.dto';
import { ActivityFeedbackResDto } from './dto/activity-feedback.res.dto';
import { ActivityResDto } from './dto/activity.res.dto';
import { AssignUserToActivityDto } from './dto/assign-user-to-activity.dto';
import { AttachFileDto } from './dto/attach-file.dto';
import { AttachFileResDto } from './dto/attach-file.res.dto';
import { CreateActivityFeedbackDto } from './dto/create-activity-feedback.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { QueryActivityDto } from './dto/query-activity.dto';
import { UpdateActivityStatusDto } from './dto/update-activity-status.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { UpdateParticipantReqDto } from './dto/update-participant.req.dto';
import { ActivityAssigneeEntity } from './entities/activity-assignee.entity';
import { ActivityFeedbackEntity } from './entities/activity-feedback.entity';
import { ActivityFileEntity } from './entities/activity-file.entity';
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
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {
    super(activityRepo);
  }

  async create(dto: CreateActivityDto): Promise<ResponseDto<ActivityResDto>> {
    if (dto.type === 'event') {
      if (!dto.startTime || !dto.endTime || !dto.location) {
        throw new BadRequestException(
          'Event phải có startTime, endTime, location',
        );
      }
    }
    const count = await this.activityRepo.count({
      where: { stageId: dto.stageId },
    });
    const activity = this.activityRepo.create({ ...dto, position: count + 1 });
    const res = await this.activityRepo.save(activity);

    return new ResponseDto<ActivityResDto>({
      data: plainToInstance(ActivityResDto, res, {
        excludeExtraneousValues: true,
      }),
      message: 'Tạo hoạt động thành công',
    });
  }

  async findAll(
    query: QueryActivityDto,
  ): Promise<OffsetPaginatedDto<ActivityResDto>> {
    const qb = this.activityRepo
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.participants', 'participants')
      .leftJoinAndSelect('participants.user', 'participantUser')
      .leftJoinAndSelect('activity.files', 'files')
      .leftJoinAndSelect('activity.feedbacks', 'feedbacks')
      .leftJoinAndSelect('feedbacks.user', 'feedbackUser')
      .leftJoinAndSelect('activity.assignees', 'assignees')
      .leftJoinAndSelect('assignees.user', 'assigneeUser')
      .leftJoinAndSelect('activity.semester', 'semester')
      .leftJoinAndSelect('activity.parent', 'parent')
      .leftJoinAndSelect('activity.subActivities', 'subActivities');
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
  ): Promise<ResponseDto<ActivityResDto>> {
    const activity = await this.activityRepo.findOneOrFail({ where: { id } });
    activity.status = dto.status;
    await this.activityRepo.save(activity);
    return new ResponseDto<ActivityResDto>({
      data: plainToInstance(ActivityResDto, activity, {
        excludeExtraneousValues: true,
      }),
      message: 'Cập nhật trạng thái hoạt động thành công',
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

  async deleteActivity(id: Uuid): Promise<ResponseNoDataDto> {
    await this.activityRepo.delete(id);
    //TODO: handle clear file manualy here
    return new ResponseNoDataDto({
      message: 'Xóa hoạt động thành công',
    });
  }

  async updateActivity(
    id: Uuid,
    dto: UpdateActivityDto,
  ): Promise<ResponseDto<ActivityResDto>> {
    return await this.dataSource.transaction(async (manager) => {
      const activityRepo = manager.getRepository(ActivityEntity);

      const activity = await activityRepo.findOneOrFail({ where: { id } });
      const oldStageId = activity.stageId;
      const oldPosition = activity.position;
      const newStageId = dto.stageId ?? activity.stageId;
      const newPosition = dto.position ?? activity.position;

      // Kiểm tra các loại thay đổi
      const hasStageChange = dto.stageId && dto.stageId !== oldStageId;
      const hasPositionChange =
        dto.position !== undefined && dto.position !== oldPosition;

      if (hasStageChange) {
        // Case 1: Chuyển sang stage khác (có thể kèm theo thay đổi position)
        await Promise.all([
          // Cập nhật column cũ: Giảm position của các items phía sau vị trí cũ
          activityRepo
            .createQueryBuilder()
            .update(ActivityEntity)
            .set({ position: () => 'position - 1' })
            .where('stageId = :oldStageId', { oldStageId })
            .andWhere('position > :oldPosition', { oldPosition })
            .execute(),

          // Cập nhật column mới: Tăng position của các items từ vị trí mới trở đi
          activityRepo
            .createQueryBuilder()
            .update(ActivityEntity)
            .set({ position: () => 'position + 1' })
            .where('stageId = :newStageId', { newStageId })
            .andWhere('position >= :newPosition', { newPosition })
            .execute(),
        ]);
      } else if (hasPositionChange) {
        // Case 2: Di chuyển trong cùng stage
        if (oldPosition < newPosition) {
          // Di chuyển xuống: Giảm position của các items ở giữa
          await activityRepo
            .createQueryBuilder()
            .update(ActivityEntity)
            .set({ position: () => 'position - 1' })
            .where('stageId = :stageId', { stageId: newStageId })
            .andWhere('position > :oldPosition', { oldPosition })
            .andWhere('position <= :newPosition', { newPosition })
            .execute();
        } else {
          // Di chuyển lên: Tăng position của các items ở giữa
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

      // Case 3: hasStageChange = true đã cover cả trường hợp có position change
      // Vì khi chuyển stage, ta luôn:
      // 1. Dọn dẹp column cũ (giảm position các items phía sau)
      // 2. Chuẩn bị chỗ trong column mới (tăng position từ vị trí insert)
      // 3. Insert item vào đúng vị trí mong muốn

      // Cập nhật activity với tất cả các thay đổi
      Object.assign(activity, dto);
      await activityRepo.save(activity);

      return new ResponseDto<ActivityResDto>({
        data: plainToInstance(ActivityResDto, activity, {
          excludeExtraneousValues: true,
        }),
        message: 'Cập nhật hoạt động thành công',
      });
    });
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
    // Kiểm tra activity tồn tại
    const activity = await this.activityRepo.findOneOrFail({
      where: { id: activityId },
    });

    // Kiểm tra semester tồn tại
    const semester = await this.semesterRepo.findOneOrFail({
      where: { id: semesterId },
    });

    // Gán activity vào kỳ học
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
