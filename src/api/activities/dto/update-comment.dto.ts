import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateActivityCommentDto {
  @ApiProperty({ description: 'Nội dung bình luận mới' })
  @IsString()
  @IsNotEmpty()
  content: string;
}
