import { ROLES } from '../constants';

/**
 * Visibility rules for a notification against the logged-in user:
 * - userIds: only those users
 * - roles: must include the user's role (defaults to ops if omitted)
 * - wardIds: supervisors only see overlapping wards; admin sees all
 */
export function isNotificationVisibleToUser(notification, user) {
  if (!notification || !user) return false;

  const { role, id: userId, wardIds: userWardIds = [] } = user;
  const { userIds, roles, wardIds } = notification;

  if (Array.isArray(userIds) && userIds.length > 0) {
    return userIds.includes(userId);
  }

  const audienceRoles = Array.isArray(roles) && roles.length > 0
    ? roles
    : [ROLES.ADMIN, ROLES.SUPERVISOR];

  if (!audienceRoles.includes(role)) return false;

  if (role === ROLES.SUPERVISOR && Array.isArray(wardIds) && wardIds.length > 0) {
    return wardIds.some((w) => userWardIds.includes(w));
  }

  return true;
}

export function filterNotificationsForUser(notifications, user) {
  if (!Array.isArray(notifications)) return [];
  return notifications.filter((n) => isNotificationVisibleToUser(n, user));
}
