import { WorkspaceMembers } from '@/api/workspaces/entities/workspace-members.entity';
import { Workspaces } from '@/api/workspaces/entities/workspace.entity'; // Thêm import này
import { WorkspaceRole } from '@/database/enum/workspace.enum';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Repository } from 'typeorm';

@Injectable()
export class WorkspaceAccessGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(WorkspaceMembers)
    private membersRepository: Repository<WorkspaceMembers>,
    @InjectRepository(Workspaces) // Thêm repository Workspaces
    private workspaceRepository: Repository<Workspaces>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles =
      this.reflector.get<WorkspaceRole[]>(
        'workspaceRoles',
        context.getHandler(),
      ) || [];

    const request = context.switchToHttp().getRequest<Request>();
    const userId = request.user?.id as string;

    if (!userId) {
      throw new ForbiddenException('Không có quyền truy cập');
    }

    const params = request.params || {};
    const body = request.body || {};
    const query = request.query || {};

    const workspaceId =
      params.workspaceId || body.workspaceId || (query.workspaceId as string);

    if (!workspaceId) {
      throw new ForbiddenException('Không tìm thấy workspace');
    }

    // Kiểm tra quyền của user trong workspace
    const membership = await this.membersRepository.findOne({
      where: {
        userId,
        workspaceId,
      },
    });

    let isOwner = false;
    if (!membership) {
      const workspace = await this.workspaceRepository.findOne({
        where: { id: workspaceId },
      });

      if (workspace && workspace.ownerId === userId) {
        isOwner = true;

        // Thêm owner vào bảng members nếu chưa có
        const newMembership = this.membersRepository.create({
          role: WorkspaceRole.OWNER,
          userId,
          workspaceId,
        });

        try {
          // Lưu membership mới vào database
          await this.membersRepository.save(newMembership);

          // Cập nhật biến membership để sử dụng sau này
          const savedMembership = await this.membersRepository.findOne({
            where: { id: newMembership.id },
          });

          if (savedMembership) {
            request['workspaceMember'] = savedMembership;
          }
        } catch (error) {
          console.error('Error adding owner to workspace_members:', error);
        }
      } else {
        throw new ForbiddenException(
          'Bạn không phải thành viên của workspace này',
        );
      }
    }

    if (
      requiredRoles.length === 0 ||
      isOwner ||
      membership?.role === WorkspaceRole.OWNER
    ) {
      return true;
    }

    if (membership && requiredRoles.includes(membership.role)) {
      return true;
    }

    throw new ForbiddenException('Bạn không có quyền thực hiện hành động này');
  }
}
