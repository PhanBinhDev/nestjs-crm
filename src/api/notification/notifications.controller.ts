import { UserEntity } from '@/api/users/entities/user.entity';
import { Uuid } from '@/common/types/common.type';
import { CurrentUser } from '@/decorators/current-user.decorator';
import { ApiAuth, ApiPublic } from '@/decorators/http.decorators';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ApiConsumes, ApiParam, ApiTags } from '@nestjs/swagger';
import { MarkReadDto } from './dto/mark-read.dto';
import { NotificationResDto } from './dto/notification.res.dto';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { NotificationsService } from './notifications.service';

import { FilesInterceptor } from '@nestjs/platform-express';
import { CreateReminderReqDto } from './dto/create-reminder.req.dto';

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

  @Post('test/:id')
  @ApiPublic({
    summary: 'Gửi thông báo test đến thiết bị của user hiện tại',
    type: NotificationResDto,
  })
  @ApiParam({
    name: 'id',
    description: 'ID của user hiện tại',
    type: 'string',
    format: 'uuid',
  })
  async sendTestNotification(@Param('id') id: Uuid) {
    return this.notificationService.sendTestNotification(id);
  }

  @Patch('read')
  @ApiAuth({
    summary: 'Đánh dấu thông báo là đã đọc',
  })
  async markRead(@Body() dto: MarkReadDto, @CurrentUser('id') userId: Uuid) {
    return this.notificationService.markRead(dto, userId);
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

  @Post('reminder')
  @ApiAuth({
    summary: 'Tạo nhắc nhở và gửi tới danh sách người nhận',
    type: null,
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('attachments'))
  async createReminder(
    @Body() dto: CreateReminderReqDto,
    @CurrentUser('id') userId: Uuid,
    @UploadedFiles() attachments: Express.Multer.File[] = [],
  ) {
    return this.notificationService.sendReminderToUsers(
      dto,
      attachments,
      userId,
    );
  }
}
