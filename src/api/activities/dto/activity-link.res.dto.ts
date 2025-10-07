import { AuditResDto } from '@/common/dto/audit.res.dto';
import { Uuid } from '@/common/types/common.type';
import {
  StringField,
  StringFieldOptional,
  UUIDField,
} from '@/decorators/field.decorators';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class CreatorInfoDto {
  @UUIDField({
    description: 'ID của người tạo',
  })
  @Expose()
  id: Uuid;

  @StringField({
    description: 'Tên của người tạo',
  })
  @Expose()
  name: string;
}

export class ActivityLinkResDto extends AuditResDto {
  @UUIDField({
    description: 'ID của link',
  })
  @Expose()
  declare id: Uuid;

  @UUIDField({
    description: 'ID của activity',
  })
  @Expose()
  activityId: Uuid;

  @StringField({
    description: 'Tiêu đề của link',
  })
  @Expose()
  title: string;

  @StringField({
    description: 'URL của link',
  })
  @Expose()
  url: string;

  @StringFieldOptional({
    description: 'Mô tả về link',
  })
  @Expose()
  description?: string;

  @ApiProperty({
    description: 'Thông tin người tạo link',
    type: CreatorInfoDto,
  })
  @Type(() => CreatorInfoDto)
  @Expose()
  creator: CreatorInfoDto;
}
