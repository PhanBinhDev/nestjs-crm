import {
  BooleanField,
  ClassField,
  NumberField,
} from '@/decorators/field.decorators';
import { Expose, Type } from 'class-transformer';

export class ActivityProgressDetailsDto {
  @NumberField({
    description: 'Tiến độ hoàn thành của các sub-tasks (0-100)',
    example: 75.5,
  })
  @Expose()
  subTasksProgress: number;

  @NumberField({
    description: 'Tiến độ hoàn thành của các checklist items (0-100)',
    example: 60.0,
  })
  @Expose()
  checklistsProgress: number;

  @BooleanField({
    description: 'Trạng thái hoàn thành của stage',
    example: false,
  })
  @Expose()
  stageCompleted: boolean;

  @NumberField({
    description: 'Tổng số sub-tasks',
    example: 4,
    int: true,
  })
  @Expose()
  totalSubTasks: number;

  @NumberField({
    description: 'Số sub-tasks đã hoàn thành',
    example: 3,
    int: true,
  })
  @Expose()
  completedSubTasks: number;

  @NumberField({
    description: 'Tổng số checklist items',
    example: 10,
    int: true,
  })
  @Expose()
  totalChecklistItems: number;

  @NumberField({
    description: 'Số checklist items đã hoàn thành',
    example: 6,
    int: true,
  })
  @Expose()
  completedChecklistItems: number;
}

export class ActivityProgressResDto {
  @NumberField({
    description: 'Phần trăm tiến độ hoàn thành tổng thể (0-100)',
    example: 67.75,
  })
  @Expose()
  progress: number;

  @ClassField(() => ActivityProgressDetailsDto, {
    description: 'Chi tiết tiến độ của từng thành phần',
  })
  @Expose()
  @Type(() => ActivityProgressDetailsDto)
  details: ActivityProgressDetailsDto;
}
