import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateActivityCommentDto {
  @ApiProperty({ description: 'ID của activity để bình luận' })
  @IsUUID()
  @IsNotEmpty()
  activityId: string;

  @ApiProperty({ description: 'Nội dung bình luận' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    description: 'ID của comment cha (cho reply)',
    example: '',
  })
  @IsOptional()
  @IsUUID(4, { message: 'parentCommentId phải là UUID hợp lệ' })
  @Transform(({ value }) => (value === '' ? undefined : value))
  parentCommentId?: string;
}
