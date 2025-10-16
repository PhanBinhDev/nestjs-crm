import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class AddActivityLinkDto {
  @ApiProperty({
    description: 'Tiêu đề của link',
    example: 'Tài liệu hướng dẫn',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255, { message: 'Tiêu đề không được vượt quá 255 ký tự' })
  title: string;

  @ApiProperty({
    description: 'URL của link (phải có http:// hoặc https://)',
    example: 'https://example.com/document',
  })
  @Matches(/^https?:\/\/.+/, {
    message: 'URL phải bắt đầu với http:// hoặc https://',
  })
  @IsNotEmpty()
  url: string;

  @ApiPropertyOptional({
    description: 'Mô tả về link',
    example: 'Tài liệu hướng dẫn thực hiện hoạt động này',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Mô tả không được vượt quá 500 ký tự' })
  description?: string;
}
