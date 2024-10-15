import React, { useState } from 'react';
import UserTable from './UserTable';
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useHttp } from '../providers/http-provider';

const UserManagement: React.FC = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const http = useHttp();

  const { isPending, error, data } = useQuery({
    queryKey: ['users', page, pageSize],
    queryFn: async () => {
      const response = await http.get(`/user?page=${page - 1}&pageSize=${pageSize}`);
      return response.data;
    },
    placeholderData: keepPreviousData,
  });

  console.log(222, data)

  return (
    <div className="user-management">
      <UserTable 
        users={data?.data || []}
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
