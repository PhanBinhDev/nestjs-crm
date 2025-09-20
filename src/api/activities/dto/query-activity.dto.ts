import { PageOptionsDto } from '@/common/dto/offset-pagination/page-options.dto';
import { Uuid } from '@/common/types/common.type';
import {
  ActivityCategory,
  ActivityPiority,
  ActivityType,
} from '@/database/enum/activity.enum';
import { BooleanFieldOptional, UUIDField } from '@/decorators/field.decorators';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
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

  @ApiPropertyOptional({ enum: ActivityCategory })
  @IsOptional()
  @IsEnum(ActivityCategory)
  category?: ActivityCategory;

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

  @UUIDField({
    description: 'ID của workspace để lọc activities',
    required: true,
  })
  workspaceId: Uuid;
}
