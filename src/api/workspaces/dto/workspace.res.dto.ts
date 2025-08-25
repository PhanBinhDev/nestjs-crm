import { WorkspaceVisibility } from '@/database/enum/workspace.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class WorkspaceResDto {
  @ApiProperty({ type: String })
  @Expose()
  id: string;

  @ApiProperty({ type: String })
  @Expose()
  name: string;

  @ApiProperty({ type: String, required: false })
  @Expose()
  description?: string;

  @ApiProperty({ type: String, required: false })
  @Expose()
  icon?: string;

  @ApiProperty({ type: String, enum: WorkspaceVisibility })
  @Expose()
  visibility: WorkspaceVisibility;

  @ApiProperty({ type: String, required: false })
  @Expose()
  avatar?: string;

  @ApiProperty({ type: String })
  @Expose()
  createdAt: Date;

  @ApiProperty({ type: String })
  @Expose()
  updatedAt: Date;
}
