import { Uuid } from '@/common/types/common.type';
import { ActivityPiority, ActivityType } from '@/database/enum/activity.enum';
import {
  BooleanFieldOptional,
  DateFieldOptional,
  EnumField,
  EnumFieldOptional,
  NumberFieldOptional,
  StringField,
  StringFieldOptional,
  URLFieldOptional,
  UUIDField,
  UUIDFieldOptional,
} from '@/decorators/field.decorators';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ActivityAssigneeDto } from './activity-assignee.dto';
import { ActivityChecklistDto } from './activity-checklist.dto';

export class CreateActivityDto {
  @StringField({
    example: 'Họp nhóm dự án',
    description: 'Tên hoạt động',
  })
  name: string;

  @NumberFieldOptional({
    example: 1,
    description: 'Vị trí sắp xếp',
  })
  position?: number;

  @EnumField(() => ActivityType, {
    example: ActivityType.TASK,
    description: 'Loại hoạt động',
  })
  type: ActivityType;

  @StringFieldOptional({
    example: 'Mô tả chi tiết về hoạt động',
    minLength: 0,
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
    nullable: true,
  })
  stageId?: Uuid;

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

  @UUIDFieldOptional({
    example: 'category-uuid',
    description: 'ID danh mục hoạt động (Dành cho event)',
    nullable: true,
  })
  categoryId?: Uuid;

  @UUIDFieldOptional({
    example: 'parent-activity-uuid',
    description: 'ID hoạt động cha (nếu có)',
    nullable: true,
  })
  parentId?: Uuid;

  @NumberFieldOptional({
    example: 120,
    description: 'Thời gian ước tính hoàn thành (phút)',
  })
  estimateTime?: number;

  @UUIDFieldOptional({
    example: 'semester-uuid',
    description: 'ID kỳ học (nếu có)',
    nullable: true,
  })
  semesterId?: Uuid;

  @ApiProperty({
    type: [ActivityChecklistDto],
    required: false,
    description: 'Danh sách checklist cho hoạt động',
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ActivityChecklistDto)
  checklist?: ActivityChecklistDto[];

  @ApiProperty({
    description: 'Danh sách công việc con',
    type: [String],
    required: false,
    example: ['Chuẩn bị tài liệu', 'Gửi email mời'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subtask?: string[];

  @UUIDField({
    example: 'workspace-uuid',
    description: 'ID không gian làm việc',
  })
  workspaceId: string;

  @NumberFieldOptional({
    example: 5,
    description: 'Số lượng giảng viên tham gia',
    nullable: true,
  })
  instructorCount?: number;

  @NumberFieldOptional({
    example: 30,
    description: 'Số lượng sinh viên tham gia',
    nullable: true,
  })
  studentCount?: number;

  @ApiProperty({
    type: [ActivityAssigneeDto],
    required: false,
    description:
      'Danh sách người được gán cho hoạt động (chỉ cần userId, role mặc định collaborator)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActivityAssigneeDto)
  assignees?: ActivityAssigneeDto[];

  @ApiProperty({
    type: [String],
    required: false,
    description:
      'Danh sách file URL đính kèm cho hoạt động (array string URLs)',
    example: ['/uploads/file1.docx', '/uploads/file2.png'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  @UUIDFieldOptional({
    description: 'Danh sách ID người dùng sẽ theo dõi hoạt động này',
    example: [
      'b1d94e3e-8fb3-5be3-bd11-8c19f6dbe4b9',
      'c2e05f4f-9gc4-6cf4-ce22-9d20g7ecf5ca',
    ],
    each: true,
  })
  follows?: string[];
}
