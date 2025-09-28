import { AuditResDto } from '@/common/dto/audit.res.dto';
import {
  StringField,
  StringFieldOptional,
} from '@/decorators/field.decorators';
import { Expose } from 'class-transformer';

export class CategoryResDto extends AuditResDto {
  @StringField({
    example: 'Tutor',
    description: 'Tên danh mục hoạt động',
  })
  @Expose()
  name: string;

  @StringFieldOptional({
    example: 'Mô tả danh mục hoạt động',
    description: 'Mô tả chi tiết về danh mục hoạt động',
  })
  @Expose()
  description?: string;
}
