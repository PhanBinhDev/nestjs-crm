import { WorkspaceRole } from '@/database/enum/workspace.enum';

export class WorkspaceRoleHierarchy {
  private static readonly roleHierarchy: Record<WorkspaceRole, number> = {
    [WorkspaceRole.OWNER]: 3,
    [WorkspaceRole.ADMIN]: 2,
    [WorkspaceRole.MEMBER]: 1,
  };

  /**
   * Check if the current user role can manage (delete/update) the target user role
   * @param currentUserRole - Role of the user performing the action
   * @param targetUserRole - Role of the user being managed
   * @returns true if the current user can manage the target user
   */
  static canManageRole(
    currentUserRole: WorkspaceRole,
    targetUserRole: WorkspaceRole,
  ): boolean {
    const currentRoleLevel = this.roleHierarchy[currentUserRole];
    const targetRoleLevel = this.roleHierarchy[targetUserRole];

    // A user can manage roles that are lower than their own
    return currentRoleLevel > targetRoleLevel;
  }

  /**
   * Check if the current user role can assign a specific role to another user
   * @param currentUserRole - Role of the user performing the action
   * @param roleToAssign - Role to be assigned
   * @returns true if the current user can assign this role
   */
  static canAssignRole(
    currentUserRole: WorkspaceRole,
    roleToAssign: WorkspaceRole,
  ): boolean {
    const currentRoleLevel = this.roleHierarchy[currentUserRole];
    const assignRoleLevel = this.roleHierarchy[roleToAssign];

    // A user can only assign roles that are lower than or equal to their own
    // But OWNER cannot be assigned by anyone (it's transferred, not assigned)
    if (roleToAssign === WorkspaceRole.OWNER) {
      return false;
    }

    return currentRoleLevel >= assignRoleLevel;
  }

  /**
   * Get all roles that a user can assign based on their current role
   * @param currentUserRole - Role of the user
   * @returns Array of assignable roles
   */
  static getAssignableRoles(currentUserRole: WorkspaceRole): WorkspaceRole[] {
    const assignableRoles: WorkspaceRole[] = [];

    for (const role of Object.values(WorkspaceRole)) {
      if (this.canAssignRole(currentUserRole, role)) {
        assignableRoles.push(role);
      }
    }

    return assignableRoles;
  }

  /**
   * Check if a role is higher than another role
   * @param roleA - First role
   * @param roleB - Second role
   * @returns true if roleA is higher than roleB
   */
  static isRoleHigher(roleA: WorkspaceRole, roleB: WorkspaceRole): boolean {
    return this.roleHierarchy[roleA] > this.roleHierarchy[roleB];
  }
}
