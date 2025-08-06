import { UserEntity } from '@/api/users/entities/user.entity';
import { WrapperType } from '@/common/types/types';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { ActivityEntity } from './activity.entity';

@Entity('activity_feedback')
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
