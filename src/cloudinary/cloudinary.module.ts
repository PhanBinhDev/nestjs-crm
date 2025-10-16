import { AllConfigType } from '@/config/config.type';
import { PROVIDER } from '@/constants/app.constant';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 } from 'cloudinary';
import { CloudinaryService } from './cloudinary.service';

@Module({
  providers: [
    {
      provide: PROVIDER.CLOUDINARY,
      useFactory: (configService: ConfigService<AllConfigType>) => {
        return v2.config({
          cloud_name: configService.getOrThrow('cloudinary.cloudName', {
            infer: true,
          }),
          api_key: configService.getOrThrow('cloudinary.apiKey', {
            infer: true,
          }),
          api_secret: configService.getOrThrow('cloudinary.apiSecret', {
            infer: true,
          }),
        });
      },
      inject: [ConfigService],
    },
    CloudinaryService,
  ],
  exports: [PROVIDER.CLOUDINARY, CloudinaryService],
})
export class CloudinaryModule {}
