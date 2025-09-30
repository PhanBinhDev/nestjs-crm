import { WrapperType } from '@/common/types/types';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { ActivityEntity } from './activity.entity';

@Entity('activity_checklists')
@Index('idx_activity_checklist_activity', ['activityId'])
export class ActivityChecklistEntity extends AbstractEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ManyToOne(() => ActivityEntity, (activity) => activity.checklists, {
    nullable: false,
  })
  @JoinColumn({ name: 'activityId' })
  activity: WrapperType<ActivityEntity>;

  @Column({ type: 'uuid', nullable: false })
  activityId: string;

  @OneToMany(() => ActivityChecklistItemEntity, (item) => item.checklist, {
    cascade: true,
  })
  items: ActivityChecklistItemEntity[];
}

@Entity('activity_checklist_items')
@Index('idx_activity_checklist_item_checklist', ['checklistId'])
@Index('idx_activity_checklist_item_is_done', ['isDone'])
export class ActivityChecklistItemEntity extends AbstractEntity {
  @Column({ type: 'varchar', length: 255 })
  content: string;

  @Column({ type: 'boolean', default: false })
  isDone: boolean;

  @ManyToOne(() => ActivityChecklistEntity, (checklist) => checklist.items, {
    nullable: false,
  })
  @JoinColumn({ name: 'checklistId' })
  checklist: ActivityChecklistEntity;

  @Column({ type: 'uuid', nullable: false })
  checklistId: string;
}
