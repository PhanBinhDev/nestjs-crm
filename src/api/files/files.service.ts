import { ResponseNoDataDto } from '@/common/dto/response/response-no-data.dto';
import { ResponseDto } from '@/common/dto/response/response.dto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { FilesResponseDto } from './dto/files.res.dto';
import { FileEntity } from './entities/files.entity';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepo: Repository<FileEntity>,
  ) {}

  async saveFile(
    data: Partial<FileEntity>,
  ): Promise<ResponseDto<FilesResponseDto>> {
    const file = this.fileRepo.create(data);
    const res = await this.fileRepo.save(file);
    return new ResponseDto<FilesResponseDto>({
      data: plainToInstance(FilesResponseDto, res, {
        excludeExtraneousValues: true,
      }),
      message: 'Tạo file thành công',
    });
  }

  async findAll(): Promise<ResponseDto<FilesResponseDto[]>> {
    const files = await this.fileRepo.find({ where: { isDeleted: false } });
    return new ResponseDto<FilesResponseDto[]>({
      data: plainToInstance(FilesResponseDto, files, {
        excludeExtraneousValues: true,
      }),
      message: 'Lấy danh sách file thành công',
    });
  }

  async remove(id: string): Promise<ResponseNoDataDto> {
    await this.fileRepo.update(id, { isDeleted: true });
    return new ResponseNoDataDto({
      message: 'Xóa file thành công',
    });
  }

  async findByUser(userId: string): Promise<ResponseDto<FilesResponseDto[]>> {
    const files = await this.fileRepo.find({
      where: { isDeleted: false, uploadedBy: userId },
    });
    return new ResponseDto<FilesResponseDto[]>({
      data: plainToInstance(FilesResponseDto, files, {
        excludeExtraneousValues: true,
      }),
      message: 'Lấy danh sách file theo người dùng thành công',
    });
  }
}
