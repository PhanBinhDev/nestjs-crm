import { ResponseNoDataDto } from '@/common/dto/response/response-no-data.dto';
import { ResponseDto } from '@/common/dto/response/response.dto';
import { Uuid } from '@/common/types/common.type';
import { StageGroup } from '@/database/enum/stage.enum';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { CreateStageDto } from './dto/create-stage.dto';
import { QueryStageDto } from './dto/query-stage.dto';
import { StageResDto } from './dto/stage.res.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { StagesEntity } from './entities/stage.entity';

@Injectable()
export class StagesService {
  private readonly logger = new Logger(StagesService.name);

  constructor(
    @InjectRepository(StagesEntity)
    private readonly stagesRepository: Repository<StagesEntity>,
  ) {}

  // Hàm tạo stage mới với các ràng buộc
  async create(
    createStageDto: CreateStageDto,
  ): Promise<ResponseDto<StageResDto>> {
    const { stageGroup = StageGroup.ACTIVE } = createStageDto;

    // Kiểm tra ràng buộc: không cho phép tạo thêm stage trong nhóm CLOSED
    if (stageGroup === StageGroup.CLOSED) {
      throw new BadRequestException(
        'Không thể tạo thêm stage trong nhóm Closed',
      );
    }

    // Tính position tổng thể
    const allStages = await this.stagesRepository.find({
      order: { position: 'ASC' },
    });

    // Tính vị trí trong nhóm
    let groupPosition = 0;
    const stagesInGroup = await this.stagesRepository.find({
      where: { stageGroup },
      order: { groupPosition: 'ASC' },
    });

    if (stagesInGroup.length > 0) {
      groupPosition = stagesInGroup[stagesInGroup.length - 1].groupPosition + 1;
    }

    // Tính position chung
    let position = createStageDto.position;
    if (position === undefined) {
      // Tính vị trí cuối của nhóm
      const stageGroups = [
        StageGroup.NOT_STARTED,
        StageGroup.ACTIVE,
        StageGroup.DONE,
        StageGroup.CLOSED,
      ];
      const groupIndex = stageGroups.indexOf(stageGroup);

      let lastPositionInPreviousGroups = -1;

      if (groupIndex > 0) {
        const previousGroup = stageGroups[groupIndex - 1];
        const lastStageInPreviousGroup = await this.stagesRepository.find({
          where: { stageGroup: previousGroup },
          order: { position: 'DESC' },
          take: 1,
        });

        if (lastStageInPreviousGroup.length > 0) {
          lastPositionInPreviousGroups = lastStageInPreviousGroup[0].position;
        }
      }

      position = lastPositionInPreviousGroups + 1;

      // Kiểm tra xem có stage nào sau position này không
      const nextStages = allStages.filter((s) => s.position >= position);

      // Dời các stages sau vị trí này
      if (nextStages.length > 0) {
        await this.stagesRepository
          .createQueryBuilder()
          .update(StagesEntity)
          .set({ position: () => 'position + 1' })
          .where('position >= :position', { position })
          .execute();
      }
    } else {
      // Kiểm tra ràng buộc vị trí dựa trên stageGroup
      const stageGroups = [
        StageGroup.NOT_STARTED,
        StageGroup.ACTIVE,
        StageGroup.DONE,
        StageGroup.CLOSED,
      ];
      const requestedGroupIndex = stageGroups.indexOf(stageGroup);

      // Tìm stage tại vị trí đã yêu cầu
      const stageAtPosition = allStages.find((s) => s.position === position);

      if (stageAtPosition) {
        const existingGroupIndex = stageGroups.indexOf(
          stageAtPosition.stageGroup,
        );

        // Không cho phép tạo stage ở nhóm khác với vị trí đã yêu cầu
        if (requestedGroupIndex !== existingGroupIndex) {
          throw new BadRequestException(
            `Không thể tạo stage tại vị trí này vì nó thuộc về nhóm ${stageAtPosition.stageGroup}`,
          );
        }

        // Dịch các stages sau vị trí này
        await this.stagesRepository
          .createQueryBuilder()
          .update(StagesEntity)
          .set({ position: () => 'position + 1' })
          .where('position >= :position', { position })
          .execute();
      }
    }

    // Tạo stage mới
    const stage = this.stagesRepository.create({
      ...createStageDto,
      position,
      stageGroup,
      groupPosition,
      isBuiltIn: false,
    });

    await this.stagesRepository.save(stage);

    // Đảm bảo vị trí trong nhóm liên tục
    await this.reorderStagesInGroup(stageGroup);

    // Lấy lại stage đã tạo
    const savedStage = await this.stagesRepository.findOne({
      where: { id: stage.id },
    });

    return new ResponseDto<StageResDto>({
      data: plainToInstance(StageResDto, savedStage, {
        excludeExtraneousValues: true,
      }),
      message: 'Tạo trạng thái (stage) thành công',
    });
  }

