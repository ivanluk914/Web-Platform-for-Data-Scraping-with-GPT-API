import React, { useState, useCallback, useEffect } from 'react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Tooltip, Link } from "@nextui-org/react";
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@nextui-org/react";
import { useNavigate } from 'react-router-dom';
import { useHttp } from '../providers/http-provider';
import { useAuth0 } from '@auth0/auth0-react';
import { MdOutlineDeleteForever, MdOutlineCancel } from "react-icons/md";
import { GrView } from "react-icons/gr";
import { Task, mapStatus, statusColorMap } from '../models/task';
import { toast } from 'react-hot-toast';
import { Card, CardBody } from "@nextui-org/react";

const columns = [
  { name: "TASK NAME", uid: "taskName" },
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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Fetch tasks from backend
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoading(true);
        const response = await http.get(`/user/${user?.sub}/task`);
        const mappedTasks = response.data.map((task: any) => {
          // Check if task_definition exists and is a string before parsing
          let url = '';
          try {
            if (task.task_definition) {
              const parsedTaskDefinition = JSON.parse(task.task_definition);
              if (parsedTaskDefinition.source && parsedTaskDefinition.source[0]) {
                url = parsedTaskDefinition.source[0].url;
              }
            }
          } catch (e) {
            console.error('Error parsing task definition:', e);
          }

          return {
            id: task.id, 
            url: url,
            dateCreated: new Date(task.created_at).toLocaleDateString(), 
            timeCreated: new Date(task.created_at).toLocaleTimeString(),
            status: mapStatus(task.status),
            taskName: task.task_name || '',
            taskDefinition: task.task_definition || '',
          };
        });
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

  const handleDeleteTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setIsDeleteModalOpen(true);
  };

  const handleCancelTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setIsCancelModalOpen(true);
  };

  const confirmDeleteTask = async () => {
    if (selectedTaskId) {
      try {
        const response = await http.delete(`/user/${user?.sub}/task/${selectedTaskId}`);
        if (response.status === 200) {
          // Update local state by filtering out the deleted task
          setTasks(prevTasks => prevTasks.filter(task => task.id !== selectedTaskId));
          setIsDeleteModalOpen(false);
          setSelectedTaskId(null);
          toast.success('Task deleted successfully');
        } else {
          toast.error('Failed to delete task. Please try again.');
        }
      } catch (error) {
        console.error('Error deleting task:', error);
        toast.error('An error occurred while deleting the task.');
        setIsDeleteModalOpen(false);
        setSelectedTaskId(null);
      }
    }
  };

  const confirmCancelTask = async () => {
    if (selectedTaskId) {
      try {
        const taskToUpdate = tasks.find(task => task.id === selectedTaskId);
        if (!taskToUpdate) {
          throw new Error('Task not found');
        }
        const updatePayload = {
          status: 5
        };

        const response = await http.put(`/user/${user?.sub}/task/${selectedTaskId}`, updatePayload);
        
        if (response.status === 200) {
          setTasks(prevTasks => prevTasks.map(task => 
            task.id === selectedTaskId ? { ...task, status: 'canceled' } : task
          ));
          setIsCancelModalOpen(false);
          setSelectedTaskId(null);
          toast.success('Task canceled successfully');
        } else {
          toast.error('Failed to cancel task. Please try again.');
        }
      } catch (error) {
        console.error('Error canceling task:', error);
        toast.error('An error occurred while canceling the task.');
      } finally {
        setIsCancelModalOpen(false);
        setSelectedTaskId(null);
      }
    }
  };

  const renderCell = useCallback((task: Task, columnKey: React.Key) => {
    const cellValue = task[columnKey as keyof Task];

    switch (columnKey) {
      case "taskName":
        return <span>{task.taskName}</span>;
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
            {task.status === "canceled" || task.status === "completed" || task.status === "failed" ? (
              <Tooltip color="danger" content="Delete Task" delay={0} closeDelay={0} size="sm">
                <span className="text-lg text-danger cursor-pointer active:opacity-50" onClick={() => handleDeleteTask(task.id)}>
                  <MdOutlineDeleteForever />  
                </span>
              </Tooltip>
            ) : (
              <Tooltip color="primary" content="Cancel Task" delay={0} closeDelay={0} size="sm">
                <span className="text-lg text-primary cursor-pointer active:opacity-50" onClick={() => handleCancelTask(task.id)}>
                  <MdOutlineCancel />
                </span>
              </Tooltip>
            )}
          </div>
        );
      default:
        return cellValue;
    }
  }, [tasks]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="container mx-auto">
      <Card className="mx-auto">
        <CardBody className="p-8">
          <h1 className="text-3xl font-bold mb-2 text-black">Task Management</h1>
          <p className="text-gray-600 mb-6">
            Monitor and manage your data extraction tasks. View details, cancel running tasks, or remove completed ones.
          </p>
          
          <Table
            aria-label="Tasks table with custom cells"
            removeWrapper
            bottomContent={
              <div className="flex w-full justify-center">
                {tasks.length > 0 && (
                  <span className="text-small text-default-400">
                    Total {tasks.length} tasks
                  </span>
                )}
              </div>
            }
          >
            <TableHeader columns={columns}>
              {(column) => (
                <TableColumn key={column.uid} align={column.uid === "actions" ? "center" : "start"}>
                  {column.name}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody items={tasks} emptyContent={<div>No tasks to display.</div>}>
              {(item) => (
                <TableRow key={item.id} >
                  {(columnKey) => <TableCell key={`${item.id}-${columnKey}`}>{renderCell(item, columnKey)}</TableCell>}
                </TableRow>
              )}
            </TableBody>
          </Table>

          <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
            <ModalContent>
              <ModalHeader className="flex flex-col gap-1">Confirm Deletion</ModalHeader>
              <ModalBody>
                <p>Are you sure you want to delete this task? This action cannot be undone.</p>
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="light" onPress={() => setIsDeleteModalOpen(false)}>
                  No, Keep Task
                </Button>
                <Button color="danger" onPress={confirmDeleteTask}>
                  Yes, Delete Task
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>

          <Modal isOpen={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)}>
            <ModalContent>
              <ModalHeader className="flex flex-col gap-1">Confirm Cancellation</ModalHeader>
              <ModalBody>
                <p>Are you sure you want to cancel this task? This action cannot be undone.</p>
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="light" onPress={() => setIsCancelModalOpen(false)}>
                  No, Keep Task
                </Button>
                <Button color="danger" onPress={confirmCancelTask}>
                  Yes, Cancel Task
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </CardBody>
      </Card>
    </div>
  );
};

export default TaskManagement;