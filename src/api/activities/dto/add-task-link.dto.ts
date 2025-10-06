import { Uuid } from '@/common/types/common.type';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class AddTaskLinkDto {
  @ApiProperty({
    description: 'ID của task cần liên kết',
    example: 'uuid-of-linked-task',
  })
  @IsUUID(4, { message: 'linkedActivityId phải là UUID hợp lệ' })
  @IsNotEmpty()
  linkedActivityId: Uuid;
}
