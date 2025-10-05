import { SemesterEntity } from '@/api/semester/entities/semester.entity';
import { UserEntity } from '@/api/users/entities/user.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StagesEntity } from '../stages/entities/stage.entity';
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
      ActivityCommentReactionEntity,
    ]),
  ],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
})
export class ActivitiesModule {}
