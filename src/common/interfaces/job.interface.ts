export interface IEmailJob {
  email: string;
}

export interface IVerifyEmailJob extends IEmailJob {
  token: string;
}

export interface ITaskAssignedEmailJob extends IEmailJob {
  activityName: string;
  activityLink: string;
  assignerName: string;
  activityType: string; // 'công việc' hoặc 'sự kiện'
}

export interface IWorkspaceMemberJob extends IEmailJob {
  workspaceName: string;
  inviteLink: string;
  ownerName: string;
}
