import { WrapperType } from '@/common/types/types';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { EventFeedbackEntity } from './event-feedback.entity';

@Entity('event_feedback_files')
export class EventFeedbackFileEntity extends AbstractEntity {
  @ManyToOne(() => EventFeedbackEntity, {
    nullable: false,
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'eventFeedbackId' })
  eventFeedback: WrapperType<EventFeedbackEntity>;

  @Column({ type: 'uuid' })
  eventFeedbackId: string;

  @Column({ type: 'varchar', length: 255 })
  uid: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;
}
