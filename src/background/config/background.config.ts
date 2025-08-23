import validateConfig from '@/utils/validate-config';
import { registerAs } from '@nestjs/config';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';
import process from 'node:process';
import { BackgroundConfig } from './background-config.type';

class BackgroundConfigValidator {
  @IsInt()
  @IsOptional()
  REDIS_FAMILY: number;

  @IsString()
  @IsOptional()
  REDIS_HOST: string;

  @IsInt()
  @IsOptional()
  REDIS_PORT: number;

  @IsString()
  @IsOptional()
  REDIS_PASSWORD: string;

  @IsBoolean()
  @IsOptional()
  REDIS_TLS: boolean;
}

export default registerAs<BackgroundConfig>('background', () => {
  console.log('Loading background configuration...');

  validateConfig(process.env, BackgroundConfigValidator);

  return {
    redis: {
      family: process.env.REDIS_FAMILY
        ? parseInt(process.env.REDIS_FAMILY, 10)
        : 4,
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT
        ? parseInt(process.env.REDIS_PORT, 10)
        : 6379,
      password: process.env.REDIS_PASSWORD || '',
      tls: {
        ca: process.env.REDIS_TLS_CA || '',
        key: process.env.REDIS_TLS_KEY || '',
        rejectUnauthorized:
          process.env.REDIS_TLS_REJECT_UNAUTHORIZED === 'true',
      },
    },
  };
});
