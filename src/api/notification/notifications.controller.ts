import { UserEntity } from '@/api/users/entities/user.entity';
import { Uuid } from '@/common/types/common.type';
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
    type: NotificationResDto,
    paginationType: 'cursor',
    isPaginated: true,
  })
  async findAll(
    @Query() query: QueryNotificationDto,
    @CurrentUser('id') userId: Uuid,
  ) {
    return this.notificationService.findAll(query, userId);
  }

  @Patch('read')
  async markRead(@Body() dto: MarkReadDto) {
    return this.notificationService.markRead(dto);
  }

  @Patch('clear-all')
  @ApiAuth({
    summary: 'Xoá tất cả thông báo',
  })
  async clearAll(@CurrentUser() user: UserEntity) {
    return this.notificationService.clearAll(user.id);
  }

  @Patch('read-all')
  @ApiAuth({
    summary: 'Đánh dấu tất cả thông báo là đã đọc',
  })
  async markAllRead(@CurrentUser() user: UserEntity) {
    return this.notificationService.markAllRead(user);
  }
}
