import { ActivityEntity } from '@/api/activities/entities/activity.entity';
import { StagesEntity } from '@/api/stages/entities/stage.entity';
import { UserEntity } from '@/api/users/entities/user.entity';
import { WrapperType } from '@/common/types/types';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import { WorkspaceVisibility } from '@/database/enum/workspace.enum';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { WorkspaceMembers } from './workspace-members.entity';
import { WorkspaceViewSettings } from './workspace-view-settings.entity';

@Entity('workspaces')
export class Workspaces extends AbstractEntity {
  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  name: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  description?: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  icon?: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  visibility: WorkspaceVisibility;

  @Column({ type: 'uuid', nullable: false })
  ownerId: string;

  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: 'ownerId' })
  owner?: WrapperType<UserEntity>;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  avatars?: string;

  @Column({
    type: 'varchar',
    length: 32,
    nullable: true,
    unique: true,
  })
  inviteCode?: string;

  @OneToMany(() => WorkspaceMembers, (member) => member.workspace, {
    cascade: true,
  })
  members: WorkspaceMembers[];

  @OneToMany(() => WorkspaceViewSettings, (settings) => settings.workspace, {
    cascade: true,
  })
  settingsView?: WorkspaceViewSettings[];

  @OneToMany(() => ActivityEntity, (activity) => activity.workspace)
  activities?: ActivityEntity[];

  @OneToMany(() => StagesEntity, (stage) => stage.workspace)
  stages?: StagesEntity[];
}
