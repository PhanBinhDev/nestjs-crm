import { Uuid } from '@/common/types/common.type';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('activity_log')
export class ActivityLogEntity extends AbstractEntity {
  @PrimaryGeneratedColumn('uuid')
  declare id: Uuid;

  @Column({ type: 'uuid' })
  activityId: string;

  @Column({ type: 'varchar', length: 100 })
  action: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @Column({ type: 'json', nullable: true })
  oldValue: any;

  @Column({ type: 'json', nullable: true })
  newValue: any;

  // Relations - Sử dụng string reference để tránh circular dependency
  @ManyToOne('ActivityEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'activityId' })
  activity: any;

  @ManyToOne('UserEntity', {
    onDelete: 'SET NULL',
    nullable: true,
    eager: true,
  })
  @JoinColumn({ name: 'userId' })
  user: any;
}
