import { Uuid } from '@/common/types/common.type';
import { Injectable } from '@nestjs/common';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { FilesService } from '../files/files.service';

@Injectable()
export class UploadService {
  constructor(private readonly filesService: FilesService) {}

  async saveFile(
    file: Express.Multer.File,
    uploadedBy?: Uuid,
  ): Promise<string> {
    const uploadDir = join(process.cwd(), 'uploads');
    if (!existsSync(uploadDir)) mkdirSync(uploadDir);

    let fileName = file.originalname;
    if (!fileName || fileName.trim() === '') {
      const ext = file.mimetype?.split('/')[1] || 'bin';
      fileName = `${uuidv4()}.${ext}`;
    }

    const filePath = join(uploadDir, fileName);
    writeFileSync(filePath, file.buffer);

    const url = `/uploads/${fileName}`;

    await this.filesService.saveFile({
      url,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      fileName,
      destination: uploadDir,
      uploadedBy,
      isDeleted: false,
    });

    return url;
  }

  async saveFiles(
    files: Express.Multer.File[],
    uploadedBy?: Uuid,
  ): Promise<string[]> {
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
        const url = `/uploads/${fileName}`;

        await this.filesService.saveFile({
          url,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          fileName,
          destination: uploadDir,
          uploadedBy,
          isDeleted: false,
        });

        return url;
      }),
    );
  }
}
