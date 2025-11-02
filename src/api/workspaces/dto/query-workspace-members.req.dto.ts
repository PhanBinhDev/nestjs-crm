import { PageOptionsDto } from '@/common/dto/offset-pagination/page-options.dto';
import {
  MemberType,
  WorkspaceMemberStatus,
  WorkspaceRole,
} from '@/database/enum/workspace.enum';
import { EnumFieldOptional } from '@/decorators/field.decorators';

export class QueryWorkspaceMembersReqDto extends PageOptionsDto {
  @EnumFieldOptional(() => WorkspaceMemberStatus, {
    description: 'Trạng thái thành viên trong workspace',
    example: WorkspaceMemberStatus.ACTIVE,
  })
  status: WorkspaceMemberStatus;

  @EnumFieldOptional(() => WorkspaceRole, {
    description: 'Vai trò của thành viên trong workspace',
    example: WorkspaceRole.MEMBER,
  })
  role: WorkspaceRole;

  @EnumFieldOptional(() => MemberType, {
    description: 'Loại thành viên trong workspace',
    example: MemberType.NORMAL,
  })
  type: MemberType;
}
