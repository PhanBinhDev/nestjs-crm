import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

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

  @ApiProperty({
    description: 'Vị trí của stage trong danh sách (dùng cho kéo thả Kanban)',
    example: 1,
    required: false,
    default: 0,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  position?: number = 0;
}
