import { UUIDField } from '@/decorators/field.decorators';
import { Expose } from 'class-transformer';

export class FollowUsersDto {
  @UUIDField({ 
    description: 'ID của activity',
    example: 'a0c83f2d-7fa2-4ad2-ac00-7b08e5cad3a8'
  })
  @Expose()
  activityId: string;

  @UUIDField({ 
    each: true, 
    description: 'Danh sách ID người dùng',
    example: ['b1d94e3e-8fb3-5be3-bd11-8c19f6dbe4b9', 'c2e05f4f-9gc4-6cf4-ce22-9d20g7ecf5ca']
  })
  @Expose()
  userIds: string[];
}
