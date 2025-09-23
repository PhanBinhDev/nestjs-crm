import { AssigneeRole } from '@/database/enum/activity.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class ActivityAssigneeDto {
  @ApiProperty({
    description: 'ID của user được gán',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4')
  userId: string;

  @ApiPropertyOptional({
    enum: AssigneeRole,
    description: 'Vai trò của user trong activity',
    example: AssigneeRole.COLLABORATOR,
    default: AssigneeRole.COLLABORATOR,
  })
  @IsOptional()
  @IsEnum(AssigneeRole)
  role?: AssigneeRole;

  @ApiPropertyOptional({
    description: 'Ghi chú cho assignment',
    example: 'Phụ trách phần báo cáo',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
