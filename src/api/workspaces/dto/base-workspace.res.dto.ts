import { AuditResDto } from '@/common/dto/audit.res.dto';
import { WorkspaceVisibility } from '@/database/enum/workspace.enum';
import {
  EnumField,
  StringField,
  StringFieldOptional,
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
    description: 'Avatar của không gian làm việc',
    example: 'https://example.com/avatar.png',
  })
  @Expose()
  avatar?: string;
}
