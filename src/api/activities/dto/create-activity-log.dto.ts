import { UserEntity } from '@/api/users/entities/user.entity';
import {
  ClassField,
  StringField,
  StringFieldOptional,
} from '@/decorators/field.decorators';
import { ActivityEntity } from '../entities/activity.entity';

export class CreateActivityLogDto {
  @ClassField(() => ActivityEntity, {
    description: 'The activity associated with the log',
  })
  activity: ActivityEntity;

  @ClassField(() => UserEntity, {
    description: 'The user who performed the action',
  })
  user: UserEntity;

  @StringField({ description: 'The action performed' })
  action: string;

  @StringFieldOptional({ description: 'The action performed' })
  message: string;

  @StringFieldOptional({ description: 'The old value before the action' })
  oldValue?: string;

  @StringFieldOptional({ description: 'The new value after the action' })
  newValue?: string;
}
