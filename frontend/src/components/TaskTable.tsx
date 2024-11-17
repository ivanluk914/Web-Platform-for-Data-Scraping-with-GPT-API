import React, { useState, useCallback, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Tooltip,
  Link,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Accordion,
  AccordionItem,
  User,
  Input,
  Spacer,
  Pagination,
} from "@nextui-org/react";
import { MdOutlineDeleteForever, MdOutlineCancel, MdDownload } from "react-icons/md";
import { BsSearch } from "react-icons/bs";
import { GrView } from "react-icons/gr";
import { toast } from "react-hot-toast";
import { useHttp } from '../providers/http-provider';

import { TaskStatus, OutputType, TaskPeriod, mapStatus, statusColorMap } from '../models/task';
import { UserModel } from "../models/user";

interface TaskModel {
  id: string;
  user_id: string;
  taskName: string;
  url: string;
  dateCreated: string;
  timeCreated: string;
  status: TaskStatus;
}

const taskColumns = [
  { name: "TASK NAME", uid: "taskName" },
  { name: "URL", uid: "url" },
  { name: "DATE CREATED", uid: "dateCreated" },
  { name: "TIME CREATED", uid: "timeCreated" },
  { name: "STATUS", uid: "status" },
  { name: "ACTIONS", uid: "actions" },
];

interface TaskTableProps {
  users: UserModel[];
  tasksData: TaskModel[][];
}

interface UserTaskState {
  searchTerm: string;
  sortField: string;
  sortOrder: 'asc' | 'desc';
  currentPage: number;
}

interface UserWithTasks {
  user: UserModel;
  tasks: TaskModel[];
  state: UserTaskState;
}

const PAGE_SIZE = 5;

