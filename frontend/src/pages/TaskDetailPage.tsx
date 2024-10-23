import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardBody, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Chip } from "@nextui-org/react";
import { useAuth0 } from '@auth0/auth0-react';
import { useHttp } from '../providers/http-provider';
import { TaskStatus, OutputType, TaskPeriod, mapStatus, statusColorMap } from '../models/task';
import { toast } from 'react-hot-toast';

interface MappedTask {
  id: string;
  url: string;
  dateCreated: string;
  timeCreated: string;
  status: keyof typeof TaskStatus;
  dateCanceled?: string;
  timeCanceled?: string;
  taskDefinition: {
    source: { url: string }[];
    output: { type: OutputType }[];
    target: { name: string; value: string }[];
    period: TaskPeriod;
  };
}

const TaskDetailPage: React.FC = () => {
  const { user } = useAuth0();
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [task, setTask] = useState<MappedTask | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const http = useHttp();

  useEffect(() => {
    const fetchTaskDetails = async () => {
      try {
        setIsLoading(true);
        const response = await http.get(`/user/${user?.sub}/task/${taskId}`);
        console.log('Fetched task:', response.data);
        const mappedTask: MappedTask = {
          id: response.data.ID,
          url: response.data.task_definition.source[0].url,
          dateCreated: new Date(response.data.CreatedAt).toLocaleDateString(),
          timeCreated: new Date(response.data.CreatedAt).toLocaleTimeString(),
          status: mapStatus(response.data.status),
          dateCanceled: response.data.CanceledAt ? new Date(response.data.CanceledAt).toLocaleDateString() : undefined,
          timeCanceled: response.data.CanceledAt ? new Date(response.data.CanceledAt).toLocaleTimeString() : undefined,
          taskDefinition: {
            source: response.data.task_definition.source,
            output: response.data.task_definition.output,
            target: response.data.task_definition.target,
            period: response.data.task_definition.period,
          },
        };
        setTask(mappedTask);
        setError(null);
      } catch (err) {
        setError('Failed to fetch task details. Please try again later.');
        console.error('Error fetching task details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTaskDetails();
  }, [taskId, user?.sub, http]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!task) return <div>Task not found</div>;

  const handleBack = () => {
    navigate(-1);
  };

  const handleCancelTask = async () => {
    

    console.log('Cancel task:', taskId);
    setIsCancelModalOpen(false);
    toast.success('Task canceled successfully');
    navigate('/home/tasks');
  };

  const handleDeleteTask = async () => {
    // try {
    //   await axios.delete(`/api/tasks/${taskId}`);
    //   navigate('/tasks');
    // } catch (err) {
    //   console.error('Error deleting task:', err);
    //   // Handle error (e.g., show error message to user)
    // }

    // Mock delete (remove this when connecting to backend)
    console.log('Delete task:', taskId);
    setIsDeleteModalOpen(false);
    toast.success('Task deleted successfully');
    navigate('/home/tasks');
  };

  const handleDownloadResult = async () => {
    // try {
    //   const response = await axios.get(`/api/tasks/${taskId}/download`, { responseType: 'blob' });
    //   const url = window.URL.createObjectURL(new Blob([response.data]));
    //   const link = document.createElement('a');
    //   link.href = url;
    //   link.setAttribute('download', `task_${taskId}_result.${task.outputFormat.toLowerCase()}`);
    //   document.body.appendChild(link);
    //   link.click();
    //   link.remove();
    // } catch (err) {
    //   console.error('Error downloading task result:', err);
    //   // Handle error (e.g., show error message to user)
    // }

    // Mock download (remove this when connecting to backend)
    console.log('Download result for task:', taskId);
  };

  const handleAISummary = async () => {
    // try {
    //   const response = await axios.get(`/api/tasks/${taskId}/ai-summary`);
    //   console.log('AI Summary:', response.data);
    //   // Display AI summary to user (e.g., in a modal or new page)
    // } catch (err) {
    //   console.error('Error generating AI summary:', err);
    //   // Handle error (e.g., show error message to user)
    // }

    // Mock AI summary (remove this when connecting to backend)
    console.log('Generate AI summary for task:', taskId);
  };

  const InfoBox: React.FC<{ label: string; value: string | string[] | React.ReactNode }> = ({ label, value }) => (
    <div className="space-y-1">
      <div className="font-semibold text-sm text-gray-500">{label}</div>
      <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
        {typeof value === 'string' || Array.isArray(value) ? (
          <p className="text-base text-gray-700">
            {Array.isArray(value) ? value.join(', ') : value || 'N/A'}
          </p>
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

  const renderStatus = (status: keyof typeof TaskStatus) => {
    return <Chip color={statusColorMap[status]}>{status}</Chip>;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Task Details</h1>
      <div className="flex items-center space-x-4">
        <div className="text-lg text-gray-800">Task ID: <b>{task.id}</b></div>
        <div className="text-lg text-gray-600"> {renderStatus(task.status)}</div>
      </div>

      <Card className="rounded-xl shadow-lg">
        <CardBody className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoBox label="Date Created" value={`${task.dateCreated}`} />
            <InfoBox label="Time Created" value={`${task.timeCreated}`} />
            {task.status === "canceled" && task.dateCanceled && task.timeCanceled && (
              <InfoBox label="Canceled At" value={`${task.dateCanceled} ${task.timeCanceled}`} />
            )}
            <InfoBox label="URL" value={task.url} />
            <div className="h-1"></div>
            <InfoBox label="Output Type" value={task.taskDefinition.output[0]?.type ? OutputType[task.taskDefinition.output[0].type] : 'N/A'} />
            <InfoBox label="Period" value={TaskPeriod[task.taskDefinition.period]} />
            <InfoBox 
              label="Keywords [Data Types]" 
              value={
                <KeywordDataTypeList 
                  keywords={task.taskDefinition.target.map(t => t.name)}
                  dataTypes={task.taskDefinition.target.map(t => t.value)}
                />
              }
            />
          </div>
        </CardBody>
      </Card>

      <div className="flex flex-wrap gap-4">
        <Button color="default" className="hover:opacity-80" onClick={handleBack}>
          Back
        </Button>
        {(task.status === "ongoing" || task.status === "running") && (
          <Button color="danger" className="hover:opacity-80" onClick={() => setIsCancelModalOpen(true)}>
            Cancel Task
          </Button>
        )}
        {(task.status === "canceled" || task.status === "completed") && (
          <Button color="danger" className="hover:opacity-80" onClick={() => setIsDeleteModalOpen(true)}>
            Delete Task
          </Button>
        )}
        {(task.status === "ongoing" || task.status === "completed") && (
          <Button color="primary" className="hover:opacity-80" onClick={handleDownloadResult}>
            Download Result
          </Button>
        )}
        <Button color="secondary" className="hover:opacity-80" onClick={handleAISummary}>
          AI Summary
        </Button>
      </div>

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
            <Button color="danger" onPress={handleCancelTask}>
              Yes, Cancel Task
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

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
            <Button color="danger" onPress={handleDeleteTask}>
              Yes, Delete Task
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </div>
  );
};

export default TaskDetailPage;