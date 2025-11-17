import { UserEntity } from '@/api/users/entities/user.entity';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity('document_folders')
export class DocumentFolder extends AbstractEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'createdBy' })
  createdByUser?: UserEntity;
}
