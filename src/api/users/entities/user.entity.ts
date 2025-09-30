import { ActivityAssigneeEntity } from '@/api/activities/entities/activity-assignee.entity';
import { ActivityLogEntity } from '@/api/activities/entities/activity-log.entity';
import { NotificationEntity } from '@/api/notification/entities/notification.entity';
import { Workspaces } from '@/api/workspaces/entities/workspace.entity';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import { UserRole } from '@/database/enum/user.enum';
import { Column, Entity, OneToMany } from 'typeorm';

@Entity('users')
export class UserEntity extends AbstractEntity {
  constructor(data?: Partial<UserEntity>) {
    super();
    Object.assign(this, data);

    if (!this.username && this.role) {
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      this.username = `${this.role}${randomNum}`;
    }
  }

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  name: string;

  @Column({
    type: 'varchar',
    length: 100,
    unique: true,
    nullable: false,
  })
  username: string;

  @Column({
    type: 'date',
    nullable: true,
  })
  dateOfBirth: Date;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  major: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  avatar: string;

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

  @OneToMany(() => NotificationEntity, (notification) => notification.user)
  notifications: NotificationEntity[];

  @OneToMany(() => NotificationEntity, (notification) => notification.sender)
  sentNotifications: NotificationEntity[];

  @OneToMany(() => ActivityLogEntity, (log) => log.user)
  activityLogs: ActivityLogEntity[];

  @OneToMany(() => Workspaces, (workspace) => workspace.owner)
  ownedWorkspaces: Workspaces[];
}
