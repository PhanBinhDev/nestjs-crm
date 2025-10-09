import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as admin from 'firebase-admin';
import * as fs from 'node:fs';
import path from 'node:path';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'FIREBASE_ADMIN',
      useFactory: () => {
        const serviceAccountPath = path.join(
          process.cwd(),
          'serviceAccountKey.json',
        );

        // Kiểm tra xem file có tồn tại không
        if (!fs.existsSync(serviceAccountPath)) {
          console.warn(
            '⚠️  serviceAccountKey.json không tồn tại. Firebase sẽ không khả dụng.',
          );

          // Trả về mock object để tránh crash
          return {
            messaging: () => ({
              send: () => Promise.resolve({ messageId: 'mock' }),
              sendMulticast: () =>
                Promise.resolve({
                  successCount: 0,
                  failureCount: 0,
                  responses: [],
                }),
            }),
            auth: () => ({
              verifyIdToken: () =>
                Promise.reject(new Error('Firebase not configured')),
            }),
          };
        }

        try {
          const rawData = fs.readFileSync(serviceAccountPath, 'utf8');
          const serviceAccount = JSON.parse(rawData);

          // Kiểm tra xem Firebase Admin đã được khởi tạo chưa
          if (admin.apps.length === 0) {
            return admin.initializeApp({
              credential: admin.credential.cert(serviceAccount),
            });
          }

          return admin.app();
        } catch (error) {
          console.error('❌ Lỗi khởi tạo Firebase Admin:', error);

          // Trả về mock object
          return {
            messaging: () => ({
              send: () => Promise.resolve({ messageId: 'mock' }),
              sendMulticast: () =>
                Promise.resolve({
                  successCount: 0,
                  failureCount: 0,
                  responses: [],
                }),
            }),
            auth: () => ({
              verifyIdToken: () =>
                Promise.reject(new Error('Firebase not configured')),
            }),
          };
        }
      },
    },
  ],
  exports: ['FIREBASE_ADMIN'],
})
export class FirebaseModule {}
