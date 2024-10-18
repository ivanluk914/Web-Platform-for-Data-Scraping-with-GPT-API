import React, { useState, useCallback, useEffect } from 'react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Tooltip, Link } from "@nextui-org/react";
import { useNavigate } from 'react-router-dom';
import { EyeIcon } from "../components/EyeIcon";
import { DeleteIcon } from "../components/DeleteIcon";
// import axios from 'axios';

interface Task {
  id: string;
  name: string;
  dateCreated: string;
  dateCompleted?: string;
  dateCancelled?: string;
  url: string;
  status: 'ongoing' | 'completed' | 'cancelled';
}

const columns = [
  { name: "TASK NAME", uid: "name" },
  { name: "DATE CREATED", uid: "dateCreated" },
  { name: "STATUS", uid: "status" },
  { name: "URL", uid: "url" },
  { name: "ACTIONS", uid: "actions" },
];

const TaskManagement: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  // const [isLoading, setIsLoading] = useState(true);
  // const [error, setError] = useState<string | null>(null);

  // Fetch tasks from backend
  // useEffect(() => {
  //   const fetchTasks = async () => {
  //     try {
  //       setIsLoading(true);
  //       const response = await axios.get('/api/tasks');
  //       setTasks(response.data);
  //       setError(null);
  //     } catch (err) {
  //       setError('Failed to fetch tasks. Please try again later.');
  //       console.error('Error fetching tasks:', err);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };

  //   fetchTasks();
  // }, []);

  // Mock data (remove this when connecting to backend)
  useEffect(() => {
    setTasks([
      { id: 'task1', name: 'Web Scraping UNSW', dateCreated: '2023-01-01', url: 'https://www.unsw.edu.au', status: 'ongoing' },
      { id: 'task2', name: 'Data Collection EDX', dateCreated: '2023-02-15', dateCompleted: '2023-07-01', url: 'https://www.edx.org', status: 'completed' },
      { id: 'task3', name: 'Course Info Extraction', dateCreated: '2023-03-01', dateCancelled: '2023-06-15', url: 'https://www.coursera.org', status: 'cancelled' },
    ]);
  }, []);

  const statusColorMap: Record<Task['status'], "primary" | "success" | "danger"> = {
    ongoing: "primary",
    completed: "success",
    cancelled: "danger"
  };

  const handleViewDetails = (taskId: string) => {
    navigate(`/task/${taskId}`);
  };

  const handleDeleteTask = async (taskId: string) => {
    // try {
    //   await axios.delete(`/api/tasks/${taskId}`);
    //   setTasks(tasks.filter(task => task.id !== taskId));
    // } catch (err) {
    //   console.error('Error deleting task:', err);
    //   // Handle error (e.g., show error message to user)
    // }

    // Mock delete (remove this when connecting to backend)
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const renderCell = useCallback((task: Task, columnKey: React.Key) => {
    const cellValue = task[columnKey as keyof Task];

    switch (columnKey) {
      case "status":
        return (
          <Chip className="capitalize" color={statusColorMap[task.status]} size="sm" variant="flat">
            {cellValue}
          </Chip>
        );
      case "url":
        return (
          <Link href={task.url} isExternal>
            {task.url}
          </Link>
        );
      case "actions":
        return (
          <div className="relative flex items-center justify-center gap-2">
            <Tooltip content="View Details">
              <span className="text-lg text-default-400 cursor-pointer active:opacity-50" onClick={() => handleViewDetails(task.id)}>
                <EyeIcon />
              </span>
            </Tooltip>
            <Tooltip color="danger" content="Delete Task">
              <span className="text-lg text-danger cursor-pointer active:opacity-50" onClick={() => handleDeleteTask(task.id)}>
                <DeleteIcon />
              </span>
            </Tooltip>
          </div>
        );
      default:
        return cellValue;
    }
  }, []);

  // if (isLoading) return <div>Loading...</div>;
  // if (error) return <div>{error}</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Task Management</h2>
      <Table aria-label="Tasks table with custom cells">
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn key={column.uid} align={column.uid === "actions" ? "center" : "start"}>
              {column.name}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody items={tasks}>
          {(item) => (
            <TableRow key={item.id}>
              {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default TaskManagement;