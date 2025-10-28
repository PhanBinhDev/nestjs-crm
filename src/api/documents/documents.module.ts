import { WorkspaceMembers } from '@/api/workspaces/entities/workspace-members.entity';
import { Workspaces } from '@/api/workspaces/entities/workspace.entity';
import { CloudinaryModule } from '@/cloudinary/cloudinary.module';
import { LinkPreviewService } from '@/services/link-preview.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { Document } from './entities/document.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Document, Workspaces, WorkspaceMembers]),
    CloudinaryModule,
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService, LinkPreviewService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
