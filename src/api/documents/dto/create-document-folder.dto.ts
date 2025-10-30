import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDocumentFolderDto {
  @ApiProperty({
    description: 'Tên danh mục',
    example: 'Tài liệu học tập',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: 'Mô tả danh mục',
    example: 'Tài liệu dành cho sinh viên năm nhất',
  })
  @IsString()
  @IsOptional()
  description?: string;
}

