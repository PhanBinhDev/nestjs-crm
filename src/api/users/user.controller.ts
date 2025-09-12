import { Uuid } from '@/common/types/common.type';
import { UserRole } from '@/database/enum/user.enum';
import { CurrentUser } from '@/decorators/current-user.decorator';
import { ApiAuth, ApiPublic } from '@/decorators/http.decorators';
import { Roles } from '@/decorators/roles.decorator';
import { RolesGuard } from '@/guards/roles.guard';
import { Response } from 'express';

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiParam, ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import {
  ImportUsersFromUrlDto,
  ImportUsersResponseDto,
} from './dto/import-users.dto';
import { QueryUserDto } from './dto/query-user.tdo';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResDto } from './dto/user.res.dto';
import { UserService } from './user.service';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles(UserRole.CNBM, UserRole.TM)
  @ApiPublic({
    summary: 'Tạo người dùng',
    type: CreateUserDto,
  })
  createUser(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Get('all')
  @ApiAuth({
    summary: 'Lấy tất cả người dùng',
    description: 'Lấy danh sách người dùng với phân trang.',
    isPaginated: true,
    type: UserResDto,
  })
  @UseGuards(RolesGuard)
  @Roles(UserRole.CNBM, UserRole.TM, UserRole.GV)
  findAll(@Query() query: QueryUserDto) {
    return this.userService.findAll(query);
  }
  @Get('export')
  @ApiAuth({
    summary: 'Export users to Excel file',
    description: 'Exports selected fields of users to an Excel file.',
  })
  async exportUsers(
    @Res() res: Response,
    @Query('fields') fields?: string,
    @Query('limit') limit?: string,
  ) {
    const fieldList = fields ? fields.split(',') : undefined;
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    const { buffer, filename } = await this.userService.exportUsers(
      fieldList,
      limitNum,
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get(':id')
  @ApiAuth({
    summary: 'Lấy người dùng theo ID',
    type: UserResDto,
  })
  @ApiParam({ name: 'id', type: 'String' })
  findOne(@Param('id') id: Uuid) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @ApiAuth({
    summary: 'Cập nhật người dùng',
    type: UserResDto,
  })
  @ApiParam({ name: 'id', type: 'String' })
  updateUser(
    @Param('id', ParseUUIDPipe) id: Uuid,
    @Body() dto: UpdateUserDto,
    @CurrentUser('role') currentUserRole: UserRole,
  ) {
    return this.userService.update(id, dto, currentUserRole);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  @ApiAuth({
    summary: 'Import users from Excel file',
    description:
      'Upload Excel file to import users in bulk. Returns import results with success/failure counts and detailed error messages.',
    type: ImportUsersResponseDto,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description:
            'Excel file (.xlsx, .xls) with columns: Name, Email, Phone, Role, DateOfBirth (optional), Major (optional), Avatar (optional)',
        },
      },
    },
  })
  importUsers(@UploadedFile() file: Express.Multer.File) {
    return this.userService.importUsers(file);
  }

  @Post('import-url')
  @ApiAuth({
    summary: 'Import users from Google Sheets URL',
    description:
      'Import users from a Google Sheets URL (must be in export format: /export?format=xlsx). Returns import results with success/failure counts and detailed error messages.',
    type: ImportUsersResponseDto,
  })
  @ApiConsumes('application/json')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description:
            'Google Sheets URL in export format (must end with /export?format=xlsx)',
          example:
            'https://docs.google.com/spreadsheets/d/192UtoRvF0uO-PYjaTIRUk5EkJCMbJTSAG5pM-V2O_tU/export?format=xlsx',
        },
      },
      required: ['url'],
    },
  })
  importUsersFromUrl(@Body() dto: ImportUsersFromUrlDto) {
    return this.userService.importUsersFromUrl(dto.url);
  }

  @Delete(':id')
  @Roles(UserRole.CNBM, UserRole.TM)
  @ApiAuth({
    summary: 'Xóa người dùng',
  })
  @ApiParam({ name: 'id', type: 'String' })
  removeUser(@Param('id', ParseUUIDPipe) id: Uuid) {
    return this.userService.remove(id);
  }

  @Patch(':id/toggle-active')
  @Roles(UserRole.CNBM, UserRole.TM)
  @ApiAuth({
    summary: 'Toggle active status of user',
    type: UserResDto,
  })
  @ApiParam({ name: 'id', type: 'String' })
  toggleActive(
    @Param('id', ParseUUIDPipe) id: Uuid,
    @CurrentUser('id') currentUserId: Uuid,
    @CurrentUser('role') currentUserRole: UserRole,
  ) {
    return this.userService.toggleActive(id, currentUserId, currentUserRole);
  }
}
