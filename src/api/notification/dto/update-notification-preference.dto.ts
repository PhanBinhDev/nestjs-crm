import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationPreferenceType } from '@/database/enum/notification-preference.enum';

export class UpdateNotificationPreferenceDto {
  @ApiProperty({ enum: NotificationPreferenceType })
  @IsEnum(NotificationPreferenceType)
  type: NotificationPreferenceType;

  @ApiProperty()
  @IsBoolean()
  enabled: boolean;
}

export class UpdateNotificationPreferencesDto {
  @ApiProperty({ type: [UpdateNotificationPreferenceDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateNotificationPreferenceDto)
  preferences: UpdateNotificationPreferenceDto[];
}

