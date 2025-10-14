import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLogEntity } from '../../../api/activities/entities/activity-log.entity';
import { ActivityEntity } from '../../../api/activities/entities/activity.entity';
import { StagesEntity } from '../../../api/stages/entities/stage.entity';
import { UserEntity } from '../../../api/users/entities/user.entity';
import { ActivityOverdueQueueService } from './activity-overdue-queue.service';
import { ActivityOverdueProcessor } from './activity-overdue.processor';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([
      ActivityEntity,
      StagesEntity,
      ActivityLogEntity,
      UserEntity,
    ]),
  ],
  providers: [ActivityOverdueQueueService, ActivityOverdueProcessor],
  exports: [ActivityOverdueQueueService],
})
export class ActivityOverdueQueueModule {}
