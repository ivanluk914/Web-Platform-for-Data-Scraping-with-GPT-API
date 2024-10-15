import React from 'react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button } from "@nextui-org/react";
// import { useQuery } from '@tanstack/react-query';
// import { useHttp } from '../providers/http-provider';

interface Task {
  id: string;
  name: string;
  cancelledDate: string;
  reason: string;
}

const CancelledTasks: React.FC = () => {
  // const http = useHttp();
  // const { data: tasks, isLoading, error } = useQuery({
  //   queryKey: ['cancelledTasks'],
  //   queryFn: async () => {
  //     const response = await http.get('/tasks/cancelled');
  //     return response.data;
  //   },
  // });

  // Mock data
  const tasks: Task[] = [
    { id: '1', name: 'Task 1', cancelledDate: '2023-06-15', reason: 'No longer needed' },
    { id: '2', name: 'Task 2', cancelledDate: '2023-07-01', reason: 'Duplicate task' },
    { id: '3', name: 'Task 3', cancelledDate: '2023-07-10', reason: 'Project cancelled' },
  ];

  // if (isLoading) return <div>Loading...</div>;
  // if (error) return <div>An error occurred: {error.message}</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Cancelled Tasks</h2>
      <Table aria-label="Cancelled tasks table">
        <TableHeader>
          <TableColumn>TASK NAME</TableColumn>
          <TableColumn>CANCELLED DATE</TableColumn>
          <TableColumn>REASON</TableColumn>
          <TableColumn>ACTIONS</TableColumn>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell>{task.name}</TableCell>
              <TableCell>{task.cancelledDate}</TableCell>
              <TableCell>{task.reason}</TableCell>
              <TableCell>
                <Button size="sm">View Details</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default CancelledTasks;