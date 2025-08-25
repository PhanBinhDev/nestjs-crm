import { WorkspaceVisibility } from '@/database/enum/workspace.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

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
}
