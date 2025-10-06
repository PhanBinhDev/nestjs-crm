import { AuditResDto } from '@/common/dto/audit.res.dto';
import { Uuid } from '@/common/types/common.type';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ActivityLinkResDto extends AuditResDto {
  @ApiProperty()
  @Expose()
  declare id: Uuid;

  @ApiProperty()
  @Expose()
  activityId: Uuid;

  @ApiProperty()
  @Expose()
  title: string;

  @ApiProperty()
  @Expose()
  url: string;

  @ApiPropertyOptional()
  @Expose()
  description?: string;
}
