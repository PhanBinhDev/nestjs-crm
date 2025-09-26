import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class EventFeedbackFileResDto {
  @ApiProperty({
    description: 'ID của file đính kèm',
    type: String,
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'ID của event feedback',
    type: String,
  })
  @Expose()
  eventFeedbackId: string;

  @ApiProperty({
    description: 'UID của file đính kèm',
    type: String,
  })
  @Expose()
  uid: string;

  @ApiProperty({
    description: 'Tên của file',
    type: String,
  })
  @Expose()
  name: string;
}
