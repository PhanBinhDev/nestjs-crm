import { Uuid } from '@/common/types/common.type';
import { CurrentUser } from '@/decorators/current-user.decorator';
import { ApiAuth } from '@/decorators/http.decorators';
import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { WorkspaceResDto } from './dto/workspace.res.dto';
import { WorkspacesService } from './workspaces.service';

@ApiTags('Workspaces')
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  @ApiAuth({
    summary: 'Tạo không gian làm việc',
    type: WorkspaceResDto,
  })
  create(
    @Body() createWorkspaceDto: CreateWorkspaceDto,
    @CurrentUser('id') ownerId: Uuid,
  ) {
    return this.workspacesService.create(createWorkspaceDto, ownerId);
  }

  @Get()
  @ApiAuth({
    summary: 'Lấy danh sách không gian làm việc',
    isArray: true,
    type: WorkspaceResDto,
  })
  findAll() {
    return this.workspacesService.findAll();
  }

  @Get('mine')
  @ApiAuth({
    summary:
      'Lấy danh sách workspace mà user hiện tại có quyền truy cập (owner hoặc member)',
    isArray: true,
    type: WorkspaceResDto,
  })
  async findMine(@CurrentUser('id') currentUserId: Uuid) {
    return this.workspacesService.findAccessibleByUser(currentUserId);
  }

  @Patch(':id')
  @ApiAuth({
    summary: 'Cập nhật không gian làm việc',
    type: WorkspaceResDto,
  })
  @ApiParam({
    name: 'id',
    description: 'ID của không gian làm việc',
    type: 'string',
    format: 'uuid',
  })
  update(
    @Param('id') id: Uuid,
    @Body() updateWorkspaceDto: CreateWorkspaceDto,
  ) {
    return this.workspacesService.update(id, updateWorkspaceDto);
  }
}
