import { AuditResDto } from '@/common/dto/audit.res.dto';
import { StringField } from '@/decorators/field.decorators';
import { Expose } from 'class-transformer';

export class ActivityCategoryResDto extends AuditResDto {
  @StringField({
    example: 'Tutor',
    description: 'Tên danh mục hoạt động',
  })
  @Expose()
  name: string;

  @StringField({
    example: 'Danh mục dành cho gia sư',
    description: 'Mô tả danh mục hoạt động',
    required: false,
  })
  @Expose()
  description?: string;
}
