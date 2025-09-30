import { Uuid } from '@/common/types/common.type';
import { WorkspaceRole } from '@/database/enum/workspace.enum';
import { CurrentUser } from '@/decorators/current-user.decorator';
import { ApiAuth } from '@/decorators/http.decorators';
import { WorkspaceRoles } from '@/decorators/workspace-role.decorator.';
import { WorkspaceAccessGuard } from '@/guards/workspace-access.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { BaseWorkspaceResDto } from './dto/base-workspace.res.dto';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { QueryWorkspaceDetailDto } from './dto/query-workspace-detail.dto';
import { WorkspaceDetailsResDto } from './dto/workspace-details.res.dto';
import { WorkspaceMemberResDto } from './dto/workspace-member.res.dto';
import { WorkspacesService } from './workspaces.service';

@ApiTags('Workspaces')
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  @ApiAuth({
    summary: 'Tạo không gian làm việc',
    type: BaseWorkspaceResDto,
  })
  create(
    @Body() createWorkspaceDto: CreateWorkspaceDto,
    @CurrentUser('id') ownerId: Uuid,
  ) {
    return this.workspacesService.create(createWorkspaceDto, ownerId);
  }

  @Get()
  @ApiAuth({
    summary: 'Lấy danh sách không gian làm việc của user',
    isArray: true,
    type: BaseWorkspaceResDto,
  })
  findAll(@CurrentUser('id') currentUserId: Uuid) {
    return this.workspacesService.findAll(currentUserId);
  }

  @UseGuards(WorkspaceAccessGuard)
  @Get(':workspaceId')
  @ApiAuth({
    summary: 'Lấy thông tin không gian làm việc theo ID',
    type: WorkspaceDetailsResDto,
  })
  @ApiParam({
    name: 'workspaceId',
    description: 'ID của không gian làm việc',
    type: 'string',
    format: 'uuid',
  })
  findOne(
    @Param('workspaceId') workspaceId: Uuid,
    @CurrentUser('id') currentUserId: Uuid,
    @Query() query: QueryWorkspaceDetailDto,
  ) {
    return this.workspacesService.findOne(workspaceId, currentUserId, query);
  }

  @Get(':workspaceId/members')
  @UseGuards(WorkspaceAccessGuard)
  @ApiAuth({
    summary: 'Lấy danh sách thành viên của không gian làm việc',
    isArray: true,
    type: WorkspaceMemberResDto,
  })
  @ApiParam({
    name: 'workspaceId',
    description: 'ID của không gian làm việc',
  })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Từ khóa tìm kiếm thành viên (tên hoặc email)',
  })
  findMembers(
    @Param('workspaceId') workspaceId: Uuid,
    @CurrentUser('id') currentUserId: Uuid,
    @Query('q') q?: string,
  ) {
    return this.workspacesService.findMembers(workspaceId, currentUserId, q);
  }

  @Patch(':workspaceId')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiConsumes('multipart/form-data')
  @UseGuards(WorkspaceAccessGuard)
  @ApiAuth({
    summary: 'Cập nhật không gian làm việc',
    type: BaseWorkspaceResDto,
  })
  @ApiParam({
    name: 'workspaceId',
    description: 'ID của không gian làm việc',
    type: 'string',
    format: 'uuid',
  })
  update(
    @Param('workspaceId') workspaceId: Uuid,
    @Body() updateWorkspaceDto: CreateWorkspaceDto,
    @UploadedFile() avatar?: Express.Multer.File,
  ) {
    return this.workspacesService.update(workspaceId, updateWorkspaceDto, avatar);
  }

  @Delete(':workspaceId')
  @UseGuards(WorkspaceAccessGuard)
  @ApiAuth({
    summary: 'Xóa không gian làm việc',
  })
  @WorkspaceRoles(WorkspaceRole.OWNER)
  async remove(
    @Param('workspaceId') workspaceId: Uuid,
    @CurrentUser('id') currentUserId: Uuid,
  ) {
    return this.workspacesService.remove(workspaceId, currentUserId);
  }

  @Post(':workspaceId/invite')
  @UseGuards(WorkspaceAccessGuard)
  @ApiAuth({
    summary: 'Mời thành viên vào không gian làm việc',
    type: WorkspaceMemberResDto,
  })
  invite(
    @Param('workspaceId') workspaceId: Uuid,
    @Body() inviteMemberDto: InviteMemberDto,
  ) {
    return this.workspacesService.invite(workspaceId, inviteMemberDto);
  }
}
