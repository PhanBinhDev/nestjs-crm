import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workspaces } from '../workspaces/entities/workspace.entity';
import { StagesEntity } from './entities/stage.entity';
import { StagesController } from './stages.controller';
import { StagesService } from './stages.service';

@Module({
  imports: [TypeOrmModule.forFeature([StagesEntity, Workspaces])],
  controllers: [StagesController],
  providers: [StagesService],
  exports: [StagesService],
})
export class StagesModule {}
