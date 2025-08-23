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

        const rawData = fs.readFileSync(serviceAccountPath, 'utf8');
        const serviceAccount = JSON.parse(rawData);

        return admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      },
    },
  ],
  exports: ['FIREBASE_ADMIN'],
})
export class FirebaseModule {}
