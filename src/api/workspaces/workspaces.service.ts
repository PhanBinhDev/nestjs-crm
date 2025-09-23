import { ResponseNoDataDto } from '@/common/dto/response/response-no-data.dto';
import { ResponseDto } from '@/common/dto/response/response.dto';
import { Uuid } from '@/common/types/common.type';
import { WorkspaceRole } from '@/database/enum/workspace.enum';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { BaseWorkspaceResDto } from './dto/base-workspace.res.dto';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { QueryWorkspaceDetailDto } from './dto/query-workspace-detail.dto';
import { WorkspaceDetailsResDto } from './dto/workspace-details.res.dto';
import { WorkspaceMemberResDto } from './dto/workspace-member.res.dto';
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

  async remove(id: Uuid, currentUserId: Uuid): Promise<ResponseNoDataDto> {
    const workspace = await this.workspaceRepository.findOne({
      where: { id },
      relations: ['members'],
    });

    if (!workspace) {
      throw new BadRequestException('Workspace not found');
    }

    const isOwner = workspace.ownerId === currentUserId;
    if (!isOwner) {
      throw new BadRequestException(
        'Bạn không có quyền xóa không gian làm việc này',
      );
    }

    if (workspace.members.length > 1) {
      throw new BadRequestException(
        'Không thể xóa không gian làm việc khi còn thành viên khác',
      );
    }

    const ownedWorkspacesCount = await this.workspaceRepository.count({
      where: { ownerId: currentUserId },
    });

    if (ownedWorkspacesCount <= 1) {
      throw new BadRequestException(
        'Không thể xóa workspace cuối cùng của bạn. Mỗi người dùng phải có ít nhất một workspace.',
      );
    }

    await this.workspaceRepository.remove(workspace);

    return new ResponseNoDataDto({
      message: 'Xóa không gian làm việc thành công',
    });
  }

  async create(
    dto: CreateWorkspaceDto,
    ownerId: Uuid,
  ): Promise<ResponseDto<BaseWorkspaceResDto>> {
    // Tạo workspace
    const workspace = this.workspaceRepository.create({
      ...dto,
      ownerId,
    });
    await this.workspaceRepository.save(workspace);

    // Thêm owner làm member với role OWNER
    await this.membersRepository.save(
      this.membersRepository.create({
        workspaceId: workspace.id,
        userId: ownerId,
        role: WorkspaceRole.OWNER,
      }),
    );

    // Thêm các members được mời nếu có
    if (dto.assigneeIds && dto.assigneeIds.length > 0) {
      const membersToAdd = dto.assigneeIds.map((userId) =>
        this.membersRepository.create({
          workspaceId: workspace.id,
          userId,
          role: WorkspaceRole.MEMBER,
        }),
      );
      await this.membersRepository.save(membersToAdd);
    }

    return new ResponseDto<BaseWorkspaceResDto>({
      data: plainToInstance(BaseWorkspaceResDto, workspace, {
        excludeExtraneousValues: true,
      }),
      message: 'Tạo không gian làm việc thành công',
    });
  }

  async findAll(userId: Uuid): Promise<ResponseDto<BaseWorkspaceResDto[]>> {
    const workspaces = await this.workspaceRepository
      .createQueryBuilder('workspace')
      .leftJoin('workspace.members', 'members')
      .where('workspace.ownerId = :userId', { userId })
      .orWhere('members.userId = :userId', { userId })
      .distinct(true)
      .getMany();

    return new ResponseDto<BaseWorkspaceResDto[]>({
      data: plainToInstance(BaseWorkspaceResDto, workspaces, {
        excludeExtraneousValues: true,
      }),
      message: 'Lấy danh sách không gian làm việc thành công',
    });
  }

  async findOne(
    id: Uuid,
    currentUserId: Uuid,
    query: QueryWorkspaceDetailDto,
  ): Promise<ResponseDto<WorkspaceDetailsResDto>> {
    const relations = ['owner'];
    if (query.includeViewSettings) {
      relations.push('settingsView');
    }

    if (query.includeMembers) {
      relations.push('members', 'members.user');
    }

    let workspace = await this.workspaceRepository.findOne({
      where: { id },
      select: ['id', 'visibility', 'ownerId'],
    });

    if (!workspace) {
      throw new BadRequestException('Workspace not found');
    }

    if (workspace.visibility === 'private') {
      workspace = await this.workspaceRepository.findOne({
        where: [
          { id, ownerId: currentUserId },
          { id, members: { userId: currentUserId } },
        ],
        relations,
      });

      if (!workspace) {
        throw new BadRequestException(
          'Bạn không phải là thành viên của workspace này',
        );
      }
    } else {
      workspace = await this.workspaceRepository.findOne({
        where: { id },
        relations,
      });
    }

    return new ResponseDto<WorkspaceDetailsResDto>({
      data: plainToInstance(WorkspaceDetailsResDto, workspace, {
        excludeExtraneousValues: true,
      }),
      message: 'Lấy thông tin không gian làm việc thành công',
    });
  }

  async update(
    id: Uuid,
    dto: CreateWorkspaceDto,
  ): Promise<ResponseDto<BaseWorkspaceResDto>> {
    await this.workspaceRepository.update(id, dto);
    const updatedWorkspace = await this.workspaceRepository.findOne({
      where: { id },
    });
    return new ResponseDto<BaseWorkspaceResDto>({
      data: plainToInstance(BaseWorkspaceResDto, updatedWorkspace, {
        excludeExtraneousValues: true,
      }),
      message: 'Cập nhật không gian làm việc thành công',
    });
  }

  async findMembers(id: Uuid, currentUserId: Uuid) {
    const isInWorkspace = await this.checkUserInWorkspace(currentUserId, id);
    if (!isInWorkspace) {
      throw new BadRequestException(
        'Bạn không có quyền xem thành viên của không gian làm việc này',
      );
    }

    const members = await this.membersRepository.find({
      where: { workspaceId: id },
      relations: ['user'],
    });
    return new ResponseDto<WorkspaceMemberResDto[]>({
      data: plainToInstance(WorkspaceMemberResDto, members, {
        excludeExtraneousValues: true,
      }),
      message: 'Lấy danh sách thành viên không gian làm việc thành công',
    });
  }

  private async checkUserInWorkspace(
    userId: Uuid,
    workspaceId: Uuid,
  ): Promise<boolean> {
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
      relations: ['members'],
    });
    if (!workspace) {
      return false;
    }
    return workspace.members.some((member) => member.userId === userId);
  }
}
