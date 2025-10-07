import { FileEntity } from '@/api/files/entities/files.entity';
import { WrapperType } from '@/common/types/types';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ActivityEntity } from './activity.entity';

@Entity('activity_files')
@Index('idx_activity_file_activity', ['activityId'])
@Index('idx_activity_file_file', ['fileId'])
@Index('idx_activity_file_unique', ['activityId', 'fileId'], { unique: true })
export class ActivityFileEntity extends AbstractEntity {
  @ManyToOne(() => ActivityEntity, (activity) => activity.files, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'activityId' })
  activity: WrapperType<ActivityEntity>;

  @Column({ type: 'uuid' })
  activityId: string;

  @ManyToOne(() => FileEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'fileId' })
  file: WrapperType<FileEntity>;

  @Column({ type: 'uuid' })
  fileId: string;
}
