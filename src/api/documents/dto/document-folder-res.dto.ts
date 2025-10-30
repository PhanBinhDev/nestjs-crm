import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { DocumentResDto } from './document-res.dto';

export class DocumentFolderResDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiPropertyOptional()
  @Expose()
  description?: string;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  @ApiProperty()
  @Expose()
  createdBy: string;
}

export class DocumentFolderWithDocumentsDto extends DocumentFolderResDto {
  @ApiProperty({
    type: [DocumentResDto],
    description: 'Danh sách tài liệu trong folder',
  })
  @Expose()
  @Type(() => DocumentResDto)
  documents: DocumentResDto[];

  @ApiProperty({ description: 'Tổng số tài liệu trong folder' })
  @Expose()
  totalDocuments: number;
}

