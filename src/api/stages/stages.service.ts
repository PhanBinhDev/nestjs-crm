import { ResponseNoDataDto } from '@/common/dto/response/response-no-data.dto';
import { ResponseDto } from '@/common/dto/response/response.dto';
import { Uuid } from '@/common/types/common.type';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { CreateStageDto } from './dto/create-stage.dto';
import { StageResDto } from './dto/stage.res.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { StagesEntity } from './entities/stage.entity';

@Injectable()
export class StagesService {
  constructor(
    @InjectRepository(StagesEntity)
    private readonly stagesRepository: Repository<StagesEntity>,
  ) {}

  // Thêm method để sắp xếp lại position
  private async reorderStages(): Promise<void> {
    const stages = await this.stagesRepository.find({
      order: { position: 'ASC' },
    });

    // Gán lại position từ 0 đến n-1
    for (let i = 0; i < stages.length; i++) {
      if (stages[i].position !== i) {
        await this.stagesRepository.update(stages[i].id, { position: i });
      }
    }
  }

  async create(
    createStageDto: CreateStageDto,
  ): Promise<ResponseDto<StageResDto>> {
    let position = createStageDto.position;

    // Nếu không truyền position, thêm vào cuối
    if (position === undefined || position === null) {
      const max = await this.stagesRepository
        .createQueryBuilder('stage')
        .select('MAX(stage.position)', 'max')
        .getRawOne();
      position = (max?.max ?? -1) + 1;
    }

    // Đảm bảo position không âm
    position = Math.max(0, position);

    // Kiểm tra xem position đã tồn tại chưa
    const existingStages = await this.stagesRepository.find({
      order: { position: 'ASC' },
    });

    // Nếu position nằm giữa các stage hiện có, dịch các stage phía sau
    if (existingStages.some((stage) => stage.position === position)) {
      await this.stagesRepository
        .createQueryBuilder()
        .update(StagesEntity)
        .set({ position: () => '"position" + 1' })
        .where('"position" >= :position', { position })
        .execute();
    }

    // Tạo stage mới
    const stage = this.stagesRepository.create({
      ...createStageDto,
      position,
    });
    await this.stagesRepository.save(stage);

    // Sau khi tạo, kiểm tra và điều chỉnh lại các position để đảm bảo liền kề
    await this.reorderStages();

    // Lấy stage vừa tạo với position đã được điều chỉnh
    const savedStage = await this.stagesRepository.findOneBy({ id: stage.id });

    return new ResponseDto<StageResDto>({
      data: plainToInstance(StageResDto, savedStage, {
        excludeExtraneousValues: true,
      }),
      message: 'Tạo trạng thái (stage) thành công',
    });
  }

  async findAll(): Promise<ResponseDto<StageResDto[]>> {
    const stages = await this.stagesRepository.find();
    return new ResponseDto<StageResDto[]>({
      data: plainToInstance(StageResDto, stages, {
        excludeExtraneousValues: true,
      }),
      message: 'Danh sách trạng thái (stages) được lấy thành công',
    });
  }

  async findOne(id: Uuid): Promise<ResponseDto<StageResDto>> {
    const stage = await this.stagesRepository.findOne({ where: { id } });
    if (!stage) throw new NotFoundException('Stage not found');
    return new ResponseDto<StageResDto>({
      data: plainToInstance(StageResDto, stage, {
        excludeExtraneousValues: true,
      }),
      message: 'Lấy trạng thái (stage) thành công',
    });
  }

  async update(
    id: Uuid,
    updateStageDto: UpdateStageDto,
  ): Promise<ResponseDto<StageResDto>> {
    const stageEntity = await this.stagesRepository.findOne({ where: { id } });
    if (!stageEntity) {
      throw new NotFoundException('Trạng thái (stage) không tồn tại');
    }

    // Nếu có thay đổi position
    if (
      updateStageDto.position !== undefined &&
      updateStageDto.position !== null &&
      updateStageDto.position !== stageEntity.position
    ) {
      const existingStages = await this.stagesRepository.find({
        order: { position: 'ASC' },
      });

      // Đảm bảo position mới nằm trong khoảng hợp lệ
      const newPosition = Math.max(
        0,
        Math.min(updateStageDto.position, existingStages.length - 1),
      );

      // Cập nhật position của các stage khác
      if (newPosition > stageEntity.position) {
        // Kéo xuống: Giảm position của các stage nằm giữa vị trí cũ và mới
        await this.stagesRepository
          .createQueryBuilder()
          .update(StagesEntity)
          .set({ position: () => '"position" - 1' })
          .where('position > :oldPosition AND position <= :newPosition', {
            oldPosition: stageEntity.position,
            newPosition,
          })
          .execute();
      } else if (newPosition < stageEntity.position) {
        // Kéo lên: Tăng position của các stage nằm giữa vị trí mới và cũ
        await this.stagesRepository
          .createQueryBuilder()
          .update(StagesEntity)
          .set({ position: () => '"position" + 1' })
          .where('position >= :newPosition AND position < :oldPosition', {
            oldPosition: stageEntity.position,
            newPosition,
          })
          .execute();
      }

      // Cập nhật position của stage hiện tại
      stageEntity.position = newPosition;
    }

    // Cập nhật các trường khác
    Object.assign(stageEntity, updateStageDto);

    // Lưu stage đã cập nhật
    await this.stagesRepository.save(stageEntity);

    // Đảm bảo các position liền kề
    await this.reorderStages();

    // Lấy stage đã được cập nhật
    const updatedStage = await this.stagesRepository.findOneBy({ id });

    return new ResponseDto<StageResDto>({
      data: plainToInstance(StageResDto, updatedStage, {
        excludeExtraneousValues: true,
      }),
      message: 'Cập nhật trạng thái (stage) thành công',
    });
  }

  async remove(id: Uuid): Promise<ResponseNoDataDto> {
    const stageEntity = await this.stagesRepository.findOne({ where: { id } });
    if (!stageEntity) throw new NotFoundException('Stage not found');

    await this.stagesRepository.remove(stageEntity);

    // Sau khi xóa, reorder lại để đảm bảo liền kề
    await this.reorderStages();

    return new ResponseNoDataDto({
      message: 'Xóa trạng thái (stage) thành công',
    });
  }
}
