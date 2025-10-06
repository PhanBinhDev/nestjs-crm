import { PageOptionsDto } from '@/common/dto/cursor-pagination/page-options.dto';
import { ResponseNoDataDto } from '@/common/dto/response/response-no-data.dto';
import { ResponseDto } from '@/common/dto/response/response.dto';
import { Uuid } from '@/common/types/common.type';
import { QueryType } from '@/database/enum/activity.enum';
import { UserRole } from '@/database/enum/user.enum';
import { CurrentUser } from '@/decorators/current-user.decorator';
import { ApiAuth } from '@/decorators/http.decorators';
import { Roles } from '@/decorators/roles.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UserEntity } from '../users/entities/user.entity';
import { ActivitiesService } from './activities.service';
import { ActivityAssigneeResDto } from './dto/activity-assignee.res.dto';
import { ActivityCommentResDto } from './dto/activity-comment.res.dto';
import { ActivityFeedbackResDto } from './dto/activity-feedback.res.dto';
import { ActivityLinkResDto } from './dto/activity-link.res.dto';
import { ActivityLogResDto } from './dto/activity-log.res.dto';
import { ActivityResDto } from './dto/activity.res.dto';
import { AddActivityLinkDto } from './dto/add-activity-link.dto';
import { AssignUserToActivityDto } from './dto/assign-user-to-activity.dto';
import { CategoryResDto } from './dto/category.res.dto';
import { CategoryDto } from './dto/category.res.dto copy';
import { CreateActivityFeedbackDto } from './dto/create-activity-feedback.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { CreateActivityCommentDto } from './dto/create-comment.dto';
import { CreateEventFeedbackDto } from './dto/create-event-feedback.dto';
import { EventFeedbackResDto } from './dto/event-feedback.res.dto';
import { QueryActivityLogDto } from './dto/query-activity-log.dto';
import { QueryActivityDto } from './dto/query-activity.dto';
import { ToggleReactionReqDto } from './dto/toggle-reaction.req.dto';
import { UpdateActivityStatusDto } from './dto/update-activity-status.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { UpdateActivityCommentDto } from './dto/update-comment.dto';
import { UpdateParticipantReqDto } from './dto/update-participant.req.dto';

