import { FileEntity } from '@/api/files/entities/files.entity';
import { FilesModule } from '@/api/files/files.module';
import { LinkPreviewService } from '@/services/link-preview.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DocumentFolder } from './entities/document-folder.entity';
import { Document } from './entities/document.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Document,
      DocumentFolder,
      FileEntity,
      UserEntity,
    ]),
    FilesModule,
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService, LinkPreviewService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
