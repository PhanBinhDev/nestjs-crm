import { FileEntity } from '@/api/files/entities/files.entity';
import { FilesModule } from '@/api/files/files.module';
import { UserEntity } from '@/api/users/entities/user.entity';
import { LinkPreviewService } from '@/services/link-preview.service';
import { CacheModule } from '@nestjs/cache-manager'; // <-- ĐÃ CÓ: Import và đăng ký CacheModule
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
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
    CacheModule.register(),
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService, LinkPreviewService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
