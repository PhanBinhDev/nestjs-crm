import { UserEntity } from '@/api/users/entities/user.entity';
import { WrapperType } from '@/common/types/types';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ActivityEntity } from './activity.entity';

@Entity('activity_feedback')
@Index('idx_activity_feedback_activity', ['activityId'])
@Index('idx_activity_feedback_user', ['userId'])
@Index('idx_activity_feedback_submitted', ['submittedAt'])
export class ActivityFeedbackEntity extends AbstractEntity {
  @ManyToOne(() => ActivityEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'activityId',
  })
  activity: WrapperType<ActivityEntity>;

  @Column({ type: 'uuid' })
  activityId: string;

  @ManyToOne(() => UserEntity, { nullable: false, eager: true })
  @JoinColumn({
    name: 'userId',
  })
  user: WrapperType<UserEntity>;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  submittedAt: Date;
}
