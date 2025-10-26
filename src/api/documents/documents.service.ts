import { WorkspaceMembers } from '@/api/workspaces/entities/workspace-members.entity';
import { Workspaces } from '@/api/workspaces/entities/workspace.entity';
import { CloudinaryService } from '@/cloudinary/cloudinary.service';
import { ResponseDto } from '@/common/dto/response/response.dto';
import { LinkPreviewService } from '@/services/link-preview.service';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { CreateDocumentDto } from './dto/create-document.dto';
import { DocumentResDto } from './dto/document-res.dto';
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
    @InjectRepository(Workspaces)
    private readonly workspaceRepository: Repository<Workspaces>,
    @InjectRepository(WorkspaceMembers)
    private readonly workspaceMemberRepository: Repository<WorkspaceMembers>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly linkPreviewService: LinkPreviewService,
  ) {}

  async create(
    dto: CreateDocumentDto,
    userId: string,
    file?: Express.Multer.File,
  ): Promise<ResponseDto<DocumentResDto>> {
    // 1. Kiểm tra workspace tồn tại
    const workspace = await this.workspaceRepository.findOne({
      where: { id: dto.workspaceId as any },
      relations: ['owner'],
    });

    if (!workspace) {
      throw new NotFoundException('Workspace không tồn tại');
    }
    // 2. Kiểm tra quyền: phải là CNBM hoặc TM
    const member = await this.workspaceMemberRepository.findOne({
      where: {
        workspaceId: dto.workspaceId as any,
        userId: userId as any,
      },
    });

    const isOwner = workspace.owner?.id === userId;
    const allowedRoles = ['CNBM', 'TM'];

    if (!isOwner && (!member || !(allowedRoles as any).includes(member.role))) {
      throw new BadRequestException(
        'Chỉ Chủ nhiệm bộ môn (CNBM) hoặc Trưởng môn (TM) mới có quyền tạo tài liệu',
      );
    }

    // 3. Validate theo type
    if (dto.type === DocumentType.FILE) {
      if (!file) {
        throw new BadRequestException(
          'File tài liệu là bắt buộc khi type = FILE',
        );
      }

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'image/jpeg',
        'image/png',
      ];

      if (!allowedTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          'Định dạng file không được hỗ trợ. Chỉ chấp nhận: PDF, Word, Excel, PowerPoint, Text, Image',
        );
      }

      // Validate file size (max 50MB)
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new BadRequestException(
          'Kích thước file không được vượt quá 50MB',
        );
      }
    }

    if (dto.type === DocumentType.LINK && !dto.linkUrl) {
      throw new BadRequestException('Link URL là bắt buộc khi type = LINK');
    }

    // 4. Tạo document
    const document = this.documentRepository.create({
      title: dto.title,
      description: dto.description,
      type: dto.type,
      status: dto.status ?? DocumentStatus.DRAFT,
      workspaceId: dto.workspaceId as any,
      createdById: userId,
      metadata: dto.metadata,
    });

    // 5. Upload file nếu type = FILE
    if (dto.type === DocumentType.FILE && file) {
      try {
        const uploadResult = await this.cloudinaryService.uploadFile(file, {
          folder: 'documents',
        });

        document.fileUrl = uploadResult.url;
        document.fileName = file.originalname;
        document.fileType = file.mimetype;
        document.fileSize = file.size;
        document.publicId = uploadResult.publicId;

        this.logger.log(`Uploaded document file: ${uploadResult.publicId}`);
      } catch (error) {
        this.logger.error('Failed to upload document file:', error);
        throw new BadRequestException('Không thể upload file tài liệu');
      }
    }

    // 6. Lấy preview nếu type = LINK
    if (dto.type === DocumentType.LINK && dto.linkUrl) {
      try {
        const preview = await this.linkPreviewService.getPreview(dto.linkUrl);
        document.linkUrl = dto.linkUrl;
        document.linkPreview = preview;

        this.logger.log(`Fetched link preview for: ${dto.linkUrl}`);
      } catch (error) {
        this.logger.warn('Failed to fetch link preview:', error);
        document.linkUrl = dto.linkUrl;
        // Không throw error, chỉ log warning
      }
    }

    // 7. Lưu document
    const savedDocument = await this.documentRepository.save(document);

    // 8. Load relations
    const documentWithRelations = await this.documentRepository.findOne({
      where: { id: savedDocument.id },
      relations: ['createdByUser', 'workspace'],
    });

    const responseData = {
      ...documentWithRelations,
      createdBy: documentWithRelations.createdByUser, // Map relation
      updatedBy: documentWithRelations.updatedByUser,
    };

    return new ResponseDto({
      data: plainToInstance(DocumentResDto, responseData, {
        excludeExtraneousValues: true,
      }),
      message: 'Tạo tài liệu thành công',
    });
  }
}
