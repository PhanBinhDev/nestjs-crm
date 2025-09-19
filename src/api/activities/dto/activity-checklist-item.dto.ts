import { BooleanField, StringField } from '@/decorators/field.decorators';

export class ActivityChecklistItemDto {
  @StringField({
    example: 'Chuẩn bị tài liệu',
    description: 'Nội dung công việc',
  })
  content: string;

  @BooleanField({
    example: false,
    description: 'Trạng thái hoàn thành',
  })
  isDone: boolean;
}
