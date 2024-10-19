const API_BASE_URL = 'http://localhost:8080/api';

export const API_ENDPOINTS = {
  LIST_USERS: `${API_BASE_URL}/user`,
  GET_USER: (userId: string) => `${API_BASE_URL}/user/${encodeURIComponent(userId)}`,
  UPDATE_USER: (userId: string) => `${API_BASE_URL}/user/${encodeURIComponent(userId)}`,
  DELETE_USER: (userId: string) => `${API_BASE_URL}/user/${encodeURIComponent(userId)}`,
  LIST_USER_ROLES: (userId: string) => `${API_BASE_URL}/user/${encodeURIComponent(userId)}/roles`,
  ASSIGN_USER_ROLE: (userId: string) => `${API_BASE_URL}/user/${encodeURIComponent(userId)}/roles`,
  REMOVE_USER_ROLE: (userId: string) => `${API_BASE_URL}/user/${encodeURIComponent(userId)}/roles`,
};
