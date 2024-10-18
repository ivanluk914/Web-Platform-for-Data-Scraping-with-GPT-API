import React, { useState, useMemo } from 'react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button, Link, Checkbox, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@nextui-org/react";
import { Link as RouterLink } from 'react-router-dom';
// import { useQuery } from '@tanstack/react-query';
// import { useHttp } from '../providers/http-provider';

interface Task {
  id: string;
  name: string;
  dateCreated: string;
  dateCancelled: string;
  url: string;
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
    { id: '1', name: 'Task 1', dateCreated: '2023-01-01', dateCancelled: '2023-06-15', url: 'https://example1.com' },
    { id: '2', name: 'Task 2', dateCreated: '2023-02-15', dateCancelled: '2023-07-01', url: 'https://example2.com' },
    { id: '3', name: 'Task 3', dateCreated: '2023-03-01', dateCancelled: '2023-07-10', url: 'https://example3.com' },
  ];

  // if (isLoading) return <div>Loading...</div>;
  // if (error) return <div>An error occurred: {error.message}</div>;

  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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

  const handleDeleteTasks = () => {
    // Implement delete tasks logic here
    console.log('Delete tasks:', Array.from(selectedTasks));
    setIsDeleteModalOpen(false);
    // After deleting, you might want to refetch the tasks or update the local state
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Cancelled Tasks</h2>
      <Table aria-label="Cancelled tasks table">
        <TableHeader>
          <TableColumn>
            <Checkbox
              isSelected={allTasksSelected}
              onValueChange={handleSelectAll}
            />
          </TableColumn>
          <TableColumn>TASK NAME</TableColumn>
          <TableColumn>DATE CREATED</TableColumn>
          <TableColumn>DATE CANCELLED</TableColumn>
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
              <TableCell>{task.dateCreated}</TableCell>
              <TableCell>{task.dateCancelled}</TableCell>
              <TableCell>
                <Link href={task.url} isExternal>
                  {task.url}
                </Link>
              </TableCell>
              <TableCell>
                <Button 
                  as={RouterLink} 
                  to={`/cancelled-task/${task.id}`} 
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
        <Button 
          color="danger" 
          onClick={() => setIsDeleteModalOpen(true)} 
          disabled={selectedTasks.size === 0}
        >
          Delete Selected Tasks
        </Button>
      </div>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">Confirm Deletion</ModalHeader>
          <ModalBody>
            <p>Are you sure you want to delete the selected tasks?</p>
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="light" onPress={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button color="danger" onPress={handleDeleteTasks}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default CancelledTasks;