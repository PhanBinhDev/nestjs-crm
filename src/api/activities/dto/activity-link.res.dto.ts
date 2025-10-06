import { AuditResDto } from '@/common/dto/audit.res.dto';
import { Uuid } from '@/common/types/common.type';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

class LinkedActivityAssigneeDto {
  @ApiProperty()
  @Expose()
  id: Uuid;

  @ApiProperty()
  @Expose()
  role: string;

  @ApiPropertyOptional()
  @Expose()
  note?: string;

  @ApiPropertyOptional()
  @Expose()
  user?: {
    id: Uuid;
    fullName: string;
    email: string;
    avatar?: string;
  };
}

class LinkedActivityStageDto {
  @ApiProperty()
  @Expose()
  id: Uuid;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiPropertyOptional()
  @Expose()
  color?: string;
}

class LinkedActivityCategoryDto {
  @ApiProperty()
  @Expose()
  id: Uuid;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiPropertyOptional()
  @Expose()
  color?: string;
}

class LinkedActivityDto {
  @ApiProperty()
  @Expose()
  id: Uuid;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiPropertyOptional()
  @Expose()
  description?: string;

  @ApiPropertyOptional()
  @Expose()
  type?: string;

  @ApiPropertyOptional()
  @Expose()
  status?: string;

  @ApiPropertyOptional()
  @Expose()
  priority?: string;

  @ApiPropertyOptional()
  @Expose()
  startTime?: Date;

  @ApiPropertyOptional()
  @Expose()
  endTime?: Date;

  @ApiPropertyOptional()
  @Expose()
  progress?: number;

  @ApiPropertyOptional({ type: LinkedActivityStageDto })
  @Expose()
  @Type(() => LinkedActivityStageDto)
  stage?: LinkedActivityStageDto;

  @ApiPropertyOptional({ type: LinkedActivityCategoryDto })
  @Expose()
  @Type(() => LinkedActivityCategoryDto)
  category?: LinkedActivityCategoryDto;

  @ApiPropertyOptional({ type: LinkedActivityAssigneeDto, isArray: true })
  @Expose()
  @Type(() => LinkedActivityAssigneeDto)
  assignees?: LinkedActivityAssigneeDto[];

  @ApiPropertyOptional()
  @Expose()
  createdAt?: Date;

  @ApiPropertyOptional()
  @Expose()
  updatedAt?: Date;
}

export class ActivityLinkResDto extends AuditResDto {
  @ApiProperty()
  @Expose()
  declare id: Uuid;

  @ApiProperty()
  @Expose()
  activityId: Uuid;

  @ApiProperty()
  @Expose()
  title: string;

  @ApiPropertyOptional()
  @Expose()
  url?: string;

  @ApiPropertyOptional()
  @Expose()
  description?: string;

  @ApiPropertyOptional()
  @Expose()
  linkedActivityId?: Uuid;

  @ApiPropertyOptional({ type: LinkedActivityDto })
  @Expose()
  @Type(() => LinkedActivityDto)
  linkedActivity?: LinkedActivityDto;

  @ApiProperty({ enum: ['external', 'task'] })
  @Expose()
  linkType: 'external' | 'task';
}
