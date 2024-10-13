import React, { useState } from 'react';
import UserTable from './UserTable';
import { keepPreviousData, useQuery } from '@tanstack/react-query'

const UserManagement: React.FC = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { isPending, error, data } = useQuery({
    queryKey: ['users', page, pageSize],
    queryFn: () =>
      fetch(`http://localhost:8080/api/user?page=${page - 1}&pageSize=${pageSize}`).then((res) =>
        res.json(),
      ),
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
