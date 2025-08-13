import { PageOptionsDto } from '@/common/dto/offset-pagination/page-options.dto';
import { Uuid } from '@/common/types/common.type';
import { UserRole } from '@/database/enum/user.enum';
import { ApiAuth, ApiPublic } from '@/decorators/http.decorators';
import { Roles } from '@/decorators/roles.decorator';
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
} from '@nestjs/common';
import { ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SemesterBlockDto } from './dto/create-block.dto';
import { CreateSemesterDto } from './dto/create-semester.dto';
import { SemesterResDto } from './dto/semester.res.dto';
import { UpdateSemesterDto } from './dto/update-semester.dto';
import { SemesterService } from './semester.service';

@ApiTags('Học kỳ')
@Controller('semesters')
export class SemesterController {
  constructor(private readonly semesterService: SemesterService) {}

  @Post()
  @ApiAuth({
    summary: 'Tạo học kỳ mới',
    description: 'OK',
    type: SemesterResDto,
  })
  @Roles(UserRole.CNBM, UserRole.TM)
  async create(@Body() createSemesterDto: CreateSemesterDto) {
    console.log('Creating semester with data:', createSemesterDto);

    return await this.semesterService.create(createSemesterDto);
  }

  @Get()
  @ApiPublic({
    summary: 'Lấy danh sách tất cả học kỳ',
    description: 'OK',
    statusCode: 200,
    type: SemesterResDto,
    isPaginated: true,
  })
  async findAll(@Query() query: PageOptionsDto) {
    return await this.semesterService.findAll(query);
  }

  @Get(':id')
  @ApiPublic({
    summary: 'Lấy thông tin học kỳ theo ID',
    description: 'OK',
    type: SemesterResDto,
  })
  @ApiResponse({ status: 200, type: SemesterResDto })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'ID của học kỳ cần lấy thông tin',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: Uuid) {
    return await this.semesterService.findById(id);
  }

  @Patch(':id')
  @ApiAuth({
    summary: 'Cập nhật thông tin học kỳ',
    description: 'OK',
    statusCode: 200,
    type: UpdateSemesterDto,
  })
  @Roles(UserRole.CNBM, UserRole.TM)
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'ID của học kỳ cần cập nhật',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: Uuid,
    @Body() updateSemesterDto: UpdateSemesterDto,
  ) {
    return await this.semesterService.updateSemester(id, updateSemesterDto);
  }

  @Delete(':id')
  @ApiAuth({
    summary: 'Xóa học kỳ',
    description: 'OK',
    statusCode: 204,
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'ID của học kỳ cần xóa',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  async remove(@Param('id', ParseUUIDPipe) id: Uuid) {
    return await this.semesterService.deleteSemester(id);
  }

  // create block
  @Post(':id/blocks')
  @ApiAuth({
    summary: 'Tạo block học kỳ mới',
    description: 'OK',
    type: SemesterResDto,
  })
  @Roles(UserRole.CNBM, UserRole.TM)
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'ID của học kỳ để tạo block',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  async createBlock(
    @Param('id', ParseUUIDPipe) semesterId: Uuid,
    @Body() createBlockDto: SemesterBlockDto,
  ) {
    return await this.semesterService.createBlock(semesterId, createBlockDto);
  }
}
