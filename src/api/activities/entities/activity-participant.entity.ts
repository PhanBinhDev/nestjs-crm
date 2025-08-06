import { UserEntity } from '@/api/users/entities/user.entity';
import { WrapperType } from '@/common/types/types';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import {
  ParticipantRole,
  ParticipantStatus,
} from '@/database/enum/activity.enum';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { ActivityEntity } from './activity.entity';

@Entity('activity_participants')
export class ActivityParticipantEntity extends AbstractEntity {
  @ManyToOne(() => ActivityEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'activityId' })
  activity: WrapperType<ActivityEntity>;

  @Column({ type: 'uuid' })
  activityId: string;

  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: WrapperType<UserEntity>;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'enum', enum: ParticipantRole })
  role: ParticipantRole;

  @Column({ type: 'enum', enum: ParticipantStatus })
  status: ParticipantStatus;
}
