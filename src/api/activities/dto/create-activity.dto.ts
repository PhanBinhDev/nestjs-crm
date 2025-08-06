import {
  ActivityCategory,
  ActivityPiority,
  ActivityType,
} from '@/database/enum/activity.enum';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateActivityDto {
  @ApiProperty({
    example: 'Báo cáo chuyên đề',
    description: 'Tên hoạt động/công việc',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    enum: ActivityType,
    example: ActivityType.TASK,
    description: 'Loại: task hoặc event',
  })
  @IsEnum(ActivityType)
  type: ActivityType;

  @ApiProperty({
    example: 'Thực hiện báo cáo chuyên đề về AI',
    description: 'Mô tả chi tiết',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    enum: ActivityPiority,
    example: ActivityPiority.HIGH,
    description: 'Độ ưu tiên',
    required: false,
  })
  @IsOptional()
  @IsEnum(ActivityPiority)
  priority?: ActivityPiority;

  @ApiProperty({
    example: 'stage-uuid',
    description: 'ID trạng thái (stage)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsUUID()
  stageId?: string;

  @ApiProperty({
    example: '2025-08-01T09:00:00Z',
    description: 'Thời gian bắt đầu',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiProperty({
    example: '2025-08-01T11:00:00Z',
    description: 'Thời gian kết thúc',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiProperty({
    example: 'Phòng 101',
    description: 'Địa điểm',
    required: false,
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({
    example: 'https://zoom.us/j/123456789',
    description: 'Link online',
    required: false,
  })
  @IsOptional()
  @IsString()
  onlineLink?: string;

  @ApiProperty({
    example: true,
    description: 'Bắt buộc hay tự chọn',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  mandatory?: boolean;

  @ApiProperty({
    enum: ActivityCategory,
    example: ActivityCategory.SEMINAR,
    description: 'Loại hình hoạt động',
    required: false,
  })
  @IsOptional()
  @IsEnum(ActivityCategory)
  category?: ActivityCategory;

  // parentId
  @ApiProperty({
    example: 'parent-activity-uuid',
    description: 'ID hoạt động cha (nếu có)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsUUID()
  parentId?: string;

  // estimateTime
  @ApiProperty({
    example: '120',
    description: 'Thời gian ước tính hoàn thành (phút)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  estimateTime?: number; // minutes

  // semesterId:
  @ApiProperty({
    example: 'semester-uuid',
    description: 'ID kỳ học (nếu có)',
    required: false,
  })
  @IsString()
  @IsUUID()
  semesterId: string;
}
