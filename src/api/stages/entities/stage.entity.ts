import { AbstractEntity } from '@/database/entities/abstract.entity';
import { StageGroup } from '@/database/enum/stage.enum';
import { Column, Entity } from 'typeorm';

@Entity('stages')
export class StagesEntity extends AbstractEntity {
  constructor(data?: Partial<StagesEntity>) {
    super();
    Object.assign(this, data);
  }
  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  title: string;

  @Column({ type: 'int', default: 0 })
  position: number;

  @Column({
    type: 'varchar',
    length: 7,
    nullable: true,
  })
  color: string;

  @Column({
    type: 'enum',
    enum: StageGroup,
    default: StageGroup.ACTIVE,
  })
  stageGroup: StageGroup;

  @Column({
    type: 'boolean',
    default: false,
  })
  isBuiltIn: boolean;

  @Column({
    type: 'int',
    default: 0,
  })
  groupPosition: number;
}
