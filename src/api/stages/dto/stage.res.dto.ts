import { StageGroup } from '@/database/enum/stage.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class StageResDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  title: string;

  @ApiProperty({ example: '#FF5733', description: 'Mã màu của stage' })
  @Expose()
  color: string;

  @ApiProperty({ example: 1, description: 'Vị trí của stage trong danh sách' })
  @Expose()
  position: number;

  @ApiProperty({ enum: StageGroup })
  @Expose()
  stageGroup: StageGroup;

  @ApiProperty()
  @Expose()
  isBuiltIn: boolean;

  @ApiProperty()
  @Expose()
  groupPosition: number;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;
}
