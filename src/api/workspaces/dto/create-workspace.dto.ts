import { WorkspaceVisibility } from '@/database/enum/workspace.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateWorkspaceDto {
  @ApiProperty({ description: 'Tên workspace', type: String })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Mô tả workspace',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Icon workspace', type: String, required: false })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({
    description: 'Visibility workspace',
    enum: WorkspaceVisibility,
    required: true,
  })
  @IsString()
  visibility: WorkspaceVisibility;

  @ApiProperty({
    description: 'Avatar workspace',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({
    description: 'Danh sách ID của các thành viên được mời',
    type: [String],
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value.split(',').map(id => id.trim());
      }
    }
    return value;
  })
  @IsArray()
  @IsUUID('4', { each: true })
  assigneeIds?: string[];
}
