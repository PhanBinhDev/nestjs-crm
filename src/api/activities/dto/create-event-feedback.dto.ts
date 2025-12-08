import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateEventFeedbackDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email của người đánh giá',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '0123456789',
    required: false,
    description: 'Số điện thoại',
  })
  @IsOptional()
  @IsString()
  numPhone?: string;

  @ApiProperty({
    example: 'Nguyễn Văn A',
    description: 'Họ và tên đầy đủ',
  })
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @ApiProperty({
    example: 'SV001',
    description: 'Mã sinh viên hoặc mã người tham gia',
  })
  @IsNotEmpty()
  @IsString()
  studentId: string;

  @ApiProperty({
    example: 4.5,
    description: 'Điểm đánh giá từ 1-5 sao (có thể là số thập phân)',
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({
    example: 'Sự kiện rất hay và bổ ích!',
    required: false,
    description: 'Nhận xét chi tiết về sự kiện',
  })
  @IsOptional()
  @IsString()
  comments?: string;

  @ApiProperty({
    example: '/uploads/feedback-image.jpg',
    required: false,
    description: 'URL hình ảnh đính kèm',
  })
  @IsOptional()
  @IsString()
  image?: string;
}
