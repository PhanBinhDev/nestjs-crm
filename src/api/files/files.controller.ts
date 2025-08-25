import { ApiAuth } from '@/decorators/http.decorators';
import { Controller, Delete, Get, Param } from '@nestjs/common';
import { FilesResponseDto } from './dto/files.res.dto';
import { FilesService } from './files.service';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get()
  @ApiAuth({
    summary: 'Lấy danh sách file',
    isArray: true,
    type: FilesResponseDto,
  })
  async getFiles() {
    return this.filesService.findAll();
  }

  @Delete(':id')
  @ApiAuth({
    summary: 'Xóa file (soft delete)',
  })
  deleteFile(@Param('id') id: string) {
    return this.filesService.remove(id);
  }

  @Get('user/:userId')
  @ApiAuth({
    summary: 'Lấy danh sách file theo người dùng',
    isArray: true,
    type: FilesResponseDto,
  })
  async getFilesByUser(@Param('userId') userId: string) {
    return this.filesService.findByUser(userId);
  }
}
