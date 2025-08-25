import { UserEntity } from '@/api/users/entities/user.entity';
import { WrapperType } from '@/common/types/types';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import { WorkspaceRole } from '@/database/enum/workspace.enum';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Workspaces } from './workspace.entity';

@Entity('workspace_members')
export class WorkspaceMembers extends AbstractEntity {
  @Column({
    type: 'uuid',
    nullable: false,
  })
  workspaceId: string;

  @Column({
    type: 'uuid',
    nullable: false,
  })
  userId: string;

  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: WrapperType<UserEntity>;

  @Column({ type: 'enum', enum: WorkspaceRole, default: WorkspaceRole.MEMBER })
  role: WorkspaceRole;

  @ManyToOne(() => Workspaces, (workspace) => workspace.members)
  @JoinColumn({ name: 'workspaceId' })
  workspace: WrapperType<Workspaces>;
}
