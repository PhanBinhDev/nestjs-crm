import { Uuid } from '@/common/types/common.type';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class InviteMemberDto {
  @ApiProperty({
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  @IsArray()
  @IsString({ each: true })
  userIds: Uuid[];
}
