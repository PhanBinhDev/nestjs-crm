export interface IEmailJob {
  email: string;
}

export interface IVerifyEmailJob extends IEmailJob {
  token: string;
}

export interface IAssigneeEmailJob extends IEmailJob {
  activityId: string;
}

export interface IWorkspaceMemberJob extends IEmailJob {
  workspaceName: string;
  inviteLink: string;
  ownerName: string;
}
