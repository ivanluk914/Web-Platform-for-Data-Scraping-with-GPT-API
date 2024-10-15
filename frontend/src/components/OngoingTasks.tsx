import React, { useState, useMemo } from 'react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button, Link, Checkbox } from "@nextui-org/react";
import { Link as RouterLink } from 'react-router-dom';
// import { useQuery } from '@tanstack/react-query';
// import { useHttp } from '../providers/http-provider';

interface Task {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  url: string;
}

const OngoingTasks: React.FC = () => {
  // const http = useHttp();
  // const { data: tasks, isLoading, error } = useQuery({
  //   queryKey: ['ongoingTasks'],
  //   queryFn: async () => {
  //     const response = await http.get('/tasks/ongoing');
  //     return response.data;
  //   },
  // });

  // Mock data
  const tasks: Task[] = [
    { id: '1', name: 'Task 1', startDate: '2023-01-01', endDate: '2023-12-31', url: 'https://example1.com' },
    { id: '2', name: 'Task 2', startDate: '2023-02-15', endDate: '2023-11-30', url: 'https://example2.com' },
    { id: '3', name: 'Task 3', startDate: '2023-03-01', endDate: '2023-10-31', url: 'https://example3.com' },
  ];

  // if (isLoading) return <div>Loading...</div>;
  // if (error) return <div>An error occurred: {error.message}</div>;

  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());

  const allTasksSelected = useMemo(() => {
    return selectedTasks.size === tasks.length;
  }, [selectedTasks, tasks]);

  const handleTaskSelection = (taskId: string) => {
    const newSelectedTasks = new Set(selectedTasks);
    if (newSelectedTasks.has(taskId)) {
      newSelectedTasks.delete(taskId);
    } else {
      newSelectedTasks.add(taskId);
    }
    setSelectedTasks(newSelectedTasks);
  };

  const handleSelectAll = () => {
    if (allTasksSelected) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(tasks.map(task => task.id)));
    }
  };

  const handleCancelTasks = () => {
    // Implement cancel tasks logic here
    console.log('Cancel tasks:', Array.from(selectedTasks));
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">On-going Tasks</h2>
      <Table aria-label="On-going tasks table">
        <TableHeader>
          <TableColumn>
            <Checkbox
              isSelected={allTasksSelected}
              onValueChange={handleSelectAll}
            />
          </TableColumn>
          <TableColumn>TASK NAME</TableColumn>
          <TableColumn>START DATE</TableColumn>
          <TableColumn>END DATE</TableColumn>
          <TableColumn>URL</TableColumn>
          <TableColumn>ACTIONS</TableColumn>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell>
                <Checkbox
                  isSelected={selectedTasks.has(task.id)}
                  onValueChange={() => handleTaskSelection(task.id)}
                />
              </TableCell>
              <TableCell>{task.name}</TableCell>
              <TableCell>{task.startDate}</TableCell>
              <TableCell>{task.endDate}</TableCell>
              <TableCell>
                <Link href={task.url} isExternal>
                  {task.url}
                </Link>
              </TableCell>
              <TableCell>
                <Button 
                  as={RouterLink} 
                  to={`/task/${task.id}`} 
                  size="sm" 
                  color="default" 
                  className="bg-black text-white"
                >
                  View Details
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="mt-4">
        <Button color="danger" onClick={handleCancelTasks} disabled={selectedTasks.size === 0}>
          Cancel Selected Tasks
        </Button>
      </div>
    </div>
  );
};

export default OngoingTasks;