import { SemesterEntity } from '@/api/semester/entities/semester.entity';
import { UserEntity } from '@/api/users/entities/user.entity';
import { ActivityOverdueQueueModule } from '@/background/queues/activity-overdue-queue/activity-overdue-queue.module';
import { EmailQueueModule } from '@/background/queues/email-queue/email-queue.module';
import { NotificationQueueModule } from '@/background/queues/notification-queue/notification-queue.module';
import { LinkPreviewService } from '@/services/link-preview.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationPreference } from '../notification/entities/notification-preference.entity';
import { StagesEntity } from '../stages/entities/stage.entity';
import { WorkspaceMembers } from '../workspaces/entities/workspace-members.entity';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { ActivityAssigneeEntity } from './entities/activity-assignee.entity';
import { ActivityCategoryEntity } from './entities/activity-category.entity';
import {
  ActivityChecklistEntity,
  ActivityChecklistItemEntity,
} from './entities/activity-checklist.entity';
import { ActivityCommentReactionEntity } from './entities/activity-comments-reaction.entity';
import { ActivityCommentEntity } from './entities/activity-comments.entity';
import { ActivityFeedbackEntity } from './entities/activity-feedback.entity';
import { ActivityFileEntity } from './entities/activity-file.entity';
import { ActivityFollowEntity } from './entities/activity-follow.entity';
import { ActivityLinkEntity } from './entities/activity-link.entity';
import { ActivityLogEntity } from './entities/activity-log.entity';
import { ActivityParticipantEntity } from './entities/activity-participant.entity';
import { ActivityEntity } from './entities/activity.entity';
import { EventFeedbackEntity } from './entities/event-feedback.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ActivityEntity,
      ActivityParticipantEntity,
      ActivityFeedbackEntity,
      ActivityAssigneeEntity,
      ActivityChecklistEntity,
      ActivityChecklistItemEntity,
      ActivityLogEntity,
      EventFeedbackEntity,
      SemesterEntity,
      UserEntity,
      ActivityCategoryEntity,
      StagesEntity,
      ActivityCommentEntity,
      ActivityFileEntity,
      ActivityLinkEntity,
      ActivityFollowEntity,
      ActivityCommentReactionEntity,
      WorkspaceMembers,
      NotificationPreference,
    ]),
    NotificationQueueModule,
    EmailQueueModule,
    ActivityOverdueQueueModule,
  ],
  controllers: [ActivitiesController],
  providers: [ActivitiesService, LinkPreviewService],
})
export class ActivitiesModule {}
