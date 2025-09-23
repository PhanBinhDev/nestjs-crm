import { EventFeedbackRating } from '../entities/event-feedback.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateEventFeedbackDto {
  @ApiProperty({ 
    example: 'user@example.com',
    description: 'Email của người đánh giá'
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ 
    example: '0123456789',
    required: false,
    description: 'Số điện thoại'
  })
  @IsOptional()
  @IsString()
  numPhone?: string;

  @ApiProperty({ 
    example: 'Nguyễn Văn A',
    description: 'Họ và tên đầy đủ'
  })
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @ApiProperty({ 
    example: 'SV001',
    description: 'Mã sinh viên hoặc mã người tham gia'
  })
  @IsNotEmpty()
  @IsString()
  studentId: string;

  @ApiProperty({ 
    enum: EventFeedbackRating,
    example: EventFeedbackRating.FIVE,
    description: 'Điểm đánh giá từ 1-5 sao'
  })
  @IsNotEmpty()
  @IsEnum(EventFeedbackRating)
  rating: EventFeedbackRating;

  @ApiProperty({ 
    example: 'Sự kiện rất hay và bổ ích!',
    required: false,
    description: 'Nhận xét chi tiết về sự kiện'
  })
  @IsOptional()
  @IsString()
  comments?: string;

  @ApiProperty({ 
    example: 'https://example.com/image.jpg',
    required: false,
    description: 'URL hình ảnh đính kèm'
  })
  @IsOptional()
  @IsUrl()
  image?: string;
}
