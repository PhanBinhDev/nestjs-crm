import { WorkspaceMembers } from '@/api/workspaces/entities/workspace-members.entity';
import { Workspaces } from '@/api/workspaces/entities/workspace.entity';
import { WorkspaceRole } from '@/database/enum/workspace.enum';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NextFunction, Request, Response } from 'express';
import { Repository } from 'typeorm';

@Injectable()
export class WorkspaceMemberMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(WorkspaceMembers)
    private membersRepository: Repository<WorkspaceMembers>,
    @InjectRepository(Workspaces)
    private workspacesRepository: Repository<Workspaces>,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    if (req.user?.id) {
      const workspaceId =
        req.params.workspaceId ||
        req.body.workspaceId ||
        (req.query.workspaceId as string);

      console.log('Workspace ID:', workspaceId);

      if (workspaceId) {
        let member = await this.membersRepository.findOne({
          where: {
            userId: req.user.id,
            workspaceId,
          },
          relations: ['user'],
        });

        if (!member) {
          const workspace = await this.workspacesRepository.findOne({
            where: {
              id: workspaceId,
              ownerId: req.user.id,
            },
          });

          if (workspace) {
            member = this.membersRepository.create({
              workspaceId,
              userId: req.user.id,
              role: WorkspaceRole.OWNER,
            });

            await this.membersRepository.save(member);
          }
        }

        if (member) {
          req['workspaceMember'] = member;
        }
      }
    }
    next();
  }
}
