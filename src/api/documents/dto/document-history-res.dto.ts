import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class DocumentHistoryItemDto {
  @ApiProperty()
  @Expose()
  randomId: string;

  @ApiProperty()
  @Expose()
  documentId: string;

  @ApiProperty()
  @Expose()
  title: string;

  @ApiProperty()
  @Expose()
  description: string;

  @ApiProperty()
  @Expose()
  fileName: string;

  @ApiProperty()
  @Expose()
  mimeType: string;

  @ApiProperty()
  @Expose()
  fileUrl: string;

  @ApiProperty()
  @Expose()
  folderId: string;

  @ApiProperty()
  @Expose()
  folderName: string;

  @ApiProperty()
  @Expose()
  createdByUserId: string;

  @ApiProperty()
  @Expose()
  createdByUserName: string;

  @ApiProperty()
  @Expose()
  createdAt: Date;
}

export class DocumentHistoryResDto {
  @ApiProperty({ type: [DocumentHistoryItemDto] })
  @Expose()
  @Type(() => DocumentHistoryItemDto)
  items: DocumentHistoryItemDto[];

  @ApiProperty({
    example: 25,
    description: 'Tổng số lần lấy tài liệu',
  })
  @Expose()
  total: number;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID bộ môn',
  })
  @Expose()
  folderId: string;

  @ApiProperty({
    example: 'Lập trình Java',
    description: 'Tên bộ môn',
  })
  @Expose()
  folderName: string;
}
export class AllDocumentHistoryResDto {
  @ApiProperty({
    type: [DocumentHistoryResDto],
    description: 'Danh sách lịch sử theo từng bộ môn',
  })
  @Expose()
  @Type(() => DocumentHistoryResDto)
  folders: DocumentHistoryResDto[];

  @ApiProperty({
    example: 150,
    description: 'Tổng số lần lấy tài liệu của tất cả bộ môn',
  })
  @Expose()
  totalItems: number;

  @ApiProperty({
    example: 5,
    description: 'Số lượng bộ môn có lịch sử',
  })
  @Expose()
  totalFolders: number;
}
