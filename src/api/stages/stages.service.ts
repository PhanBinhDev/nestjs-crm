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
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Workspaces } from '../workspaces/entities/workspace.entity';
import { CreateStageDto } from './dto/create-stage.dto';
import { QueryStageDto } from './dto/query-stage.dto';
import { StageResDto } from './dto/stage.res.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { StagesEntity } from './entities/stage.entity';

@Injectable()
export class StagesService {
  private readonly logger = new Logger(StagesService.name);

  private readonly STAGE_GROUP_ORDER = [
    StageGroup.NOT_STARTED,
    StageGroup.ACTIVE,
    StageGroup.DONE,
    StageGroup.CLOSED,
  ];

  constructor(
    @InjectRepository(StagesEntity)
    private readonly stagesRepository: Repository<StagesEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createStageDto: CreateStageDto,
  ): Promise<ResponseDto<StageResDto>> {
    return await this.dataSource.transaction(async (manager) => {
      const {
        stageGroup = StageGroup.ACTIVE,
        title,
        workspaceId,
      } = createStageDto;

      await this.validateWorkspaceExists(manager, workspaceId);
      await this.checkDuplicateTitle(manager, title, workspaceId);
      this.validateStageGroupConstraints(stageGroup);

      const groupPosition = await this.calculateGroupPosition(
        manager,
        workspaceId,
        stageGroup,
      );
      const position = await this.calculateGlobalPosition(
        manager,
        createStageDto,
        stageGroup,
      );

      // 5. Create and save the stage
      const stage = manager.create(StagesEntity, {
        ...createStageDto,
        position,
        stageGroup,
        groupPosition,
        isBuiltIn: false,
      });

      const savedStage = await manager.save(stage);

      // 6. Reorder stages in group to ensure consistency
      await this.reorderStagesInGroup(manager, workspaceId, stageGroup);

      return new ResponseDto<StageResDto>({
        data: plainToInstance(StageResDto, savedStage, {
          excludeExtraneousValues: true,
        }),
        message: 'Tạo trạng thái (stage) thành công',
      });
    });
  }

  async findAll(query: QueryStageDto): Promise<ResponseDto<StageResDto[]>> {
    const qb = this.stagesRepository
      .createQueryBuilder('stage')
      .where('stage.workspaceId = :workspaceId', {
        workspaceId: query.workspaceId,
      });

    // Apply filters
    this.applyFilters(qb, query);

    // Apply sorting
    this.applySorting(qb, query);

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

    if (!stage) {
      throw new NotFoundException('Stage not found');
    }

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
    return await this.dataSource.transaction(async (manager) => {
      // 1. Get existing stage
      const stageEntity = await manager.findOne(StagesEntity, {
        where: { id },
      });
      if (!stageEntity) {
        throw new NotFoundException('Trạng thái (stage) không tồn tại');
      }

      // 2. Validate updates
      await this.validateStageUpdate(manager, stageEntity, updateStageDto);

      // 3. Handle different update scenarios
      const oldStageGroup = stageEntity.stageGroup;
      const newStageGroup = updateStageDto.stageGroup || oldStageGroup;

      if (newStageGroup !== oldStageGroup) {
        // Handle stage group change
        await this.handleStageGroupChange(
          manager,
          stageEntity,
          updateStageDto,
          newStageGroup,
        );
      } else if (this.isPositionUpdate(updateStageDto, stageEntity)) {
        // Handle position change within same group
        await this.handlePositionUpdate(manager, stageEntity, updateStageDto);
      } else {
        // Simple field updates
        Object.assign(stageEntity, updateStageDto);
        await manager.save(stageEntity);
      }

      // 4. Get updated stage
      const updatedStage = await manager.findOne(StagesEntity, {
        where: { id: stageEntity.id },
      });

      return new ResponseDto<StageResDto>({
        data: plainToInstance(StageResDto, updatedStage, {
          excludeExtraneousValues: true,
        }),
        message: 'Cập nhật trạng thái (stage) thành công',
      });
    });
  }

