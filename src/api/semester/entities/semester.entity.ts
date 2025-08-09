import { AbstractEntity } from '@/database/entities/abstract.entity';
import { SemesterStatus } from '@/database/enum/semeter.enum';
import { Column, Entity, OneToMany } from 'typeorm';
import { SemesterBlockEntity } from './semester-block.entity';

@Entity('semesters')
export class SemesterEntity extends AbstractEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp' })
  endDate: Date;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: SemesterStatus })
  status: SemesterStatus;

  @OneToMany(() => SemesterBlockEntity, (block) => block.semester)
  blocks: SemesterBlockEntity[];

  @Column({ type: 'int' })
  year: number;
}
