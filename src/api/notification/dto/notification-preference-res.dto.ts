import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { NotificationPreferenceType } from '@/database/enum/notification-preference.enum';

export class NotificationPreferenceResDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty({ enum: NotificationPreferenceType })
  @Expose()
  type: NotificationPreferenceType;

  @ApiProperty()
  @Expose()
  enabled: boolean;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;
}

export class NotificationPreferencesListResDto {
  @ApiProperty({ type: [NotificationPreferenceResDto] })
  @Expose()
  preferences: NotificationPreferenceResDto[];
}

