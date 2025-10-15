import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ActivityOverdueQueueService } from './activity-overdue-queue.service';

@Injectable()
export class ActivityOverdueProcessor {
  private readonly logger = new Logger(ActivityOverdueProcessor.name);

  constructor(
    private readonly activityOverdueService: ActivityOverdueQueueService,
  ) {}

  // Chạy mỗi 5 giây để check activities overdue
  @Cron(CronExpression.EVERY_5_SECONDS, {
    name: 'check-overdue-activities',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async handleOverdueCheck(): Promise<void> {
    this.logger.log('Starting scheduled overdue activities check...');

    try {
      const result =
        await this.activityOverdueService.processOverdueActivities();

      if (result.success) {
        if (result.processedCount > 0) {
          this.logger.log(`Cron job completed: ${result.message}`);
          this.logger.log(`Processed activities: ${result.details.length}`);

          // Log chi tiết các activities đã xử lý (không dùng icon)
          result.details.forEach((detail, index) => {
            this.logger.log(
              `  ${index + 1}. "${detail.activityName}" (${detail.oldStage} -> ${detail.newStage})`,
            );
          });
        } else {
          // Chỉ log khi không có overdue (mỗi 30 phút)
          const now = new Date();
          if (now.getMinutes() % 30 === 0) {
            this.logger.log('No overdue activities found');
          }
        }
      } else {
        this.logger.error(`Cron job failed: ${result.message}`);
      }
    } catch (error) {
      this.logger.error('Unexpected error in cron job:', error);
    }
  }

  // Cron job chạy lúc 0h sáng mỗi ngày để tạo báo cáo tổng kết
  @Cron('0 0 0 * * *', {
    name: 'daily-overdue-summary',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async handleDailySummary(): Promise<void> {
    this.logger.log('Generating daily overdue summary...');

    try {
      const stats = await this.activityOverdueService.getOverdueStats();

      this.logger.log('========== DAILY OVERDUE SUMMARY ==========');
      this.logger.log(`Date: ${new Date().toLocaleDateString('vi-VN')}`);
      this.logger.log(`Total overdue activities: ${stats.totalOverdue}`);

      if (stats.totalOverdue > 0) {
        this.logger.log(
          `Workspaces affected: ${stats.overdueByWorkspace.length}`,
        );
        this.logger.log(`Recently moved (24h): ${stats.recentlyMoved.length}`);

        if (stats.overdueByWorkspace.length > 0) {
          this.logger.log('Overdue by workspace:');
          stats.overdueByWorkspace.forEach((workspace, index) => {
            this.logger.log(
              `   ${index + 1}. ${workspace.workspaceName}: ${workspace.count} activities`,
            );
          });
        }

        if (stats.recentlyMoved.length > 0) {
          this.logger.log('Recently moved to overdue:');
          stats.recentlyMoved.slice(0, 5).forEach((activity, index) => {
            this.logger.log(
              `   ${index + 1}. "${activity.activityName}" - ${new Date(activity.movedAt).toLocaleString('vi-VN')}`,
            );
          });
        }
      } else {
        this.logger.log('Great! No overdue activities found.');
      }

      this.logger.log('============================================');
    } catch (error) {
      this.logger.error('Error generating daily summary:', error);
    }
  }

  // Chạy ngay khi khởi động ứng dụng (delay 30 giây)
  async onModuleInit(): Promise<void> {
    this.logger.log('ActivityOverdueProcessor initialized');

    // Delay 30 giây để đảm bảo database connections sẵn sàng
    setTimeout(async () => {
      this.logger.log('Running initial overdue check on startup...');

      // Test trước để debug
      await this.activityOverdueService.testOverdueProcess();

      // Sau đó chạy thực tế
      await this.handleOverdueCheck();
    }, 30000);
  }
}
