import { AuditResDto } from '@/common/dto/audit.res.dto';
import { Uuid } from '@/common/types/common.type';
import { ClassField, NumberField } from '@/decorators/field.decorators';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ActivityChecklistItemResDto extends AuditResDto {
  @ApiProperty({ example: 'Hoàn thành slide thuyết trình' })
  @Expose()
  content: string;

  @ApiProperty({ example: false })
  @Expose()
  isDone: boolean;
}

export class ActivityChecklistResDto extends AuditResDto {
  @ApiProperty({ example: '72e7e64a-b8d7-436c-a2cd-cff34c450fa0' })
  @Expose()
  activityId: Uuid;

  @ApiProperty({ example: 'Chuẩn bị họp' })
  @Expose()
  name: string;

  @NumberField()
  @Expose()
  totalItems: number;

  @NumberField()
  @Expose()
  completedItems: number;

  @NumberField()
  @Expose()
  progress: number;

  @ClassField(() => ActivityChecklistItemResDto, {
    isArray: true,
    required: false,
    description: 'Danh sách công việc trong checklist',
  })
  @Expose()
  items: ActivityChecklistItemResDto[];
}
