import { Module } from '@nestjs/common';

import { ActivitiesModule } from './activities/activities.module';
import { AuthModule } from './auth/auth.module';
import { DeviceTokensModule } from './device-token/device-tokens.module';
import { ExamSchedulesModule } from './exam-schedules/exam-schedules.module';
import { FilesModule } from './files/files.module';
import { HealthModule } from './health/health.module';
import { HomeModule } from './home/home.module';
import { NotificationsModule } from './notification/notifications.module';
import { SemesterModule } from './semester/semester.module';
import { StagesModule } from './stages/stages.module';
import { UploadModule } from './upload/upload.module';
import { UserModule } from './users/user.module';
import { WorkspacesModule } from './workspaces/workspaces.module';

@Module({
  imports: [
    HomeModule,
    HealthModule,
    AuthModule,
    UserModule,
    DeviceTokensModule,
    StagesModule,
    ActivitiesModule,
    UploadModule,
    SemesterModule,
    NotificationsModule,
    FilesModule,
    WorkspacesModule,
    ExamSchedulesModule,
  ],
})
export class ApiModule {}
