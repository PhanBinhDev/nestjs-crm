import { FileEntity } from '@/api/files/entities/files.entity';
import { FilesService } from '@/api/files/files.service';
import { ResponseDto } from '@/common/dto/response/response.dto';
import { LinkPreviewService } from '@/services/link-preview.service';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { plainToInstance } from 'class-transformer';
import { Response } from 'express';
import { Repository } from 'typeorm';
import { CreateDocumentDto } from './dto/create-document.dto';
import { DocumentResDto } from './dto/document-res.dto';
import { GetDocumentsQueryDto } from './dto/get-documents-query.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import {
  Document,
  DocumentStatus,
  DocumentType,
} from './entities/document.entity';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
    private readonly filesService: FilesService,
    private readonly linkPreviewService: LinkPreviewService,
  ) {}

  async create(
    dto: CreateDocumentDto,
    userId: string,
    file?: Express.Multer.File,
  ): Promise<ResponseDto<DocumentResDto>> {
    if (dto.type === DocumentType.FILE && !file) {
      throw new BadRequestException(
        'File tài liệu là bắt buộc khi type = FILE',
      );
    }

    if (dto.type === DocumentType.LINK && !dto.linkUrl) {
      throw new BadRequestException('Link URL là bắt buộc khi type = LINK');
    }

    const document = this.documentRepository.create({
      title: dto.title,
      description: dto.description,
      type: dto.type,
      status: dto.status ?? DocumentStatus.DRAFT,
      createdById: userId,
      metadata: dto.metadata,
    });

    if (dto.type === DocumentType.FILE && file) {
      try {
        const uploadedFile = await this.filesService.uploadFile(
          file,
          userId,
          null,
        );
        document.fileId = uploadedFile.id;

        this.logger.log(`Uploaded document file: ${uploadedFile.id}`);
      } catch (error) {
        this.logger.error('Failed to upload document file:', error);
        throw new BadRequestException('Không thể upload file tài liệu');
      }
    }

    if (dto.type === DocumentType.LINK && dto.linkUrl) {
      try {
        const preview = await this.linkPreviewService.getPreview(dto.linkUrl);
        document.linkUrl = dto.linkUrl;
        document.linkPreview = preview;

        this.logger.log(`Fetched link preview for: ${dto.linkUrl}`);
      } catch (error) {
        this.logger.warn('Failed to fetch link preview:', error);
        document.linkUrl = dto.linkUrl;
      }
    }

    const savedDocument = await this.documentRepository.save(document);

    const documentWithRelations = await this.documentRepository.findOne({
      where: { id: savedDocument.id },
      relations: ['createdByUser', 'updatedByUser', 'file'],
    });

    const responseData = {
      ...documentWithRelations,
      createdBy: documentWithRelations.createdByUser,
      updatedBy: documentWithRelations.updatedByUser,
    };

    return new ResponseDto({
      data: plainToInstance(DocumentResDto, responseData, {
        excludeExtraneousValues: true,
      }),
      message: 'Tạo tài liệu thành công',
    });
  }

  async findAll(
    query: GetDocumentsQueryDto,
    _userId: string,
  ): Promise<
    ResponseDto<{
      documents: DocumentResDto[];
      total: number;
      page: number;
      limit: number;
    }>
  > {
    const { status, type, search, page = 1, limit = 10 } = query;

    const queryBuilder = this.documentRepository
      .createQueryBuilder('doc')
      .leftJoinAndSelect('doc.file', 'file')
      .leftJoinAndSelect('doc.createdByUser', 'createdByUser')
      .leftJoinAndSelect('doc.updatedByUser', 'updatedByUser');

    if (status) {
      queryBuilder.andWhere('doc.status = :status', { status });
    }

    if (type) {
      queryBuilder.andWhere('doc.type = :type', { type });
    }

    if (search) {
      queryBuilder.andWhere(
        '(doc.title ILIKE :search OR doc.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    queryBuilder.orderBy('doc.createdAt', 'DESC');

    const [documents, total] = await queryBuilder.getManyAndCount();

    const responseData = documents.map((doc) => ({
      ...doc,
      createdBy: doc.createdByUser,
      updatedBy: doc.updatedByUser,
    }));

    return new ResponseDto({
      data: {
        documents: plainToInstance(DocumentResDto, responseData, {
          excludeExtraneousValues: true,
        }),
        total,
        page,
        limit,
      },
      message: 'Lấy danh sách tài liệu thành công',
    });
  }

  async findOne(
    id: string,
    _userId: string,
  ): Promise<ResponseDto<DocumentResDto>> {
    const document = await this.documentRepository
      .createQueryBuilder('doc')
      .leftJoinAndSelect('doc.file', 'file')
      .leftJoinAndSelect('doc.createdByUser', 'createdByUser')
      .leftJoinAndSelect('doc.updatedByUser', 'updatedByUser')
      .where('doc.id = :id', { id })
      .getOne();

    if (!document) {
      throw new NotFoundException('Tài liệu không tồn tại');
    }

    await this.documentRepository.increment({ id: id as any }, 'viewCount', 1);
    document.viewCount += 1;

    const responseData = {
      ...document,
      createdBy: document.createdByUser,
      updatedBy: document.updatedByUser,
    };

    return new ResponseDto({
      data: plainToInstance(DocumentResDto, responseData, {
        excludeExtraneousValues: true,
      }),
      message: 'Lấy chi tiết tài liệu thành công',
    });
  }

  async update(
    id: string,
    dto: UpdateDocumentDto,
    userId: string,
    file?: Express.Multer.File,
  ): Promise<ResponseDto<DocumentResDto>> {
    const document = await this.documentRepository.findOne({
      where: { id: id as any },
      relations: ['file', 'createdByUser'],
    });

    if (!document) {
      throw new NotFoundException('Tài liệu không tồn tại');
    }

    if (document.createdById !== userId) {
      throw new ForbiddenException(
        'Bạn không có quyền cập nhật tài liệu này. Chỉ người tạo mới có quyền cập nhật',
      );
    }

    if (dto.type && dto.type !== document.type) {
      if (dto.type === DocumentType.FILE && !file && !document.fileId) {
        throw new BadRequestException(
          'Cần upload file khi chuyển sang loại FILE',
        );
      }

      if (dto.type === DocumentType.LINK && !dto.linkUrl) {
        throw new BadRequestException(
          'Cần cung cấp linkUrl khi chuyển sang loại LINK',
        );
      }
    }

    if (dto.title !== undefined) document.title = dto.title;
    if (dto.description !== undefined) document.description = dto.description;
    if (dto.status !== undefined) document.status = dto.status;
    if (dto.metadata !== undefined) document.metadata = dto.metadata;
    if (dto.type !== undefined) document.type = dto.type;

    if (file) {
      try {
        if (document.fileId) {
          await this.filesService.deleteFile(document.fileId, userId);
          this.logger.log(`Deleted old file: ${document.fileId}`);
        }

        const uploadedFile = await this.filesService.uploadFile(
          file,
          userId,
          null,
        );
        document.fileId = uploadedFile.id;
        document.type = DocumentType.FILE;

        document.linkUrl = null;
        document.linkPreview = null;

        this.logger.log(`Uploaded new document file: ${uploadedFile.id}`);
      } catch (error) {
        this.logger.error('Failed to upload new document file:', error);
        throw new BadRequestException('Không thể upload file tài liệu mới');
      }
    }

    if (dto.type === DocumentType.LINK || document.type === DocumentType.LINK) {
      if (dto.linkUrl && dto.linkUrl !== document.linkUrl) {
        try {
          const preview = await this.linkPreviewService.getPreview(dto.linkUrl);
          document.linkUrl = dto.linkUrl;
          document.linkPreview = preview;

          if (document.fileId) {
            await this.filesService.deleteFile(document.fileId, userId);
            document.fileId = null;
          }

          this.logger.log(`Updated link preview for: ${dto.linkUrl}`);
        } catch (error) {
          this.logger.warn('Failed to fetch link preview:', error);
          document.linkUrl = dto.linkUrl;
        }
      }
    }

    document.updatedById = userId;
    const savedDocument = await this.documentRepository.save(document);

    const documentWithRelations = await this.documentRepository
      .createQueryBuilder('doc')
      .leftJoinAndSelect('doc.file', 'file')
      .leftJoinAndSelect('doc.createdByUser', 'createdByUser')
      .leftJoinAndSelect('doc.updatedByUser', 'updatedByUser')
      .where('doc.id = :id', { id: savedDocument.id })
      .getOne();

    const responseData = {
      ...documentWithRelations,
      createdBy: documentWithRelations.createdByUser,
      updatedBy: documentWithRelations.updatedByUser,
    };

    return new ResponseDto({
      data: plainToInstance(DocumentResDto, responseData, {
        excludeExtraneousValues: true,
      }),
      message: 'Cập nhật tài liệu thành công',
    });
  }

  async delete(id: string, userId: string): Promise<ResponseDto<null>> {
    const document = await this.documentRepository.findOne({
      where: { id: id as any },
      relations: ['file'],
    });

    if (!document) {
      throw new NotFoundException('Tài liệu không tồn tại');
    }

    if (document.createdById !== userId) {
      throw new ForbiddenException(
        'Bạn không có quyền xóa tài liệu này. Chỉ người tạo mới có quyền xóa',
      );
    }

    if (document.fileId) {
      try {
        await this.filesService.deleteFile(document.fileId, userId);
        this.logger.log(`Deleted file: ${document.fileId}`);
      } catch (error) {
        this.logger.warn('Failed to delete file:', error);
      }
    }

    await this.documentRepository.remove(document);

    return new ResponseDto({
      data: null,
      message: 'Xóa tài liệu thành công',
    });
  }

  async download(id: string, userId: string, res: Response): Promise<void> {
    const document = await this.documentRepository.findOne({
      where: { id: id as any },
      relations: ['file'],
    });

    if (!document) {
      throw new NotFoundException('Tài liệu không tồn tại');
    }

    if (document.type === DocumentType.LINK) {
      throw new BadRequestException(
        'Tài liệu loại LINK không hỗ trợ download. Vui lòng truy cập linkUrl',
      );
    }

    if (
      !document.file ||
      !(
        (document.file as any).url ||
        (document.file as any).fileUrl ||
        (document.file as any).path
      )
    ) {
      throw new BadRequestException('Tài liệu không có file để download');
    }

    await this.documentRepository.increment(
      { id: id as any },
      'downloadCount',
      1,
    );

    try {
      const fileUrl =
        (document.file as any).url ||
        (document.file as any).fileUrl ||
        (document.file as any).path;

      if (!fileUrl) {
        throw new BadRequestException(
          'Không thể tải file. URL file không tồn tại',
        );
      }

      const response = await axios.get(fileUrl, {
        responseType: 'stream',
      });

      const fileMeta = document.file as any;
      const filename =
        fileMeta.originalName ||
        fileMeta.fileName ||
        fileMeta.name ||
        'document';

      res.setHeader(
        'Content-Type',
        (document.file as any).mimeType || 'application/octet-stream',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(filename)}"`,
      );

      response.data.pipe(res);
    } catch (error) {
      this.logger.error('Failed to download file:', error);
      throw new BadRequestException('Không thể tải file. Vui lòng thử lại sau');
    }
  }
}
