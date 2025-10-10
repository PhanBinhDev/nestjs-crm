import { Module, Logger } from '@nestjs/common';
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
        const logger = new Logger('FirebaseModule');
        const serviceAccountPath = path.join(
          process.cwd(),
          'serviceAccountKey.json',
        );

        try {
          if (!fs.existsSync(serviceAccountPath)) {
            logger.warn(`Firebase service account file not found at ${serviceAccountPath}. Firebase features will be disabled.`);
            return null;
          }

          const rawData = fs.readFileSync(serviceAccountPath, 'utf8');
          const serviceAccount = JSON.parse(rawData);

          return admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
          });
        } catch (error) {
          logger.error('Failed to initialize Firebase:', error.message);
          return null;
        }
      },
    },
  ],
  exports: ['FIREBASE_ADMIN'],
})
export class FirebaseModule {}
