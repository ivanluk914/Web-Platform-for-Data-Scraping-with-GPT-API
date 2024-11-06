import React, { useState, useEffect } from 'react';
import TaskTable from './TaskTable';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useHttp } from '../providers/http-provider';
import { UserService } from '../api/user-service';
import { UserModel } from '../models/user';
import { Card, CardBody } from '@nextui-org/react';

const TaskManagement: React.FC = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [tasks, setTasks] = useState<any[]>([]);
  const [isTasksLoading, setIsTasksLoading] = useState(true);
  const http = useHttp();
  const userService = new UserService(http);

  // Query for fetching users list
  const { data: usersData, isPending: isUsersPending } = useQuery<UserModel[]>({
    queryKey: ['users', page],
    queryFn: () => userService.listUsers(page, pageSize),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch tasks for all users
  useEffect(() => {
    const fetchAllTasks = async () => {
      if (usersData) {
        try {
          setIsTasksLoading(true);
          const allTasks = await Promise.all(
            usersData.map(async (user) => {
              const response = await http.get(`/user/${user.user_id}/task`);
              return response.data.map((task: any) => {
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
                  user_id: user.user_id, // Added user_id here
                  url: url,
                  dateCreated: new Date(task.created_at).toLocaleDateString(),
                  timeCreated: new Date(task.created_at).toLocaleTimeString(),
                  status: task.status,
                  taskName: task.task_name || '',
                  taskDefinition: task.task_definition || '',
                };
              });
            })
          );
          setTasks(allTasks); // Do NOT flatten the array
          console.log(allTasks);
          console.log(usersData);
        } catch (err) {
          console.error('Error fetching tasks:', err);
          toast.error('Failed to fetch tasks for all users. Please try again later.');
        } finally {
          setIsTasksLoading(false);
        }
      }
    };
    fetchAllTasks();
  }, [usersData, http]);
 

  return (
    <div className="container mx-auto">
      <Card className="mx-auto">
        <CardBody className="p-8">
          <h1 className="text-3xl font-bold mb-2 text-black">Task Management</h1>
          <p className="text-gray-600 mb-6">
            Manage tasks for all users.
          </p>
          
          <TaskTable
            users={usersData ?? []}
            tasksData={tasks ?? []} // Pass all tasks as props
            isLoading={isUsersPending || isTasksLoading}
            error={null}
            page={page}
            pageSize={pageSize}
            setPage={setPage}
            setPageSize={setPageSize}
          />
        </CardBody>
      </Card>
    </div>
  );
};

export default TaskManagement;