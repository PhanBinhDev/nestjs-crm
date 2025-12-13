import { UserEntity } from '@/api/users/entities/user.entity';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import { NotificationPreferenceType } from '@/database/enum/notification-preference.enum';
import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';

@Entity('notification_preferences')
@Unique(['userId', 'type'])
@Index('idx_preference_user', ['userId'])
export class NotificationPreference extends AbstractEntity {
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;

  @Column({
    type: 'enum',
    enum: NotificationPreferenceType,
  })
  type: NotificationPreferenceType;

  @Column({ type: 'boolean', default: true })
  enabled: boolean;
}

