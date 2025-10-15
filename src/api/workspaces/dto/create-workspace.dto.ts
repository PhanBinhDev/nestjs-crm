import { Uuid } from '@/common/types/common.type';
import { WorkspaceVisibility } from '@/database/enum/workspace.enum';
import {
  EnumField,
  StringField,
  StringFieldOptional,
  URLFieldOptional,
  UUIDFieldOptional,
} from '@/decorators/field.decorators';

export class CreateWorkspaceDto {
  @StringField({
    example: 'Workspace của tôi',
  })
  name: string;

  @StringFieldOptional({
    example: 'Đây là mô tả về workspace của tôi',
    description: 'Mô tả về workspace',
  })
  description?: string;

  @EnumField(() => WorkspaceVisibility, {
    example: WorkspaceVisibility.PRIVATE,
    description: 'Quyền riêng tư của workspace',
  })
  visibility: WorkspaceVisibility;

  @URLFieldOptional({
    description: 'Ảnh đại diện của workspace',
    example: 'https://example.com/avatar.png',
  })
  avatar?: string;

  @UUIDFieldOptional({
    description: 'Danh sách ID người dùng được mời vào workspace',
    example: [
      'b1d94e3e-8fb3-5be3-bd11-8c19f6dbe4b9',
      'c2e05f4f-9gc4-6cf4-ce22-9d20g7ecf5ca',
    ],
    each: true,
  })
  members?: Uuid[];
}
