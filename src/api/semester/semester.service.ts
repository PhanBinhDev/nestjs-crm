import { PageOptionsDto } from '@/common/dto/offset-pagination/page-options.dto';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { ResponseNoDataDto } from '@/common/dto/response/response-no-data.dto';
import { ResponseDto } from '@/common/dto/response/response.dto';
import { Uuid } from '@/common/types/common.type';
import { SemesterStatus } from '@/database/enum/semeter.enum';
import { BaseService } from '@/services/base.service';
import { paginate } from '@/utils/offset-pagination';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { SemesterBlockDto } from './dto/create-block.dto';
import { CreateSemesterDto } from './dto/create-semester.dto';
import { SemesterResDto } from './dto/semester.res.dto';
import { UpdateSemesterDto } from './dto/update-semester.dto';
import { SemesterBlockEntity } from './entities/semester-block.entity';
import { SemesterEntity } from './entities/semester.entity';

@Injectable()
export class SemesterService extends BaseService<SemesterEntity> {
  constructor(
    @InjectRepository(SemesterEntity)
    private readonly semesterRepo: Repository<SemesterEntity>,
    @InjectRepository(SemesterBlockEntity)
    private readonly semesterBlockRepo: Repository<SemesterBlockEntity>,
  ) {
    super(semesterRepo);
  }

  async findBlockById(id: Uuid) {
    const block = await this.semesterBlockRepo.findOneOrFail({ where: { id } });
    return block;
  }

  async deleteBlock(id: Uuid) {
    await this.semesterBlockRepo.delete(id);
    return { message: 'Xóa block thành công' };
  }

  async create(dto: CreateSemesterDto): Promise<ResponseDto<SemesterResDto>> {
    if (dto.startDate >= dto.endDate) {
      throw new BadRequestException('Ngày bắt đầu phải trước ngày kết thúc');
    }

    const { blocks, ...semesterData } = dto;

    const semester = this.semesterRepo.create(semesterData);
    const savedSemester = await this.semesterRepo.save(semester);

    if (blocks && blocks.length > 0) {
      const blockEntities = blocks.map((block) => ({
        ...block,
        semester: savedSemester,
        semesterId: savedSemester.id,
      }));
      await this.semesterBlockRepo.save(blockEntities);
      const semesterWithBlocks = await this.semesterRepo.findOne({
        where: { id: savedSemester.id },
        relations: ['blocks'],
      });
      return new ResponseDto<SemesterResDto>({
        data: plainToInstance(SemesterResDto, semesterWithBlocks, {
          excludeExtraneousValues: true,
        }),
        message: 'Tạo học kỳ thành công',
      });
    }
    return new ResponseDto<SemesterResDto>({
      data: plainToInstance(SemesterResDto, savedSemester, {
        excludeExtraneousValues: true,
      }),
      message: 'Tạo học kỳ thành công',
    });
  }

  async findAll(
    query: PageOptionsDto,
  ): Promise<OffsetPaginatedDto<SemesterResDto>> {
    const qb = this.semesterRepo
      .createQueryBuilder('semester')
      .leftJoinAndSelect('semester.blocks', 'blocks')
      .orderBy('semester.createdAt', 'DESC');

    const [semesters, metaDto] = await paginate<SemesterEntity>(qb, query, {
      skipCount: false,
      takeAll: false,
    });

    // Đảm bảo mỗi semester đều có blocks là mảng
    const normalizedSemesters = semesters.map((s) => ({
      ...s,
      blocks: Array.isArray(s.blocks) ? s.blocks : [],
    }));
    return new OffsetPaginatedDto({
      data: plainToInstance(SemesterResDto, normalizedSemesters, {
        excludeExtraneousValues: true,
      }),
      meta: metaDto,
      message: 'Lấy danh sách học kỳ thành công',
    });
  }

  async findById(id: Uuid): Promise<ResponseDto<SemesterResDto>> {
    const semester = await this.semesterRepo.findOneOrFail({
      where: { id },
      relations: ['blocks'],
    });

    // Đảm bảo blocks là mảng
    const normalizedSemester = {
      ...semester,
      blocks: Array.isArray(semester.blocks) ? semester.blocks : [],
    };
    return new ResponseDto<SemesterResDto>({
      data: plainToInstance(SemesterResDto, normalizedSemester, {
        excludeExtraneousValues: true,
      }),
      message: 'Lấy thông tin học kỳ thành công',
    });
  }

