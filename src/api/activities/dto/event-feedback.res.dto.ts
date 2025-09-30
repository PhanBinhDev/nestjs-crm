import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class EventFeedbackResDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty({ 
    example: 'user@example.com'
  })
  @Expose()
  email: string;

  @ApiProperty({ 
    example: '0123456789',
    required: false
  })
  @Expose()
  numPhone?: string;

  @ApiProperty({ 
    example: 'Nguyễn Văn A'
  })
  @Expose()
  fullName: string;

  @ApiProperty({ 
    example: 'SV001'
  })
  @Expose()
  studentId: string;

  @ApiProperty({ 
    example: 5,
    description: 'Điểm đánh giá từ 1-5 sao'
  })
  @Expose()
  rating: number;

  @ApiProperty({ 
    example: 'Sự kiện rất hay và bổ ích!',
    required: false
  })
  @Expose()
  comments?: string;

  @ApiProperty({ 
    example: 'https://example.com/image.jpg',
    required: false
  })
  @Expose()
  image?: string;

  @ApiProperty()
  @Expose()
  submittedAt: Date;
}
