import { Uuid } from '@/common/types/common.type';
import {
  ClassFieldOptional,
  StringField,
  UUIDField,
  UUIDFieldOptional,
} from '@/decorators/field.decorators';

export class SendPushNotificationDto {
  @UUIDFieldOptional({
    description: 'The ID of the user who will send the notification',
  })
  senderId?: Uuid;

  @UUIDField({
    description: 'The ID of the user to whom the notification will be sent',
  })
  userId: Uuid;

  @StringField({
    description: 'The title of the notification',
  })
  title: string;

  @StringField({
    description: 'The message of the notification',
  })
  message: string;

  @StringField({
    description: 'The type of the notification',
  })
  type: string;

  @ClassFieldOptional(() => Object, {
    description: 'Additional data for the notification',
  })
  data?: Record<string, any>;
}
