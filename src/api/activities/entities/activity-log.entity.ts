import { UserEntity } from '@/api/users/entities/user.entity';
import { WrapperType } from '@/common/types/types';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ActivityEntity } from './activity.entity';

@Entity('activity_log')
@Index('idx_activity_log_activity', ['activity'])
@Index('idx_activity_log_user', ['user'])
@Index('idx_activity_log_action', ['action'])
@Index('idx_activity_log_parent', ['parentLog'])
export class ActivityLogEntity extends AbstractEntity {
  @Column({ type: 'varchar', length: 100 })
  action: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  message: string;

  @Column({ type: 'jsonb', nullable: true })
  oldValue: any;

  @Column({ type: 'jsonb', nullable: true })
  newValue: any;

  @ManyToOne('ActivityEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'activityId' })
  activity: WrapperType<ActivityEntity>;

  @ManyToOne('UserEntity', {
    onDelete: 'SET NULL',
    nullable: true,
    eager: true,
  })
  @JoinColumn({ name: 'userId' })
  user: WrapperType<UserEntity>;

  @ManyToOne('ActivityLogEntity', { nullable: true })
  @JoinColumn({ name: 'parentLogId' })
  parentLog: WrapperType<ActivityLogEntity>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;
}
