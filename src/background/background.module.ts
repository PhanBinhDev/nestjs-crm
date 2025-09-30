import { AllConfigType } from '@/config/config.type';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailQueueModule } from './queues/email-queue/email-queue.module';
import { NotificationQueueModule } from './queues/notification-queue/notification-queue.module';
@Module({
  imports: [
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
  providers: [NotificationQueueModule],
})
export class BackgroundModule {}
