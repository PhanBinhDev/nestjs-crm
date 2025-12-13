import { UserModule } from '@/api/users/user.module';
import { NotificationQueueModule } from '@/background/queues/notification-queue/notification-queue.module';
import { CloudinaryModule } from '@/cloudinary/cloudinary.module';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceTokensModule } from '../device-token/device-tokens.module';
import { FileEntity } from '../files/entities/files.entity';
import { NotificationEntity } from './entities/notification.entity';
import { NotificationPreference } from './entities/notification-preference.entity';
import { FirebaseModule } from './firebase.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [
    FirebaseModule,
    UserModule,
    DeviceTokensModule,
    TypeOrmModule.forFeature([NotificationEntity, NotificationPreference, FileEntity]),
    forwardRef(() => NotificationQueueModule),
    CloudinaryModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
