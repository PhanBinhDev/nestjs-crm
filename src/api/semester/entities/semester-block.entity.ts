import { Uuid } from '@/common/types/common.type';
import { WrapperType } from '@/common/types/types';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { SemesterEntity } from './semester.entity';

@Entity('semester_blocks')
export class SemesterBlockEntity {
  @PrimaryGeneratedColumn('uuid')
  id: Uuid;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ManyToOne(() => SemesterEntity, (semester) => semester.blocks)
  semester: WrapperType<SemesterEntity>;

  @Column({ type: 'uuid' })
  semesterId: string;
}
