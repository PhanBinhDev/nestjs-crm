import { FileEntity } from '@/api/files/entities/files.entity';
import { FilesModule } from '@/api/files/files.module';
import { LinkPreviewService } from '@/services/link-preview.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { Document } from './entities/document.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Document, FileEntity]), FilesModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, LinkPreviewService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
