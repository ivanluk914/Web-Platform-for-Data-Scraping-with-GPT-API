export const API_ENDPOINTS = {
  LIST_USERS: `/user`,
  GET_USER: (userId: string) => `/user/${encodeURIComponent(userId)}`,
  UPDATE_USER: (userId: string) => `/user/${encodeURIComponent(userId)}`,
  DELETE_USER: (userId: string) => `/user/${encodeURIComponent(userId)}`,
  LIST_USER_ROLES: (userId: string) => `/user/${encodeURIComponent(userId)}/roles`,
  ASSIGN_USER_ROLE: (userId: string) => `/user/${encodeURIComponent(userId)}/roles`,
  REMOVE_USER_ROLE: (userId: string) => `/user/${encodeURIComponent(userId)}/roles`,
};
