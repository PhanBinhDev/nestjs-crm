import { UserEntity } from '@/api/users/entities/user.entity';
import { WrapperType } from '@/common/types/types';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import { AssigneeRole, AssignmentStatus } from '@/database/enum/activity.enum';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { ActivityEntity } from './activity.entity';

@Entity('activity_assignees')
export class ActivityAssigneeEntity extends AbstractEntity {
  @ManyToOne(() => ActivityEntity, (activity) => activity.assignees, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'activityId' })
  activity: WrapperType<ActivityEntity>;

  @Column({ type: 'uuid' })
  activityId: string;

  @ManyToOne(() => UserEntity, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: WrapperType<UserEntity>;

  @Column({ type: 'uuid' })
  userId: string; // Bắt buộc - chỉ cần userId

  @Column({
    type: 'enum',
    enum: AssigneeRole,
    default: AssigneeRole.COLLABORATOR, // Mặc định là COLLABORATOR
  })
  role: AssigneeRole;

  @Column({
    type: 'enum',
    enum: AssignmentStatus,
    default: AssignmentStatus.PENDING,
  })
  status: AssignmentStatus;

  @Column({ type: 'timestamptz', nullable: true })
  assignedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  assignedBy?: string; // ID của user thực hiện assignment

  @Column({ type: 'text', nullable: true })
  note?: string;
}
