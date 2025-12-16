import { FilesModule } from '@/api/files/files.module';
import { CloudinaryModule } from '@/cloudinary/cloudinary.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileEntity } from '../files/entities/files.entity';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

@Module({
  imports: [
    FilesModule,
    CloudinaryModule,
    TypeOrmModule.forFeature([FileEntity]),
  ],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
