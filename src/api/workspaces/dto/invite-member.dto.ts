import { Uuid } from '@/common/types/common.type';
import { WorkspaceMemberRoleInvite } from '@/database/enum/workspace.enum';
import { EnumField } from '@/decorators/field.decorators';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class InviteMemberDto {
  @ApiProperty({
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  @IsArray()
  @IsString({ each: true })
  userIds: Uuid[];

  @EnumField(() => WorkspaceMemberRoleInvite, {
    description: 'Vai trò của thành viên được mời vào workspace',
    example: WorkspaceMemberRoleInvite.MEMBER,
  })
  role: WorkspaceMemberRoleInvite;
}
