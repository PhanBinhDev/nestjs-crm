import { WrapperType } from '@/common/types/types';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { ActivityEntity } from './activity.entity';


@Entity('event_feedback')
@Unique(['activityId', 'email'])
@Index(['activityId'])
@Index(['email'])
@Index(['rating'])
export class EventFeedbackEntity extends AbstractEntity {
  @ManyToOne(() => ActivityEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'activityId',
  })
  activity: WrapperType<ActivityEntity>;

  @Column({ type: 'uuid' })
  activityId: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  numPhone?: string;

  @Column({ type: 'varchar', length: 255 })
  fullName: string;

  @Column({ type: 'varchar', length: 50 })
  studentId: string;

  @Column({ 
    type: 'int'
  })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comments?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image?: string;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  submittedAt: Date;
}
