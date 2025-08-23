import { UserEntity } from '@/api/users/entities/user.entity';
import { CurrentUser } from '@/decorators/current-user.decorator';
import { ApiAuth } from '@/decorators/http.decorators';
import { Body, Controller, Get, Patch, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MarkReadDto } from './dto/mark-read.dto';
import { NotificationResDto } from './dto/notification.res.dto';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationService: NotificationsService) {}

  @Get()
  @ApiAuth({
    summary: 'Lấy danh sách thông báo',
    isArray: true,
    type: NotificationResDto,
  })
  async findAll(@Query() query: QueryNotificationDto) {
    return this.notificationService.findAll(query);
  }

  @Patch('read')
  async markRead(@Body() dto: MarkReadDto) {
    return this.notificationService.markRead(dto);
  }

  @Patch('read-all')
  @ApiAuth({
    summary: 'Đánh dấu tất cả thông báo là đã đọc',
  })
  async markAllRead(@CurrentUser() user: UserEntity) {
    console.log('user', user);

    return this.notificationService.markAllRead(user);
  }
}
