import { WrapperType } from '@/common/types/types';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { SemesterEntity } from './semester.entity';

@Entity('semester_blocks')
export class SemesterBlockEntity extends AbstractEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ManyToOne(() => SemesterEntity, (semester) => semester.blocks)
  semester: WrapperType<SemesterEntity>;

  @Column({ type: 'uuid' })
  semesterId: string;
}
