import { ActivityAssigneeEntity } from '@/api/activities/entities/activity-assignee.entity';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import { UserRole } from '@/database/enum/user.enum';
import { Column, Entity, OneToMany } from 'typeorm';

@Entity('users')
export class UserEntity extends AbstractEntity {
  constructor(data?: Partial<UserEntity>) {
    super();
    Object.assign(this, data);
  }

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  name: string;

  @Column({
    type: 'varchar',
    length: 255,
    unique: true,
    nullable: false,
  })
  email: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: false,
  })
  phone: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    nullable: false,
  })
  role: UserRole;

  @Column({
    type: 'boolean',
    default: true,
    nullable: false,
  })
  isActive: boolean;

  @OneToMany(
    () => ActivityAssigneeEntity,
    (activityAssignee) => activityAssignee.user,
  )
  assignedActivities: ActivityAssigneeEntity[];
}
