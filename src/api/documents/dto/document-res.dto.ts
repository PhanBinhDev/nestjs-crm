import { DocumentStatus, DocumentType } from '@/database/enum/document.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

class UserBasicDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  email: string;

  @ApiPropertyOptional()
  @Expose()
  avatar?: string;
}

class FileBasicDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty({ description: 'URL của file' })
  @Expose()
  url: string;

  @ApiProperty({ description: 'Tên file gốc' })
  @Expose()
  originalName: string;

  @ApiProperty({ description: 'Tên file đã xử lý' })
  @Expose()
  fileName: string;

  @ApiProperty({ description: 'Loại MIME' })
  @Expose()
  mimeType: string;

  @ApiProperty({ description: 'Kích thước file (bytes)' })
  @Expose()
  size: number;

  @ApiPropertyOptional({ description: 'Metadata bổ sung' })
  @Expose()
  metadata?: Record<string, any>;
}

export class DocumentResDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  title: string;

  @ApiPropertyOptional()
  @Expose()
  description?: string;

  @ApiProperty({ enum: DocumentType })
  @Expose()
  type: DocumentType;

  @ApiProperty({ enum: DocumentStatus })
  @Expose()
  status: DocumentStatus;

  @ApiPropertyOptional({
    type: FileBasicDto,
    description: 'Thông tin file đính kèm',
  })
  @Expose()
  @Type(() => FileBasicDto)
  file?: FileBasicDto;

  @ApiPropertyOptional({ description: 'URL link (nếu type = LINK)' })
  @Expose()
  linkUrl?: string;

  @ApiPropertyOptional({ description: 'Preview của link' })
  @Expose()
  linkPreview?: {
    title?: string;
    description?: string;
    image?: string;
    siteName?: string;
  };

  @ApiProperty({ type: UserBasicDto })
  @Expose()
  @Type(() => UserBasicDto)
  createdBy: UserBasicDto;

  @ApiPropertyOptional({ type: UserBasicDto })
  @Expose()
  @Type(() => UserBasicDto)
  updatedBy?: UserBasicDto;

  @ApiPropertyOptional()
  @Expose()
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Số lượt xem' })
  @Expose()
  viewCount: number;

  @ApiProperty({ description: 'Số lượt tải xuống' })
  @Expose()
  downloadCount: number;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'ID danh mục' })
  @Expose()
  folderId?: string;

  @ApiPropertyOptional({ description: 'Tên danh mục' })
  @Expose()
  folderName?: string;

  @ApiPropertyOptional({
    description: 'Tổng số tài liệu trong folder này',
    example: 15,
  })
  @Expose()
  totalDocumentsInFolder?: number;
}
