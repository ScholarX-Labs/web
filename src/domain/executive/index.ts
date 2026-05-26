export { createExecutiveDomain } from "./factory/executive-domain.factory";
export type { ExecutiveDomain } from "./factory/executive-domain.factory";
export {
  ExecutiveError,
  ExecutiveErrors,
  isExecutiveError,
} from "./application/executive-errors";
export {
  canAccessExecutiveResource,
  assertExecutiveAccess,
} from "./application/executive-access.policy";
export type {
  ExecutiveAction,
  ExecutiveAccessInput,
  ExecutiveResource,
  ExecutiveRole,
} from "./application/executive-access.policy";
export type {
  ExecutivePageId,
  ExecutiveSectionState,
} from "./contracts/executive-types";
