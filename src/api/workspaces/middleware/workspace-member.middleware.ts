import { Injectable, NestMiddleware } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NextFunction, Request, Response } from 'express';
import { Repository } from 'typeorm';
import { WorkspaceMembers } from '../entities/workspace-members.entity';

@Injectable()
export class WorkspaceMemberMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(WorkspaceMembers)
    private membersRepository: Repository<WorkspaceMembers>,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    if (req.user?.id) {
      const workspaceId =
        req.params.workspaceId ||
        req.body.workspaceId ||
        (req.query.workspaceId as string);

      if (workspaceId) {
        const member = await this.membersRepository.findOne({
          where: {
            userId: req.user.id,
            workspaceId,
          },
          relations: ['user'],
        });

        if (member) {
          req['workspaceMember'] = member;
        }
      }
    }
    next();
  }
}