  async remove(id: Uuid): Promise<ResponseNoDataDto> {
    return await this.dataSource.transaction(async (manager) => {
      const stageEntity = await manager.findOne(StagesEntity, {
        where: { id },
      });

      if (!stageEntity) {
        throw new NotFoundException('Stage not found');
      }

      if (stageEntity.isBuiltIn) {
        throw new BadRequestException(
          'Không thể xóa stage mặc định của hệ thống',
        );
      }

      const { stageGroup, workspaceId } = stageEntity;

      await manager.remove(stageEntity);

      // Reorder remaining stages
      await this.reorderStagesInGroup(manager, workspaceId, stageGroup);
      await this.updateGlobalPositions(manager, workspaceId);

      return new ResponseNoDataDto({
        message: 'Xóa trạng thái (stage) thành công',
      });
    });
  }

  async initDefaultStages(
    workspaceId: Uuid,
    manager: EntityManager,
  ): Promise<void> {
    const workspace = await manager.findOne(Workspaces, {
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const defaultStages = this.getDefaultStagesConfig();

    for (let i = 0; i < defaultStages.length; i++) {
      const stageConfig = { ...defaultStages[i], position: i };

      const existing = await manager.findOne(StagesEntity, {
        where: {
          workspaceId,
          stageGroup: stageConfig.stageGroup,
          isBuiltIn: true,
        },
      });

      if (!existing) {
        await manager.save(
          manager.create(StagesEntity, {
            ...stageConfig,
            workspaceId,
          }),
        );
      } else {
        await manager.update(StagesEntity, existing.id, stageConfig);
      }
    }

    await this.updateGlobalPositions(manager, workspaceId);
  }

  private async validateWorkspaceExists(
    manager: EntityManager,
    workspaceId: Uuid,
  ): Promise<void> {
    const workspace = await manager.findOne(Workspaces, {
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new BadRequestException('Workspace không tồn tại');
    }
  }

  private async checkDuplicateTitle(
    manager: EntityManager,
    title: string,
    workspaceId: Uuid,
    excludeId?: Uuid,
  ): Promise<void> {
    const qb = manager
      .createQueryBuilder(StagesEntity, 'stage')
      .where('LOWER(stage.title) = LOWER(:title)', { title })
      .andWhere('stage.workspaceId = :workspaceId', { workspaceId });

    if (excludeId) {
      qb.andWhere('stage.id != :id', { id: excludeId });
    }

    const existingStage = await qb.getOne();

    if (existingStage) {
      throw new BadRequestException(
        `Tên stage "${title}" đã tồn tại trong workspace này`,
      );
    }
  }

  private validateStageGroupConstraints(stageGroup: StageGroup): void {
    if (stageGroup === StageGroup.CLOSED) {
      throw new BadRequestException(
        'Không thể tạo thêm stage trong nhóm Closed',
      );
    }
  }

  private async calculateGroupPosition(
    manager: EntityManager,
    workspaceId: Uuid,
    stageGroup: StageGroup,
  ): Promise<number> {
    const lastStageInGroup = await manager
      .createQueryBuilder(StagesEntity, 'stage')
      .where('stage.workspaceId = :workspaceId', { workspaceId })
      .andWhere('stage.stageGroup = :stageGroup', { stageGroup })
      .orderBy('stage.groupPosition', 'DESC')
      .take(1)
      .getOne();

    return lastStageInGroup ? lastStageInGroup.groupPosition + 1 : 0;
  }

  private async calculateGlobalPosition(
    manager: EntityManager,
    createStageDto: CreateStageDto,
    stageGroup: StageGroup,
  ): Promise<number> {
    const { position: requestedPosition, workspaceId } = createStageDto;

    if (requestedPosition === undefined) {
      return await this.calculatePositionByGroup(
        manager,
        workspaceId,
        stageGroup,
      );
    }

    return await this.validateAndAdjustPosition(
      manager,
      workspaceId,
      requestedPosition,
      stageGroup,
    );
  }

  private async calculatePositionByGroup(
    manager: EntityManager,
    workspaceId: Uuid,
    stageGroup: StageGroup,
  ): Promise<number> {
    const groupIndex = this.STAGE_GROUP_ORDER.indexOf(stageGroup);
    let lastPosition = -1;

    // Find last position in previous groups
    for (let i = 0; i < groupIndex; i++) {
      const lastStageInGroup = await manager
        .createQueryBuilder(StagesEntity, 'stage')
        .where('stage.workspaceId = :workspaceId', { workspaceId })
        .andWhere('stage.stageGroup = :stageGroup', {
          stageGroup: this.STAGE_GROUP_ORDER[i],
        })
        .orderBy('stage.position', 'DESC')
        .take(1)
        .getOne();

      if (lastStageInGroup) {
        lastPosition = Math.max(lastPosition, lastStageInGroup.position);
      }
    }

    const newPosition = lastPosition + 1;

    // Shift subsequent stages if needed
    await manager
      .createQueryBuilder()
      .update(StagesEntity)
      .set({ position: () => 'position + 1' })
      .where('workspaceId = :workspaceId', { workspaceId })
      .andWhere('position >= :position', { position: newPosition })
      .execute();

    return newPosition;
  }

  private async validateAndAdjustPosition(
    manager: EntityManager,
    workspaceId: Uuid,
    requestedPosition: number,
    stageGroup: StageGroup,
  ): Promise<number> {
    const allStages = await manager
      .createQueryBuilder(StagesEntity, 'stage')
      .where('stage.workspaceId = :workspaceId', { workspaceId })
      .orderBy('stage.position', 'ASC')
      .getMany();

    const requestedGroupIndex = this.STAGE_GROUP_ORDER.indexOf(stageGroup);
    const stageAtPosition = allStages.find(
      (s) => s.position === requestedPosition,
    );

    if (stageAtPosition) {
      const existingGroupIndex = this.STAGE_GROUP_ORDER.indexOf(
        stageAtPosition.stageGroup,
      );

      if (requestedGroupIndex !== existingGroupIndex) {
        throw new BadRequestException(
          `Không thể tạo stage tại vị trí ${requestedPosition} vì nó thuộc về nhóm ${stageAtPosition.stageGroup}`,
        );
      }

      // Shift stages at and after this position
      await manager
        .createQueryBuilder()
        .update(StagesEntity)
        .set({ position: () => 'position + 1' })
        .where('workspaceId = :workspaceId', { workspaceId })
        .andWhere('position >= :position', { position: requestedPosition })
        .execute();
    }

    return requestedPosition;
  }

  private async validateStageUpdate(
    manager: EntityManager,
    stageEntity: StagesEntity,
    updateStageDto: UpdateStageDto,
  ): Promise<void> {
    // Check title uniqueness
    if (
      updateStageDto.title &&
      updateStageDto.title.toLowerCase() !== stageEntity.title.toLowerCase()
    ) {
      await this.checkDuplicateTitle(
        manager,
        updateStageDto.title,
        stageEntity.workspaceId,
        stageEntity.id,
      );
    }

    // Validate built-in stage constraints
    if (stageEntity.isBuiltIn) {
      if (
        updateStageDto.stageGroup &&
        updateStageDto.stageGroup !== stageEntity.stageGroup
      ) {
        throw new BadRequestException(
          'Không thể thay đổi nhóm của stage mặc định',
        );
      }

      if (
        'position' in updateStageDto &&
        updateStageDto.position !== stageEntity.position
      ) {
        throw new BadRequestException(
          'Không thể thay đổi vị trí của stage mặc định',
        );
      }
    }

    // Validate new stage group
    if (updateStageDto.stageGroup === StageGroup.CLOSED) {
      throw new BadRequestException('Không thể chuyển stage vào nhóm Closed');
    }
  }

  private isPositionUpdate(
    updateStageDto: UpdateStageDto,
    stageEntity: StagesEntity,
  ): boolean {
    return (
      updateStageDto.position !== undefined &&
      updateStageDto.position !== stageEntity.position
    );
  }

  private async handleStageGroupChange(
    manager: EntityManager,
    stageEntity: StagesEntity,
    updateStageDto: UpdateStageDto,
    newStageGroup: StageGroup,
  ): Promise<void> {
    const oldStageGroup = stageEntity.stageGroup;

    // Calculate new group position
    const stagesInNewGroup = await manager.find(StagesEntity, {
      where: {
        workspaceId: stageEntity.workspaceId,
        stageGroup: newStageGroup,
      },
      order: { groupPosition: 'ASC' },
    });

    const newGroupPosition = stagesInNewGroup.length;

    // Update stage
    Object.assign(stageEntity, {
      ...updateStageDto,
      stageGroup: newStageGroup,
      groupPosition: newGroupPosition,
    });

    await manager.save(stageEntity);

    // Reorder both groups
    await this.reorderStagesInGroup(
      manager,
      stageEntity.workspaceId,
      oldStageGroup,
    );
    await this.reorderStagesInGroup(
      manager,
      stageEntity.workspaceId,
      newStageGroup,
    );

    // Update global positions
    await this.updateGlobalPositions(manager, stageEntity.workspaceId);
  }

  private async handlePositionUpdate(
    manager: EntityManager,
    stageEntity: StagesEntity,
    updateStageDto: UpdateStageDto,
  ): Promise<void> {
    const stagesInGroup = await manager.find(StagesEntity, {
      where: {
        workspaceId: stageEntity.workspaceId,
        stageGroup: stageEntity.stageGroup,
      },
      order: { groupPosition: 'ASC' },
    });

    const oldGroupPosition = stageEntity.groupPosition;
    const newGroupPosition = Math.min(
      Math.max(0, updateStageDto.position!),
      stagesInGroup.length - 1,
    );

    // Update other stages in group
    if (newGroupPosition > oldGroupPosition) {
      await manager
        .createQueryBuilder()
        .update(StagesEntity)
        .set({ groupPosition: () => 'groupPosition - 1' })
        .where('workspaceId = :workspaceId', {
          workspaceId: stageEntity.workspaceId,
        })
        .andWhere('stageGroup = :stageGroup', {
          stageGroup: stageEntity.stageGroup,
        })
        .andWhere('groupPosition > :oldPos AND groupPosition <= :newPos', {
          oldPos: oldGroupPosition,
          newPos: newGroupPosition,
        })
        .execute();
    } else if (newGroupPosition < oldGroupPosition) {
      await manager
        .createQueryBuilder()
        .update(StagesEntity)
        .set({ groupPosition: () => 'groupPosition + 1' })
        .where('workspaceId = :workspaceId', {
          workspaceId: stageEntity.workspaceId,
        })
        .andWhere('stageGroup = :stageGroup', {
          stageGroup: stageEntity.stageGroup,
        })
        .andWhere('groupPosition >= :newPos AND groupPosition < :oldPos', {
          oldPos: oldGroupPosition,
          newPos: newGroupPosition,
        })
        .execute();
    }

    // Update current stage
    Object.assign(stageEntity, {
      ...updateStageDto,
      groupPosition: newGroupPosition,
    });

    await manager.save(stageEntity);

    // Update global positions
    await this.updateGlobalPositions(manager, stageEntity.workspaceId);
  }

  private async reorderStagesInGroup(
    manager: EntityManager,
    workspaceId: Uuid,
    stageGroup: StageGroup,
  ): Promise<void> {
    const stages = await manager.find(StagesEntity, {
      where: { workspaceId, stageGroup },
      order: { groupPosition: 'ASC' },
    });

    for (let i = 0; i < stages.length; i++) {
      if (stages[i].groupPosition !== i) {
        await manager.update(StagesEntity, stages[i].id, {
          groupPosition: i,
        });
      }
    }
  }

  private async updateGlobalPositions(
    manager: EntityManager,
    workspaceId: Uuid,
  ): Promise<void> {
    let globalPosition = 0;

    // Update position for each group in order
    for (const group of this.STAGE_GROUP_ORDER) {
      const stagesInGroup = await manager.find(StagesEntity, {
        where: { workspaceId, stageGroup: group },
        order: { groupPosition: 'ASC' },
      });

      for (const stage of stagesInGroup) {
        if (stage.position !== globalPosition) {
          await manager.update(StagesEntity, stage.id, {
            position: globalPosition,
          });
        }
        globalPosition++;
      }
    }
  }

  private applyFilters(qb: any, query: QueryStageDto): void {
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
  }

  private applySorting(qb: any, query: QueryStageDto): void {
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
      qb.addOrderBy('stage.position', query.order || 'ASC');
    }
  }

  private getDefaultStagesConfig() {
    return [
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
        isCompleted: true,
      },
    ];
  }
}
