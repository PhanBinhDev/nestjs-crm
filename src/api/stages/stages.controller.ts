import { Uuid } from '@/common/types/common.type';
import { ApiAuth, ApiPublic } from '@/decorators/http.decorators';
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
import { CreateStageDto } from './dto/create-stage.dto';
import { QueryStageDto } from './dto/query-stage.dto';
import { StageResDto } from './dto/stage.res.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { StagesService } from './stages.service';

@ApiTags('Stages')
@Controller('stages')
export class StagesController {
  constructor(private readonly stagesService: StagesService) {}

  @Post()
  @ApiAuth({
    summary: 'Tạo stage mới',
    type: StageResDto,
  })
  async create(@Body() createStageDto: CreateStageDto) {
    return this.stagesService.create(createStageDto);
  }

  @Get()
  @ApiPublic({
    summary: 'Lấy danh sách tất cả stage',
    statusCode: 200,
    type: StageResDto,
    isArray: true,
  })
  async findAll(@Query() query: QueryStageDto) {
    return await this.stagesService.findAll(query);
  }

  @Get(':id')
  @ApiPublic({
    summary: 'Lấy thông tin stage theo id',
    type: StageResDto,
  })
  async findOne(@Param('id') id: Uuid) {
    return await this.stagesService.findOne(id);
  }

  @Patch(':id')
  @ApiAuth({
    summary: 'Cập nhật stage',
    statusCode: 200,
    type: UpdateStageDto,
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'ID của stage cần cập nhật',
  })
  async update(@Param('id') id: Uuid, @Body() updateStageDto: UpdateStageDto) {
    return await this.stagesService.update(id, updateStageDto);
  }

  @Delete(':id')
  @ApiAuth({
    summary: 'Xóa stage',
    type: StageResDto,
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'ID của stage cần xóa',
  })
  async remove(@Param('id') id: Uuid) {
    return await this.stagesService.remove(id);
  }
}
