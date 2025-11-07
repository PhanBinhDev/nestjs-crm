import { DocumentStatus, DocumentType } from '@/database/enum/document.enum';
import { UserRole } from '@/database/enum/user.enum';
import { CurrentUser } from '@/decorators/current-user.decorator';
import { ApiAuth } from '@/decorators/http.decorators';
import { Roles } from '@/decorators/roles.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { DocumentsService } from './documents.service';
import { CreateDocumentFolderDto } from './dto/create-document-folder.dto';
import { CreateDocumentDto } from './dto/create-document.dto';
import {
  DocumentFolderResDto,
  DocumentFolderWithDocumentsDto,
} from './dto/document-folder-res.dto';
import { DocumentHistoryResDto } from './dto/document-history-res.dto';
import { DocumentResDto } from './dto/document-res.dto';
import { GetDocumentsQueryDto } from './dto/get-documents-query.dto';
import { RandomDocumentResDto } from './dto/random-document-res.dto';
import { UpdateDocumentFolderDto } from './dto/update-document-folder.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

@ApiTags('Documents')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @ApiAuth({
    summary: 'Tạo tài liệu',
    description: 'Tạo tài liệu mới. Hỗ trợ upload file hoặc lưu link',
    type: DocumentResDto,
  })
  @Roles(UserRole.CNBM, UserRole.TM, UserRole.GV, UserRole.SUPERADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  create(
    @Body() createDocumentDto: CreateDocumentDto,
    @CurrentUser('id') userId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.documentsService.create(createDocumentDto, userId, file);
  }

  @Post('folders')
  @ApiAuth({
    summary: 'Tạo danh mục tài liệu',
    description: 'Tạo danh mục mới để phân loại tài liệu',
    type: DocumentFolderResDto,
  })
  @Roles(UserRole.CNBM, UserRole.TM, UserRole.GV, UserRole.SUPERADMIN)
  createFolder(
    @Body() dto: CreateDocumentFolderDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.documentsService.createFolder(dto, userId);
  }

  @Get('folders')
  @ApiAuth({
    summary: 'Lấy danh sách danh mục',
    description: 'Lấy tất cả danh mục tài liệu',
    type: DocumentFolderResDto,
    isArray: true,
  })
  @Roles(UserRole.CNBM, UserRole.TM, UserRole.GV, UserRole.SUPERADMIN)
  findAllFolders() {
    return this.documentsService.findAllFolders();
  }

  @Get('folders/:id')
  @ApiAuth({
    summary: 'Xem chi tiết danh mục',
    description:
      'Lấy thông tin chi tiết của danh mục bao gồm danh sách tài liệu trong folder',
    type: DocumentFolderWithDocumentsDto,
  })
  @Roles(UserRole.CNBM, UserRole.TM, UserRole.GV, UserRole.SUPERADMIN)
  findOneFolder(@Param('id') id: string) {
    return this.documentsService.findOneFolder(id);
  }

  @Patch('folders/:id')
  @ApiAuth({
    summary: 'Cập nhật danh mục',
    description: 'Cập nhật thông tin danh mục tài liệu',
    type: DocumentFolderResDto,
  })
  @Roles(UserRole.CNBM, UserRole.TM, UserRole.GV, UserRole.SUPERADMIN)
  updateFolder(
    @Param('id') id: string,
    @Body() dto: UpdateDocumentFolderDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.documentsService.updateFolder(id, dto, userId);
  }

  @Delete('folders/:id')
  @ApiAuth({
    summary: 'Xóa danh mục',
    description:
      'Xóa danh mục tài liệu (chỉ khi không có tài liệu nào sử dụng)',
  })
  @Roles(UserRole.CNBM, UserRole.TM, UserRole.SUPERADMIN)
  deleteFolder(@Param('id') id: string) {
    return this.documentsService.deleteFolder(id);
  }

  @Get()
  @ApiAuth({
    summary: 'Lấy danh sách tài liệu (CNBM, TM)',
    description:
      'Lấy danh sách tài liệu trong một folder. Chỉ CNBM và TM có quyền truy cập. FolderId là bắt buộc.',
    type: DocumentResDto,
    isArray: true,
  })
  @Roles(UserRole.CNBM, UserRole.TM, UserRole.SUPERADMIN) // CHỈ CNBM VÀ TM
  @ApiQuery({
    name: 'folderId',
    required: true, // BẮT BUỘC
    description: 'ID danh mục (bắt buộc)',
    type: 'string',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Lọc theo trạng thái',
    enum: DocumentStatus,
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Lọc theo loại tài liệu',
    enum: Object.values(DocumentType),
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Tìm kiếm theo title hoặc description',
    type: 'string',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Số trang',
    type: 'number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Số lượng mỗi trang',
    type: 'number',
    example: 10,
  })
  findAll(
    @Query() query: GetDocumentsQueryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.documentsService.findAll(query, userId);
  }

  @Get('folders/:folderId/random')
  @ApiAuth({
    summary: 'Lấy random tài liệu PDF/Word của bộ môn',
    description:
      'Lấy ngẫu nhiên 1 tài liệu PDF hoặc Word từ bộ môn. Lịch sử sẽ được lưu vào Redis. Chỉ CNBM, TM, GV có quyền.',
    type: RandomDocumentResDto,
  })
  @Roles(UserRole.CNBM, UserRole.TM, UserRole.GV, UserRole.SUPERADMIN)
  @ApiParam({
    name: 'folderId',
    description: 'ID bộ môn',
    type: 'string',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  getRandomDocument(
    @Param('folderId') folderId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.documentsService.getRandomDocument(folderId, userId);
  }

  @Get('folders/:folderId/history')
  @ApiAuth({
    summary: 'Lịch sử lấy tài liệu của bộ môn',
    description:
      'Xem lịch sử các lần lấy random tài liệu của bộ môn. Lưu tối đa 100 items gần nhất.',
    type: DocumentHistoryResDto,
  })
  @Roles(UserRole.CNBM, UserRole.TM, UserRole.GV, UserRole.SUPERADMIN)
  @ApiParam({
    name: 'folderId',
    description: 'ID bộ môn',
    type: 'string',
  })
  getDocumentHistory(
    @Param('folderId') folderId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.documentsService.getDocumentHistory(folderId, userId);
  }

  @Get(':id/download')
  @ApiAuth({
    summary: 'Download tài liệu',
    description: 'Download file tài liệu. Tự động tăng downloadCount',
  })
  @Roles(UserRole.CNBM, UserRole.TM, UserRole.GV, UserRole.SUPERADMIN)
  async download(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Res() res: Response,
  ) {
    return this.documentsService.download(id, userId, res);
  }

  @Get(':id')
  @ApiAuth({
    summary: 'Xem chi tiết tài liệu',
    description: 'Lấy thông tin chi tiết của tài liệu. Tự động tăng viewCount',
    type: DocumentResDto,
  })
  @Roles(UserRole.CNBM, UserRole.TM, UserRole.GV, UserRole.SUPERADMIN)
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.documentsService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiAuth({
    summary: 'Cập nhật tài liệu',
    description: 'Chỉ người tạo tài liệu mới có quyền cập nhật',
    type: DocumentResDto,
  })
  @Roles(UserRole.CNBM, UserRole.TM, UserRole.GV, UserRole.SUPERADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  update(
    @Param('id') id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
    @CurrentUser('id') userId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.documentsService.update(id, updateDocumentDto, userId, file);
  }

  @Delete(':id')
  @ApiAuth({
    summary: 'Xóa tài liệu',
    description: 'Chỉ người tạo tài liệu mới có quyền xóa',
  })
  @Roles(UserRole.CNBM, UserRole.TM, UserRole.SUPERADMIN)
  delete(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.documentsService.delete(id, userId);
  }
}
