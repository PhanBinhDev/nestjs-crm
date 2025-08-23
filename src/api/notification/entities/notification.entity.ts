import { AbstractEntity } from '@/database/entities/abstract.entity';
import { Column, Entity } from 'typeorm';

@Entity('notifications')
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
}
