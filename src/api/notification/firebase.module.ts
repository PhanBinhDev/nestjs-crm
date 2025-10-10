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
        const serviceAccountJson = configService.get('noti.serviceAccountKey', {
          infer: true,
        });

        // Nếu không có service account key, trả về null thay vì throw error
        if (!serviceAccountJson || serviceAccountJson.trim() === '') {
          console.warn(
            'Firebase service account key is not provided. Firebase features will be disabled.',
          );
          return null;
        }

        try {
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
        } catch (error) {
          console.error('Error parsing Firebase service account key:', error);
          return null;
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: ['FIREBASE_ADMIN'],
})
export class FirebaseModule {}
