import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UploadActivityFileResDto {
  @ApiProperty({
    description: 'ID của file đính kèm',
    type: String,
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'ID của activity',
    type: String,
  })
  @Expose()
  activityId: string;

  @ApiProperty({
    description: 'URL của file',
    type: String,
  })
  @Expose()
  url: string;

  @ApiProperty({
    description: 'Tên file gốc',
    type: String,
  })
  @Expose()
  originalName: string;

  @ApiProperty({
    description: 'Tên file',
    type: String,
  })
  @Expose()
  fileName: string;

  @ApiProperty({
    description: 'Kích thước file (bytes)',
    type: Number,
  })
  @Expose()
  size: number;

  @ApiProperty({
    description: 'MIME type của file',
    type: String,
  })
  @Expose()
  mimeType: string;
}


