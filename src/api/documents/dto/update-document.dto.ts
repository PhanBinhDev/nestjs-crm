import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { DocumentStatus, DocumentType } from '@/database/enum/document.enum';

export class UpdateDocumentDto {
  @ApiPropertyOptional({
    description: 'Tiêu đề tài liệu',
    example: 'Giáo trình lập trình Java (Updated)',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @ApiPropertyOptional({
    description: 'Mô tả tài liệu',
    example: 'Giáo trình đầy đủ về lập trình Java cơ bản đến nâng cao',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Loại tài liệu',
    enum: DocumentType,
    example: DocumentType.FILE,
  })
  @IsOptional()
  @IsEnum(DocumentType)
  type?: DocumentType;

  @ApiPropertyOptional({
    description: 'Trạng thái tài liệu',
    enum: DocumentStatus,
    example: DocumentStatus.PUBLISHED,
  })
  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus;

  @ApiPropertyOptional({
    description: 'URL link (bắt buộc nếu type = LINK)',
    example: 'https://example.com/document',
  })
  @ValidateIf((o) => o.type === DocumentType.LINK)
  @IsUrl()
  linkUrl?: string;

  @ApiPropertyOptional({
    description: 'File tài liệu mới (nếu muốn thay thế file cũ)',
    type: 'string',
    format: 'binary',
  })
  file?: Express.Multer.File;

  @ApiPropertyOptional({
    description: 'Metadata bổ sung',
    example: { tags: ['java', 'programming'], category: 'tutorial' },
  })
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'ID danh mục tài liệu',
    example: 'uuid-of-folder',
  })
  @IsOptional()
  @IsUUID()
  folderId?: string;
}
