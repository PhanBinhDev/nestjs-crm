import { WorkspaceMembers } from '@/api/workspaces/entities/workspace-members.entity';
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
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles =
      this.reflector.get<WorkspaceRole[]>(
        'workspaceRoles',
        context.getHandler(),
      ) || [];

    const request = context.switchToHttp().getRequest<Request>();
    const userId = request.user.id as string;

    if (!userId) {
      throw new ForbiddenException('Không có quyền truy cập');
    }

    const params = request.params || {};
    const body = request.body || {};
    const query = request.query || {};

    console.log('params', params);
    console.log('body', body);
    console.log('query', query);

    // Lấy workspaceId từ params hoặc body hoặc query
    const workspaceId =
      params.workspaceId || body.workspaceId || (query.workspaceId as string);

    if (!workspaceId) {
      throw new ForbiddenException('Không tìm thấy workspace 2');
    }

    // Kiểm tra quyền của user trong workspace
    const membership = await this.membersRepository.findOne({
      where: {
        userId,
        workspaceId,
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'Bạn không phải thành viên của workspace này',
      );
    }

    if (requiredRoles.length === 0) {
      return true;
    }

    if (membership.role === WorkspaceRole.OWNER) {
      return true;
    }

    return requiredRoles.includes(membership.role);
  }
}
