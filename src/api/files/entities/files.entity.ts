import { UserEntity } from '@/api/users/entities/user.entity';
import { Workspaces } from '@/api/workspaces/entities/workspace.entity';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity('files')
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

  @Column()
  destination: string;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'uploadedBy' })
  uploader?: UserEntity;

  @Column({ type: 'uuid', nullable: true })
  uploadedBy?: string;

  @Column({ type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ type: 'uuid', nullable: true })
  workspaceId?: string;

  @ManyToOne(() => Workspaces, { nullable: true })
  @JoinColumn({ name: 'workspaceId' })
  workspace?: Workspaces;
}
