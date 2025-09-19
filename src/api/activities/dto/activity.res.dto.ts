import { SemesterResDto } from '@/api/semester/dto/semester.res.dto';
import { Uuid } from '@/common/types/common.type';
import { WrapperType } from '@/common/types/types';
import {
  ActivityCategory,
  ActivityPiority,
  ActivityStatus,
  ActivityType,
} from '@/database/enum/activity.enum';
import { ClassField, UUIDField } from '@/decorators/field.decorators';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ActivityAssigneeResDto } from './activity-assignee.res.dto';
import { ActivityChecklistResDto } from './activity-checklist.res.dto';

export class ActivityResDto {
  @ApiProperty({ example: '72e7e64a-b8d7-436c-a2cd-cff34c450fa0' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'Báo cáo chuyên đề' })
  @Expose()
  name: string;

  @ApiProperty({ enum: ActivityType, example: ActivityType.EVENT })
  @Expose()
  type: ActivityType;

  @ApiProperty({
    example: 'Thực hiện báo cáo chuyên đề về AI',
    required: false,
  })
  @Expose()
  description?: string;

  @ApiProperty({
    enum: ActivityPiority,
    example: ActivityPiority.HIGH,
    required: false,
  })
  @Expose()
  priority?: ActivityPiority;

  @ApiProperty({ example: 'stage-uuid', required: false })
  @Expose()
  stageId?: string;

  @ApiProperty({ example: '2025-08-01T09:00:00Z', required: false })
  @Expose()
  startTime?: Date;

  @ApiProperty({ example: '2025-08-01T11:00:00Z', required: false })
  @Expose()
  endTime?: Date;

  @ApiProperty({
    example: 120,
    required: false,
    description: 'Ước lượng thời gian (phút)',
  })
  @Expose()
  estimateTime?: number;

  @UUIDField({
    example: 'parent-activity-uuid',
    description: 'ID công việc cha (nếu có)',
  })
  @Expose()
  parentId?: Uuid;

  @ApiProperty({ example: 'Phòng 101', required: false })
  @Expose()
  location?: string;

  @ApiProperty({ example: 'https://zoom.us/j/123456789', required: false })
  @Expose()
  onlineLink?: string;

  @ApiProperty({ example: false, required: false })
  @Expose()
  mandatory?: boolean;

  @ApiProperty({
    enum: ActivityCategory,
    example: ActivityCategory.SEMINAR,
    required: false,
  })
  @Expose()
  category?: ActivityCategory;

  @ApiProperty({ example: '2025-07-20T08:43:00.230Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ example: '1108e1a1-4320-4acd-bd92-8a175310fbf6' })
  @Expose()
  createdBy: string;

  @ApiProperty({ example: '2025-07-20T08:43:00.230Z' })
  @Expose()
  updatedAt: Date;

  @ApiProperty({ enum: ActivityStatus, example: ActivityStatus.NEW })
  @Expose()
  status: ActivityStatus;

  @ApiProperty({ example: 0 })
  @Expose()
  position: number;

  @UUIDField({
    example: 'workspace-uuid',
    description: 'ID không gian làm việc',
  })
  @Expose()
  workspaceId: Uuid;

  @ApiProperty({ type: () => SemesterResDto, required: false })
  @Expose()
  @Type(() => SemesterResDto)
  semester?: SemesterResDto;

  @ApiProperty({ type: () => ActivityResDto, required: false })
  @Expose()
  @Type(() => ActivityResDto)
  parent?: ActivityResDto;

  @ApiProperty({ type: () => [ActivityAssigneeResDto], required: false })
  @Expose()
  @Type(() => ActivityAssigneeResDto)
  assignees?: ActivityAssigneeResDto[];

  @ClassField(() => ActivityResDto, {
    isArray: true,
    required: false,
    description: 'Danh sách công việc con',
  })
  @Expose()
  subActivities?: WrapperType<ActivityResDto>[];

  @ClassField(() => ActivityChecklistResDto, {
    isArray: true,
    required: false,
    description: 'Danh sách checklist cho hoạt động',
  })
  @Expose()
  checklists?: ActivityChecklistResDto[];
}
