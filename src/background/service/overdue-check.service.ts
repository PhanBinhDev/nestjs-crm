import { ActivityLogEntity } from '@/api/activities/entities/activity-log.entity';
import { ActivityEntity } from '@/api/activities/entities/activity.entity';
import { UserEntity } from '@/api/users/entities/user.entity';
import {
  ActivityLogActionEnum,
  ActivityStatus,
} from '@/database/enum/activity.enum';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Not, Repository } from 'typeorm';

@Injectable()
export class OverdueCheckService {
  private readonly logger = new Logger(OverdueCheckService.name);

  constructor(
    @InjectRepository(ActivityEntity)
    private readonly activityRepo: Repository<ActivityEntity>,
    @InjectRepository(ActivityLogEntity)
    private readonly activityLogRepo: Repository<ActivityLogEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  // Chạy mỗi 30 phút
  @Cron('*/30 * * * *')
  async checkOverdueActivities(): Promise<void> {
    this.logger.log('Starting overdue activities check...');

    try {
      const now = new Date();

      // Kiểm tra kết nối database trước
      await this.activityRepo.query('SELECT 1');
      this.logger.log('Database connection verified');

      // Tìm các hoạt động quá hạn (endTime < now) và chưa hoàn thành
      const overdueActivities = await this.activityRepo.find({
        where: {
          endTime: LessThan(now),
          status: Not(
            In([
              ActivityStatus.COMPLETED,
              ActivityStatus.CANCELLED,
              ActivityStatus.OVERDUE,
            ]),
          ),
        },
        relations: ['assignees', 'assignees.user', 'stage'],
      });

      this.logger.log(`Found ${overdueActivities.length} overdue activities`);

      if (overdueActivities.length === 0) {
        this.logger.log('No overdue activities found');
        return;
      }

      // Tạo system user cho log (nếu chưa có)
      const systemUser = await this.getOrCreateSystemUser();

      // Cập nhật từng hoạt động
      const updatedActivities: string[] = [];
      const logs: ActivityLogEntity[] = [];

      for (const activity of overdueActivities) {
        try {
          const oldStatus = activity.status;

          // Cập nhật status thành OVERDUE
          activity.status = ActivityStatus.OVERDUE;
          await this.activityRepo.save(activity);

          updatedActivities.push(`${activity.name} (ID: ${activity.id})`);

          // Tạo log
          const log = this.activityLogRepo.create({
            activity,
            user: systemUser,
            action: ActivityLogActionEnum.UPDATED,
            message: `System auto-changed status from ${oldStatus} to ${ActivityStatus.OVERDUE} due to overdue`,
            oldValue: oldStatus,
            newValue: ActivityStatus.OVERDUE,
            metadata: {
              type: 'AUTO_STATUS_CHANGE',
              reason: 'OVERDUE',
              checkedAt: now.toISOString(),
              daysOverdue: this.calculateDaysOverdue(activity.endTime, now),
            },
          });
          logs.push(log);

          this.logger.log(
            `Updated activity: ${activity.name} (${activity.id})`,
          );
        } catch (activityError) {
          this.logger.error(
            `Error updating activity ${activity.id}:`,
            activityError.message,
          );
        }
      }

      // Lưu tất cả logs
      if (logs.length > 0) {
        try {
          await this.activityLogRepo.save(logs);
          this.logger.log(`Saved ${logs.length} activity logs`);
        } catch (logError) {
          this.logger.error('Error saving activity logs:', logError.message);
        }
      }

      this.logger.log(
        `Successfully updated ${updatedActivities.length} overdue activities`,
      );

      // Gửi thông báo cho assignees (optional)
      await this.notifyOverdueActivities(overdueActivities);
    } catch (error) {
      this.logger.error('Error in checkOverdueActivities:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
    }
  }

  // Chạy hàng ngày lúc 9:00 AM để check các hoạt động sắp quá hạn (warning)
  @Cron('0 9 * * *')
  async checkUpcomingDeadlines(): Promise<void> {
    this.logger.log('Checking upcoming deadlines...');

    try {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Tìm hoạt động sắp quá hạn trong 24h
      const upcomingDeadlines = await this.activityRepo.find({
        where: {
          endTime: LessThan(tomorrow),
          status: Not(
            In([
              ActivityStatus.COMPLETED,
              ActivityStatus.CANCELLED,
              ActivityStatus.OVERDUE,
            ]),
          ),
        },
        relations: ['assignees', 'assignees.user'],
      });

      this.logger.log(`Found ${upcomingDeadlines.length} upcoming deadlines`);

      if (upcomingDeadlines.length > 0) {
        this.logger.warn(
          `${upcomingDeadlines.length} activities will be overdue in next 24h`,
        );

        // Gửi email warning hoặc push notification
        await this.notifyUpcomingDeadlines(upcomingDeadlines);
      }
    } catch (error) {
      this.logger.error('Error in checkUpcomingDeadlines:', {
        message: error.message,
        stack: error.stack,
      });
    }
  }

  private async getOrCreateSystemUser(): Promise<UserEntity> {
    try {
      let systemUser = await this.userRepo.findOne({
        where: { email: 'system@crm.com' },
      });

      if (!systemUser) {
        this.logger.log('Creating system user...');
        systemUser = this.userRepo.create({
          email: 'system@crm.com',
          name: 'System',
          username: 'system',
          isActive: true,
        });
        await this.userRepo.save(systemUser);
        this.logger.log('System user created successfully');
      }

      return systemUser;
    } catch (error) {
      this.logger.error('Error getting/creating system user:', error.message);
      throw error;
    }
  }

  private calculateDaysOverdue(endTime: Date, currentTime: Date): number {
    const diffTime = currentTime.getTime() - endTime.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private async notifyOverdueActivities(
    activities: ActivityEntity[],
  ): Promise<void> {
    try {
      this.logger.log(
        `Sending notifications for ${activities.length} overdue activities`,
      );
      // TODO: Implement notification logic
    } catch (error) {
      this.logger.error('Error sending overdue notifications:', error.message);
    }
  }

  private async notifyUpcomingDeadlines(
    activities: ActivityEntity[],
  ): Promise<void> {
    try {
      this.logger.log(
        `Sending deadline warnings for ${activities.length} activities`,
      );
      // TODO: Implement warning notification logic
    } catch (error) {
      this.logger.error('Error sending deadline warnings:', error.message);
    }
  }

  // Manual trigger để test
  async manualOverdueCheck(): Promise<{
    updatedCount: number;
    activities: string[];
    error?: string;
  }> {
    this.logger.log('Manual overdue check triggered...');

    try {
      const now = new Date();
      const overdueActivities = await this.activityRepo.find({
        where: {
          endTime: LessThan(now),
          status: Not(
            In([
              ActivityStatus.COMPLETED,
              ActivityStatus.CANCELLED,
              ActivityStatus.OVERDUE,
            ]),
          ),
        },
      });

      const activityNames = overdueActivities.map((a) => `${a.name} (${a.id})`);

      // Trigger the main check method
      await this.checkOverdueActivities();

      return {
        updatedCount: overdueActivities.length,
        activities: activityNames,
      };
    } catch (error) {
      this.logger.error('Error in manual overdue check:', error.message);
      return {
        updatedCount: 0,
        activities: [],
        error: error.message,
      };
    }
  }

  // Health check method
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    lastCheck?: Date;
    error?: string;
  }> {
    try {
      await this.activityRepo.query('SELECT 1');
      await this.userRepo.query('SELECT 1');
      await this.activityLogRepo.query('SELECT 1');

      return {
        status: 'healthy',
        lastCheck: new Date(),
      };
    } catch (error) {
      this.logger.error('Health check failed:', error.message);
      return {
        status: 'unhealthy',
        error: error.message,
      };
    }
  }
}
