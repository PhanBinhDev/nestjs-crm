import {
  ActivityCategory,
  ActivityPiority,
  ActivityType,
} from '@/database/enum/activity.enum';
import {
  BooleanFieldOptional,
  DateFieldOptional,
  EnumFieldOptional,
  NumberFieldOptional,
  StringFieldOptional,
  URLFieldOptional,
  UUIDFieldOptional,
} from '@/decorators/field.decorators';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ActivityChecklistDto } from './activity-checklist.dto';

export class CreateActivityDto {
  @ApiProperty({
    example: 'Báo cáo chuyên đề',
    description: 'Tên hoạt động/công việc',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @NumberFieldOptional({
    example: 1,
    description: 'Vị trí sắp xếp',
  })
  position?: number;

  @ApiProperty({
    enum: ActivityType,
    example: ActivityType.TASK,
    description: 'Loại: task hoặc event',
  })
  @IsEnum(ActivityType)
  type: ActivityType;

  @StringFieldOptional({
    example: 'Mô tả chi tiết về hoạt động',
  })
  description?: string;

  @EnumFieldOptional(() => ActivityPiority, {
    example: ActivityPiority.MEDIUM,
    description: 'Độ ưu tiên: thấp, trung bình, cao',
  })
  priority?: ActivityPiority;

  @UUIDFieldOptional({
    example: 'stage-uuid',
    description: 'ID giai đoạn (nếu có)',
  })
  stageId?: string;

  @DateFieldOptional({
    example: '2025-08-01T09:00:00Z',
    description: 'Thời gian bắt đầu',
  })
  startTime?: string;

  @DateFieldOptional({
    example: '2025-08-01T11:00:00Z',
    description: 'Thời gian kết thúc',
  })
  endTime?: string;

  @StringFieldOptional({
    example: 'Phòng A101, Tòa nhà B',
    description: 'Địa điểm tổ chức',
  })
  location?: string;

  @URLFieldOptional({
    example: 'https://meet.google.com/abc-defg-hij',
    description: 'Link họp online (nếu có)',
  })
  onlineLink?: string;

  @BooleanFieldOptional({
    example: false,
    description: 'Hoạt động có bắt buộc không',
  })
  mandatory?: boolean;

  @EnumFieldOptional(() => ActivityCategory, {
    example: ActivityCategory.SEMINAR,
    description: 'Danh mục hoạt động',
  })
  category?: ActivityCategory;

  @UUIDFieldOptional({
    example: 'parent-activity-uuid',
    description: 'ID hoạt động cha (nếu có)',
  })
  parentId?: string;

  @NumberFieldOptional({
    example: 120,
    description: 'Thời gian ước tính hoàn thành (phút)',
  })
  estimateTime?: number;

  // semesterId:
  @UUIDFieldOptional({
    example: 'semester-uuid',
    description: 'ID kỳ học (nếu có)',
  })
  semesterId?: string;

  @ApiProperty({
    type: [ActivityChecklistDto],
    required: false,
    description: 'Danh sách checklist cho hoạt động',
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ActivityChecklistDto)
  checklist?: ActivityChecklistDto[];
}
