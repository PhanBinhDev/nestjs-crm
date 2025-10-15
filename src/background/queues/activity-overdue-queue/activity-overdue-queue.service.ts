import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLogEntity } from '../../../api/activities/entities/activity-log.entity';
import { ActivityEntity } from '../../../api/activities/entities/activity.entity';
import { StagesEntity } from '../../../api/stages/entities/stage.entity';
import { UserEntity } from '../../../api/users/entities/user.entity';
import {
  ActivityLogActionEnum,
  StageGroupStatus,
} from '../../../database/enum/activity.enum';

@Injectable()
export class ActivityOverdueQueueService {
  private readonly logger = new Logger(ActivityOverdueQueueService.name);

  constructor(
    @InjectRepository(ActivityEntity)
    private readonly activityRepo: Repository<ActivityEntity>,
    @InjectRepository(StagesEntity)
    private readonly stageRepo: Repository<StagesEntity>,
    @InjectRepository(ActivityLogEntity)
    private readonly activityLogRepo: Repository<ActivityLogEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async processOverdueActivities(): Promise<{
    success: boolean;
    processedCount: number;
    message: string;
    details: Array<{
      activityId: string;
      activityName: string;
      oldStage: string;
      newStage: string;
      endTime: Date;
      workspaceId: string;
    }>;
  }> {
    try {
      this.logger.log('Starting overdue activities check...');

      const now = new Date();

      const overdueActivities = await this.activityRepo
        .createQueryBuilder('activity')
        .leftJoinAndSelect('activity.stage', 'stage')
        .leftJoinAndSelect('activity.workspace', 'workspace')
        .where('activity.endTime IS NOT NULL')
        .andWhere('activity.endTime < :now', { now })
        .andWhere('stage.title != :overdueTitle', { overdueTitle: 'OVERDUE' })
        .andWhere('stage.stageGroup NOT IN (:...excludedGroups)', {
          excludedGroups: [StageGroupStatus.DONE, StageGroupStatus.CLOSED],
        })
        .getMany();

      if (overdueActivities.length === 0) {
        this.logger.log('No overdue activities found');
        return {
          success: true,
          processedCount: 0,
          message: 'No overdue activities to process',
          details: [],
        };
      }

      this.logger.log(`Found ${overdueActivities.length} overdue activities`);

      // Nhóm activities theo workspace để tìm stage OVERDUE tương ứng
      const activitiesByWorkspace = new Map<string, ActivityEntity[]>();

      overdueActivities.forEach((activity) => {
        const workspaceId = activity.workspace.id;
        if (!activitiesByWorkspace.has(workspaceId)) {
          activitiesByWorkspace.set(workspaceId, []);
        }
        activitiesByWorkspace.get(workspaceId)!.push(activity);
      });

      const processedDetails = [];

      // Tạo hoặc tìm system user
      let systemUser = await this.userRepo.findOne({
        where: { email: 'system@crm.com' },
      });

      if (!systemUser) {
        try {
          systemUser = await this.userRepo.save({
            email: 'system@crm.com',
            name: 'System Auto',
            isActive: true,
          });
          this.logger.log('Created system user for logging');
        } catch (_userError) {
          this.logger.warn(
            'Could not create system user, logs will be skipped',
          );
        }
      }

      // Xử lý từng workspace
      for (const [workspaceId, activities] of activitiesByWorkspace) {
        try {
          // Tìm stage OVERDUE trong workspace này
          const overdueStage = await this.stageRepo.findOne({
            where: {
              title: 'OVERDUE',
              isBuiltIn: true,
              workspaceId: workspaceId as any,
            },
          });

          if (!overdueStage) {
            this.logger.warn(
              `No OVERDUE stage found for workspace ${workspaceId}, skipping...`,
            );
            continue;
          }

          this.logger.log(
            `Using OVERDUE stage: "${overdueStage.title}" (ID: ${overdueStage.id}) for workspace ${workspaceId}`,
          );

          // Xử lý từng activity trong workspace này
          for (const activity of activities) {
            try {
              const oldStage = activity.stage;

              this.logger.log(
                `Processing activity: "${activity.name}" (${oldStage?.title} -> OVERDUE)`,
              );

              // Cập nhật stage cho activity
              const updateResult = await this.activityRepo.update(activity.id, {
                stageId: overdueStage.id,
                updatedAt: now,
              });

              if (updateResult.affected === 0) {
                this.logger.warn(`No rows updated for activity ${activity.id}`);
                continue;
              }

              // Tạo activity log nếu có system user
              if (systemUser) {
                try {
                  const activityLog = this.activityLogRepo.create({
                    activity: { id: activity.id } as ActivityEntity,
                    user: systemUser,
                    action: ActivityLogActionEnum.UPDATED,
                    message: `Tu dong chuyen sang OVERDUE do het han luc ${now.toLocaleString('vi-VN')}`,
                    oldValue: oldStage?.id || null,
                    newValue: overdueStage.id,
                    metadata: {
                      type: 'AUTO_OVERDUE',
                      reason: 'EXPIRED',
                      oldStageTitle: oldStage?.title || 'Unknown',
                      newStageTitle: overdueStage.title,
                      endTime: activity.endTime.toISOString(),
                      processedAt: now.toISOString(),
                      automated: true,
                      workspaceId: String(workspaceId),
                    },
                  });

                  await this.activityLogRepo.save(activityLog);
                } catch (logError) {
                  this.logger.warn(
                    `Could not create log for activity ${activity.id}: ${logError.message}`,
                  );
                }
              }

              processedDetails.push({
                activityId: activity.id,
                activityName: activity.name,
                oldStage: oldStage?.title || 'Unknown',
                newStage: overdueStage.title,
                endTime: activity.endTime,
                workspaceId: String(workspaceId),
              });

              this.logger.log(
                `Successfully moved "${activity.name}" to OVERDUE`,
              );
            } catch (activityError) {
              this.logger.error(
                `Error processing activity ${activity.id}: ${activityError.message}`,
              );
            }
          }
        } catch (workspaceError) {
          this.logger.error(
            `Error processing workspace ${workspaceId}: ${workspaceError.message}`,
          );
        }
      }

      const successMessage = `Successfully processed ${processedDetails.length}/${overdueActivities.length} overdue activities`;
      this.logger.log(successMessage);

      return {
        success: true,
        processedCount: processedDetails.length,
        message: successMessage,
        details: processedDetails,
      };
    } catch (error) {
      this.logger.error('Error in processOverdueActivities:', error);
      return {
        success: false,
        processedCount: 0,
        message: `Error: ${error.message}`,
        details: [],
      };
    }
  }

  async getOverdueStats(): Promise<{
    totalOverdue: number;
    overdueByWorkspace: Array<{
      workspaceId: string;
      workspaceName: string;
      count: number;
    }>;
    recentlyMoved: Array<{
      activityId: string;
      activityName: string;
      movedAt: Date;
    }>;
  }> {
    try {
      // Đếm tổng số overdue theo title OVERDUE
      const totalOverdue = await this.activityRepo
        .createQueryBuilder('activity')
        .leftJoin('activity.stage', 'stage')
        .where('stage.title = :overdueTitle', { overdueTitle: 'OVERDUE' })
        .getCount();

      // Thống kê theo workspace
      const overdueByWorkspace = await this.activityRepo
        .createQueryBuilder('activity')
        .leftJoin('activity.stage', 'stage')
        .leftJoin('activity.workspace', 'workspace')
        .select([
          'workspace.id as "workspaceId"',
          'workspace.name as "workspaceName"',
          'COUNT(activity.id) as count',
        ])
        .where('stage.title = :overdueTitle', { overdueTitle: 'OVERDUE' })
        .groupBy('workspace.id, workspace.name')
        .getRawMany();

      // Activities được chuyển gần đây (24h)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const recentlyMoved = await this.activityLogRepo
        .createQueryBuilder('log')
        .leftJoin('log.activity', 'activity')
        .select([
          'activity.id as "activityId"',
          'activity.name as "activityName"',
          'log.createdAt as "movedAt"',
        ])
        .where('log.action = :action', {
          action: ActivityLogActionEnum.UPDATED,
        })
        .andWhere("log.metadata->>'type' = :type", { type: 'AUTO_OVERDUE' })
        .andWhere('log.createdAt >= :yesterday', { yesterday })
        .orderBy('log.createdAt', 'DESC')
        .limit(10)
        .getRawMany();

      return {
        totalOverdue,
        overdueByWorkspace: overdueByWorkspace.map((item) => ({
          workspaceId: item.workspaceId,
          workspaceName: item.workspaceName,
          count: parseInt(item.count, 10),
        })),
        recentlyMoved: recentlyMoved.map((item) => ({
          activityId: item.activityId,
          activityName: item.activityName,
          movedAt: new Date(item.movedAt),
        })),
      };
    } catch (error) {
      this.logger.error('Error getting overdue stats:', error);
      return {
        totalOverdue: 0,
        overdueByWorkspace: [],
        recentlyMoved: [],
      };
    }
  }

  // Method để test manual - debug
  async testOverdueProcess(): Promise<void> {
    this.logger.log('Testing overdue process...');

    // List tất cả stages để debug
    const allStages = await this.stageRepo
      .createQueryBuilder('stage')
      .select([
        'stage.id',
        'stage.title',
        'stage.stageGroup',
        'stage.workspaceId',
        'stage.isBuiltIn',
      ])
      .getMany();

    this.logger.log('All stages in database:');
    allStages.forEach((stage) => {
      this.logger.log(
        `  - ${stage.title} (${stage.stageGroup}, workspace: ${stage.workspaceId}, builtin: ${stage.isBuiltIn}) - ID: ${stage.id}`,
      );
    });

    // Tìm stages OVERDUE
    const overdueStages = await this.stageRepo.find({
      where: { title: 'OVERDUE', isBuiltIn: true },
    });

    this.logger.log(`Found ${overdueStages.length} OVERDUE stages:`);
    overdueStages.forEach((stage) => {
      this.logger.log(
        `  - OVERDUE stage in workspace ${stage.workspaceId} (ID: ${stage.id})`,
      );
    });

    // List activities hết hạn nhưng chưa ở OVERDUE
    const now = new Date();
    const expiredActivities = await this.activityRepo
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.stage', 'stage')
      .leftJoinAndSelect('activity.workspace', 'workspace')
      .where('activity.endTime IS NOT NULL')
      .andWhere('activity.endTime < :now', { now })
      .andWhere('stage.title != :overdueTitle', { overdueTitle: 'OVERDUE' })
      .andWhere('stage.stageGroup NOT IN (:...excludedGroups)', {
        excludedGroups: [StageGroupStatus.DONE, StageGroupStatus.CLOSED],
      })
      .getMany();

    this.logger.log(
      `Activities that should be moved to OVERDUE: ${expiredActivities.length}`,
    );
    expiredActivities.forEach((activity) => {
      this.logger.log(
        `  - "${activity.name}" ended at ${activity.endTime?.toLocaleString('vi-VN')} (Stage: ${activity.stage?.title}, Workspace: ${activity.workspace?.name})`,
      );
    });

    // List activities hiện tại ở OVERDUE
    const currentOverdueActivities = await this.activityRepo
      .createQueryBuilder('activity')
      .leftJoin('activity.stage', 'stage')
      .where('stage.title = :title', { title: 'OVERDUE' })
      .getCount();

    this.logger.log(
      `Activities currently in OVERDUE stage: ${currentOverdueActivities}`,
    );
  }
}
