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

export enum QueryType {
  CREATED_BY_ME = 'created_by_me',
  ASSIGNED_TO_ME = 'assigned_to_me',
  OVERDUE = 'overdue',
  TODAY = 'today',
  COMPLETED = 'completed',
}

export enum ActivityLogActionEnum {
  CREATED = 'created',
  UPDATED = 'updated',
  DELETED = 'deleted',
  ADDED = 'added',
}

export enum ActivityLogQueryType {
  SUB_TASK = 'sub_task',
}
