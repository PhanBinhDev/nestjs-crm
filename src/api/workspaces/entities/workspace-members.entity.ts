import { UserEntity } from '@/api/users/entities/user.entity';
import { Uuid } from '@/common/types/common.type';
import { WrapperType } from '@/common/types/types';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import {
  WorkspaceMemberStatus,
  WorkspaceRole,
} from '@/database/enum/workspace.enum';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Workspaces } from './workspace.entity';

@Entity('workspace_members')
@Index('idx_workspace_member_workspace', ['workspaceId'])
@Index('idx_workspace_member_user', ['userId'])
@Index('idx_workspace_member_workspace_user', ['workspaceId', 'userId'], {
  unique: true,
})
@Index('idx_workspace_member_role', ['role'])
@Index('idx_workspace_member_status', ['status'])
export class WorkspaceMembers extends AbstractEntity {
  @Column({
    type: 'uuid',
    nullable: false,
  })
  workspaceId: Uuid;

  @Column({
    type: 'uuid',
    nullable: false,
  })
  userId: Uuid;

  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: WrapperType<UserEntity>;

  @Column({ type: 'enum', enum: WorkspaceRole, default: WorkspaceRole.MEMBER })
  role: WorkspaceRole;

  @ManyToOne(() => Workspaces, (workspace) => workspace.members)
  @JoinColumn({ name: 'workspaceId' })
  workspace: WrapperType<Workspaces>;

  @Column({
    type: 'enum',
    enum: WorkspaceMemberStatus,
    default: WorkspaceMemberStatus.PENDING,
  })
  status: WorkspaceMemberStatus;
}
