import { NotificationsModule } from '@/api/notification/notifications.module';
import { QueueName } from '@/constants/job.constant';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { NotificationQueueEvents } from './notification-queue.events';
import { NotificationProcessor } from './notification-queue.processor';
import { NotificationQueueService } from './notification-queue.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: QueueName.NOTIFICATION,
      streams: {
        events: {
          maxLen: 1000,
        },
      },
    }),
    NotificationsModule,
  ],
  providers: [
    NotificationQueueService,
    NotificationProcessor,
    NotificationQueueEvents,
  ],
  exports: [BullModule, NotificationQueueService],
})
export class NotificationQueueModule {}
