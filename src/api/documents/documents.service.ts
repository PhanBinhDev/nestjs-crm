import { WorkspaceMembers } from '@/api/workspaces/entities/workspace-members.entity';
import { Workspaces } from '@/api/workspaces/entities/workspace.entity';
import { CloudinaryService } from '@/cloudinary/cloudinary.service';
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
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { CreateDocumentDto } from './dto/create-document.dto';
import { DocumentResDto } from './dto/document-res.dto';
import { GetDocumentsQueryDto } from './dto/get-documents-query.dto';
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
    const workspace = await this.workspaceRepository.findOne({
      where: { id: dto.workspaceId as any },
      relations: ['owner'],
    });

    if (!workspace) {
      throw new NotFoundException('Workspace không tồn tại');
    }
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

    if (dto.type === DocumentType.FILE) {
      if (!file) {
        throw new BadRequestException(
          'File tài liệu là bắt buộc khi type = FILE',
        );
      }

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

    const document = this.documentRepository.create({
      title: dto.title,
      description: dto.description,
      type: dto.type,
      status: dto.status ?? DocumentStatus.DRAFT,
      workspaceId: dto.workspaceId as any,
      createdById: userId,
      metadata: dto.metadata,
    });

    if (dto.type === DocumentType.FILE && file) {
      try {
        const uploadResult = await this.cloudinaryService.uploadFile(file, {
          folder: 'documents',
          resource_type: 'raw',
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
      relations: ['createdByUser', 'workspace'],
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
    userId: string,
  ): Promise<
    ResponseDto<{
      documents: DocumentResDto[];
      total: number;
      page: number;
      limit: number;
    }>
  > {
    const { workspaceId, status, type, search, page = 1, limit = 10 } = query;

    let workspaceIds: string[] = [];

    if (workspaceId) {
      const member = await this.workspaceMemberRepository.findOne({
        where: {
          workspaceId: workspaceId as any,
          userId: userId as any,
        },
      });

      const workspace = await this.workspaceRepository.findOne({
        where: { id: workspaceId as any },
        relations: ['owner'],
      });

      const isOwner = workspace?.owner?.id === userId;

      if (!member && !isOwner) {
        throw new ForbiddenException(
          'Bạn không có quyền xem tài liệu của bộ môn này',
        );
      }

      workspaceIds = [workspaceId];
    } else {
      const myWorkspaces = await this.workspaceMemberRepository.find({
        where: { userId: userId as any },
        select: ['workspaceId'],
      });

      const ownedWorkspaces = await this.workspaceRepository.find({
        where: { owner: { id: userId as any } },
        select: ['id'],
      });

      workspaceIds = [
        ...myWorkspaces.map((m) => m.workspaceId),
        ...ownedWorkspaces.map((w) => w.id),
      ];

      workspaceIds = [...new Set(workspaceIds)];

      if (workspaceIds.length === 0) {
        return new ResponseDto({
          data: {
            documents: [],
            total: 0,
            page,
            limit,
          },
          message: 'Lấy danh sách tài liệu thành công',
        });
      }
    }

    const queryBuilder = this.documentRepository
      .createQueryBuilder('doc')
      .leftJoinAndSelect('doc.workspace', 'workspace')
      .leftJoinAndSelect('doc.createdByUser', 'createdByUser')
      .where('doc.workspaceId IN (:...workspaceIds)', { workspaceIds });

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
}
