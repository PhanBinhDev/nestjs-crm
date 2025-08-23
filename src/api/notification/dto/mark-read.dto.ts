import { Uuid } from '@/common/types/common.type';
import { ApiProperty } from '@nestjs/swagger';

export class MarkReadDto {
  @ApiProperty({ description: 'ID thông báo', type: String })
  notificationId: Uuid;
}
