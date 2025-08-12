import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ActivityChecklistItemDto {
  @ApiProperty({
    example: 'Chuẩn bị tài liệu',
    description: 'Nội dung checklist item',
  })
  @IsString()
  content: string;
}
