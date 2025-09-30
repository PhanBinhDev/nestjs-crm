import { Uuid } from '@/common/types/common.type';
import { StringField } from '@/decorators/field.decorators';

export class InviteMemberDto {
  @StringField({
    description: 'Danh sách ID người dùng cần mời vào không gian làm việc',
    example: ['550e8400-e29b-41d4-a716-446655440000'],
    isArray: true,
  })
  userIds: Uuid[];
}
