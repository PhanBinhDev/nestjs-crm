import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { StagesModule } from '../stages/stages.module';
import { UserEntity } from '../users/entities/user.entity';
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
    ]),
    StagesModule,
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
