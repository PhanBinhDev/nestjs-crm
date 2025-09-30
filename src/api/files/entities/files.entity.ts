import { UserEntity } from '@/api/users/entities/user.entity';
import { Workspaces } from '@/api/workspaces/entities/workspace.entity';
import { WrapperType } from '@/common/types/types';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import {
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

@Entity('files')
@Index('idx_file_workspace', ['workspaceId'])
@Index('idx_file_uploader', ['uploadedBy'])
@Index('idx_file_deleted', ['deletedAt'])
export class FileEntity extends AbstractEntity {
  @Column()
  url: string;

  @Column()
  originalName: string;

  @Column()
  mimeType: string;

  @Column()
  size: number;

  @Column()
  fileName: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'uploadedBy' })
  uploader?: WrapperType<UserEntity>;

  @Column({ type: 'uuid', nullable: true })
  uploadedBy?: string;

  @DeleteDateColumn()
  deletedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  workspaceId?: string;

  @ManyToOne(() => Workspaces, { nullable: true })
  @JoinColumn({ name: 'workspaceId' })
  workspace?: WrapperType<Workspaces>;
}
