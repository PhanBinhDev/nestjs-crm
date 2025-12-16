import { CloudinaryService } from '@/cloudinary/cloudinary.service';
import { Uuid } from '@/common/types/common.type';
import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { FileEntity } from '../files/entities/files.entity';
import { FilesService } from '../files/files.service';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(
    private readonly filesService: FilesService,
    private readonly cloudinaryService: CloudinaryService,
    @InjectRepository(FileEntity)
    private readonly fileRepo: Repository<FileEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async saveFile(
    file: Express.Multer.File,
    uploadedBy?: Uuid,
  ): Promise<string> {
    const uploadDir = join(process.cwd(), 'uploads');
    if (!existsSync(uploadDir)) mkdirSync(uploadDir);

    let fileName = file.originalname;
    if (!fileName || fileName.trim() === '') {
      const ext = file.mimetype?.split('/')[1] || 'bin';
      fileName = `${uuidv4()}.${ext}`;
    }

    const filePath = join(uploadDir, fileName);
    writeFileSync(filePath, file.buffer);

    const url = `/uploads/${fileName}`;

    await this.filesService.saveFile({
      url,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      fileName,
      destination: uploadDir,
      uploadedBy,
      isDeleted: false,
    });

    return url;
  }

  async saveFiles(
    files: Express.Multer.File[],
    uploadedBy?: Uuid,
    workspaceId?: Uuid | null,
  ): Promise<string[]> {
    const uploadedPublicIds: string[] = [];
    const urls: string[] = [];

    return await this.dataSource
      .transaction(async (manager) => {
        const fileRepo = manager.getRepository(FileEntity);
        const folder = 'uploads';

        for (const file of files) {
          try {
            const fileName = file.originalname;

            // Upload file lên Cloudinary
            const uploadResult = await this.cloudinaryService.uploadToFolder(
              file,
              folder,
              fileName,
            );

            if (!('url' in uploadResult)) {
              this.logger.warn(`Upload file thất bại: ${file.originalname}`);
              continue;
            }

            uploadedPublicIds.push(uploadResult.public_id);

            // Tạo FileEntity với metadata đầy đủ
            const fileEntity = fileRepo.create({
              url: uploadResult.url,
              originalName: file.originalname,
              mimeType: file.mimetype,
              size: uploadResult.bytes,
              fileName: fileName,
              uploadedBy: uploadedBy,
              workspaceId: workspaceId || null,
              metadata: {
                public_id: uploadResult.public_id,
                format: uploadResult.format,
                resource_type: uploadResult.resource_type,
                width: uploadResult.width,
                height: uploadResult.height,
                bytes: uploadResult.bytes,
                folder: folder,
                secure_url: uploadResult.secure_url || uploadResult.url,
                created_at: uploadResult.created_at,
                version: uploadResult.version,
                signature: uploadResult.signature,
                etag: uploadResult.etag,
                ...(uploadResult.asset_id && { asset_id: uploadResult.asset_id }),
                ...(uploadResult.pages && { pages: uploadResult.pages }),
                ...(uploadResult.duration && { duration: uploadResult.duration }),
              },
            });

            const savedFile = await fileRepo.save(fileEntity);
            urls.push(savedFile.url);
          } catch (error) {
            this.logger.error(
              `Error uploading file ${file.originalname}:`,
              error,
            );
            // Rollback uploaded files on error
            for (const publicId of uploadedPublicIds) {
              try {
                await this.cloudinaryService.deleteFile(publicId);
              } catch (deleteError) {
                this.logger.warn(
                  `Cannot rollback file on Cloudinary: ${publicId}`,
                );
              }
            }
            throw error;
          }
        }

        return urls;
      })
      .catch((error) => {
        // Rollback: Xóa files trên Cloudinary nếu có lỗi
        for (const publicId of uploadedPublicIds) {
          try {
            this.cloudinaryService.deleteFile(publicId);
          } catch (deleteError) {
            this.logger.warn(
              `Cannot rollback file on Cloudinary: ${publicId}`,
            );
          }
        }
        throw error;
      });
  }
}