  async findAll(query: QueryStageDto): Promise<ResponseDto<StageResDto[]>> {
    const qb = this.stagesRepository.createQueryBuilder('stage');

    if (query.q) {
      qb.andWhere('stage.title ILIKE :search', { search: `%${query.q}%` });
    }

    if (query.stageGroup) {
      qb.andWhere('stage.stageGroup = :stageGroup', {
        stageGroup: query.stageGroup,
      });
    }

    if (query.isBuiltIn !== undefined) {
      qb.andWhere('stage.isBuiltIn = :isBuiltIn', {
        isBuiltIn: query.isBuiltIn,
      });
    }

    const allowedSortFields = ['position', 'createdAt'];

    if (query.sortBy) {
      const sortField = allowedSortFields.includes(query.sortBy)
        ? query.sortBy
        : 'createdAt';

      if (!allowedSortFields.includes(query.sortBy)) {
        this.logger.warn(
          `Invalid sortBy field '${query.sortBy}', defaulting to 'createdAt'`,
        );
      }

      qb.addOrderBy(`stage.${sortField}`, query.order || 'DESC');
    } else {
      qb.addOrderBy('stage.position', query.order || 'DESC');
    }

    const stages = await qb.getMany();
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
    console.log('updateStageDto', updateStageDto);

    const stageEntity = await this.stagesRepository.findOne({ where: { id } });
    if (!stageEntity) {
      throw new NotFoundException('Trạng thái (stage) không tồn tại');
    }

    if (
      stageEntity.isBuiltIn &&
      updateStageDto.stageGroup &&
      updateStageDto.stageGroup !== stageEntity.stageGroup
    ) {
      throw new BadRequestException(
        'Không thể thay đổi nhóm của stage mặc định',
      );
    }

    if (
      stageEntity.isBuiltIn &&
      'position' in updateStageDto &&
      updateStageDto.position !== stageEntity.position
    ) {
      console.log(
        'stageEntity.isBuiltIn',
        stageEntity.isBuiltIn,
        'position in updateStageDto',
        'position' in updateStageDto,
        'updateStageDto.position !== stageEntity.position',
        updateStageDto.position !== stageEntity.position,
      );

      throw new BadRequestException(
        'Không thể thay đổi vị trí của stage mặc định',
      );
    }

    const oldStageGroup = stageEntity.stageGroup;
    const newStageGroup = updateStageDto.stageGroup || oldStageGroup;

    // Nếu thay đổi nhóm
    if (newStageGroup !== oldStageGroup) {
      // Kiểm tra các ràng buộc chuyển nhóm
      if (newStageGroup === StageGroup.CLOSED) {
        // Không cho phép thêm stage vào nhóm CLOSED
        throw new BadRequestException('Không thể chuyển stage vào nhóm Closed');
      }

      // Tính toán vị trí mới trong nhóm mới
      const stagesInNewGroup = await this.stagesRepository.find({
        where: { stageGroup: newStageGroup },
        order: { groupPosition: 'ASC' },
      });

      // Thêm vào cuối nhóm mới
      const newGroupPosition = stagesInNewGroup.length;

      // Cập nhật stage
      Object.assign(stageEntity, {
        ...updateStageDto,
        stageGroup: newStageGroup,
        groupPosition: newGroupPosition,
      });

      await this.stagesRepository.save(stageEntity);

      // Reorder lại 2 nhóm
      await this.reorderStagesInGroup(oldStageGroup);
      await this.reorderStagesInGroup(newStageGroup);

      // Cập nhật lại position tổng thể
      await this.updateGlobalPositions();
    } else if (
      updateStageDto.position !== undefined &&
      updateStageDto.position !== stageEntity.position
    ) {
      // Di chuyển trong cùng nhóm
      const stagesInGroup = await this.stagesRepository.find({
        where: { stageGroup: stageEntity.stageGroup },
        order: { groupPosition: 'ASC' },
      });

      const oldGroupPosition = stageEntity.groupPosition;
      const newGroupPosition = Math.min(
        Math.max(0, updateStageDto.position),
        stagesInGroup.length - 1,
      );

      // Cập nhật các stages khác trong nhóm
      if (newGroupPosition > oldGroupPosition) {
        await this.stagesRepository
          .createQueryBuilder()
          .update(StagesEntity)
          .set({ groupPosition: () => 'groupPosition - 1' })
          .where('stageGroup = :stageGroup', {
            stageGroup: stageEntity.stageGroup,
          })
          .andWhere('groupPosition > :oldPos AND groupPosition <= :newPos', {
            oldPos: oldGroupPosition,
            newPos: newGroupPosition,
          })
          .execute();
      } else if (newGroupPosition < oldGroupPosition) {
        await this.stagesRepository
          .createQueryBuilder()
          .update(StagesEntity)
          .set({ groupPosition: () => 'groupPosition + 1' })
          .where('stageGroup = :stageGroup', {
            stageGroup: stageEntity.stageGroup,
          })
          .andWhere('groupPosition >= :newPos AND groupPosition < :oldPos', {
            oldPos: oldGroupPosition,
            newPos: newGroupPosition,
          })
          .execute();
      }

      // Cập nhật stage hiện tại
      Object.assign(stageEntity, {
        ...updateStageDto,
        groupPosition: newGroupPosition,
      });

      await this.stagesRepository.save(stageEntity);

      // Cập nhật position tổng thể
      await this.updateGlobalPositions();
    } else {
      // Chỉ cập nhật các trường khác
      Object.assign(stageEntity, updateStageDto);
      await this.stagesRepository.save(stageEntity);
    }

    // Lấy stage đã cập nhật
    const updatedStage = await this.stagesRepository.findOne({
      where: { id: stageEntity.id },
    });

    return new ResponseDto<StageResDto>({
      data: plainToInstance(StageResDto, updatedStage, {
        excludeExtraneousValues: true,
      }),
      message: 'Cập nhật trạng thái (stage) thành công',
    });
  }

