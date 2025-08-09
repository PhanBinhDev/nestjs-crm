import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class SemesterBlockDto {
  @ApiProperty({
    description: 'Tên của block học tập',
    example: 'Block 1',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @Expose()
  name: string;
}
