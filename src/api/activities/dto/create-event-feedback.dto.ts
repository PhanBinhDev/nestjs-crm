import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsArray, ValidateNested, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class EventFeedbackFileDto {
  @ApiProperty({
    description: 'UID của file đính kèm',
    example: 'file-upload-1234567890-45'
  })
  @IsString()
  @IsNotEmpty()
  uid: string;

  @ApiProperty({
    description: 'Tên của file',
    example: 'anh-feedback.jpg'
  })
  @IsString()
  @IsNotEmpty()
  name: string;
}

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
    example: 5,
    description: 'Điểm đánh giá từ 1-5 sao'
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ 
    example: 'Sự kiện rất hay và bổ ích!',
    required: false,
    description: 'Nhận xét chi tiết về sự kiện'
  })
  @IsOptional()
  @IsString()
  comments?: string;

  @ApiProperty({ 
    type: [EventFeedbackFileDto],
    required: false,
    description: 'Danh sách hình ảnh đính kèm'
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventFeedbackFileDto)
  images?: EventFeedbackFileDto[];
}