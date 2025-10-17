import { UserResDto } from '@/api/users/dto/user.res.dto';
import { ClassField } from '@/decorators/field.decorators';
import { Expose } from 'class-transformer';
import { BaseWorkspaceResDto } from './base-workspace.res.dto';
import { WorkspaceMemberResDto } from './workspace-member.res.dto';

export class WorkspaceDetailsResDto extends BaseWorkspaceResDto {
  @ClassField(() => UserResDto, {
    description: 'Thông tin chủ sở hữu của không gian làm việc',
  })
  @Expose()
  owner: UserResDto;

  @ClassField(() => WorkspaceMemberResDto, {
    description: 'Danh sách thành viên của không gian làm việc',
  })
  @Expose()
  members: WorkspaceMemberResDto[];
}
