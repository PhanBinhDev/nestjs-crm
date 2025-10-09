// dto/test-notification.dto.ts
import {
  StringField,
  StringFieldOptional,
} from '@/decorators/field.decorators';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class TestNotificationDto {
  @StringField({
    description: 'Tiêu đề thông báo test',
    example: 'Test Notification',
  })
  @IsString()
  title: string;

  @StringField({
    description: 'Nội dung thông báo test',
    example: 'This is a test notification',
  })
  @IsString()
  message: string;

  @StringFieldOptional({
    description: 'Loại thông báo',
    example: 'TEST',
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    description: 'Dữ liệu bổ sung',
    example: { action: 'test' },
  })
  @IsOptional()
  data?: Record<string, any>;
}
