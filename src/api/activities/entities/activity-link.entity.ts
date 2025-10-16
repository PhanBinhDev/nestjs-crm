import { UserEntity } from '@/api/users/entities/user.entity';
import { WrapperType } from '@/common/types/types';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { ActivityEntity } from './activity.entity';

@Entity('activity_links')
@Index('idx_activity_link_activity', ['activityId'])
export class ActivityLinkEntity extends AbstractEntity {
  @Column({ type: 'uuid', nullable: false })
  activityId: string;

  @ManyToOne(() => ActivityEntity, (activity) => activity.links, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'activityId' })
  activity: WrapperType<ActivityEntity>;

  @Column({ type: 'varchar', length: 255, nullable: false })
  title: string;

  @Column({ type: 'varchar', length: 2048, nullable: false })
  url: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  // Thêm các field metadata cho link preview
  @Column({ type: 'varchar', length: 2048, nullable: true })
  thumbnail?: string;

  @Column({ type: 'text', nullable: true })
  siteName?: string;

  @Column({ type: 'text', nullable: true })
  siteDescription?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  favicon?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @ManyToOne(() => UserEntity, { eager: true })
  @JoinColumn({ name: 'createdBy' })
  creator: WrapperType<UserEntity>;
}
