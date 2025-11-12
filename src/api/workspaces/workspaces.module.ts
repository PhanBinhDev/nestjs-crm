import { FileEntity } from '@/api/files/entities/files.entity';
import { StagesModule } from '@/api/stages/stages.module';
import { UploadModule } from '@/api/upload/upload.module';
import { UserEntity } from '@/api/users/entities/user.entity';
import { EmailQueueModule } from '@/background/queues/email-queue/email-queue.module';
import { NotificationQueueModule } from '@/background/queues/notification-queue/notification-queue.module';
import { CloudinaryModule } from '@/cloudinary/cloudinary.module';
import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { NotificationEntity } from '../notification/entities/notification.entity';
import { WorkspaceMembers } from './entities/workspace-members.entity';
import { WorkspaceViewSettings } from './entities/workspace-view-settings.entity';
import { Workspaces } from './entities/workspace.entity';
import { WorkspaceMemberMiddleware } from './middleware/workspace-member.middleware';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Workspaces,
      WorkspaceMembers,
      WorkspaceViewSettings,
      UserEntity,
      DataSource,
      FileEntity,
      NotificationEntity,
    ]),
    CloudinaryModule,
    EmailQueueModule,
    StagesModule,
    UploadModule,
    NotificationQueueModule,
  ],
  controllers: [WorkspacesController],
  providers: [WorkspacesService],
})
export class WorkspacesModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(WorkspaceMemberMiddleware)
      .exclude(
        { path: 'workspaces', method: RequestMethod.GET },
        { path: 'workspaces', method: RequestMethod.POST },
      )
      .forRoutes({
        path: 'workspaces/:workspaceId/*',
        method: RequestMethod.ALL,
      });
  }
}
