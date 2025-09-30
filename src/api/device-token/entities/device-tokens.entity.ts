import { AbstractEntity } from '@/database/entities/abstract.entity';
import { Column, Entity, Index } from 'typeorm';

@Entity('device-token')
@Index('idx_device_token_user', ['userId'])
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
