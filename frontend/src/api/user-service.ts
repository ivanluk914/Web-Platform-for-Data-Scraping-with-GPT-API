import { API_ENDPOINTS } from "./apiEndPoints";
import { UserModel } from "../models/user";

export interface RolesMap {
  [key: string]: number[];
}

export class UserService {
  constructor(private http: any) {}

  async listUsers(): Promise<UserModel[]> {
    const response = await this.http.get(API_ENDPOINTS.LIST_USERS);
    return response.data?.data || [];
  }

  async getUserRoles(userId: string): Promise<number[]> {
    const response = await this.http.get(API_ENDPOINTS.LIST_USER_ROLES(userId));
    return response.data;
  }

  async getAllUserRoles(users: UserModel[]): Promise<RolesMap> {
    const rolesMap: RolesMap = {};
    
    for (const user of users) {
      try {
        const roles = await this.getUserRoles(user.user_id);
        rolesMap[user.user_id] = roles;
      } catch (error) {
        console.error(`Error fetching roles for user ${user.user_id}:`, error);
        rolesMap[user.user_id] = [];
      }
    }
    
    return rolesMap;
  }

  async deleteUser(userId: string): Promise<void> {
    await this.http.delete(API_ENDPOINTS.DELETE_USER(userId));
  }

  async assignRole(userId: string, role: number): Promise<number[]> {
    await this.http.post(API_ENDPOINTS.ASSIGN_USER_ROLE(userId), { role });
    const roles = await this.getUserRoles(userId);
    return roles;
  }

  async removeRole(userId: string, role: number): Promise<number[]> {
    await this.http.delete(API_ENDPOINTS.REMOVE_USER_ROLE(userId), { data: { role } });
    const roles = await this.getUserRoles(userId);
    return roles;
  }
}