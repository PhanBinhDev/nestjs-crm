import { AbstractEntity } from '@/database/entities/abstract.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { ActivityEntity } from './activity.entity';

@Entity('activity_categories')
export class ActivityCategoryEntity extends AbstractEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description?: string;

  @OneToMany(() => ActivityEntity, (activity) => activity.category)
  activities: ActivityEntity[];
}
