import { DeviceTokensService } from '@/api/device-token/device-tokens.service';
import { UserService } from '@/api/users/user.service';
import { CursorPaginationDto } from '@/common/dto/cursor-pagination/cursor-pagination.dto';
import { CursorPaginatedDto } from '@/common/dto/cursor-pagination/paginated.dto';
import { ResponseNoDataDto } from '@/common/dto/response/response-no-data.dto';
import { Uuid } from '@/common/types/common.type';
import { buildPaginator } from '@/utils/cursor-pagination';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import * as admin from 'firebase-admin';
import { Repository } from 'typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { MarkReadDto } from './dto/mark-read.dto';
import { NotificationResDto } from './dto/notification.res.dto';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { NotificationEntity } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @Inject('FIREBASE_ADMIN') private readonly firebaseAdmin: admin.app.App,
    @InjectRepository(NotificationEntity)
    private readonly notificationRepo: Repository<NotificationEntity>,
    private readonly userServices: UserService,
    private readonly deviceTokenServices: DeviceTokensService,
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

    return new CursorPaginatedDto<NotificationResDto>({
      data: plainToInstance(NotificationResDto, data, {
        excludeExtraneousValues: true,
      }),
      meta: metaDto,
      message: 'Lấy danh sách thông báo thành công',
    });
  }

  async clearAll(userId: Uuid): Promise<ResponseNoDataDto> {
    await this.notificationRepo.delete({ userId });

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

  async sendPushNotification(dto: CreateNotificationDto) {
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
    };

    const message: admin.messaging.MulticastMessage = {
      notification: {
        title: dto.title,
        body: dto.message,
      },
      data,
      tokens: deviceTokens,
      webpush: {
        headers: {
          Urgency: 'high',
        },
        notification: {
          title: dto.title,
          body: dto.message,
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
