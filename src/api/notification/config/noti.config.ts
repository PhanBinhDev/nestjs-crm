import validateConfig from '@/utils/validate-config';
import { registerAs } from '@nestjs/config';
import { IsOptional, IsString } from 'class-validator';
import process from 'node:process';
import { NotiConfig } from './noti-config.type';

class NotiVariablesValidator {
  @IsString()
  @IsOptional()
  SERVICE_ACCOUNT_KEY: string;
}

export default registerAs<NotiConfig>('noti', () => {
  console.log('Loading noti configuration...');

  validateConfig(process.env, NotiVariablesValidator);

  return {
    serviceAccountKey: process.env.SERVICE_ACCOUNT_KEY || '',
  };
});