  // Cập nhật hàm remove để áp dụng ràng buộc
  async remove(id: Uuid): Promise<ResponseNoDataDto> {
    const stageEntity = await this.stagesRepository.findOne({ where: { id } });
    if (!stageEntity) throw new NotFoundException('Stage not found');

    // Không cho phép xóa stage mặc định
    if (stageEntity.isBuiltIn) {
      throw new BadRequestException(
        'Không thể xóa stage mặc định của hệ thống',
      );
    }

    const stageGroup = stageEntity.stageGroup;

    await this.stagesRepository.remove(stageEntity);

    // Cập nhật lại vị trí trong nhóm và vị trí toàn cục
    await this.reorderStagesInGroup(stageGroup);
    await this.updateGlobalPositions();

    return new ResponseNoDataDto({
      message: 'Xóa trạng thái (stage) thành công',
    });
  }

  // Cập nhật vị trí tổng thể dựa trên stageGroup và groupPosition
  private async updateGlobalPositions(): Promise<void> {
    // Thứ tự của các nhóm
    const groupOrder = [
      StageGroup.NOT_STARTED,
      StageGroup.ACTIVE,
      StageGroup.DONE,
      StageGroup.CLOSED,
    ];

    let globalPosition = 0;

    // Cập nhật position cho từng nhóm theo thứ tự
    for (const group of groupOrder) {
      const stagesInGroup = await this.stagesRepository.find({
        where: { stageGroup: group },
        order: { groupPosition: 'ASC' },
      });

      for (const stage of stagesInGroup) {
        if (stage.position !== globalPosition) {
          await this.stagesRepository.update(stage.id, {
            position: globalPosition,
          });
        }
        globalPosition++;
      }
    }
  }

  private async reorderStagesInGroup(stageGroup: StageGroup): Promise<void> {
    const stages = await this.stagesRepository.find({
      where: { stageGroup },
      order: { groupPosition: 'ASC' },
    });

    for (let i = 0; i < stages.length; i++) {
      if (stages[i].groupPosition !== i) {
        await this.stagesRepository.update(stages[i].id, { groupPosition: i });
      }
    }
  }

  async initDefaultStages(): Promise<void> {
    const defaultStages = [
      {
        title: 'TO DO',
        color: '#FF0000',
        stageGroup: StageGroup.NOT_STARTED,
        isBuiltIn: true,
        groupPosition: 0,
      },
      {
        title: 'IN PROGRESS',
        color: '#0000FF',
        stageGroup: StageGroup.ACTIVE,
        isBuiltIn: true,
        groupPosition: 0,
      },
      {
        title: 'DONE',
        color: '#00FF00',
        stageGroup: StageGroup.DONE,
        isBuiltIn: true,
        groupPosition: 0,
      },
      {
        title: 'COMPLETE',
        color: '#008000',
        stageGroup: StageGroup.CLOSED,
        isBuiltIn: true,
        groupPosition: 0,
      },
    ];

    for (const groupStage of defaultStages) {
      const existing = await this.stagesRepository.findOne({
        where: {
          stageGroup: groupStage.stageGroup,
          isBuiltIn: true,
        },
      });

      if (!existing) {
        await this.stagesRepository.save(
          this.stagesRepository.create(groupStage),
        );
      }
    }

    await this.updateGlobalPositions();
  }
}
