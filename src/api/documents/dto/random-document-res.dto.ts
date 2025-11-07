import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class RandomDocumentResDto {
  @ApiProperty({
    example: 'abc123xyz',
    description: 'ID của lần lấy random',
  })
  @Expose()
  randomId: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID tài liệu',
  })
  @Expose()
  documentId: string;

  @ApiProperty({
    example: 'Đề thi giữa kỳ môn Java',
    description: 'Tiêu đề tài liệu',
  })
  @Expose()
  title: string;

  @ApiProperty({
    example: 'Đề thi giữa kỳ học kỳ 1 năm 2024',
    description: 'Mô tả tài liệu',
  })
  @Expose()
  description: string;

  @ApiProperty({
    example: 'FILE',
    description: 'Loại tài liệu',
  })
  @Expose()
  type: string;

  @ApiProperty({
    example: 'application/pdf',
    description: 'Loại file',
  })
  @Expose()
  mimeType: string;

  @ApiProperty({
    example: 'de-thi-java.pdf',
    description: 'Tên file',
  })
  @Expose()
  fileName: string;

  @ApiProperty({
    example: 'https://res.cloudinary.com/.../de-thi-java.pdf',
    description: 'URL file',
  })
  @Expose()
  fileUrl: string;

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

  @ApiProperty({
    example: '2025-11-06T10:30:00.000Z',
    description: 'Thời gian lấy random',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    example: 'user-id-123',
    description: 'ID người lấy',
  })
  @Expose()
  createdByUserId: string;

  @ApiProperty({
    example: 'Nguyễn Văn A',
    description: 'Tên người lấy',
  })
  @Expose()
  createdByUserName: string;
}
