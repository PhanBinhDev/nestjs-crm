import { Uuid } from '@/common/types/common.type';
import { ReminderType } from '@/database/enum/notifications.enum';
import {
  DateField,
  EnumField,
  NumberField,
  StringField,
  StringFieldOptional,
  UUIDField,
} from '@/decorators/field.decorators';
import { Expose } from 'class-transformer';

export class CreateReminderReqDto {
  @StringField({
    description: 'Nội dung nhắc nhở',
    example: 'Họp team lúc 10h sáng mai',
  })
  content: string;

  @StringFieldOptional({
    description: 'Mô tả chi tiết nhắc nhở',
    example: 'Chuẩn bị báo cáo tiến độ dự án',
  })
  description?: string;

  @DateField({
    description:
      'Thời gian nhắc nhở (ISO 8601). Nếu chọn "Đúng giờ" thì là thời điểm hạn, nếu chọn trước thì là thời điểm nhắc thực tế.',
    example: '2025-10-14T09:00:00.000Z',
  })
  remindAt: string;

  @EnumField(() => ReminderType, {
    description:
      'Loại nhắc nhở: "exact" là đúng giờ, "before_time" là trước thời gian hạn',
    example: ReminderType.BEFORE_TIME,
  })
  type: ReminderType;

  @NumberField({
    description:
      'Nếu remindType là "custom" thì customMinutes là số phút trước hạn sẽ nhắc',
    example: 30,
  })
  customMinutes?: number;

  @UUIDField({
    each: true,
    description: 'Danh sách ID người dùng',
    example: [
      'b1d94e3e-8fb3-5be3-bd11-8c19f6dbe4b9',
      'c2e05f4f-9gc4-6cf4-ce22-9d20g7ecf5ca',
    ],
  })
  @Expose()
  receivers: Uuid[];
}
