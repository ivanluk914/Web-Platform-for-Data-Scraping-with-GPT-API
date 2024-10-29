import React, { useState, useMemo } from 'react';
import UserTable from './UserTable';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useHttp } from '../providers/http-provider';
import { UserService, RolesMap } from '../api/user-service';
import { UserModel } from '../models/user';

const UserManagement: React.FC = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const http = useHttp();
  const queryClient = useQueryClient();
  const userService = new UserService(http);

  // Query for fetching users list
  const { data: usersData, isPending: isUsersPending } = useQuery<UserModel[]>({
    queryKey: ['users'],
    queryFn: () => userService.listUsers()
  });

  // Query for fetching roles for each user
  const { data: userRoles, isPending: isRolesPending } = useQuery<RolesMap>({
    queryKey: ['userRoles'],
    queryFn: () => userService.getAllUserRoles(usersData || []),
    enabled: !!usersData,
  });

  // Combine users and roles data
  const combinedData = useMemo(() => {
    if (!usersData || !userRoles) return [];
    return usersData.map(user => ({
      ...user,
      roles: userRoles[user.user_id] || []
    }));
  }, [usersData, userRoles]);

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => userService.deleteUser(userId),
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: ['users'] });
      const previousUsers = queryClient.getQueryData<UserModel[]>(['users']);
      
      if (previousUsers) {
        queryClient.setQueryData<UserModel[]>(['users'], 
          previousUsers.filter(user => user.user_id !== userId)
        );
      }
      
      return { previousUsers };
    },
    onError: (err, variables, context) => {
      if (context?.previousUsers) {
        queryClient.setQueryData(['users'], context.previousUsers);
      }
      toast.error('Failed to delete user');
    },
    onSuccess: () => {
      toast.success('User deleted successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });

  // Assign role mutation
  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: number }) => {
      const roles = await userService.assignRole(userId, role);
      return { userId, roles };
    },
    onSuccess: (data) => {
      queryClient.setQueryData<RolesMap>(['userRoles'], (oldData) => ({
        ...oldData,
        [data.userId]: data.roles
      }));
      toast.success('Role assigned successfully');
    },
    onError: () => {
      toast.error('Failed to assign role');
    }
  });

  // Remove role mutation
  const removeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: number }) => {
      const roles = await userService.removeRole(userId, role);
      return { userId, roles };
    },
    onSuccess: (data) => {
      queryClient.setQueryData<RolesMap>(['userRoles'], (oldData) => ({
        ...oldData,
        [data.userId]: data.roles
      }));
      toast.success('Role removed successfully');
    },
    onError: () => {
      toast.error('Failed to remove role');
    }
  });

  // Handler for role updates
  const handleRoleUpdate = async (userId: string, rolesToAdd: number[], rolesToRemove: number[]) => {
    try {
      const mutations = [
        ...rolesToAdd.map(role => assignRoleMutation.mutateAsync({ userId, role })),
        ...rolesToRemove.map(role => removeRoleMutation.mutateAsync({ userId, role }))
      ];
      
      await Promise.all(mutations);
      return true;
    } catch (error) {
      console.error('Error updating roles:', error);
      return false;
    }
  };

  // Handler for user deletion
  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUserMutation.mutateAsync(userId);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  };

  return (
    <div className="user-management">
      <UserTable
        users={combinedData}
        isLoading={isUsersPending || isRolesPending}
        error={null}
        page={page}
        pageSize={pageSize}
        setPage={setPage}
        setPageSize={setPageSize}
        onDeleteUser={handleDeleteUser}
        onUpdateRoles={handleRoleUpdate}
        isDeleting={deleteUserMutation.isPending}
        isUpdatingRoles={assignRoleMutation.isPending || removeRoleMutation.isPending}
      />
    </div>
  );
};

export default UserManagement;