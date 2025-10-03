import { WorkspaceRole } from '@/database/enum/workspace.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

// Only allow ADMIN and MEMBER roles for assignment
const ASSIGNABLE_ROLES = [WorkspaceRole.ADMIN, WorkspaceRole.MEMBER] as const;
type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

export class UpdateMemberRoleDto {
  @ApiProperty({
    description: 'Vai trò mới cho member (chỉ admin hoặc member)',
    enum: ASSIGNABLE_ROLES,
    example: WorkspaceRole.ADMIN,
  })
  @IsEnum(ASSIGNABLE_ROLES, {
    message: 'Vai trò chỉ được phép là: admin hoặc member',
  })
  @IsNotEmpty()
  role: AssignableRole;
}
