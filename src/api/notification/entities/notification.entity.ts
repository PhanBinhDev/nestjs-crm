import { UserEntity } from '@/api/users/entities/user.entity';
import { Uuid } from '@/common/types/common.type';
import { WrapperType } from '@/common/types/types';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('notifications')
@Index('idx_notification_user', ['userId'])
@Index('idx_notification_isRead', ['isRead'])
@Index('idx_notification_type', ['type'])
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: Uuid;

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
  data: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date;

  @Column({ type: 'uuid', nullable: true })
  workspaceMemberId: Uuid;

  @ManyToOne(() => UserEntity, (user) => user.notifications, {
    onDelete: 'CASCADE',
  })
  user: WrapperType<UserEntity>;

  @ManyToOne(() => UserEntity, (user) => user.sentNotifications, {
    onDelete: 'SET NULL',
  })
  sender?: WrapperType<UserEntity>;

  @DeleteDateColumn()
  deletedAt?: Date;

  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: false,
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
    nullable: false,
  })
  updatedAt: Date;
}
