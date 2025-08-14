import { Module } from '@nestjs/common';

import { ActivitiesModule } from './activities/activities.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { HomeModule } from './home/home.module';
import { SemesterModule } from './semester/semester.module';
import { StagesModule } from './stages/stages.module';
import { UploadModule } from './upload/upload.module';
import { UserModule } from './users/user.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    HomeModule,
    HealthModule,
    StagesModule,
    ActivitiesModule,
    UploadModule,
    SemesterModule,
  ],
})
export class ApiModule {}
