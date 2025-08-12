import { Injectable } from '@nestjs/common';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  async saveFile(file: Express.Multer.File): Promise<string> {
    const uploadDir = join(process.cwd(), 'uploads');
    if (!existsSync(uploadDir)) mkdirSync(uploadDir);

    let fileName = file.originalname;
    if (!fileName || fileName.trim() === '') {
      const ext = file.mimetype?.split('/')[1] || 'bin';
      fileName = `${uuidv4()}.${ext}`;
    }

    const filePath = join(uploadDir, fileName);
    writeFileSync(filePath, file.buffer);

    return `/uploads/${fileName}`;
  }

  async saveFiles(files: Express.Multer.File[]): Promise<string[]> {
    const uploadDir = join(process.cwd(), 'uploads');
    if (!existsSync(uploadDir)) mkdirSync(uploadDir);

    return Promise.all(
      files.map(async (file) => {
        let fileName = file.originalname;
        if (!fileName || fileName.trim() === '') {
          const ext = file.mimetype?.split('/')[1] || 'bin';
          fileName = `${uuidv4()}.${ext}`;
        }
        const filePath = join(uploadDir, fileName);
        writeFileSync(filePath, file.buffer);
        return `/uploads/${fileName}`;
      }),
    );
  }
}
