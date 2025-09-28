import {
  StringField,
  StringFieldOptional,
} from '@/decorators/field.decorators';

export class CategoryDto {
  @StringField({
    example: 'Tutor',
    description: 'Tên danh mục hoạt động',
  })
  name: string;

  @StringFieldOptional({
    example: 'Mô tả danh mục hoạt động',
    description: 'Mô tả chi tiết về danh mục hoạt động',
  })
  description?: string;
}
