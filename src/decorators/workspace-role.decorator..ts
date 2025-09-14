import { WorkspaceRole } from '@/database/enum/workspace.enum';
import { SetMetadata } from '@nestjs/common';

export const WorkspaceRoles = (...roles: WorkspaceRole[]) =>
  SetMetadata('workspaceRoles', roles);
