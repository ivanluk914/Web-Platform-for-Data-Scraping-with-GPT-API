import React, { useState } from 'react';
import UserTable from './UserTable';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useHttp } from '../providers/http-provider';
import { UserService } from '../api/user-service';
import { UserModel, UserRole } from '../models/user';
import { Card, CardBody } from '@nextui-org/react';

const UserManagement: React.FC = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const http = useHttp();
  const queryClient = useQueryClient();
  const userService = new UserService(http);

  // Query for fetching users list
  const { data: usersData, isPending: isUsersPending } = useQuery<UserModel[]>({
    queryKey: ['users', page],
    queryFn: () => userService.listUsers(page, pageSize),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => userService.deleteUser(userId),
    onError: () => {
      toast.error('Failed to delete user');
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted successfully');
    },
  });

  // Assign role mutation
  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      await userService.assignRole(userId, role);
    },
    onSuccess: async () => {
      toast.success('Role assigned successfully');
    },
    onError: () => {
      toast.error('Failed to assign role');
    }
  });

  // Remove role mutation
  const removeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: number }) => {
      await userService.removeRole(userId, role);
    },
    onSuccess: async () => {
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
      await queryClient.invalidateQueries({ queryKey: ['users'] });
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
    <div className="container mx-auto">
      <Card className="mx-auto">
        <CardBody className="p-8">
          <h1 className="text-3xl font-bold mb-2 text-black">User Management</h1>
          <p className="text-gray-600 mb-6">
            Manage user roles and permissions for the application.
          </p>
          
          <UserTable
            users={usersData ?? []}
            isLoading={isUsersPending}
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
        </CardBody>
      </Card>
    </div>
  );
};

export default UserManagement;