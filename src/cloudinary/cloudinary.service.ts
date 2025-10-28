import { Injectable } from '@nestjs/common';
import toStream from 'buffer-to-stream';
import {
  UploadApiErrorResponse,
  UploadApiOptions,
  UploadApiResponse,
  v2,
} from 'cloudinary';

@Injectable()
export class CloudinaryService {
  async uploadFile(
    file: Express.Multer.File,
    options: UploadApiOptions = {},
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      const upload = v2.uploader.upload_stream(options, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });

      toStream(file.buffer).pipe(upload);
    });
  }

  async uploadFiles(
    files: Express.Multer.File[],
    options: UploadApiOptions = {},
  ): Promise<(UploadApiResponse | UploadApiErrorResponse)[]> {
    return Promise.all(files.map((file) => this.uploadFile(file, options)));
  }

  async uploadToFolder(
    file: Express.Multer.File,
    folder: string,
    fileName?: string,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    const options: UploadApiOptions = {
      folder,
      resource_type: 'auto',
    };

    if (fileName) {
      options.public_id = fileName;
    }

    console.log('Uploading to folder:', folder, 'with options:', options);

    return this.uploadFile(file, options);
  }

  async uploadFilesToFolder(
    files: Express.Multer.File[],
    folder: string,
  ): Promise<(UploadApiResponse | UploadApiErrorResponse)[]> {
    return Promise.all(files.map((file) => this.uploadToFolder(file, folder)));
  }

  async deleteFile(
    publicId: string,
    resourceType: 'image' | 'video' | 'raw' = 'image',
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      v2.uploader.destroy(
        publicId,
        {
          resource_type: resourceType,
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );
    });
  }
}
