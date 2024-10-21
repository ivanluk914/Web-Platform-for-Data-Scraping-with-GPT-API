import React, { useState, useCallback, useEffect } from 'react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Tooltip, Link } from "@nextui-org/react";
import { useNavigate } from 'react-router-dom';
import { useHttp } from '../providers/http-provider';
import { useAuth0 } from '@auth0/auth0-react';
import { MdOutlineDeleteForever } from "react-icons/md";
import { GrView } from "react-icons/gr";
import { Task, mapStatus, statusColorMap } from '../models/task';

const columns = [
  { name: "URL", uid: "url" },
  { name: "DATE CREATED", uid: "dateCreated" },
  { name: "TIME CREATED", uid: "timeCreated" },
  { name: "STATUS", uid: "status" },
  { name: "ACTIONS", uid: "actions" },
];

const TaskManagement: React.FC = () => {
  const { user } = useAuth0();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const http = useHttp();

  // Fetch tasks from backend
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoading(true);
        const response = await http.get(`/user/${user?.sub}/task`);
        console.log('Fetched tasks:', response.data);
        const mappedTasks = response.data.map((task: any) => ({
          id: task.ID,
          url: task.task_definition.source[0].url,
          dateCreated: new Date(task.CreatedAt).toLocaleDateString(),
          timeCreated: new Date(task.CreatedAt).toLocaleTimeString(),
          status: mapStatus(task.status),
        }));
        setTasks(mappedTasks);
        setError(null);
      } catch (err) {
        setError('Failed to fetch tasks. Please try again later.');
        console.error('Error fetching tasks:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTasks();
  }, [user, http]);

  const handleViewDetails = (taskId: string) => {
    navigate(`/home/tasks/${taskId}`);
  };

const handleDeleteTask = async (taskId: string) => {
  try {
    await http.delete(`/user/${user?.sub}/task/${taskId}`);
    setTasks(tasks.filter(task => task.id !== taskId));
  } catch (err) {
    console.error('Error deleting task:', err);
  }
};

  const renderCell = useCallback((task: Task, columnKey: React.Key) => {
    const cellValue = task[columnKey as keyof Task];

    switch (columnKey) {
      case "url":
        return (
          <Link href={task.url} isExternal>
            {task.url}
          </Link>
        );
      case "status":
        return (
          <Chip className="capitalize" color={statusColorMap[task.status]} size="sm" variant="flat">
            {cellValue}
          </Chip>
        );
      case "actions":
        return (
          <div className="relative flex items-center justify-center gap-2">
            <Tooltip content="View Details" delay={0} closeDelay={0} size="sm">
              <span className="text-lg text-default-400 cursor-pointer active:opacity-50" onClick={() => handleViewDetails(task.id)}>
                <GrView />
              </span>
            </Tooltip>
            <Tooltip color="danger" content="Delete Task" delay={0} closeDelay={0} size="sm">
              <span className="text-lg text-danger cursor-pointer active:opacity-50" onClick={() => handleDeleteTask(task.id)}>
                <MdOutlineDeleteForever />  
              </span>
            </Tooltip>
          </div>
        );
      default:
        return cellValue;
    }
  }, [tasks]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

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
              {(columnKey) => <TableCell key={`${item.id}-${columnKey}`}>{renderCell(item, columnKey)}</TableCell>}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default TaskManagement;
