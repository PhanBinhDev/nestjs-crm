import { Uuid } from '@/common/types/common.type';
import { getOrder, Order } from '@/database/decorators/order.decorator';
import { plainToInstance } from 'class-transformer';
import { RequestContextService } from 'src/services/request-context.service';
import {
  BaseEntity,
  BeforeInsert,
  Column,
  CreateDateColumn,
  DataSource,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export abstract class AbstractEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: Uuid;

  @Order(9999)
  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: false,
  })
  createdAt: Date;

  @Order(9999)
  @Column({
    type: 'varchar',
    nullable: false,
  })
  createdBy: string;

  @Order(9999)
  @UpdateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
    nullable: false,
  })
  updatedAt: Date;

  toDto<Dto>(dtoClass: new () => Dto): Dto {
    return plainToInstance(dtoClass, this);
  }

  static useDataSource(dataSource: DataSource) {
    BaseEntity.useDataSource.call(this, dataSource);
    const meta = dataSource.entityMetadatasMap.get(this);
    if (meta != null) {
      // reorder columns here
      meta.columns = [...meta.columns].sort((x, y) => {
        const orderX = getOrder((x.target as any)?.prototype, x.propertyName);
        const orderY = getOrder((y.target as any)?.prototype, y.propertyName);
        return orderX - orderY;
      });
    }
  }

  @BeforeInsert()
  setCreatedBy() {
    const user = RequestContextService.get('user') || 'anonymous';
    this.createdBy = user?.id ? user.id.toString() : 'anonymous';
  }
}
