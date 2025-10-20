import { AuditResDto } from '@/common/dto/audit.res.dto';
import { Uuid } from '@/common/types/common.type';
import { WorkspaceVisibility } from '@/database/enum/workspace.enum';
import {
  EnumField,
  NumberField,
  StringField,
  StringFieldOptional,
  UUIDField,
} from '@/decorators/field.decorators';
import { Expose } from 'class-transformer';

export class BaseWorkspaceResDto extends AuditResDto {
  @StringField({
    description: 'Tên của không gian làm việc',
    example: 'Workspace 1',
  })
  @Expose()
  name: string;

  @StringFieldOptional({
    description: 'Mô tả của không gian làm việc',
    example: 'Đây là mô tả của không gian làm việc',
  })
  @Expose()
  description?: string;

  @StringField({
    description: 'Icon của không gian làm việc',
    example: 'IconApps',
  })
  @Expose()
  icon?: string;

  @EnumField(() => WorkspaceVisibility, {
    description: 'trạng thái hiển thị của không gian làm việc',
    example: WorkspaceVisibility.PRIVATE,
  })
  @Expose()
  visibility: WorkspaceVisibility;

  @StringFieldOptional({
    description: 'Avatar của không gian làm việc (URL)',
    example: '/uploads/workspace-avatar.jpg',
  })
  @Expose()
  avatar?: string;

  @UUIDField({
    description: 'ID của chủ sở hữu không gian làm việc',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Expose()
  ownerId: Uuid;

  @StringFieldOptional({
    description: 'Tên chủ sở hữu không gian làm việc',
    example: 'Nguyễn Văn A',
  })
  @Expose()
  ownerName?: string;

  @StringField({
    description: 'Mã mời tham gia không gian làm việc',
    example: 'abc123def456ghi789jkl012mno345pq',
  })
  @Expose()
  inviteCode: string;

  @NumberField({
    description: 'Số lượng thành viên trong không gian làm việc',
    example: 5,
  })
  @Expose()
  membersCount?: number;
}
