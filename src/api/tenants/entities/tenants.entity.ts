import { UserEntity } from '@/api/users/entities/user.entity';
import { WrapperType } from '@/common/types/types';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import { TenantStatus } from '@/database/enum/tenants.enum';
import { Column, Entity, Index, JoinColumn, OneToOne } from 'typeorm';

@Entity('tenants')
export class TenantEntity extends AbstractEntity {
  @Column({ unique: true })
  @Index()
  code: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  address: string;

  @Column({
    type: 'enum',
    enum: TenantStatus,
    default: TenantStatus.ACTIVE,
  })
  status: TenantStatus;

  @Column({ unique: true })
  schemaName: string;

  @OneToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({
    name: 'ownerId',
  })
  owner?: WrapperType<UserEntity>;

  @Column({ default: false })
  isDeleted: boolean;
}