  async deleteSemester(id: Uuid): Promise<ResponseNoDataDto> {
    await this.semesterRepo.delete(id);

    return new ResponseNoDataDto({
      message: 'Xóa học kỳ thành công',
    });
  }

  async updateSemester(
    id: Uuid,
    dto: UpdateSemesterDto,
  ): Promise<ResponseDto<SemesterResDto>> {
    const semester = await this.semesterRepo.findOneOrFail({
      where: { id },
      relations: ['blocks'],
    });

    if (dto.startDate && dto.endDate && dto.startDate >= dto.endDate) {
      throw new BadRequestException('Ngày bắt đầu phải trước ngày kết thúc');
    }

    // Cập nhật thông tin semester
    Object.assign(semester, dto);
    await this.semesterRepo.save(semester);

    // Cập nhật blocks nếu có
    if (dto.blocks) {
      await this.semesterBlockRepo.delete({ semesterId: semester.id });
      // Tạo lại blocks mới
      const blockEntities = dto.blocks.map((block) => ({
        ...block,
        semester: semester,
        semesterId: semester.id,
      }));
      await this.semesterBlockRepo.save(blockEntities);
      // Lấy lại semester kèm blocks
      const semesterWithBlocks = await this.semesterRepo.findOne({
        where: { id: semester.id },
        relations: ['blocks'],
      });
      return new ResponseDto<SemesterResDto>({
        data: plainToInstance(SemesterResDto, semesterWithBlocks, {
          excludeExtraneousValues: true,
        }),
        message: 'Cập nhật học kỳ thành công',
      });
    }
    // Nếu không có blocks
    const normalizedSemester = {
      ...semester,
      blocks: Array.isArray(semester.blocks) ? semester.blocks : [],
    };
    return new ResponseDto<SemesterResDto>({
      data: plainToInstance(SemesterResDto, normalizedSemester, {
        excludeExtraneousValues: true,
      }),
      message: 'Cập nhật học kỳ thành công',
    });
  }

  async findActiveSemester(): Promise<ResponseDto<SemesterResDto>> {
    const semester = await this.semesterRepo.findOne({
      where: { status: SemesterStatus.ONGOING },
      order: { createdAt: 'DESC' },
      relations: ['blocks'],
    });

    if (!semester) {
      throw new NotFoundException('Không tìm thấy học kỳ đang diễn ra');
    }

    // Đảm bảo blocks là mảng
    const normalizedSemester = {
      ...semester,
      blocks: Array.isArray(semester.blocks) ? semester.blocks : [],
    };
    return new ResponseDto<SemesterResDto>({
      data: plainToInstance(SemesterResDto, normalizedSemester, {
        excludeExtraneousValues: true,
      }),
      message: 'Lấy học kỳ đang diễn ra thành công',
    });
  }

  async createBlock(
    semesterId: Uuid,
    dto: SemesterBlockDto,
  ): Promise<ResponseDto<SemesterBlockEntity>> {
    const semester = await this.semesterRepo.findOneOrFail({
      where: { id: semesterId },
      relations: ['blocks'],
    });

    if (!semester) {
      throw new NotFoundException('Học kỳ không tồn tại');
    }

    // Kiểm tra xem block đã tồn tại chưa
    const existingBlock = semester.blocks.find(
      (block) => block.name === dto.name,
    );
    if (existingBlock) {
      throw new BadRequestException('Block với tên này đã tồn tại');
    }

    // Tạo block mới
    const newBlock = this.semesterBlockRepo.create({
      ...dto,
      semester,
      semesterId: semester.id,
    });
    await this.semesterBlockRepo.save(newBlock);

    return new ResponseDto<SemesterBlockEntity>({
      data: plainToInstance(SemesterBlockEntity, newBlock, {
        excludeExtraneousValues: true,
      }),
      message: 'Tạo block học kỳ thành công',
    });
  }
}
