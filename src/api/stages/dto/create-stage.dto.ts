import { Uuid } from '@/common/types/common.type';
import { StageGroup } from '@/database/enum/stage.enum';
import {
  EnumFieldOptional,
  NumberFieldOptional,
  UUIDField,
} from '@/decorators/field.decorators';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateStageDto {
  @ApiProperty({
    description: 'Title of the stage',
    example: 'Stage 1',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Mã màu của stage (dùng cho hiển thị màu sắc)',
    example: '#FF5733',
    required: false,
  })
  @IsString()
  @IsOptional()
  color?: string;

  @NumberFieldOptional({
    description: 'Vị trí của stage trong danh sách',
    example: 1,
  })
  position?: number;

  @EnumFieldOptional(() => StageGroup, {
    description: 'Nhóm của stage',
    example: StageGroup.ACTIVE,
  })
  stageGroup: StageGroup;

  @UUIDField({
    description: 'ID của workspace mà stage thuộc về',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  workspaceId: Uuid;
}
