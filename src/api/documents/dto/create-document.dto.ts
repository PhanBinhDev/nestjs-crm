import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { DocumentStatus, DocumentType } from '../entities/document.entity';

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

  @ApiProperty({
    description: 'ID workspace',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  workspaceId: string;

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
}