@ApiTags('activities')
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get('category')
  @ApiAuth({
    summary: 'Lấy danh sách danh mục hoạt động',
    type: CategoryResDto,
    isArray: true,
  })
  getActivityCategories() {
    return this.activitiesService.getActivityCategories();
  }

  @Post('category')
  @ApiAuth({
    summary: 'Tạo mới danh mục hoạt động',
    type: CategoryResDto,
  })
  @Roles(UserRole.TM)
  createActivityCategory(@Body() dto: CategoryDto) {
    return this.activitiesService.createActivityCategory(dto);
  }

  @Post('comments')
  @ApiAuth({
    summary: 'Thêm bình luận cho activity',
    type: ActivityCommentResDto,
  })
  createComment(
    @Param('id') activityId: Uuid,
    @Body() dto: CreateActivityCommentDto,
    @CurrentUser('id') userId: Uuid,
  ) {
    return this.activitiesService.createComment(
      dto.activityId as Uuid,
      dto,
      userId,
    );
  }

  @Get(':id/comments')
  @ApiAuth({
    summary: 'Lấy danh sách bình luận của activity',
    type: ActivityCommentResDto,
    paginationType: 'cursor',
    isArray: true,
  })
  @ApiParam({ name: 'id', description: 'ID của activity' })
  getComments(
    @Param('id') activityId: Uuid,
    @Query() query: PageOptionsDto,
    @CurrentUser('id') userId: Uuid,
  ) {
    return this.activitiesService.getComments(activityId, query, userId);
  }

  @Get(':id/comments/:commentId/replies')
  @ApiAuth({
    summary: 'Lấy danh sách replies của một bình luận',
    type: ActivityCommentResDto,
    paginationType: 'cursor',
    isArray: true,
  })
  @ApiParam({ name: 'id', description: 'ID của activity' })
  @ApiParam({ name: 'commentId', description: 'ID của comment cha' })
  getReplies(
    @Param('id') activityId: Uuid,
    @Param('commentId') commentId: Uuid,
    @Query() query: PageOptionsDto,
  ) {
    return this.activitiesService.getReplies(activityId, commentId, query);
  }

  @Patch(':id/comments/:commentId')
  @ApiAuth({
    summary: 'Cập nhật bình luận',
    type: ActivityCommentResDto,
  })
  @ApiParam({ name: 'id', description: 'ID của activity' })
  @ApiParam({ name: 'commentId', description: 'ID của comment' })
  updateComment(
    @Param('id') activityId: Uuid,
    @Param('commentId') commentId: Uuid,
    @Body() dto: UpdateActivityCommentDto,
    @CurrentUser('id') userId: Uuid,
  ) {
    return this.activitiesService.updateComment(
      activityId,
      commentId,
      dto,
      userId,
    );
  }

  @Post(':id/comments/:commentId/reactions')
  @ApiAuth({
    summary: 'Thêm/cập nhật phản ứng cho bình luận',
    type: ActivityCommentResDto,
  })
  @ApiParam({ name: 'id', description: 'ID của activity' })
  @ApiParam({ name: 'commentId', description: 'ID của comment' })
  toggleReactionOnComment(
    @Param('id') activityId: Uuid,
    @Param('commentId') commentId: Uuid,
    @Body() body: ToggleReactionReqDto,
    @CurrentUser('id') userId: Uuid,
  ) {
    return this.activitiesService.toggleReactionOnComment(
      activityId,
      commentId,
      userId,
      body.type,
    );
  }

  @Delete(':id/comments/:commentId')
  @ApiAuth({
    summary: 'Xóa bình luận',
    type: ResponseNoDataDto,
  })
  @ApiParam({ name: 'id', description: 'ID của activity' })
  @ApiParam({ name: 'commentId', description: 'ID của comment' })
  deleteComment(
    @Param('id') activityId: Uuid,
    @Param('commentId') commentId: Uuid,
    @CurrentUser('id') userId: Uuid,
  ) {
    return this.activitiesService.deleteComment(activityId, commentId, userId);
  }

  @Get(':id/logs')
  @ApiAuth({
    summary: 'Lấy danh sách log chi tiết của activity',
    type: ActivityLogResDto,
    isArray: true,
  })
  @ApiParam({ name: 'id', description: 'ID của activity' })
  @ApiOperation({ summary: 'Lấy danh sách log chi tiết của activity' })
  async getActivityLogs(
    @Param('id') activityId: Uuid,
    @Query() query: QueryActivityLogDto,
  ): Promise<ActivityLogResDto[]> {
    return this.activitiesService.getActivityLogs(activityId, query);
  }

  @Post()
  @ApiAuth({ summary: 'Tạo mới activity', type: ActivityResDto })
  createActivity(
    @Body() dto: CreateActivityDto,
    @CurrentUser('id') userId: Uuid,
  ) {
    return this.activitiesService.create(dto, userId);
  }

  @Get('filter')
  @ApiAuth({
    summary:
      'Lấy danh sách công việc theo loại (do mình tạo, được giao, trễ hẹn, hôm nay, đã hoàn thành)',
    type: ActivityResDto,
    isArray: true,
  })
  @ApiQuery({
    name: 'queryType',
    enum: QueryType,
    required: false,
    description:
      'Loại lọc: created_by_me, assigned_to_me, overdue, today, completed',
  })
  getFilteredActivities(
    @CurrentUser('id') userId: Uuid,
    @Query() query: QueryActivityDto,
    @Query('queryType') type: QueryType,
  ) {
    if (type)
      return this.activitiesService.findFilteredActivities(userId, query, type);

    return this.activitiesService.findAll(query);
  }

  @Get()
  @ApiAuth({
    summary: 'Lấy danh sách activities',
    isPaginated: true,
    type: ActivityResDto,
  })
  getActivities(@Query() query: QueryActivityDto) {
    return this.activitiesService.findAll(query);
  }

  @Get(':id/sub-activities')
  @ApiAuth({
    summary: 'Lấy danh sách sub-activities của activity',
    type: ActivityResDto,
    isArray: true,
  })
  @ApiParam({
    name: 'id',
    description: 'ID của activity để lấy danh sách sub-activities',
  })
  getSubActivities(@Param('id') id: Uuid) {
    return this.activitiesService.findSubActivities(id);
  }

  @Patch(':id/status')
  @ApiAuth({
    summary: 'Cập nhật trạng thái công việc',
    description: 'Chỉ giảng viên, trưởng môn, chủ nhiệm bộ môn được phép',
    type: ActivityResDto,
  })
  @ApiParam({
    name: 'id',
    description: 'ID của activity cần cập nhật trạng thái',
  })
  @Roles(UserRole.CNBM, UserRole.TM, UserRole.GV)
  updateStatus(
    @Param('id') id: Uuid,
    @Body() dto: UpdateActivityStatusDto,
    @CurrentUser('id') userId: Uuid,
  ) {
    return this.activitiesService.updateStatus(id, dto, userId);
  }

  @Get(':id')
  @ApiAuth({
    summary: 'Lấy thông tin activity theo ID',
    type: ActivityResDto,
  })
  @ApiParam({
    name: 'id',
    description: 'ID của activity cần lấy thông tin',
  })
  getActivityById(@Param('id') id: Uuid) {
    return this.activitiesService.findById(id);
  }

  @Delete(':id')
  @ApiAuth({
    summary: 'Xóa activity theo ID',
    description: 'Chỉ giảng viên, trưởng môn, chủ nhiệm bộ môn được phép',
    type: ResponseNoDataDto,
  })
  @ApiParam({
    name: 'id',
    description: 'ID của activity cần xóa',
  })
  deleteActivity(@Param('id') id: Uuid, @CurrentUser('id') userId: Uuid) {
    return this.activitiesService.deleteActivity(id, userId);
  }

  @Patch(':id')
  @ApiAuth({
    summary: 'Cập nhật activity theo ID',
    description: 'Chỉ giảng viên, trưởng môn, chủ nhiệm bộ môn được phép',
    type: ActivityResDto,
  })
  @ApiParam({
    name: 'id',
    description: 'ID của activity cần cập nhật',
  })
  @Roles(UserRole.CNBM, UserRole.TM, UserRole.GV)
  updateActivity(
    @Param('id') id: Uuid,
    @Body() dto: UpdateActivityDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.activitiesService.updateActivity(id, dto, user.id);
  }

  @Patch(':id/participants')
  @ApiAuth({ summary: 'Cập nhật participant', type: UpdateParticipantReqDto })
  @ApiParam({
    name: 'id',
    description: 'ID của activity để cập nhật participants',
  })
  @Roles(UserRole.CNBM, UserRole.TM)
  updateParticipants(
    @Param('id') id: Uuid,
    @Body() dto: UpdateParticipantReqDto,
  ) {
    return this.activitiesService.updateParticipants(id, dto);
  }
  @Get(':id/feedback')
  @ApiAuth({
    summary: 'Lấy danh sách feedback của activity',
    type: ActivityFeedbackResDto,
  })
  @ApiParam({
    name: 'id',
    description: 'ID của activity',
  })
  getFeedbacksByActivityId(@Param('id') id: Uuid) {
    return this.activitiesService.getFeedbacksByActivityId(id);
  }
  @Post(':id/feedback')
  @ApiAuth({
    summary: 'Gửi phản hồi/feedback cho activity',
    type: CreateActivityFeedbackDto,
  })
  @ApiParam({
    name: 'id',
    description: 'ID của activity',
  })
  async createFeedback(
    @Param('id') id: Uuid,
    @Body() dto: CreateActivityFeedbackDto,
    @CurrentUser('id') userId: Uuid,
  ) {
    return this.activitiesService.createFeedback(id, userId, dto);
  }

  @Patch(':id/assignees')
  @ApiAuth({
    summary: 'Gán người thực hiện cho activity',
    type: AssignUserToActivityDto,
  })
  @ApiParam({
    name: 'id',
    description: 'ID của activity để gán người thực hiện',
  })
  @Roles(UserRole.CNBM, UserRole.TM)
  async assignUserToActivity(
    @Param('id') id: Uuid,
    @Body() dto: AssignUserToActivityDto,
    @CurrentUser('id') currentUserId: Uuid,
  ) {
    return this.activitiesService.assignUserToActivity(id, dto, currentUserId);
  }

  @Get(':id/assignees')
  @ApiAuth({
    summary: 'Lấy danh sách người thực hiện của activity',
    type: ActivityAssigneeResDto,
    isArray: true,
  })
  @ApiParam({
    name: 'id',
    description: 'ID của activity để lấy danh sách người thực hiện',
  })
  async getAssigneesByActivityId(@Param('id') id: Uuid) {
    return this.activitiesService.getAssigneesByActivityId(id);
  }

  @Delete(':id/assignees/:userId')
  @ApiParam({
    name: 'id',
    description: 'ID của activity',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID của người dùng cần xóa khỏi activity',
  })
  @ApiAuth({
    summary: 'Xóa người thực hiện khỏi activity',
    type: ResponseNoDataDto,
  })
  async deleteAssignee(
    @Param('id') activityId: Uuid,
    @Param('userId') userId: Uuid,
    @CurrentUser('id') currentUserId: Uuid,
  ): Promise<ResponseNoDataDto> {
    return this.activitiesService.deleteAssignee(
      activityId,
      userId,
      currentUserId,
    );
  }

  @Patch(':id/assignees/:userId')
  @ApiAuth({
    summary: 'Cập nhật thông tin người thực hiện trong activity',
    type: ActivityAssigneeResDto,
  })
  @ApiParam({
    name: 'id',
    description: 'ID của activity',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID của người dùng cần cập nhật thông tin',
  })
  async updateAssignee(
    @Param('id') activityId: Uuid,
    @Param('userId') userId: Uuid,
    @Body() dto: AssignUserToActivityDto,
    @CurrentUser('id') currentUserId: Uuid,
  ): Promise<ResponseDto<ActivityAssigneeResDto>> {
    return this.activitiesService.updateAssignee(
      activityId,
      userId,
      dto,
      currentUserId,
    );
  }

  @Patch(':id/semester/:semesterId')
  @ApiAuth({
    summary: 'Gán activity vào kỳ học',
    type: ActivityResDto,
  })
  @ApiParam({ name: 'id', description: 'ID của activity' })
  @ApiParam({ name: 'semesterId', description: 'ID của kỳ học' })
  @Roles(UserRole.CNBM, UserRole.TM)
  async linkActivityToSemester(
    @Param('id') id: Uuid,
    @Param('semesterId') semesterId: Uuid,
  ) {
    return this.activitiesService.linkActivityToSemester(id, semesterId);
  }

  @Delete(':id/semester/:semesterId')
  @ApiAuth({
    summary: 'Xóa liên kết activity với kỳ học',
    type: ResponseNoDataDto,
  })
  @ApiParam({ name: 'id', description: 'ID của activity' })
  @ApiParam({
    name: 'semesterId',
    description: 'ID của kỳ học',
  })
  @Roles(UserRole.CNBM, UserRole.TM)
  async unlinkActivityFromSemester(
    @Param('id') id: Uuid,
    @Param('semesterId') semesterId: Uuid,
  ) {
    return this.activitiesService.unlinkActivityFromSemester(id, semesterId);
  }

  // Event Feedback Endpoints
  @Post(':id/event-feedback')
  @ApiAuth({
    summary: 'Tạo đánh giá sự kiện',
    type: CreateEventFeedbackDto,
  })
  @ApiParam({
    name: 'id',
    description: 'ID của activity (event)',
  })
  async createEventFeedback(
    @Param('id') id: Uuid,
    @Body() dto: CreateEventFeedbackDto,
  ) {
    return this.activitiesService.createEventFeedback(id, dto);
  }

  @Get(':id/event-feedbacks')
  @ApiAuth({
    summary: 'Lấy danh sách đánh giá sự kiện',
    type: EventFeedbackResDto,
    isArray: true,
  })
  @ApiParam({
    name: 'id',
    description: 'ID của activity (event)',
  })
  async getEventFeedbacksByActivityId(@Param('id') id: Uuid) {
    return this.activitiesService.getEventFeedbacksByActivityId(id);
  }

  @Get('event-feedback/:feedbackId')
  @ApiAuth({
    summary: 'Lấy chi tiết đánh giá sự kiện',
    type: EventFeedbackResDto,
  })
  @ApiParam({
    name: 'feedbackId',
    description: 'ID của event feedback',
  })
  async getEventFeedbackById(@Param('feedbackId') feedbackId: Uuid) {
    return this.activitiesService.getEventFeedbackById(feedbackId);
  }

  @Get(':id/event-feedback-stats')
  @ApiAuth({
    summary: 'Lấy thống kê đánh giá sự kiện',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của activity (event)',
  })
  async getEventFeedbackStats(@Param('id') id: Uuid) {
    return this.activitiesService.getEventFeedbackStats(id);
  }

  @Post(':id/links')
  @ApiAuth({
    summary: 'Gắn link vào activity',
    type: ActivityLinkResDto,
  })
  @ApiParam({ name: 'id', description: 'ID của activity' })
  addLinkToActivity(
    @Param('id') activityId: Uuid,
    @Body() dto: AddActivityLinkDto,
  ) {
    return this.activitiesService.addLinkToActivity(activityId, dto);
  }

  @Get(':id/links')
  @ApiAuth({
    summary: 'Lấy danh sách links của activity',
    type: ActivityLinkResDto,
    isArray: true,
  })
  @ApiParam({ name: 'id', description: 'ID của activity' })
  getActivityLinks(@Param('id') activityId: Uuid) {
    return this.activitiesService.getActivityLinks(activityId);
  }

  @Patch(':id/links/:linkId')
  @ApiAuth({
    summary: 'Cập nhật link của activity',
    type: ActivityLinkResDto,
  })
  @ApiParam({ name: 'id', description: 'ID của activity' })
  @ApiParam({ name: 'linkId', description: 'ID của link cần cập nhật' })
  updateActivityLink(
    @Param('id') activityId: Uuid,
    @Param('linkId') linkId: Uuid,
    @Body() dto: AddActivityLinkDto,
  ) {
    return this.activitiesService.updateActivityLink(activityId, linkId, dto);
  }

  @Delete(':id/links/:linkId')
  @ApiAuth({
    summary: 'Xóa link khỏi activity',
    type: ResponseNoDataDto,
  })
  @ApiParam({ name: 'id', description: 'ID của activity' })
  @ApiParam({ name: 'linkId', description: 'ID của link cần xóa' })
  removeLinkFromActivity(
    @Param('id') activityId: Uuid,
    @Param('linkId') linkId: Uuid,
  ) {
    return this.activitiesService.removeLinkFromActivity(activityId, linkId);
  }
}
