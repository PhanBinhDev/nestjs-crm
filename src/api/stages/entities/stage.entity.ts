import { Workspaces } from '@/api/workspaces/entities/workspace.entity';
import { Uuid } from '@/common/types/common.type';
import { WrapperType } from '@/common/types/types';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import { StageGroup } from '@/database/enum/stage.enum';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity('stages')
export class StagesEntity extends AbstractEntity {
  constructor(data?: Partial<StagesEntity>) {
    super();
    Object.assign(this, data);
  }
  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  title: string;

  @Column({ type: 'int', default: 0 })
  position: number;

  @Column({
    type: 'varchar',
    length: 7,
    nullable: true,
  })
  color: string;

  @Column({
    type: 'enum',
    enum: StageGroup,
    default: StageGroup.ACTIVE,
  })
  stageGroup: StageGroup;

  @Column({
    type: 'boolean',
    default: false,
  })
  isBuiltIn: boolean;

  @Column({
    type: 'int',
    default: 0,
  })
  groupPosition: number;

  @Column({ type: 'uuid', nullable: false })
  workspaceId: Uuid;

  @ManyToOne(() => Workspaces, (workspace) => workspace.stages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workspaceId' })
  workspace: WrapperType<Workspaces>;

  @Column({ type: 'boolean', default: false })
  isCompleted: boolean;
}
