import { WrapperType } from '@/common/types/types';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { CardSize, FieldGroups } from '../types/card';
import { Workspaces } from './workspace.entity';

@Entity('workspace_view_settings')
export class WorkspaceViewSettings extends AbstractEntity {
  @Column({ nullable: false })
  workspaceId: string;

  @Column({ type: 'varchar', default: 'medium' })
  cardSize: CardSize;

  @Column({ type: 'boolean', default: false })
  stackFields: boolean;

  @Column({ type: 'boolean', default: false })
  showEmptyFields: boolean;

  @Column({
    type: 'jsonb',
    default: {
      shown: ['name'],
      popular: ['description', 'status'],
      hidden: [
        'assignees',
        'dateClosed',
        'dateUpdated',
        'dueDate',
        'priority',
        'tags',
        'taskId',
        'taskType',
        'progress',
        'location',
        'estimateTime',
        'attachments',
        'checklist',
        'comments',
        'mandatory',
        'category',
      ],
    },
  })
  fields: FieldGroups;

  @Column({ type: 'int', default: 3 })
  maxVisibleAssignees: number;

  @Column({ type: 'jsonb', nullable: true })
  additionalSettings?: Record<string, any>;

  @ManyToOne(() => Workspaces, (workspace) => workspace.settingsView, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workspaceId' })
  workspace: WrapperType<Workspaces>;
}
