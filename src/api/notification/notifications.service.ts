import { DeviceTokensService } from '@/api/device-token/device-tokens.service';
import { UserService } from '@/api/users/user.service';
import { CloudinaryService } from '@/cloudinary/cloudinary.service';
import { CursorPaginationDto } from '@/common/dto/cursor-pagination/cursor-pagination.dto';
import { CursorPaginatedDto } from '@/common/dto/cursor-pagination/paginated.dto';
import { ResponseNoDataDto } from '@/common/dto/response/response-no-data.dto';
import { Uuid } from '@/common/types/common.type';
import { JobName, QueueName } from '@/constants/job.constant';
import { NotificationType } from '@/database/enum/notifications.enum';
import { buildPaginator } from '@/utils/cursor-pagination';
import { upperCaseFirst } from '@/utils/index.util';
import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { plainToInstance } from 'class-transformer';
import * as admin from 'firebase-admin';
import moment from 'moment';
import { In, Repository } from 'typeorm';
import { FileEntity } from '../files/entities/files.entity';
import { UserEntity } from '../users/entities/user.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { CreateReminderReqDto } from './dto/create-reminder.req.dto';
import { MarkReadDto } from './dto/mark-read.dto';
import { NotificationResDto } from './dto/notification.res.dto';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { SendPushNotificationDto } from './dto/send-push-notification.dto';
import { NotificationEntity } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @Inject('FIREBASE_ADMIN')
    private readonly firebaseAdmin: admin.app.App,
    @InjectRepository(NotificationEntity)
    private readonly notificationRepo: Repository<NotificationEntity>,
    private readonly userServices: UserService,
    private readonly deviceTokenServices: DeviceTokensService,
    @InjectQueue(QueueName.NOTIFICATION) private notiQueue: Queue,
    private readonly cloudinaryService: CloudinaryService,
    @InjectRepository(FileEntity)
    private readonly fileRepo: Repository<FileEntity>,
  ) {}

  async findAll(
    query: QueryNotificationDto,
    currentUser: Uuid,
  ): Promise<CursorPaginatedDto<NotificationResDto>> {
    const qb = this.notificationRepo
      .createQueryBuilder('notification')
      .andWhere('notification.userId = :userId', { userId: currentUser })
      .leftJoinAndSelect('notification.user', 'user');

    if (query.senderId) {
      qb.andWhere('notification.senderId = :senderId', {
        senderId: query.senderId,
      });
    }

    if (query.isRead !== undefined) {
      qb.andWhere('notification.isRead = :isRead', { isRead: query.isRead });
    }

    if (query.type) {
      qb.andWhere('notification.type = :type', { type: query.type });
    }

    if (query.q) {
      qb.andWhere(
        '(notification.title ILIKE :search OR notification.message ILIKE :search)',
        { search: `%${query.q}%` },
      );
    }

    const allowedSortFields = ['createdAt', 'title', 'type', 'isRead'];
    const sortField = allowedSortFields.includes(query.sortBy || '')
      ? query.sortBy
      : 'createdAt';

    qb.orderBy(`notification.${sortField}`, query.order || 'DESC');

    const paginator = buildPaginator({
      entity: NotificationEntity,
      alias: 'notification',
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

    const unreadCount = await this.notificationRepo.count({
      where: { userId: currentUser, isRead: false },
    });

    return new CursorPaginatedDto<NotificationResDto>({
      data: plainToInstance(NotificationResDto, data, {
        excludeExtraneousValues: true,
      }),
      meta: metaDto,
      message: 'Lấy danh sách thông báo thành công',
      metadata: { unreadCount },
    });
  }

  private calculateDelay(remindAt: string, customMinutes?: number): number {
    const remindTime = moment(remindAt);
    let notificationTime = remindTime;
    if (customMinutes) {
      notificationTime = remindTime.subtract(customMinutes, 'minutes');
    }
    return notificationTime.diff(moment(), 'milliseconds');
  }

  async sendReminderToUsers(
    dto: CreateReminderReqDto,
    attachments: Express.Multer.File[],
    userId: Uuid,
  ) {
    const user = await this.userServices.findOne(userId);
    const uploadedPublicIds: string[] = [];
    const files: FileEntity[] = [];

    try {
      await this.fileRepo.manager.transaction(async (manager) => {
        if (attachments && attachments.length) {
          for (const file of attachments) {
            const folder = 'reminders';
            const resUpload = await this.cloudinaryService.uploadToFolder(
              file,
              folder,
              file.originalname,
            );
            uploadedPublicIds.push(resUpload.public_id);

            const fileEntity = manager.create(FileEntity, {
              url: resUpload.secure_url,
              originalName: file.originalname,
              mimeType: file.mimetype,
              size: resUpload.bytes,
              fileName: file.originalname,
              uploadedBy: userId,
              metadata: {
                public_id: resUpload.public_id,
                format: resUpload.format,
                resource_type: resUpload.resource_type,
                width: resUpload.width,
                height: resUpload.height,
                bytes: resUpload.bytes,
              },
            });
            const savedFile = await manager.save(FileEntity, fileEntity);
            files.push(savedFile);
          }
        }

        for (const receiverId of dto.receivers) {
          const notificationDto: SendPushNotificationDto = {
            userId: receiverId,
            title: `${upperCaseFirst(dto.title) || 'Bạn có 1 nhắc nhở'} từ ${upperCaseFirst(user.data.name) || 'Hệ thống'}`,
            message: `${dto.description || ''}`.trim(),
            type: NotificationType.REMINDER,
            data: {
              reminderAt: dto.reminderAt,
              files,
            },
          };
          const delay = this.calculateDelay(dto.reminderAt, dto.customMinutes);

          await this.notiQueue.add(JobName.REMINDER, notificationDto, {
            removeOnComplete: true,
            delay: Math.max(delay, 0),
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 1000,
            },
          });
        }
      });
    } catch (error) {
      for (const publicId of uploadedPublicIds) {
        try {
          await this.cloudinaryService.deleteFile(publicId);
        } catch {
          this.logger.warn(`Cannot rollback file on Cloudinary: ${publicId}`);
        }
      }
      throw error;
    }

    return new ResponseNoDataDto({
      message: 'Tạo nhắc nhở thành công',
    });
  }

  async sendTestNotification(userId: Uuid) {
    const createNotificationDto: SendPushNotificationDto = {
      userId,
      title: 'Test Notification',
      message: 'This is a test notification',
      type: NotificationType.GENERAL,
      data: {
        uri: 'https://dribbble.com/search/request-notification-permisison',
      },
    };

    console.log('createNotificationDto', createNotificationDto);

    return this.sendPushNotification(createNotificationDto);
  }

  async clearAll(userId: Uuid): Promise<ResponseNoDataDto> {
    let filePublicIds: string[] = [];

    await this.notificationRepo.manager.transaction(async (manager) => {
      const notifications = await manager.find(NotificationEntity, {
        where: { userId },
      });

      const fileIds: string[] = [];
      for (const noti of notifications) {
        if (Array.isArray(noti.data?.files)) {
          for (const file of noti.data.files) {
            if (file.id) fileIds.push(file.id);
          }
        }
      }

      if (fileIds.length) {
        const files = await manager.findBy(FileEntity, {
          id: In(fileIds),
        });
        filePublicIds = files
          .map((file) => file.metadata?.public_id)
          .filter(Boolean);

        await manager.delete(FileEntity, fileIds);
      }

      await manager.delete(NotificationEntity, { userId });
    });

    for (const publicId of filePublicIds) {
      try {
        await this.cloudinaryService.deleteFile(publicId);
      } catch {
        this.logger.warn(`Cannot delete file on Cloudinary: ${publicId}`);
      }
    }

    return new ResponseNoDataDto({
      message: 'Xoá tất cả thông báo thành công',
    });
  }

  async markRead(dto: MarkReadDto): Promise<ResponseNoDataDto> {
    const notification = await this.notificationRepo.findOne({
      where: { id: dto.notificationId },
    });

    if (!notification) {
      throw new Error('Không tìm thấy thông báo');
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await this.notificationRepo.save(notification);

    return new ResponseNoDataDto({
      message: 'Đánh dấu thông báo là đã đọc thành công',
    });
  }

  async markAllRead(user: UserEntity): Promise<ResponseNoDataDto> {
    await this.notificationRepo.update(
      { userId: user.id, isRead: false },
      { isRead: true, readAt: new Date() },
    );
    return new ResponseNoDataDto({
      message: 'Đánh dấu tất cả thông báo là đã đọc thành công',
    });
  }

  async createNotification(dto: CreateNotificationDto) {
    return this.notificationRepo.save(dto);
  }

  async sendPushNotification(dto: SendPushNotificationDto) {
    const userReceivedNoti = await this.userServices.findOne(dto.userId);

    const deviceTokens = await this.deviceTokenServices.findAllByUserId(
      dto.userId,
    );

    if (!deviceTokens.length) {
      this.logger.warn(
        `User ${dto.userId} - ${userReceivedNoti.data.email} has no device tokens.`,
      );
      return;
    }

    const notification = await this.createNotification(dto);

    const data = {
      ...Object.fromEntries(
        Object.entries(dto.data || {}).map(([k, v]) => [k, String(v)]),
      ),
      timestamp: new Date().toISOString(),
      uri: dto.data?.uri || '',
    };

    const message: admin.messaging.MulticastMessage = {
      data,
      tokens: deviceTokens,
      notification: {
        title: dto.title,
        body: dto.message,
      },
      webpush: {
        headers: {
          Urgency: 'high',
        },
        fcmOptions: {
          link: dto.data.uri || '/',
        },
      },
    };

    const response = await this.firebaseAdmin
      .messaging()
      .sendEachForMulticast(message);

    this.logger.log(
      `Push notification sent to user ${dto.userId} - ${userReceivedNoti.data.email}. Success: ${response.successCount}, Failure: ${response.failureCount}`,
    );

    await this.handleSendResponse(response, deviceTokens, dto.userId);

    return notification;
  }

  private async handleSendResponse(
    response: admin.messaging.BatchResponse,
    tokens: string[],
    targetUserId: Uuid,
  ) {
    const invalidTokens: string[] = [];

    response.responses.forEach((resp, idx) => {
      if (!resp.success && resp.error) {
        const errorCode = resp.error.code;

        this.logger.log(
          `Error sending notification to token ${tokens[idx]}: ${resp.error.message}`,
        );

        this.logger.log(`Error code: ${errorCode}`);

        if (
          errorCode === 'messaging/invalid-registration-token' ||
          errorCode === 'messaging/registration-token-not-registered'
        ) {
          invalidTokens.push(tokens[idx]);
        }
      }
    });

    // Cleanup invalid tokens
    if (invalidTokens.length > 0) {
      await this.removeInvalidTokens(targetUserId, invalidTokens);
    }
  }

  private async removeInvalidTokens(
    targetUserId: Uuid,
    invalidTokens: string[],
  ) {
    for (const token of invalidTokens) {
      // Xóa từng token không hợp lệ khỏi DB
      await this.deviceTokenServices.removeToken(targetUserId, token);
    }
  }
}
