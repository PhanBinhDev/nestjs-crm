import { AuditResDto } from '@/common/dto/audit.res.dto';
import { Uuid } from '@/common/types/common.type';
import {
  StringField,
  StringFieldOptional,
  UUIDField,
} from '@/decorators/field.decorators';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class LinkMetadataDto {
  @ApiPropertyOptional({
    description: 'Thumbnail của website',
    example: 'https://example.com/image.jpg',
  })
  @Expose()
  thumbnail?: string;

  @ApiPropertyOptional({
    description: 'Tên website',
    example: 'GitHub',
  })
  @Expose()
  siteName?: string;

  @ApiPropertyOptional({
    description: 'Mô tả của website',
    example: 'GitHub is where people build software.',
  })
  @Expose()
  siteDescription?: string;

  @ApiPropertyOptional({
    description: 'Favicon của website',
    example: 'https://github.com/favicon.ico',
  })
  @Expose()
  favicon?: string;
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

  @ApiPropertyOptional({
    description: 'Metadata của link (thumbnail, site info)',
    type: LinkMetadataDto,
  })
  @Type(() => LinkMetadataDto)
  @Expose()
  linkPreview?: LinkMetadataDto;
}
