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

  // role và note được xử lý trong logic, không hiển thị trong schema
  @IsOptional()
  @IsEnum(AssigneeRole)
  role?: AssigneeRole;

  @IsOptional()
  @IsString()
  note?: string;
}
