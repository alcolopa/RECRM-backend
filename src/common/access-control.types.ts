/**
 * Access Control Types
 *
 * Defines the core abstractions for the unified authorization system.
 * All services use these types to determine record visibility and ownership.
 */

/**
 * Determines how records are filtered for a given user.
 */
export enum AccessStrategy {
  /** User sees all records in the organization */
  ORG_WIDE = 'ORG_WIDE',
  /** User sees only records they created */
  OWN_ONLY = 'OWN_ONLY',
  /** User sees records they created OR are assigned to */
  OWN_OR_ASSIGNED = 'OWN_OR_ASSIGNED',
  /** User sees only records assigned to them */
  ASSIGNED_ONLY = 'ASSIGNED_ONLY',
}

/**
 * Resolved context for the current user's access within an organization.
 * Built once per request by AccessControlService.getAccessContext().
 */
export interface AccessContext {
  userId: string;
  organizationId: string;
  role: string;
  permissions: string[];
  isOrgOwner: boolean;
}

/**
 * Options for customizing which fields are used for ownership scoping.
 * Different models may use different field names for the creator and assignee.
 */
export interface ScopedWhereOptions {
  /** The field name for the record creator. Defaults to 'createdById'. */
  createdByField?: string;
  /** The field name for the assigned user. Defaults to 'assignedUserId'. */
  assignedToField?: string;
  /** Override the default strategy for non-privileged users. Defaults to OWN_OR_ASSIGNED. */
  defaultStrategy?: AccessStrategy;
}
