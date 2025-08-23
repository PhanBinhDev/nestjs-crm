import { AbstractEntity } from '@/database/entities/abstract.entity';
import { Column, Entity } from 'typeorm';

@Entity('device-token')
export class DeviceTokenEntity extends AbstractEntity {
  @Column({
    type: 'uuid',
    nullable: false,
  })
  userId: string;

  @Column({
    type: 'simple-array',
    nullable: false,
  })
  tokens: string[];

  @Column({ type: 'varchar', length: 255, nullable: true })
  deviceInfo?: string;
}
