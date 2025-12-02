import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { DocumentResDto } from './document-res.dto';

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

  @ApiProperty({ type: UserBasicDto, description: 'Thông tin người tạo' })
  @Expose()
  @Type(() => UserBasicDto)
  createdBy: UserBasicDto;

  @ApiProperty({ description: 'Tổng số tài liệu trong folder' })
  @Expose()
  totalDocuments: number;
}

export class DocumentFolderWithDocumentsDto extends DocumentFolderResDto {
  @ApiProperty({
    type: [DocumentResDto],
    description: 'Danh sách tài liệu trong folder',
  })
  @Expose()
  @Type(() => DocumentResDto)
  documents: DocumentResDto[];
}
