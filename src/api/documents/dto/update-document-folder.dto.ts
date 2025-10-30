import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateDocumentFolderDto {
  @ApiPropertyOptional({
    description: 'Tên danh mục',
    example: 'Tài liệu học tập',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Mô tả danh mục',
    example: 'Tài liệu dành cho sinh viên năm nhất',
  })
  @IsString()
  @IsOptional()
  description?: string;
}

