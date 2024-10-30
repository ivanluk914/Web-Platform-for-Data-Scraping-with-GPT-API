export interface UserModel {
    user_id: string;
    email: string;
    name: string;
    given_name: string;
    family_name: string;
    nickname: string;
    last_login: string;
    picture: string;
    roles?: UserRole[];
}

export enum UserRole {
    User = 1,
    Member = 2,
    Admin = 3,
}

export const hasRole = (user: UserModel | null, role: UserRole) => {
    return user?.roles?.includes(role) ?? false;
}
