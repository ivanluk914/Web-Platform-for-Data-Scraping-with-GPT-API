import React from 'react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button } from "@nextui-org/react";
// import { useQuery } from '@tanstack/react-query';
// import { useHttp } from '../providers/http-provider';

interface Task {
  id: string;
  name: string;
  completionDate: string;
  duration: string;
}

const CompletedTasks: React.FC = () => {
  // const http = useHttp();
  // const { data: tasks, isLoading, error } = useQuery({
  //   queryKey: ['completedTasks'],
  //   queryFn: async () => {
  //     const response = await http.get('/tasks/completed');
  //     return response.data;
  //   },
  // });

  // Mock data
  const tasks: Task[] = [
    { id: '1', name: 'Task 1', completionDate: '2023-05-15', duration: '30 days' },
    { id: '2', name: 'Task 2', completionDate: '2023-06-01', duration: '45 days' },
    { id: '3', name: 'Task 3', completionDate: '2023-06-30', duration: '60 days' },
  ];

  // if (isLoading) return <div>Loading...</div>;
  // if (error) return <div>An error occurred: {error.message}</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Completed Tasks</h2>
      <Table aria-label="Completed tasks table">
        <TableHeader>
          <TableColumn>TASK NAME</TableColumn>
          <TableColumn>COMPLETION DATE</TableColumn>
          <TableColumn>DURATION</TableColumn>
          <TableColumn>ACTIONS</TableColumn>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell>{task.name}</TableCell>
              <TableCell>{task.completionDate}</TableCell>
              <TableCell>{task.duration}</TableCell>
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

export default CompletedTasks;