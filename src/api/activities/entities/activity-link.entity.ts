import { WrapperType } from '@/common/types/types';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ActivityEntity } from './activity.entity';

@Entity('activity_links')
@Index('idx_activity_link_activity', ['activityId'])
@Index('idx_activity_link_linked_activity', ['linkedActivityId'])
export class ActivityLinkEntity extends AbstractEntity {
  @Column({ type: 'uuid', nullable: false })
  activityId: string;

  @ManyToOne(() => ActivityEntity, (activity) => activity.links, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'activityId' })
  activity: WrapperType<ActivityEntity>;

  @Column({ type: 'varchar', length: 255, nullable: false })
  title: string;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  url?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'uuid', nullable: true })
  linkedActivityId?: string;

  @ManyToOne(() => ActivityEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'linkedActivityId' })
  linkedActivity?: WrapperType<ActivityEntity>;

  @Column({
    type: 'enum',
    enum: ['external', 'task'],
    default: 'external',
  })
  linkType: 'external' | 'task';
}
