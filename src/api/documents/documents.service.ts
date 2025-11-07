import { FileEntity } from '@/api/files/entities/files.entity';
import { FilesService } from '@/api/files/files.service';
import { ResponseDto } from '@/common/dto/response/response.dto';
import { DocumentStatus, DocumentType } from '@/database/enum/document.enum';
import { UserRole } from '@/database/enum/user.enum';
import { LinkPreviewService } from '@/services/link-preview.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { Cache } from 'cache-manager';
import { plainToInstance } from 'class-transformer';
import { randomBytes } from 'crypto';
import { Response } from 'express';
import { Repository } from 'typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { CreateDocumentFolderDto } from './dto/create-document-folder.dto';
import { CreateDocumentDto } from './dto/create-document.dto';
import { DocumentFolderResDto } from './dto/document-folder-res.dto';
import { DocumentHistoryResDto } from './dto/document-history-res.dto';
import {
  DocumentResDto as DocumentDtoForImport,
  DocumentResDto,
} from './dto/document-res.dto';
import { GetDocumentsQueryDto } from './dto/get-documents-query.dto';
import { RandomDocumentResDto } from './dto/random-document-res.dto';
import { UpdateDocumentFolderDto } from './dto/update-document-folder.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { DocumentFolder } from './entities/document-folder.entity';
import { Document } from './entities/document.entity';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);
  private readonly HISTORY_KEY_PREFIX = 'DOC_RANDOM_HISTORY:';
  private readonly MAX_HISTORY_ITEMS = 100;

  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
    @InjectRepository(DocumentFolder)
    private readonly folderRepository: Repository<DocumentFolder>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly filesService: FilesService,
    private readonly linkPreviewService: LinkPreviewService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
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

    const folder = await this.folderRepository.findOne({
      where: { id: dto.folderId as any },
    });
    if (!folder) {
      throw new NotFoundException('Danh mục không tồn tại');
    }

    const document = this.documentRepository.create({
      title: dto.title,
      description: dto.description,
      type: dto.type,
      status: dto.status ?? DocumentStatus.DRAFT,
      createdById: userId,
      metadata: dto.metadata,
      folderId: dto.folderId,
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
      relations: ['createdByUser', 'updatedByUser', 'file', 'folder'],
    });

    const responseData = {
      ...documentWithRelations,
      createdBy: documentWithRelations.createdByUser,
      updatedBy: documentWithRelations.updatedByUser,
      folderName: documentWithRelations.folder?.name,
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
    const user = await this.userRepository.findOne({
      where: { id: userId as any },
    });

    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    const allowedRoles = [UserRole.CNBM, UserRole.TM, UserRole.SUPERADMIN];
    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenException(
        'Chỉ Chủ nhiệm bộ môn (CNBM) hoặc Trưởng môn (TM) mới có quyền xem danh sách tài liệu',
      );
    }

    const { folderId, status, type, search, page = 1, limit = 10 } = query;

    const folder = await this.folderRepository.findOne({
      where: { id: folderId as any },
    });

    if (!folder) {
      throw new NotFoundException('Danh mục không tồn tại');
    }

    const queryBuilder = this.documentRepository
      .createQueryBuilder('doc')
      .leftJoinAndSelect('doc.file', 'file')
      .leftJoinAndSelect('doc.createdByUser', 'createdByUser')
      .leftJoinAndSelect('doc.updatedByUser', 'updatedByUser')
      .leftJoinAndSelect('doc.folder', 'folder')
      .where('doc.folderId = :folderId', { folderId });

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
      folderName: doc.folder?.name,
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
      .leftJoinAndSelect('doc.folder', 'folder')
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
      folderName: document.folder?.name,
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

    // Validate folderId nếu có
    if (dto.folderId !== undefined) {
      if (dto.folderId) {
        const folder = await this.folderRepository.findOne({
          where: { id: dto.folderId as any },
        });
        if (!folder) {
          throw new NotFoundException('Danh mục không tồn tại');
        }
      }
      document.folderId = dto.folderId;
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
      .leftJoinAndSelect('doc.folder', 'folder')
      .where('doc.id = :id', { id: savedDocument.id })
      .getOne();

    const responseData = {
      ...documentWithRelations,
      createdBy: documentWithRelations.createdByUser,
      updatedBy: documentWithRelations.updatedByUser,
      folderName: documentWithRelations.folder?.name,
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

  async getRandomDocument(
    folderId: string,
    userId: string,
  ): Promise<ResponseDto<RandomDocumentResDto>> {
    const user = await this.userRepository.findOne({
      where: { id: userId as any },
    });

    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    const allowedRoles = [
      UserRole.CNBM,
      UserRole.TM,
      UserRole.GV,
      UserRole.SUPERADMIN,
    ];
    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenException(
        'Chỉ CNBM, TM hoặc GV mới có quyền lấy tài liệu ngẫu nhiên',
      );
    }

    const folder = await this.folderRepository.findOne({
      where: { id: folderId as any },
    });

    if (!folder) {
      throw new NotFoundException('Bộ môn không tồn tại');
    }

    const documents = await this.documentRepository
      .createQueryBuilder('doc')
      .leftJoinAndSelect('doc.file', 'file')
      .where('doc.folderId = :folderId', { folderId })
      .andWhere('doc.type = :type', { type: DocumentType.FILE })
      .andWhere('doc.status = :status', { status: DocumentStatus.PUBLISHED })
      .andWhere('doc.fileId IS NOT NULL')
      .andWhere('(file.mimeType = :pdf OR file.mimeType IN (:...wordTypes))', {
        pdf: 'application/pdf',
        wordTypes: [
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
      })
      .getMany();

    if (!documents || documents.length === 0) {
      throw new NotFoundException(
        `Không có tài liệu PDF/Word nào trong bộ môn "${folder.name}"`,
      );
    }

    const randomIndex = Math.floor(Math.random() * documents.length);
    const document = documents[randomIndex];

    const randomId = randomBytes(16).toString('hex');

    const file = document.file as any;
    const fileUrl = file?.url || file?.fileUrl || file?.path;
    const fileName = file?.originalName || file?.fileName || file?.name;
    const mimeType = file?.mimeType;

    if (!fileUrl) {
      throw new BadRequestException('Không thể lấy URL file');
    }

    const now = new Date();
    const historyData = {
      randomId,
      documentId: document.id,
      title: document.title,
      description: document.description,
      fileName,
      mimeType,
      fileUrl,
      folderId: folder.id,
      folderName: folder.name,
      createdByUserId: userId,
      createdByUserName: user.name,
      createdAt: now.toISOString(),
    };

    await this.saveToHistory(folderId, historyData);

    await this.documentRepository.increment(
      { id: document.id as any },
      'viewCount',
      1,
    );

    this.logger.log(
      `User ${userId} (${user.name}) got random document ${document.id} from folder ${folderId}`,
    );

    return new ResponseDto({
      data: plainToInstance(
        RandomDocumentResDto,
        {
          ...historyData,
          createdAt: now,
        },
        { excludeExtraneousValues: true },
      ),
      message: 'Lấy tài liệu ngẫu nhiên thành công',
    });
  }

  async getDocumentHistory(
    folderId: string,
    userId: string,
  ): Promise<ResponseDto<DocumentHistoryResDto>> {
    const folder = await this.folderRepository.findOne({
      where: { id: folderId as any },
    });

    if (!folder) {
      throw new NotFoundException('Bộ môn không tồn tại');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId as any },
    });

    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    const allowedRoles = [
      UserRole.CNBM,
      UserRole.TM,
      UserRole.GV,
      UserRole.SUPERADMIN,
    ];
    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenException(
        'Chỉ CNBM, TM hoặc GV mới có quyền xem lịch sử',
      );
    }

    const historyKey = `${this.HISTORY_KEY_PREFIX}${folderId}`;
    const historyStr = await this.cacheManager.get<string>(historyKey);
    const history = historyStr ? JSON.parse(historyStr) : [];

    const items = history.map((item: any) => ({
      ...item,
      createdAt: new Date(item.createdAt),
    }));

    return new ResponseDto({
      data: plainToInstance(
        DocumentHistoryResDto,
        {
          items,
          total: items.length,
          folderId: folder.id,
          folderName: folder.name,
        },
        { excludeExtraneousValues: true },
      ),
      message: 'Lấy lịch sử thành công',
    });
  }

  private async saveToHistory(folderId: string, data: any): Promise<void> {
    const historyKey = `${this.HISTORY_KEY_PREFIX}${folderId}`;

    const historyStr = await this.cacheManager.get<string>(historyKey);
    const history = historyStr ? JSON.parse(historyStr) : [];

    history.unshift(data);

    if (history.length > this.MAX_HISTORY_ITEMS) {
      history.splice(this.MAX_HISTORY_ITEMS);
    }

    await this.cacheManager.set(historyKey, JSON.stringify(history), 0);

    this.logger.log(
      `Saved history item ${data.randomId} to folder ${folderId}, total items: ${history.length}`,
    );
  }

  // ==================== DOCUMENT FOLDER METHODS ====================

  async createFolder(
    dto: CreateDocumentFolderDto,
    _userId: string,
  ): Promise<ResponseDto<DocumentFolderResDto>> {
    const folder = this.folderRepository.create({
      name: dto.name,
      description: dto.description,
    });

    const savedFolder = await this.folderRepository.save(folder);

    return new ResponseDto({
      data: plainToInstance(DocumentFolderResDto, savedFolder, {
        excludeExtraneousValues: true,
      }),
      message: 'Tạo danh mục thành công',
    });
  }

  async findAllFolders(): Promise<
    ResponseDto<{
      folders: DocumentFolderResDto[];
      total: number;
    }>
  > {
    const [folders, total] = await this.folderRepository.findAndCount({
      order: { createdAt: 'DESC' },
    });

    return new ResponseDto({
      data: {
        folders: plainToInstance(DocumentFolderResDto, folders, {
          excludeExtraneousValues: true,
        }),
        total,
      },
      message: 'Lấy danh sách danh mục thành công',
    });
  }

  async findOneFolder(id: string): Promise<ResponseDto<DocumentFolderResDto>> {
    const folder = await this.folderRepository.findOne({
      where: { id: id as any },
    });

    if (!folder) {
      throw new NotFoundException('Danh mục không tồn tại');
    }

    const documents = await this.documentRepository
      .createQueryBuilder('doc')
      .leftJoinAndSelect('doc.file', 'file')
      .leftJoinAndSelect('doc.createdByUser', 'createdByUser')
      .leftJoinAndSelect('doc.updatedByUser', 'updatedByUser')
      .where('doc.folderId = :folderId', { folderId: id })
      .orderBy('doc.createdAt', 'DESC')
      .getMany();

    const documentsData = documents.map((doc) => ({
      ...doc,
      createdBy: doc.createdByUser,
      updatedBy: doc.updatedByUser,
    }));

    const folderWithDocuments = {
      ...folder,
      documents: plainToInstance(DocumentDtoForImport, documentsData, {
        excludeExtraneousValues: true,
      }),
      totalDocuments: documents.length,
    };

    return new ResponseDto({
      data: folderWithDocuments as any,
      message: 'Lấy chi tiết danh mục thành công',
    });
  }

  async updateFolder(
    id: string,
    dto: UpdateDocumentFolderDto,
    _userId: string,
  ): Promise<ResponseDto<DocumentFolderResDto>> {
    const folder = await this.folderRepository.findOne({
      where: { id: id as any },
    });

    if (!folder) {
      throw new NotFoundException('Danh mục không tồn tại');
    }

    if (dto.name !== undefined) folder.name = dto.name;
    if (dto.description !== undefined) folder.description = dto.description;

    const savedFolder = await this.folderRepository.save(folder);

    return new ResponseDto({
      data: plainToInstance(DocumentFolderResDto, savedFolder, {
        excludeExtraneousValues: true,
      }),
      message: 'Cập nhật danh mục thành công',
    });
  }

  async deleteFolder(id: string): Promise<ResponseDto<null>> {
    const folder = await this.folderRepository.findOne({
      where: { id: id as any },
    });

    if (!folder) {
      throw new NotFoundException('Danh mục không tồn tại');
    }

    const documentsCount = await this.documentRepository.count({
      where: { folderId: id },
    });

    if (documentsCount > 0) {
      throw new BadRequestException(
        `Không thể xóa danh mục này vì đang có ${documentsCount} tài liệu sử dụng`,
      );
    }

    await this.folderRepository.remove(folder);

    return new ResponseDto({
      data: null,
      message: 'Xóa danh mục thành công',
    });
  }
}