const TaskTable: React.FC<TaskTableProps> = ({ users, tasksData = [] }) => {
  const http = useHttp();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null); // Changed from selectedUserIndex
  const [tasks, setTasks] = useState<TaskModel[][]>(tasksData);
  const [usersWithTasks, setUsersWithTasks] = useState<UserWithTasks[]>([]);
  const [userSortOrder, setUserSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isViewDetailsModalOpen, setIsViewDetailsModalOpen] = useState(false);
  const [selectedTaskDetails, setSelectedTaskDetails] = useState<MappedTask | null>(null);
  const [userSearchTerm, setUserSearchTerm] = useState('');

  useEffect(() => {
    setTasks(tasksData);

    const combinedData = users.map((user, index) => ({
      user,
      tasks: tasksData[index] || [],
      state: {
        searchTerm: '',
        sortField: '',
        sortOrder: 'asc' as 'asc' | 'desc',
        currentPage: 1,
      },
    }));

    setUsersWithTasks(combinedData);
  }, [tasksData, users]);

  const handleDeleteTask = (taskId: string, userId: string) => {
    setSelectedTaskId(taskId);
    setSelectedUserId(userId);
    setIsDeleteModalOpen(true);
  };

  const handleCancelTask = (taskId: string, userId: string) => {
    setSelectedTaskId(taskId);
    setSelectedUserId(userId);
    setIsCancelModalOpen(true);
  };

  const confirmDeleteTask = async () => {
    if (selectedTaskId !== null && selectedUserId !== null) {
      const userIndex = usersWithTasks.findIndex(u => u.user.user_id === selectedUserId);
      if (userIndex === -1) {
        toast.error("User not found.");
        return;
      }
      const userTasks = usersWithTasks[userIndex].tasks;
      const taskToDelete = userTasks.find(task => task.id === selectedTaskId);
      if (!taskToDelete) {
        toast.error("Task not found.");
        return;
      }
      try {
        const response = await http.delete(`/user/${selectedUserId}/task/${selectedTaskId}`);
        if (response.status === 200) {
          setUsersWithTasks(prevUsersWithTasks => {
            const updatedUsersWithTasks = [...prevUsersWithTasks];
            updatedUsersWithTasks[userIndex].tasks = userTasks.filter(task => task.id !== selectedTaskId);
            return updatedUsersWithTasks;
          });
          toast.success("Task deleted successfully");
        } else {
          toast.error("Failed to delete task. Please try again.");
        }
      } catch (error) {
        console.error("Error deleting task:", error);
        toast.error("An error occurred while deleting the task.");
      } finally {
        setIsDeleteModalOpen(false);
        setSelectedTaskId(null);
        setSelectedUserId(null);
      }
    }
  };

  const confirmCancelTask = async () => {
    if (selectedTaskId !== null && selectedUserId !== null) {
      const userIndex = usersWithTasks.findIndex(u => u.user.user_id === selectedUserId);
      if (userIndex === -1) {
        toast.error("User not found.");
        return;
      }
      const userTasks = usersWithTasks[userIndex].tasks;
      const taskToCancel = userTasks.find(task => task.id === selectedTaskId);
      if (!taskToCancel) {
        toast.error("Task not found.");
        return;
      }
      try {
        const response = await http.put(`/user/${selectedUserId}/task/${selectedTaskId}`, { status: TaskStatus.canceled });
        if (response.status === 200) {
          setUsersWithTasks(prevUsersWithTasks => {
            const updatedUsersWithTasks = [...prevUsersWithTasks];
            updatedUsersWithTasks[userIndex].tasks = userTasks.map(task =>
              task.id === selectedTaskId ? { ...task, status: TaskStatus.canceled } : task
            );
            return updatedUsersWithTasks;
          });
          toast.success("Task canceled successfully");
        } else {
          toast.error("Failed to cancel task. Please try again.");
        }
      } catch (error) {
        console.error("Error canceling task:", error);
        toast.error("An error occurred while canceling the task.");
      } finally {
        setIsCancelModalOpen(false);
        setSelectedTaskId(null);
        setSelectedUserId(null);
      }
    }
  };

  interface MappedTask {
    id: string;
    taskName: string;
    url: string;
    dateCreated: string;
    timeCreated: string;
    status: keyof typeof TaskStatus;
    dateCanceled?: string;
    timeCanceled?: string;
    taskDefinition: {
      source: { url: string }[];
      output: { type: OutputType; value: string }[];
      target: { name: string; value: string }[];
      period: TaskPeriod;
    };
    GPTResponse?: string;
    userName?: string;
  }

  const fetchTaskDetails = async (taskId: string, userId: string): Promise<MappedTask | null> => {
    try {
      const response = await http.get(`/user/${userId}/task/${taskId}`);
      if (response.status === 200) {
        const responseData = response.data;
        const taskDefinition = responseData.taskDefinition || JSON.parse(responseData.task_definition);
        const user = users.find(u => u.user_id === userId);
        
        const mappedTask: MappedTask = {
          id: responseData.id,
          taskName: responseData.taskName || responseData.task_name,
          url: taskDefinition.source[0].url,
          dateCreated: new Date(responseData.createdAt || responseData.created_at).toLocaleDateString(),
          timeCreated: new Date(responseData.createdAt || responseData.created_at).toLocaleTimeString(),
          status: mapStatus(responseData.status),
          dateCanceled: responseData.canceledAt ? new Date(responseData.canceledAt).toLocaleDateString() : undefined,
          timeCanceled: responseData.canceledAt ? new Date(responseData.canceledAt).toLocaleTimeString() : undefined,
          taskDefinition: taskDefinition,
          userName: user?.name || 'Unknown User',
        };
        const outputValue = mappedTask.taskDefinition.output[0]?.value;
        const formattedResponse = outputValue?.replace(/\\n/g, '\n').replace(/\n/g, '\n');
        mappedTask.GPTResponse = formattedResponse || '';
        return mappedTask;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error fetching task details:", error);
      return null;
    }
  };

  const handleViewDetails = async (taskId: string, userId: string) => {
    try {
      const task = await fetchTaskDetails(taskId, userId);
      if (task) {
        setSelectedTaskDetails(task);
        setIsViewDetailsModalOpen(true);
      } else {
        toast.error("Failed to fetch task details. Please try again.");
      }
    } catch (error) {
      console.error("Error fetching task details:", error);
      toast.error("An error occurred while fetching the task details.");
    }
  };

  const handleDownloadResult = async (taskId: string, userId: string) => {
    try {
      const task = await fetchTaskDetails(taskId, userId);
      if (task && task.taskDefinition.output) {
        const output = task.taskDefinition.output[1]; // Output at index 1
        const data = output?.value;
        const type = output?.type;

        if (!data || type === undefined) {
          console.error('No data or type available for download');
          toast.error('No data available for download.');
          return;
        }

        let fileType = '';
        let fileExtension = '';
        let fileContent = data;

        try {
          const unescapedData = data.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');

          switch (type) {
            case OutputType.JSON:
              fileType = 'application/json';
              fileExtension = 'json';
              let fixedData = unescapedData;
              fixedData = fixedData.trim();
              if (fixedData.startsWith('{') && fixedData.endsWith('}')) {
                fixedData = fixedData.substring(1, fixedData.length - 1).trim();
              }
              fixedData = `[${fixedData}]`;
              const jsonData = JSON.parse(fixedData);
              fileContent = JSON.stringify(jsonData, null, 2);
              break;
            case OutputType.CSV:
              fileType = 'text/csv';
              fileExtension = 'csv';
              fileContent = unescapedData.replace(/\\n/g, '\n');
              break;
            case OutputType.MARKDOWN:
              fileType = 'text/markdown';
              fileExtension = 'md';
              fileContent = unescapedData.replace(/\\n/g, '\n');
              break;
            default:
              console.error('Unsupported file type');
              toast.error('Unsupported file type.');
              return;
          }

          const blob = new Blob([fileContent], { type: fileType });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `${task.taskName || 'output'}.${fileExtension}`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        } catch (error) {
          console.error('Error processing data:', error);
          toast.error('Error processing data.');
        }
      } else {
        toast.error("Failed to fetch task details. Please try again.");
      }
    } catch (error) {
      console.error("Error fetching task details:", error);
      toast.error("An error occurred while fetching the task details.");
    }
  };

  const renderCell = useCallback((task: TaskModel, columnKey: string) => {
    switch (columnKey) {
      case "taskName":
        return <span>{task.taskName}</span>;
      case "url":
        return <Link href={task.url} isExternal>{task.url}</Link>;
      case "status":
        return (
          <Chip
            className="capitalize"
            size="sm"
            variant="flat"
            color={statusColorMap[TaskStatus[task.status]]}
          >
            {TaskStatus[task.status]}
          </Chip>
        );
      case "actions":
        return (
          <div className="flex justify-center gap-2">
            <Tooltip content="View Details" size="sm">
              <span className="cursor-pointer" onClick={() => handleViewDetails(task.id, task.user_id)}>
                <GrView />
              </span>
            </Tooltip>
            <Tooltip content="Download" size="sm">
              <span className="cursor-pointer" onClick={() => handleDownloadResult(task.id, task.user_id)}>
                <MdDownload />
              </span>
            </Tooltip>
            {task.status === TaskStatus.canceled || task.status === TaskStatus.completed ? (
              <Tooltip content="Delete Task" color="danger" size="sm">
                <span className="cursor-pointer" onClick={() => handleDeleteTask(task.id, task.user_id)}>
                  <MdOutlineDeleteForever />
                </span>
              </Tooltip>
            ) : (
              <Tooltip content="Cancel Task" color="primary" size="sm">
                <span className="cursor-pointer" onClick={() => handleCancelTask(task.id, task.user_id)}>
                  <MdOutlineCancel />
                </span>
              </Tooltip>
            )}
          </div>
        );
      default:
        return task[columnKey as keyof TaskModel] ?? "";
    }
  }, []);

  const handleUserSortChange = () => {
    setUserSortOrder(prevOrder => (prevOrder === 'asc' ? 'desc' : 'asc'));
  };

  const handleSearchChange = (value: string, userId: string) => {
    setUsersWithTasks((prevUsersWithTasks) => {
      return prevUsersWithTasks.map(userWithTasks => {
        if (userWithTasks.user.user_id === userId) {
          return {
            ...userWithTasks,
            state: {
              ...userWithTasks.state,
              searchTerm: value,
              currentPage: 1,
            },
          };
        }
        return userWithTasks;
      });
    });
  };

  const filteredAndSortedTasks = (userWithTasks: UserWithTasks) => {
    const { tasks, state } = userWithTasks;
    const { searchTerm, sortField, sortOrder } = state;

    let filteredTasks = tasks.filter(task =>
      task.taskName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.dateCreated.toLowerCase().includes(searchTerm.toLowerCase()) ||
      TaskStatus[task.status].toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortField) {
      filteredTasks.sort((a, b) => {
        const fieldA = a[sortField as keyof TaskModel];
        const fieldB = b[sortField as keyof TaskModel];

        if (fieldA == null || fieldB == null) {
          return 0;
        }

        let comparison = 0;

        if (typeof fieldA === 'string' && typeof fieldB === 'string') {
          comparison = fieldA.localeCompare(fieldB);
        } else if (typeof fieldA === 'number' && typeof fieldB === 'number') {
          comparison = fieldA - fieldB;
        } else {
          comparison = 0;
        }

        return sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    return filteredTasks;
  };

  const paginatedTasks = (tasks: TaskModel[], userWithTasks: UserWithTasks) => {
    const currentPage = userWithTasks.state.currentPage;
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return tasks.slice(startIndex, startIndex + PAGE_SIZE);
  };

  const totalPages = (tasks: TaskModel[]) => {
    return Math.ceil(tasks.length / PAGE_SIZE) || 1;
  };

  const handleTaskSortChange = (field: string, userId: string) => {
    setUsersWithTasks((prevUsersWithTasks) => {
      return prevUsersWithTasks.map(userWithTasks => {
        if (userWithTasks.user.user_id === userId) {
          const currentSortField = userWithTasks.state.sortField;
          const currentSortOrder = userWithTasks.state.sortOrder;

          let newSortOrder: 'asc' | 'desc' = 'asc';

          if (currentSortField === field) {
            newSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
          }

          return {
            ...userWithTasks,
            state: {
              ...userWithTasks.state,
              sortField: field,
              sortOrder: newSortOrder,
            },
          };
        }
        return userWithTasks;
      });
    });
  };

  const handlePageChange = (userId: string, newPage: number) => {
    setUsersWithTasks((prevUsersWithTasks) => {
      return prevUsersWithTasks.map(userWithTasks => {
        if (userWithTasks.user.user_id === userId) {
          return {
            ...userWithTasks,
            state: {
              ...userWithTasks.state,
              currentPage: newPage,
            },
          };
        }
        return userWithTasks;
      });
    });
  };

  return (
    <>
      <div className="flex justify-between mb-4 mx-2">
          <Input
            isClearable
            placeholder="Search Users..."
            startContent={<BsSearch />}
            value={userSearchTerm}
            onValueChange={(value) => setUserSearchTerm(value)}
            className="w-full sm:max-w-[44%]"
          />
          <Button size="sm" onClick={handleUserSortChange}>
            Sort: {userSortOrder === 'asc' ? 'Ascending' : 'Descending'}
          </Button>
      </div>
      <Accordion variant="splitted" selectionMode='multiple' isCompact>
        {[...usersWithTasks]
          .filter(userWithTasks =>
            userWithTasks.user.name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
            userWithTasks.user.user_id.toLowerCase().includes(userSearchTerm.toLowerCase())
          )
          .sort((a, b) =>
            userSortOrder === 'asc'
              ? (a.user.name || '').localeCompare(b.user.name || '')
              : (b.user.name || '').localeCompare(a.user.name || '')
          )
          .map((userWithTasks) => {
            const filteredTasks = filteredAndSortedTasks(userWithTasks);
            const tasksToDisplay = paginatedTasks(filteredTasks, userWithTasks);
            const totalTaskPages = totalPages(filteredTasks);
            const userId = userWithTasks.user.user_id;

            return (
              <AccordionItem
                key={userId || ""}
                aria-label="User Accordion Item"
                title={
                  <div className="flex justify-between items-center">
                    <User
                      avatarProps={{ radius: "lg", src: userWithTasks.user.picture }}
                      name={userWithTasks.user.name || ""}
                    >
                      {userWithTasks.user.user_id}
                    </User>
                    <span className="text-sm text-gray-500">Total tasks: {userWithTasks.tasks.length}</span>
                  </div>
                }
              >
                <Input
                  placeholder="Search tasks..."
                  value={userWithTasks.state.searchTerm}
                  onValueChange={(value) => handleSearchChange(value, userId)}
                  className="mb-4"
                />
                <Table aria-label="Nested tasks table">
                  <TableHeader columns={taskColumns}>
                    {(column) => (
                      <TableColumn
                        key={column.uid}
                        align={column.uid === "actions" ? "center" : "start"}
                        onClick={() => handleTaskSortChange(column.uid, userId)}
                        allowsSorting
                      >
                        {column.name}
                      </TableColumn>
                    )}
                  </TableHeader>
                  <TableBody emptyContent="No tasks available.">
                    {tasksToDisplay.map((task) => (
                      <TableRow key={task.id}>
                        {taskColumns.map((column) => (
                          <TableCell key={column.uid}>{renderCell(task, column.uid)}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex w-full justify-center mt-2">
                  <Pagination
                    isCompact
                    showControls
                    showShadow
                    color="secondary"
                    page={userWithTasks.state.currentPage}
                    total={totalTaskPages}
                    onChange={(page) => handlePageChange(userId, page)}
                  />
                </div>
              </AccordionItem>
            );
          })}
      </Accordion>

      {/* Modals for Confirm Delete and Cancel */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
        <ModalContent>
          <ModalHeader>Confirm Deletion</ModalHeader>
          <ModalBody>Are you sure you want to delete this task? This action cannot be undone.</ModalBody>
          <ModalFooter>
            <Button variant="light" onClick={() => setIsDeleteModalOpen(false)}>No, Keep Task</Button>
            <Button color="danger" onClick={confirmDeleteTask}>Yes, Delete Task</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)}>
        <ModalContent>
          <ModalHeader>Confirm Cancellation</ModalHeader>
          <ModalBody>Are you sure you want to cancel this task? This action cannot be undone.</ModalBody>
          <ModalFooter>
            <Button variant="light" onClick={() => setIsCancelModalOpen(false)}>No, Keep Task</Button>
            <Button color="primary" onClick={confirmCancelTask}>Yes, Cancel Task</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal for View Details */}
      <Modal isOpen={isViewDetailsModalOpen} onClose={() => setIsViewDetailsModalOpen(false)} scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>Task Details</ModalHeader>
          <ModalBody>
            {selectedTaskDetails && (
              <div>
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center">
                    <span className="text-sm font-semibold text-gray-500">Task ID</span>
                    <Spacer />
                    <Chip color="default" className="mr-2" size="sm">
                      {selectedTaskDetails.id}
                    </Chip>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-semibold text-gray-500">User</span>
                    <Spacer />
                    <Chip color="default" className="mr-2" size="sm" variant="solid">
                      {selectedTaskDetails.userName}
                    </Chip>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-sm font-semibold text-gray-500">Status</span>
                    <Chip className="capitalize" color={statusColorMap[selectedTaskDetails.status]} size="sm" variant="flat">
                      {selectedTaskDetails.status}
                    </Chip>
                  </div>
                </div>
                <Spacer y={4} />
                <div className="space-y-4">
                  <InfoBox label="Task Name" value={selectedTaskDetails.taskName} />
                  <InfoBox label="URL" value={selectedTaskDetails.url} />
                  <InfoBox label="Date Created" value={selectedTaskDetails.dateCreated} />
                  <InfoBox label="Time Created" value={selectedTaskDetails.timeCreated} />
                  <InfoBox label="Output Type" value={selectedTaskDetails.taskDefinition.output[0]?.type !== undefined ? OutputType[selectedTaskDetails.taskDefinition.output[0].type] : 'N/A'} />
                  <InfoBox
                    label="Keywords [Data Types]"
                    value={
                      <KeywordDataTypeList
                        keywords={selectedTaskDetails.taskDefinition.target.map(t => t.name)}
                        dataTypes={selectedTaskDetails.taskDefinition.target.map(t => t.value)}
                      />
                    }
                  />
                  <InfoBox label="Period Type" value={selectedTaskDetails.taskDefinition.period ? TaskPeriod[selectedTaskDetails.taskDefinition.period] : 'N/A'} />
                  <InfoBox
                    label="Preview Result"
                    value={<pre className="whitespace-pre-wrap text-sm">{selectedTaskDetails.GPTResponse}</pre>}
                  />
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onClick={() => setIsViewDetailsModalOpen(false)}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

const InfoBox: React.FC<{ label: string; value: string | React.ReactNode }> = ({ label, value }) => (
  <div className="space-y-1">
    <div className="font-semibold text-sm text-gray-500">{label}</div>
    <div className="bg-gray-50 p-2 rounded-lg">
      {typeof value === 'string' ? (
        <p className="text-base text-gray-700">{value || 'N/A'}</p>
      ) : (
        value
      )}
    </div>
  </div>
);

const KeywordDataTypeList: React.FC<{ keywords: string[]; dataTypes: string[] }> = ({ keywords, dataTypes }) => (
  <ul className="list-none space-y-1">
    {keywords.map((keyword, index) => (
      <li key={index} className="text-base text-gray-700">
        {keyword} [{dataTypes[index] || 'N/A'}]
      </li>
    ))}
  </ul>
);

export default TaskTable;