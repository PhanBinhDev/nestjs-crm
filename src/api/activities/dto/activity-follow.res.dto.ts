import { UserResDto } from '@/api/users/dto/user.res.dto';
import { AuditResDto } from '@/common/dto/audit.res.dto';
import { Uuid } from '@/common/types/common.type';
import { UUIDField } from '@/decorators/field.decorators';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ActivityResDto } from './activity.res.dto';

export class ActivityFollowResDto extends AuditResDto {
  @UUIDField({ description: 'ID của follow' })
  @Expose()
  declare id: Uuid;

  @UUIDField({ description: 'ID của activity' })
  @Expose()
  activityId: Uuid;

  @UUIDField({ description: 'ID của user' })
  @Expose()
  userId: Uuid;

  @ApiProperty({ description: 'Thông tin activity', type: ActivityResDto })
  @Expose()
  @Type(() => ActivityResDto)
  activity?: ActivityResDto;

  @ApiProperty({ description: 'Thông tin người dùng', type: UserResDto })
  @Expose()
  @Type(() => UserResDto)
  user?: UserResDto;
}
