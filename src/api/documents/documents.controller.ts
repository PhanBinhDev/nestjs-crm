import { UserRole } from '@/database/enum/user.enum';
import { CurrentUser } from '@/decorators/current-user.decorator';
import { ApiAuth } from '@/decorators/http.decorators';
import { Roles } from '@/decorators/roles.decorator';
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { DocumentResDto } from './dto/document-res.dto';
import { GetDocumentsQueryDto } from './dto/get-documents-query.dto';

@ApiTags('Documents')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @ApiAuth({
    summary: 'Tạo tài liệu (CNBM, TM)',
    description: 'Chỉ CNBM và TM mới có quyền tạo tài liệu trong workspace',
    type: DocumentResDto,
  })
  @Roles(UserRole.CNBM, UserRole.TM, UserRole.SUPERADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  create(
    @Body() createDocumentDto: CreateDocumentDto,
    @CurrentUser('id') userId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.documentsService.create(createDocumentDto, userId, file);
  }
  @Get()
  @ApiAuth({
    summary: 'Lấy DS tài liệu của bộ môn',
    description:
      'Lấy danh sách tài liệu của workspace mà user tham gia. Có thể filter theo status, type, search',
    type: DocumentResDto,
    isArray: true,
  })
  @Roles(UserRole.CNBM, UserRole.TM, UserRole.GV, UserRole.SUPERADMIN)
  findAll(
    @Query() query: GetDocumentsQueryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.documentsService.findAll(query, userId);
  }
}
