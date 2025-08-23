import { CreateNotificationDto } from '@/api/notification/dto/create-notification.dto';
import { NotificationsService } from '@/api/notification/notifications.service';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationQueueService {
  private readonly logger = new Logger(NotificationQueueService.name);

  constructor(private readonly notificationService: NotificationsService) {}

  async addNotificationJob(data: CreateNotificationDto): Promise<void> {
    this.logger.debug(`Adding notification job for user ${data.userId}...`);
    await this.notificationService.sendPushNotification(data);
  }
}
