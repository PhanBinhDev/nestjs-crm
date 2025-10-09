import { UserEntity } from '@/api/users/entities/user.entity';
import { Uuid } from '@/common/types/common.type';
import { WrapperType } from '@/common/types/types';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import { Column, Entity, Index, JoinColumn, OneToOne } from 'typeorm';

@Entity('device-token')
@Index('idx_device_token_user', ['userId'])
export class DeviceTokenEntity extends AbstractEntity {
  @Column({
    type: 'uuid',
    nullable: false,
  })
  userId: Uuid;

  @OneToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: WrapperType<UserEntity>;

  @Column({
    type: 'jsonb',
    nullable: false,
    default: [],
  })
  tokens: string[];

  @Column({ type: 'varchar', length: 255, nullable: true })
  deviceInfo?: string;
}
