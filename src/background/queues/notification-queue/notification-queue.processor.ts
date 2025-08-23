import { JobName, QueueName } from '@/constants/job.constant';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { NotificationQueueService } from './notification-queue.service';

@Processor(QueueName.NOTIFICATION, {
  concurrency: 5,
  drainDelay: 300,
  stalledInterval: 30000,
  removeOnComplete: {
    age: 86400,
    count: 100,
  },
  limiter: {
    max: 100,
    duration: 1000,
  },
})
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private readonly notificationQueueService: NotificationQueueService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>, _token?: string): Promise<any> {
    this.logger.debug(
      `Processing job ${job.id} of type ${job.name} with data ${JSON.stringify(job.data)}...`,
    );

    switch (job.name) {
      case JobName.NOTIFICATION:
      // return await this.
    }
  }
}
