import { EventFeedbackRating } from '../entities/event-feedback.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { EventFeedbackFileResDto } from './event-feedback-file.res.dto';

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
    enum: EventFeedbackRating,
    example: EventFeedbackRating.FIVE
  })
  @Expose()
  rating: EventFeedbackRating;

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

  @ApiProperty({
    type: [EventFeedbackFileResDto],
    required: false,
    description: 'Danh sách file đính kèm'
  })
  @Expose()
  @Type(() => EventFeedbackFileResDto)
  files?: EventFeedbackFileResDto[];
}
