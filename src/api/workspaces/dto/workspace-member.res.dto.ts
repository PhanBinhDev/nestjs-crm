import { UserResDto } from '@/api/users/dto/user.res.dto';
import { AuditResDto } from '@/common/dto/audit.res.dto';
import { Uuid } from '@/common/types/common.type';
import {
  WorkspaceMemberStatus,
  WorkspaceRole,
} from '@/database/enum/workspace.enum';
import {
  ClassField,
  EnumField,
  UUIDField,
} from '@/decorators/field.decorators';
import { Expose } from 'class-transformer';

export class WorkspaceMemberResDto extends AuditResDto {
  @UUIDField()
  @Expose()
  workspaceId: Uuid;

  @ClassField(() => UserResDto, {
    description: 'Thông tin người dùng',
  })
  @Expose()
  user: UserResDto;

  @EnumField(() => WorkspaceRole, {
    description: 'Vai trò của thành viên trong không gian làm việc',
    example: WorkspaceRole.MEMBER,
  })
  @Expose()
  role: WorkspaceRole;

  @EnumField(() => WorkspaceMemberStatus, {
    description: 'Trạng thái của thành viên trong không gian làm việc',
    example: WorkspaceMemberStatus.ACTIVE,
  })
  @Expose()
  status: WorkspaceMemberStatus;
}
