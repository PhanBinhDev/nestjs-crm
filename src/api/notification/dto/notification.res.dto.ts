import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class NotificationResDto {
  @ApiProperty({ type: String })
  @Expose()
  id: string;

  @ApiProperty({ type: String })
  @Expose()
  userId: string;

  @ApiProperty({ type: String, required: false })
  @Expose()
  senderId?: string;

  @ApiProperty({ type: String })
  @Expose()
  title: string;

  @ApiProperty({ type: String, required: false })
  @Expose()
  message?: string;

  @ApiProperty({ type: String, required: false })
  @Expose()
  type?: string;

  @ApiProperty({ type: Object, required: false })
  @Expose()
  data?: any;

  @ApiProperty({ type: Boolean })
  @Expose()
  isRead: boolean;

  @ApiProperty({ type: String, required: false })
  @Expose()
  readAt?: Date;

  @ApiProperty({ type: Boolean })
  @Expose()
  isDeleted: boolean;

  @ApiProperty({ type: String })
  @Expose()
  createdAt: Date;
}
