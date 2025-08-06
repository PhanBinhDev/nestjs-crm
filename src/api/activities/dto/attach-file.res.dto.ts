import { WrapperType } from '@/common/types/types';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ActivityResDto } from './activity.res.dto';

export class AttachFileResDto {
  @ApiProperty({
    description: 'ID của file đính kèm',
    type: String,
  })
  @Expose()
  id: string;

  // maping to Activity
  @ApiProperty({
    description: 'ID của hoạt động liên quan',
    type: String,
  })
  @Expose()
  activityId: string;

  @ApiProperty({
    description: 'Thông tin activity',
    type: ActivityResDto,
  })
  @Expose()
  activity: WrapperType<ActivityResDto>;

  @ApiProperty({
    description: 'URL của file đính kèm',
    type: String,
  })
  @Expose()
  fileUrl: string;

  @ApiProperty({
    description: 'Tên của file',
    type: String,
  })
  @Expose()
  fileName: string;
}
