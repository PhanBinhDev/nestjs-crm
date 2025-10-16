import { UserEntity } from '@/api/users/entities/user.entity';
import { WrapperType } from '@/common/types/types';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import { ReactionType } from '@/database/enum/comments.enum';
import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { ActivityCommentEntity } from './activity-comments.entity';

@Entity('activity_comment_reactions')
@Unique('uq_user_comment_reaction', ['userId', 'commentId'])
@Index('idx_comment_reaction_user', ['userId'])
@Index('idx_comment_reaction_comment', ['commentId'])
export class ActivityCommentReactionEntity extends AbstractEntity {
  @Column({ type: 'uuid', nullable: false })
  userId: string;

  @ManyToOne(() => UserEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: WrapperType<UserEntity>;

  @Column({ type: 'uuid', nullable: false })
  commentId: string;

  @ManyToOne(() => ActivityCommentEntity, (comment) => comment.reactions, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'commentId' })
  comment: WrapperType<ActivityCommentEntity>;

  @Column({
    type: 'enum',
    enum: ReactionType,
    default: ReactionType.LIKE,
    nullable: false,
  })
  type: ReactionType;
}
