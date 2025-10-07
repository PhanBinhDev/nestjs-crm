import { ActivityLogEntity } from '@/api/activities/entities/activity-log.entity';
import { ActivityEntity } from '@/api/activities/entities/activity.entity';
import { UserEntity } from '@/api/users/entities/user.entity';
import { AllConfigType } from '@/config/config.type';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BackgroundController } from './controller/background.controller';
import { EmailQueueModule } from './queues/email-queue/email-queue.module';
import { NotificationQueueModule } from './queues/notification-queue/notification-queue.module';
import { OverdueCheckService } from './service/overdue-check.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([ActivityEntity, ActivityLogEntity, UserEntity]),
    EmailQueueModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService<AllConfigType>) => {
        return {
          connection: {
            family:
              configService.getOrThrow('background.redis.family', {
                infer: true,
              }) || 4,
            host:
              configService.getOrThrow('background.redis.host', {
                infer: true,
              }) || 'localhost',
            port:
              configService.getOrThrow('background.redis.port', {
                infer: true,
              }) || 6379,
            password:
              configService.getOrThrow('background.redis.password', {
                infer: true,
              }) || '',
            tls: {
              ca: configService.getOrThrow('background.redis.tls.ca', {
                infer: true,
              }),
              key: configService.getOrThrow('background.redis.tls.key', {
                infer: true,
              }),
              rejectUnauthorized: configService.getOrThrow(
                'background.redis.tls.rejectUnauthorized',
                {
                  infer: true,
                },
              ),
            },
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [BackgroundController],
  providers: [NotificationQueueModule, OverdueCheckService],
  exports: [OverdueCheckService],
})
export class BackgroundModule {}
