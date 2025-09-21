import { SemesterEntity } from '@/api/semester/entities/semester.entity';
import { UserEntity } from '@/api/users/entities/user.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { ActivityAssigneeEntity } from './entities/activity-assignee.entity';
import {
  ActivityChecklistEntity,
  ActivityChecklistItemEntity,
} from './entities/activity-checklist.entity';
import { ActivityFeedbackEntity } from './entities/activity-feedback.entity';
import { ActivityFileEntity } from './entities/activity-file.entity';
import { ActivityLogEntity } from './entities/activity-log.entity';
import { ActivityParticipantEntity } from './entities/activity-participant.entity';
import { ActivityEntity } from './entities/activity.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ActivityEntity,
      ActivityFileEntity,
      ActivityParticipantEntity,
      ActivityFeedbackEntity,
      ActivityAssigneeEntity,
      ActivityChecklistEntity,
      ActivityChecklistItemEntity,
      ActivityLogEntity,
      SemesterEntity,
      UserEntity,
    ]),
  ],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
})
export class ActivitiesModule {}
