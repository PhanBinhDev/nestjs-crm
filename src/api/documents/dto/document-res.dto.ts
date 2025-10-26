import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { DocumentStatus, DocumentType } from '../entities/document.entity';

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

  @ApiPropertyOptional()
  @Expose()
  fileUrl?: string;

  @ApiPropertyOptional()
  @Expose()
  fileName?: string;

  @ApiPropertyOptional()
  @Expose()
  fileType?: string;

  @ApiPropertyOptional()
  @Expose()
  fileSize?: number;

  @ApiPropertyOptional()
  @Expose()
  linkUrl?: string;

  @ApiPropertyOptional()
  @Expose()
  linkPreview?: {
    title?: string;
    description?: string;
    image?: string;
    siteName?: string;
  };

  @ApiProperty()
  @Expose()
  workspaceId: string;

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

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;
}
