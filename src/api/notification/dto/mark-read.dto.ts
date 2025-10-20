import { Uuid } from '@/common/types/common.type';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class MarkReadDto {
  @ApiProperty({
    description: 'ID của notification cần đánh dấu là đã đọc',
    example: 'a9a95f09-ba70-4d2d-957e-3c575b32052b',
    type: 'string',
    format: 'uuid',
  })
  @IsNotEmpty({ message: 'notificationId không được để trống' })
  @IsUUID('4', { message: 'notificationId phải là UUID hợp lệ' })
  notificationId: Uuid;
}
