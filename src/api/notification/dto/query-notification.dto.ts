import { PageOptionsDto } from '@/common/dto/cursor-pagination/page-options.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryNotificationDto extends PageOptionsDto {
  @ApiPropertyOptional({ description: 'ID người gửi', type: String })
  senderId?: string;

  @ApiPropertyOptional({ description: 'Trạng thái đã đọc', type: Boolean })
  isRead?: boolean;

  @ApiPropertyOptional({ description: 'Loại thông báo', type: String })
  type?: string;
}
