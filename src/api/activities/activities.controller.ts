import { ResponseNoDataDto } from '@/common/dto/response/response-no-data.dto';
import { Uuid } from '@/common/types/common.type';
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
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { ActivitiesService } from './activities.service';
import { ActivityFeedbackResDto } from './dto/activity-feedback.res.dto';
import { ActivityFileResDto } from './dto/activity-file.res.dto';
import { ActivityResDto } from './dto/activity.res.dto';
import { AssignUserToActivityDto } from './dto/assign-user-to-activity.dto';
import { ActivityAssigneeResDto } from './dto/assign.res.dto';
import { AttachFileDto } from './dto/attach-file.dto';
import { CreateActivityFeedbackDto } from './dto/create-activity-feedback.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { QueryActivityDto } from './dto/query-activity.dto';
import { UpdateActivityStatusDto } from './dto/update-activity-status.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { UpdateParticipantReqDto } from './dto/update-participant.req.dto';

@ApiTags('Activities')
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  @ApiAuth({ summary: 'Tạo mới activity', type: ActivityResDto })
  @Roles(UserRole.CNBM, UserRole.TM)
  createActivity(@Body() dto: CreateActivityDto) {
    return this.activitiesService.create(dto);
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
  updateStatus(@Param('id') id: Uuid, @Body() dto: UpdateActivityStatusDto) {
    return this.activitiesService.updateStatus(id, dto);
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
  deleteActivity(@Param('id') id: Uuid) {
    return this.activitiesService.deleteActivity(id);
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
  updateActivity(@Param('id') id: Uuid, @Body() dto: UpdateActivityDto) {
    return this.activitiesService.updateActivity(id, dto);
  }

  @Post(':id/files')
  @ApiAuth({
    summary: 'Đính kèm file cho activity',
    type: ActivityFileResDto,
  })
  @ApiParam({ name: 'id', description: 'ID của activity' })
  async attachFile(@Param('id') id: Uuid, @Body() dto: AttachFileDto) {
    return this.activitiesService.attachFile(id, dto);
  }

  @Get(':id/files')
  @ApiAuth({
    summary: 'Lấy danh sách file đính kèm của activity',
    type: ActivityFileResDto,
    isArray: true,
  })
  @ApiParam({ name: 'id', description: 'ID của activity' })
  getFiles(@Param('id') id: Uuid) {
    return this.activitiesService.getFiles(id);
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
  ) {
    return this.activitiesService.assignUserToActivity(id, dto);
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
  async deleteAssignee(@Param('id') id: Uuid, @Param('userId') userId: Uuid) {
    return this.activitiesService.deleteAssignee(id, userId);
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
    @Param('id') id: Uuid,
    @Param('userId') userId: Uuid,
    @Body() dto: AssignUserToActivityDto,
  ) {
    return this.activitiesService.updateAssignee(id, userId, dto);
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
}
