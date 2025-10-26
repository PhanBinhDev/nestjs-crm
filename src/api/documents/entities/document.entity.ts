import { UserEntity } from '@/api/users/entities/user.entity';
import { Workspaces } from '@/api/workspaces/entities/workspace.entity';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

export enum DocumentType {
  FILE = 'FILE',
  LINK = 'LINK',
}

export enum DocumentStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

@Entity('documents')
export class Document extends AbstractEntity {
  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: DocumentType,
    default: DocumentType.FILE,
  })
  type: DocumentType;

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.DRAFT,
  })
  status: DocumentStatus;

  // Cho type = FILE
  @Column({ type: 'varchar', nullable: true })
  fileUrl?: string;

  @Column({ type: 'varchar', nullable: true })
  fileName?: string;

  @Column({ type: 'varchar', nullable: true })
  fileType?: string;

  @Column({ type: 'bigint', nullable: true })
  fileSize?: number;

  @Column({ type: 'varchar', nullable: true })
  publicId?: string;

  // Cho type = LINK
  @Column({ type: 'varchar', nullable: true })
  linkUrl?: string;

  @Column({ type: 'jsonb', nullable: true })
  linkPreview?: {
    title?: string;
    description?: string;
    image?: string;
    siteName?: string;
  };

  // Relations
  @Column({ type: 'uuid' })
  workspaceId: string;

  @ManyToOne(() => Workspaces, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspaceId' })
  workspace: Workspaces;

  @Column({ type: 'uuid' })
  createdById: string;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdById' })
  createdByUser: UserEntity;

  @Column({ type: 'uuid', nullable: true })
  updatedById?: string;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'updatedById' })
  updatedByUser?: UserEntity;

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'int', default: 0 })
  viewCount: number;

  @Column({ type: 'int', default: 0 })
  downloadCount: number;
}
