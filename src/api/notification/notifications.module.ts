import { UserModule } from '@/api/users/user.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceTokensModule } from '../device-token/device-tokens.module';
import { NotificationEntity } from './entities/notification.entity';
import { FirebaseModule } from './firebase.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [
    FirebaseModule,
    UserModule,
    DeviceTokensModule,
    TypeOrmModule.forFeature([NotificationEntity]),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
