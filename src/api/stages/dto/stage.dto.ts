import { ApiProperty } from '@nestjs/swagger';

export class StageDto {
  @ApiProperty({ example: 'uuid', description: 'ID stage' })
  id: string;

  @ApiProperty({ example: 'Stage 1', description: 'Tên stage' })
  title: string;

  @ApiProperty({ example: 1, description: 'Vị trí của stage trong danh sách' })
  position: number;

  @ApiProperty({ example: '#FF5733', description: 'Mã màu của stage' })
  color: string;

  @ApiProperty({ example: '2025-07-20T12:00:00Z', description: 'Ngày tạo' })
  createdAt: Date;

  @ApiProperty({ example: 'user1', description: 'Người tạo' })
  createdBy: string;

  @ApiProperty({
    example: '2025-07-20T12:00:00Z',
    description: 'Ngày cập nhật',
  })
  updatedAt: Date;

  @ApiProperty({ example: 'user2', description: 'Người cập nhật' })
  updatedBy: string;
}
