import { PageOptionsDto } from '@/common/dto/offset-pagination/page-options.dto';
import {
  ActivityPiority,
  ActivityType,
  QueryType,
  StageGroupStatus,
} from '@/database/enum/activity.enum';
import { BooleanFieldOptional } from '@/decorators/field.decorators';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class QueryActivityDto extends PageOptionsDto {
  @ApiPropertyOptional({ enum: ActivityType })
  @IsOptional()
  @IsEnum(ActivityType)
  type?: ActivityType;

  @ApiPropertyOptional({ enum: ActivityPiority })
  @IsOptional()
  @IsEnum(ActivityPiority)
  priority?: ActivityPiority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  stageId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  mandatory?: boolean;

  @ApiPropertyOptional({
    description: 'Lọc theo thời gian bắt đầu >=',
    type: String,
  })
  @IsOptional()
  @IsDateString()
  startTimeFrom?: string;

  @ApiPropertyOptional({
    description: 'Lọc theo thời gian kết thúc <=',
    type: String,
  })
  @IsOptional()
  @IsDateString()
  endTimeTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  createdBy?: string;

  @BooleanFieldOptional({
    example: false,
    description: 'Bao gồm các công việc con (sub-tasks)',
  })
  includeSubTasks?: boolean;

  @ApiPropertyOptional({
    description: 'ID của workspace để lọc activities (optional)',
  })
  @IsOptional()
  @IsString()
  workspaceId?: string;

  @ApiPropertyOptional({
    description: 'ID của assignee để lọc activities theo người được giao',
  })
  @IsOptional()
  @IsString()
  assigneeId?: string;

  @ApiPropertyOptional({
    enum: StageGroupStatus,
    description: 'Trạng thái stage group để lọc activities theo nhóm giai đoạn',
  })
  @IsOptional()
  @IsEnum(StageGroupStatus)
  stageGroupStatus?: StageGroupStatus;

  @ApiPropertyOptional({
    enum: QueryType,
    description:
      'Loại query để lọc activities: created_by_me, assigned_to_me, assigned_by_stage_group, overdue, in_progress, today, completed, all',
  })
  @IsOptional()
  @IsEnum(QueryType)
  queryType?: QueryType;

  @ApiPropertyOptional({
    description: 'Tìm kiếm theo tên hoặc mô tả',
  })
  @IsOptional()
  @IsString()
  q?: string = undefined;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
