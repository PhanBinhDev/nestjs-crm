import { Injectable, Logger } from '@nestjs/common';
import { ActivityOverdueQueueService } from './activity-overdue-queue.service';

@Injectable()
export class ActivityOverdueProcessor {
  private readonly logger = new Logger(ActivityOverdueProcessor.name);

  constructor(
    private readonly activityOverdueService: ActivityOverdueQueueService,
  ) {}

  // @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
  //   name: 'check-overdue-activities',
  //   timeZone: 'Asia/Ho_Chi_Minh',
  // })
  async handleOverdueCheck(): Promise<void> {
    // this.logger.log('Starting scheduled overdue activities check...');
    // try {
    //   const result =
    //     await this.activityOverdueService.processOverdueActivities();
    //   if (result.success) {
    //     if (result.processedCount > 0) {
    //       this.logger.log(`Cron job completed: ${result.message}`);
    //       this.logger.log(`Processed activities: ${result.details.length}`);
    //       result.details.forEach((detail, index) => {
    //         this.logger.log(
    //           `  ${index + 1}. "${detail.activityName}" (${detail.oldStage} -> ${detail.newStage})`,
    //         );
    //       });
    //     } else {
    //       const now = new Date();
    //       if (now.getMinutes() % 30 === 0) {
    //         this.logger.log('No overdue activities found');
    //       }
    //     }
    //   } else {
    //     this.logger.error(`Cron job failed: ${result.message}`);
    //   }
    // } catch (error) {
    //   this.logger.error('Unexpected error in cron job:', error);
    // }
  }
}
