import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';

class UserInfoDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  email: string;

  @ApiProperty({ required: false })
  @Expose()
  avatar?: string;
}

export class ActivityLogResDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  activityId: string;

  @ApiProperty()
  @Expose()
  action: string;

  @ApiProperty({ required: false })
  @Expose()
  message?: string;

  @ApiProperty({ required: false })
  @Expose()
  userId?: string;

  @ApiProperty({ required: false, type: Object })
  @Expose()
  oldValue?: any;

  @ApiProperty({ required: false, type: Object })
  @Expose()
  newValue?: any;

  @ApiProperty({ required: false, type: Object })
  @Expose()
  metadata?: any;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty({ type: UserInfoDto, required: false })
  @Expose()
  @Type(() => UserInfoDto)
  user?: UserInfoDto;

  @ApiProperty({ description: 'Thời gian tương đối như "2 giờ trước"' })
  @Transform(({ obj }) => {
    const now = new Date();
    const diff = now.getTime() - new Date(obj.createdAt).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes} phút trước`;
    } else if (hours < 24) {
      return `${hours} giờ trước`;
    } else {
      return `${days} ngày trước`;
    }
  })
  @Expose()
  timeAgo: string;
}
