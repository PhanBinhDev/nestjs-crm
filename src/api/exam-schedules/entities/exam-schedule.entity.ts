import { AbstractEntity } from '@/database/entities/abstract.entity';
import { Column, Entity } from 'typeorm';

@Entity('exam_schedules')
export class ExamSchedule extends AbstractEntity {
  @Column({ type: 'date', nullable: false, name: 'examDate' })
  examDate: Date;

  @Column({ type: 'int', nullable: false, name: 'examSession' })
  examSession: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  building?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  campus?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  room?: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'subjectCode' })
  subjectCode?: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'sessionCode' })
  sessionCode?: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'examType' })
  examType?: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'className' })
  className?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lecturer?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  department?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  examiner1?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  examiner2?: string;
}

