import { Uuid } from '@/common/types/common.type';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDeviceTokenDto {
  @ApiProperty({
    description: 'ID của user',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  userId: Uuid;

  @ApiProperty({
    description: 'Danh sách các token của thiết bị',
    type: [String],
    example: ['token1', 'token2'],
  })
  tokens: string[];

  @ApiPropertyOptional({
    description: 'Thông tin về thiết bị',
    type: String,
    example: 'Web',
  })
  deviceInfo?: string;
}
