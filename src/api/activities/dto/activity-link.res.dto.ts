import { AuditResDto } from '@/common/dto/audit.res.dto';
import { Uuid } from '@/common/types/common.type';
import {
  StringField,
  StringFieldOptional,
  UUIDField,
} from '@/decorators/field.decorators';
import { Expose } from 'class-transformer';

export class ActivityLinkResDto extends AuditResDto {
  @UUIDField({
    description: 'ID of the activity this link is associated with',
  })
  @Expose()
  activityId: Uuid;

  @StringField({
    description: 'Title of the link',
  })
  @Expose()
  title: string;

  @StringField({
    description: 'URL of the link',
  })
  @Expose()
  url: string;

  @StringFieldOptional({
    description: 'Optional description of the link',
  })
  @Expose()
  description?: string;
}
