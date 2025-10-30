export enum QueueName {
  EMAIL = 'email',
  NOTIFICATION = 'notification',
}

export enum QueuePrefix {
  AUTH = 'auth',
}

export enum JobName {
  EMAIL_VERIFICATION = 'email-verification',
  WORKSPACE_INVITATION = 'workspace-invitation',
  WORKSPACE_ACCEPTED = 'workspace-accepted',
  WORKSPACE_DECLINED = 'workspace-declined',
  WORKSPACE_REQUEST_JOIN = 'workspace-request-join',
  WORKSPACE_INVITATION_REVOKED = 'workspace-invitation-revoked',
  NOTIFICATION = 'notification',
  TASK_CREATED_ASSIGNEE = 'task-created-assignee',
  TASK_CREATED_FOLLOWED = 'task-created-followed',
  REMINDER = 'reminder',
}
