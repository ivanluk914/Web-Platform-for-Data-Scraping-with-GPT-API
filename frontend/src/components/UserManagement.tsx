import React, { useState } from 'react';
import UserTable from './UserTable';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useHttp } from '../providers/http-provider';
import { API_ENDPOINTS } from '../api/apiEndPoints';

const UserManagement: React.FC = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const http = useHttp();

  const { isPending, error, data } = useQuery({
    queryKey: ['usersWithRoles', page, pageSize],
    queryFn: async () => {
      const usersResponse = await http.get(API_ENDPOINTS.LIST_USERS);
      
      // Access the `data` field inside the response
      const usersData = usersResponse.data?.data;  // Extract the users array from the response
      
      if (Array.isArray(usersData)) {
        const usersWithRoles = await Promise.all(
          usersData.map(async (user: any) => {
            const rolesResponse = await http.get(API_ENDPOINTS.LIST_USER_ROLES(user.user_id));
            return {
              ...user,
              roles: rolesResponse.data,  // Add roles to each user
            };
          })
        );
        return usersWithRoles;
      } else {
        console.error("Expected an array of users, but received:", usersData);
        return [];  // Return an empty array if the data is not an array
      }
    },
    placeholderData: keepPreviousData,
  });

  return (
    <div className="user-management">
      <UserTable
        users={data || []}  // Ensure users is always an array
        isLoading={isPending}
        error={error as Error | null}
        page={page}
        pageSize={pageSize}
        setPage={setPage}
        setPageSize={setPageSize}
      />
    </div>
  );
};

export default UserManagement;
