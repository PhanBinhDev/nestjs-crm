import { UserEntity } from '@/api/users/entities/user.entity';
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

@Entity('activity_comments')
@Index('idx_activity_comment_activity', ['activityId'])
@Index('idx_activity_comment_user', ['userId'])
@Index('idx_activity_comment_parent', ['parentCommentId'])
export class ActivityCommentEntity extends AbstractEntity {
  @Column({ type: 'uuid', nullable: false })
  activityId: string;

  @ManyToOne(() => ActivityEntity, (activity) => activity.comments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'activityId' })
  activity: WrapperType<ActivityEntity>;

  @Column({ type: 'uuid', nullable: true })
  parentCommentId?: string;

  @ManyToOne(() => ActivityCommentEntity, (comment) => comment.replies, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parentCommentId' })
  parentComment?: ActivityCommentEntity;

  @OneToMany(() => ActivityCommentEntity, (comment) => comment.parentComment)
  replies: ActivityCommentEntity[];

  @Column({ type: 'jsonb', nullable: true })
  reactions?: Record<string, number>;

  @Column({ type: 'uuid', nullable: false })
  userId: string;

  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: WrapperType<UserEntity>;

  @Column({ type: 'text', nullable: false })
  content: string;

  @Column({ type: 'boolean', default: false })
  isEdited: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  editedAt?: Date;
}
