import { DocumentStatus, DocumentType } from '@/database/enum/document.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class CreateDocumentDto {
  @ApiProperty({
    description: 'Tiêu đề tài liệu',
    example: 'Giáo trình lập trình Java',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  title: string;

  @ApiPropertyOptional({
    description: 'Mô tả tài liệu',
    example: 'Giáo trình đầy đủ về lập trình Java cơ bản đến nâng cao',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Loại tài liệu',
    enum: DocumentType,
    example: DocumentType.FILE,
  })
  @IsEnum(DocumentType)
  @IsNotEmpty()
  type: DocumentType;

  @ApiPropertyOptional({
    description: 'Trạng thái tài liệu',
    enum: DocumentStatus,
    default: DocumentStatus.DRAFT,
  })
  @IsEnum(DocumentStatus)
  @IsOptional()
  status?: DocumentStatus;

  @ApiPropertyOptional({
    description: 'URL link (bắt buộc nếu type = LINK)',
    example: 'https://example.com/document',
  })
  @ValidateIf((o) => o.type === DocumentType.LINK)
  @IsUrl()
  @IsNotEmpty()
  linkUrl?: string;

  @ApiPropertyOptional({
    description: 'File tài liệu (bắt buộc nếu type = FILE)',
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
  @IsNotEmpty({ message: 'ID danh mục tài liệu là bắt buộc' })
  folderId?: string;
}
