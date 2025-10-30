import { CloudinaryService } from '@/cloudinary/cloudinary.service';
import { ResponseNoDataDto } from '@/common/dto/response/response-no-data.dto';
import { ResponseDto } from '@/common/dto/response/response.dto';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { IsNull, Repository } from 'typeorm';
import { FilesResponseDto } from './dto/files.res.dto';
import { FileEntity } from './entities/files.entity';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepo: Repository<FileEntity>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async saveFile(
    data: Partial<FileEntity>,
  ): Promise<ResponseDto<FilesResponseDto>> {
    const file = this.fileRepo.create(data);
    const res = await this.fileRepo.save(file);
    return new ResponseDto<FilesResponseDto>({
      data: plainToInstance(FilesResponseDto, res, {
        excludeExtraneousValues: true,
      }),
      message: 'Tạo file thành công',
    });
  }

  async findAll(): Promise<ResponseDto<FilesResponseDto[]>> {
    const files = await this.fileRepo.find({
      where: { deletedAt: IsNull() },
    });
    return new ResponseDto<FilesResponseDto[]>({
      data: plainToInstance(FilesResponseDto, files, {
        excludeExtraneousValues: true,
      }),
      message: 'Lấy danh sách file thành công',
    });
  }

  async remove(id: string): Promise<ResponseNoDataDto> {
    await this.fileRepo.update(id, { deletedAt: new Date() });
    return new ResponseNoDataDto({
      message: 'Xóa file thành công',
    });
  }

  async findByUser(userId: string): Promise<ResponseDto<FilesResponseDto[]>> {
    const files = await this.fileRepo.find({
      where: {
        deletedAt: IsNull(),
        uploadedBy: userId,
      },
    });
    return new ResponseDto<FilesResponseDto[]>({
      data: plainToInstance(FilesResponseDto, files, {
        excludeExtraneousValues: true,
      }),
      message: 'Lấy danh sách file theo người dùng thành công',
    });
  }

  /**
   * Upload file lên cloud và lưu vào database
   * @param file - File từ multer
   * @param userId - ID người upload
   * @param workspaceId - ID workspace (nullable)
   * @returns FileEntity đã lưu
   */
  async uploadFile(
    file: Express.Multer.File,
    userId: string,
    workspaceId?: string | null,
  ): Promise<FileEntity> {
    try {
      const uploadResult = await this.cloudinaryService.uploadFile(file, {
        folder: 'documents',
        resource_type: 'auto',
      });

      const fileEntity = this.fileRepo.create({
        url: uploadResult.url,
        originalName: file.originalname,
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        uploadedBy: userId,
        workspaceId: workspaceId || null,
        metadata: {
          publicId: uploadResult.publicId,
        },
      });

      const savedFile = await this.fileRepo.save(fileEntity);

      this.logger.log(`File uploaded successfully: ${savedFile.id}`);

      return savedFile;
    } catch (error) {
      this.logger.error('Failed to upload file:', error);
      throw error;
    }
  }

  /**
   * Xóa file (soft delete)
   * @param fileId - ID của file
   * @param userId - ID người xóa
   */
  async deleteFile(fileId: string, userId: string): Promise<void> {
    const file = await this.fileRepo.findOne({
      where: {
        id: fileId as any,
        deletedAt: IsNull(),
      },
    });

    if (!file) {
      throw new NotFoundException('File không tồn tại');
    }

    file.deletedAt = new Date();
    await this.fileRepo.save(file);

    this.logger.log(`File soft deleted: ${fileId} by user ${userId}`);

    try {
      const publicId = file.metadata?.publicId;
      if (publicId) {
        await this.cloudinaryService.deleteFile(publicId);
        this.logger.log(`Deleted file from Cloudinary: ${publicId}`);
      }
    } catch (error) {
      this.logger.warn('Failed to delete file from Cloudinary:', error);
    }
  }

  /**
   * Lấy thông tin file theo ID
   * @param fileId - ID của file
   * @returns FileEntity
   */
  async findOne(fileId: string): Promise<FileEntity> {
    const file = await this.fileRepo.findOne({
      where: {
        id: fileId as any,
        deletedAt: IsNull(),
      },
    });

    if (!file) {
      throw new NotFoundException('File không tồn tại');
    }

    return file;
  }
}
