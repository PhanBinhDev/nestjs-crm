import { FileEntity } from '@/api/files/entities/files.entity';
import { UserEntity } from '@/api/users/entities/user.entity';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import { DocumentStatus, DocumentType } from '@/database/enum/document.enum';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { DocumentFolder } from './document-folder.entity';

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

  @Column({ type: 'uuid', nullable: true })
  fileId?: string;

  @ManyToOne(() => FileEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'fileId' })
  file?: FileEntity;

  @Column({ type: 'varchar', nullable: true })
  linkUrl?: string;

  @Column({ type: 'jsonb', nullable: true })
  linkPreview?: {
    title?: string;
    description?: string;
    image?: string;
    siteName?: string;
  };

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

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'uuid', nullable: true })
  folderId?: string;

  @ManyToOne(() => DocumentFolder, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'folderId' })
  folder?: DocumentFolder;

  @Column({ type: 'int', default: 0 })
  viewCount: number;

  @Column({ type: 'int', default: 0 })
  downloadCount: number;
}
