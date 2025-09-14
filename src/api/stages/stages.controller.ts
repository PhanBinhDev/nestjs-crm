import { ResponseNoDataDto } from '@/common/dto/response/response-no-data.dto';
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
import { StageDto } from './dto/stage.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { StagesService } from './stages.service';

@ApiTags('Stages')
@Controller('stages')
export class StagesController {
  constructor(private readonly stagesService: StagesService) {}

  @Post()
  @ApiAuth({
    summary: 'Tạo stage mới',
    type: StageDto,
  })
  async create(@Body() createStageDto: CreateStageDto) {
    return this.stagesService.create(createStageDto);
  }

  @Post('init-default')
  @ApiAuth({
    summary: 'Khởi tạo các stage mặc định nếu chưa có',
  })
  async initDefaultStages() {
    await this.stagesService.initDefaultStages();
    return new ResponseNoDataDto({
      message: 'Khởi tạo các stage mặc định thành công',
    });
  }

  @Get()
  @ApiPublic({
    summary: 'Lấy danh sách tất cả stage',
    statusCode: 200,
    type: StageDto,
    isArray: true,
  })
  async findAll(@Query() query: QueryStageDto) {
    return await this.stagesService.findAll(query);
  }

  @Get(':id')
  @ApiPublic({
    summary: 'Lấy thông tin stage theo id',
    type: StageDto,
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
    type: StageDto,
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
