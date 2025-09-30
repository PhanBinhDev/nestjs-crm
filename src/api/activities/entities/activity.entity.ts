import { SemesterEntity } from '@/api/semester/entities/semester.entity';
import { StagesEntity } from '@/api/stages/entities/stage.entity';
import { Workspaces } from '@/api/workspaces/entities/workspace.entity';
import { Uuid } from '@/common/types/common.type';
import { WrapperType } from '@/common/types/types';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import {
  ActivityPiority,
  ActivityStatus,
  ActivityType,
} from '@/database/enum/activity.enum';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { ActivityAssigneeEntity } from './activity-assignee.entity';
import { ActivityCategoryEntity } from './activity-category.entity';
import { ActivityChecklistEntity } from './activity-checklist.entity';
import { ActivityCommentEntity } from './activity-comments.entity';
import { ActivityFeedbackEntity } from './activity-feedback.entity';
import { ActivityParticipantEntity } from './activity-participant.entity';

@Entity('activities')
@Index('idx_activity_workspace', ['workspaceId'])
@Index('idx_activity_stage', ['stageId'])
@Index('idx_activity_parent', ['parentId'])
@Index('idx_activity_category', ['categoryId'])
@Index('idx_activity_semester', ['semesterId'])
@Index('idx_activity_status', ['status'])
@Index('idx_activity_type', ['type'])
@Index('idx_activity_name', ['name'])
export class ActivityEntity extends AbstractEntity {
  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'enum', enum: ActivityType })
  type: ActivityType;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: ActivityPiority, nullable: true })
  priority?: ActivityPiority;

  @ManyToOne(() => StagesEntity, { nullable: true })
  @JoinColumn({ name: 'stageId' })
  stage?: StagesEntity;

  @Column({ type: 'uuid', nullable: true })
  stageId?: Uuid;

  @Column({ type: 'timestamptz', nullable: true })
  startTime?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endTime?: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  onlineLink?: string;

  @Column({ type: 'boolean', default: false })
  mandatory: boolean;

  @Column({ type: 'int', nullable: true })
  estimateTime?: number;

  @Column({ type: 'uuid', nullable: true })
  parentId?: Uuid;

  @Column({ type: 'int', default: 0 })
  position: number;

  @ManyToOne(() => ActivityEntity, (activity) => activity.subActivities, {
    nullable: true,
  })
  @JoinColumn({ name: 'parentId' })
  parent?: ActivityEntity;

  @Column({ type: 'uuid', nullable: false })
  workspaceId: Uuid;

  @ManyToOne(() => Workspaces, (workspace) => workspace.activities, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'workspaceId' })
  workspace: WrapperType<Workspaces>;

  @OneToMany(() => ActivityEntity, (activity) => activity.parent)
  subActivities: ActivityEntity[];

  @OneToMany(() => ActivityCommentEntity, (comment) => comment.activity, {
    cascade: true,
  })
  comments: ActivityCommentEntity[];

  @Column({ type: 'uuid', nullable: true })
  categoryId?: Uuid;

  @ManyToOne(() => ActivityCategoryEntity, (category) => category.activities, {
    nullable: true,
  })
  @JoinColumn({ name: 'categoryId' })
  category?: ActivityCategoryEntity;

  @Column({ type: 'enum', enum: ActivityStatus, default: ActivityStatus.NEW })
  status: ActivityStatus;

  @Column({ type: 'uuid', nullable: true })
  semesterId?: Uuid;

  @Column({ type: 'int', nullable: true })
  instructorCount?: number;

  @Column({ type: 'int', nullable: true })
  studentCount?: number;

  @OneToMany(
    () => ActivityParticipantEntity,
    (participant) => participant.activity,
    {
      cascade: true,
    },
  )
  participants: ActivityParticipantEntity[];

  @OneToMany(() => ActivityFeedbackEntity, (feedback) => feedback.activity, {
    cascade: true,
  })
  feedbacks: ActivityFeedbackEntity[];

  @OneToMany(() => ActivityAssigneeEntity, (assignee) => assignee.activity, {
    cascade: true,
  })
  assignees: ActivityAssigneeEntity[];

  @ManyToOne(() => SemesterEntity, { nullable: false, eager: false })
  @JoinColumn({ name: 'semesterId' })
  semester: WrapperType<SemesterEntity>;

  @OneToMany(() => ActivityChecklistEntity, (checklist) => checklist.activity, {
    cascade: true,
  })
  checklists: ActivityChecklistEntity[];
}
