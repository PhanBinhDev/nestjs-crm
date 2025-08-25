import { ResponseDto } from '@/common/dto/response/response.dto';
import { Uuid } from '@/common/types/common.type';
import { WorkspaceRole } from '@/database/enum/workspace.enum';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { WorkspaceResDto } from './dto/workspace.res.dto';
import { WorkspaceMembers } from './entities/workspace-members.entity';
import { Workspaces } from './entities/workspace.entity';

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectRepository(Workspaces)
    private readonly workspaceRepository: Repository<Workspaces>,

    @InjectRepository(WorkspaceMembers)
    private readonly membersRepository: Repository<WorkspaceMembers>,
  ) {}

  async create(
    dto: CreateWorkspaceDto,
    ownerId: Uuid,
  ): Promise<ResponseDto<WorkspaceResDto>> {
    const workspace = this.workspaceRepository.create({
      ...dto,
      ownerId,
    });
    await this.workspaceRepository.save(workspace);

    await this.membersRepository.save(
      this.membersRepository.create({
        workspaceId: workspace.id,
        userId: ownerId,
        role: WorkspaceRole.OWNER,
      }),
    );

    return new ResponseDto<WorkspaceResDto>({
      data: plainToInstance(WorkspaceResDto, workspace, {
        excludeExtraneousValues: true,
      }),
      message: 'Tạo không gian làm việc thành công',
    });
  }

  async findAll(): Promise<ResponseDto<WorkspaceResDto[]>> {
    const workspaces = await this.workspaceRepository.find();
    return new ResponseDto<WorkspaceResDto[]>({
      data: plainToInstance(WorkspaceResDto, workspaces, {
        excludeExtraneousValues: true,
      }),
      message: 'Lấy danh sách không gian làm việc thành công',
    });
  }

  async findAccessibleByUser(
    userId: Uuid,
  ): Promise<ResponseDto<WorkspaceResDto[]>> {
    const qb = this.workspaceRepository
      .createQueryBuilder('w')
      .leftJoin('w.members', 'm')
      .where('w.ownerId = :userId', { userId })
      .orWhere('m.userId = :userId', { userId })
      .orderBy('w.updatedAt', 'DESC')
      .distinct(true);

    const workspaces = await qb.getMany();
    return new ResponseDto<WorkspaceResDto[]>({
      data: plainToInstance(WorkspaceResDto, workspaces, {
        excludeExtraneousValues: true,
      }),
      message: 'Lấy danh sách không gian làm việc thành công',
    });
  }

  async update(
    id: Uuid,
    dto: CreateWorkspaceDto,
  ): Promise<ResponseDto<WorkspaceResDto>> {
    await this.workspaceRepository.update(id, dto);
    const updatedWorkspace = await this.workspaceRepository.findOne({
      where: { id },
    });
    return new ResponseDto<WorkspaceResDto>({
      data: plainToInstance(WorkspaceResDto, updatedWorkspace, {
        excludeExtraneousValues: true,
      }),
      message: 'Cập nhật không gian làm việc thành công',
    });
  }
}
