import { UserEntity } from '@/api/users/entities/user.entity';
import { WrapperType } from '@/common/types/types';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ActivityEntity } from './activity.entity';

@Entity('activity_follows')
@Index('idx_activity_follow_activity', ['activityId'])
@Index('idx_activity_follow_user', ['userId'])
@Index('idx_activity_follow_activity_user', ['activityId', 'userId'], {
  unique: true,
})
export class ActivityFollowEntity extends AbstractEntity {
  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: WrapperType<UserEntity>;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => ActivityEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'activityId' })
  activity: WrapperType<ActivityEntity>;

  @Column({ type: 'uuid' })
  activityId: string;
}
