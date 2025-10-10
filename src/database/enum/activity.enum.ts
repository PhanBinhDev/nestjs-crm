export enum ActivityType {
  TASK = 'task',
  EVENT = 'event',
}

export enum ActivityPiority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum ActivityCategory {
  SEMINAR = 'seminar',
  WORKSHOP = 'workshop',
  TUTOR = 'tutor',
}

export enum ParticipantStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'declined',
  JOINED = 'joined',
}

export enum ParticipantRole {
  OWNER = 'owner',
  EXECUTOR = 'executor',
  PARTICIPANT = 'participant',
}

export enum ActivityStatus {
  NEW = 'new',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
}

export enum AssigneeRole {
  OWNER = 'owner',
  COLLABORATOR = 'collaborator',
  REVIEWER = 'reviewer',
}

export enum AssignmentStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
}

export enum StageGroupStatus {
  ACTIVE = 'active',
  DONE = 'done',
  NOT_STARTED = 'not_started',
  CLOSED = 'closed',
}

export enum QueryType {
  CREATED_BY_ME = 'created_by_me',
  ASSIGNED_TO_ME = 'assigned_to_me',
  ASSIGNED_BY_STAGE_GROUP = 'assigned_by_stage_group',
  OVERDUE = 'overdue',
  IN_PROGRESS = 'in_progress',
  TODAY = 'today',
  COMPLETED = 'completed',
  ALL = 'all',
}

export enum ActivityLogActionEnum {
  CREATED = 'created',
  UPDATED = 'updated',
  DELETED = 'deleted',
  ADDED = 'added',
  COMMENT_CREATED = 'comment_created',
  COMMENT_UPDATED = 'comment_updated',
  COMMENT_DELETED = 'comment_deleted',
  DELETE_SUB_TASK = 'delete_sub_task',
  FOLLOW = 'follow'
}

export enum ActivityLogQueryType {
  SUB_TASK = 'sub_task',
  MAIN_ACTIVITY = 'main_activity',
}
