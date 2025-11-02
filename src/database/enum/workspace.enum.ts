export enum WorkspaceRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

export enum WorkspaceVisibility {
  PRIVATE = 'private',
  PUBLIC = 'public',
}

export enum WorkspaceMemberStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  REJECT = 'reject',
  REVOKED = 'revoked',
}

export enum MemberType {
  NORMAL = 'normal',
  INVITE = 'invite',
  REQUEST_JOIN = 'request_join',
}
