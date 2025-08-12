import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, ValidateNested } from 'class-validator';
import { ActivityChecklistItemDto } from './activity-checklist-item.dto';

export class ActivityChecklistDto {
  @ApiProperty({ example: 'Chuẩn bị', description: 'Tên checklist' })
  @IsString()
  name: string;

  @ApiProperty({
    type: [ActivityChecklistItemDto],
    description: 'Danh sách các item',
  })
  @ValidateNested({ each: true })
  @Type(() => ActivityChecklistItemDto)
  items: ActivityChecklistItemDto[];
}
