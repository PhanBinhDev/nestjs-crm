import { Uuid } from '@/common/types/common.type';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiProperty({ description: 'ID người nhận', type: String })
  userId: Uuid;

  @ApiProperty({ description: 'ID người gửi', type: String, required: false })
  senderId?: Uuid;

  @ApiProperty({ description: 'Tiêu đề thông báo', type: String })
  title: string;

  @ApiProperty({
    description: 'Nội dung thông báo',
    type: String,
    required: false,
  })
  message?: string;

  @ApiProperty({ description: 'Loại thông báo', type: String, required: false })
  type?: string;

  @ApiProperty({
    description: 'Dữ liệu bổ sung',
    type: Object,
    required: false,
  })
  data?: any;
}
