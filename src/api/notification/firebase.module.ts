import { AllConfigType } from '@/config/config.type';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'FIREBASE_ADMIN',
      useFactory: (configService: ConfigService<AllConfigType>) => {
        const serviceAccountJson = configService.getOrThrow(
          'noti.serviceAccountKey',
          {
            infer: true,
          },
        );

        if (!serviceAccountJson) {
          throw new Error(
            'Firebase service account key is not provided in configuration.',
          );
        }

        const serviceAccount = JSON.parse(serviceAccountJson);

        if (
          serviceAccount.private_key &&
          typeof serviceAccount.private_key === 'string'
        ) {
          serviceAccount.private_key = serviceAccount.private_key.replace(
            /\\n/g,
            '\n',
          );
        }

        return admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: ['FIREBASE_ADMIN'],
})
export class FirebaseModule {}
