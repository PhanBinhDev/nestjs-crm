import { UserEntity } from '@/api/users/entities/user.entity';
import { WrapperType } from '@/common/types/types';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import { Column, Entity, Index, ManyToOne } from 'typeorm';

@Entity('notifications')
@Index('idx_notification_user', ['userId'])
@Index('idx_notification_workspace', ['workspaceId'])
@Index('idx_notification_isRead', ['isRead'])
@Index('idx_notification_type', ['type'])
export class NotificationEntity extends AbstractEntity {
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid', nullable: true })
  senderId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  type: string;

  @Column({ type: 'json', nullable: true })
  data: any;

  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date;

  @Column({ type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ type: 'uuid', nullable: true })
  workspaceId?: string;

  @ManyToOne(() => UserEntity, (user) => user.notifications, {
    onDelete: 'CASCADE',
  })
  user: WrapperType<UserEntity>;

  @ManyToOne(() => UserEntity, (user) => user.sentNotifications, {
    onDelete: 'SET NULL',
  })
  sender?: WrapperType<UserEntity>;
}
