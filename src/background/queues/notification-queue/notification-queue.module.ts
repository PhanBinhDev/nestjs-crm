import { QueueName } from '@/constants/job.constant';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

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
  ],
})
export class NotificationQueueModule {}
