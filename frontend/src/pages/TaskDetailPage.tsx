import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardBody, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Chip, Spacer } from "@nextui-org/react";
import { useAuth0 } from '@auth0/auth0-react';
import { useHttp } from '../providers/http-provider';
import { TaskStatus, OutputType, TaskPeriod, TaskRunType, mapStatus, statusColorMap } from '../models/task';
import { toast } from 'react-hot-toast';
import { FaChevronLeft } from 'react-icons/fa';
import { RiSparklingFill } from 'react-icons/ri';

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
    // type: TaskRunType;
    source: { url: string }[];
    output: { type: OutputType, value: string }[];
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
  const [GPTResponse, setGPTResponse] = useState('');

  useEffect(() => {
    const fetchTaskDetails = async () => {
      try {
        setIsLoading(true);
        const response = await http.get(`/user/${user?.sub}/task/${taskId}`);
        console.log('Response:', response.data);
        // New task object
        const mappedTask: MappedTask = {
          id: response.data.id,
          taskName: response.data.task_name,
          url: JSON.parse(response.data.task_definition).source[0].url, 
          dateCreated: new Date(response.data.created_at).toLocaleDateString(), 
          timeCreated: new Date(response.data.created_at).toLocaleTimeString(), 
          status: mapStatus(response.data.status), 
          dateCanceled: response.data.canceled_at ? new Date(response.data.canceled_at).toLocaleDateString() : undefined,
          timeCanceled: response.data.canceled_at ? new Date(response.data.canceled_at).toLocaleTimeString() : undefined,
          taskDefinition: {
            // type: JSON.parse(response.data.task_definition).type,
            source: JSON.parse(response.data.task_definition).source, 
            output: JSON.parse(response.data.task_definition).output, 
            target: JSON.parse(response.data.task_definition).target, 
            period: JSON.parse(response.data.task_definition).period,
          },
        };
        setTask(mappedTask);
        const outputValue = mappedTask.taskDefinition.output[0]?.value;
        const formattedResponse = outputValue?.replace(/\\n/g, '\n').replace(/\n/g, '\n');
        setGPTResponse(formattedResponse || '');
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
    try {
      const response = await http.put(`/user/${user?.sub}/task/${taskId}`, { status: 5 });
      if (response.status === 200) {
        setIsCancelModalOpen(false);
        toast.success('Task canceled successfully');
        navigate('/home/tasks');
      } else {
        toast.error('Failed to cancel task. Please try again.');
      }
    } catch (error) {
      console.error('Error canceling task:', error);
      toast.error('An error occurred while canceling the task.');
      setIsCancelModalOpen(false);
    }
  };

  const handleDeleteTask = async () => {
    try {
      const response = await http.delete(`/user/${user?.sub}/task/${taskId}`);
      if (response.status === 200) {
        setIsDeleteModalOpen(false);
        toast.success('Task deleted successfully');
        navigate('/home/tasks');
      } else {
        toast.error('Failed to delete task. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('An error occurred while deleting the task.');
      setIsDeleteModalOpen(false);
    }
  };

  const handleDownloadResult = async () => {
    const output = task.taskDefinition.output[0];
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
      // Unescape the data
      const unescapedData = data.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  
      switch (type) {
        case OutputType.JSON:
          fileType = 'application/json';
          fileExtension = 'json';
          // Fix the JSON structure
          let fixedData = unescapedData;
          // Remove extra curly braces if present
          fixedData = fixedData.trim();
          if (fixedData.startsWith('{') && fixedData.endsWith('}')) {
            fixedData = fixedData.substring(1, fixedData.length - 1).trim();
          }
          // Wrap with square brackets to form a valid JSON array
          fixedData = `[${fixedData}]`;
          // Parse and stringify the JSON data
          const jsonData = JSON.parse(fixedData);
          fileContent = JSON.stringify(jsonData, null, 2);
          break;
        case OutputType.CSV:
          fileType = 'text/csv';
          fileExtension = 'csv';
          // Replace escaped newlines with actual newlines
          fileContent = unescapedData.replace(/\\n/g, '\n');
          break;
        case OutputType.MARKDOWN:
          fileType = 'text/markdown';
          fileExtension = 'md';
          // Replace escaped newlines with actual newlines
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
      <div className="bg-gray-50 p-2 rounded-lg">
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

  // const renderPeriod = (taskDefinition: MappedTask['taskDefinition']) => {
  //   if (taskDefinition.type === TaskRunType.Single) {
  //     return "Single";
  //   } else {
  //     return TaskPeriod[taskDefinition.period];
  //   }
  // };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-start mb-4">
        <Button
          isIconOnly
          color="default"
          aria-label="Back"
          className="hover:opacity-80"
          onClick={handleBack}
        >
          <FaChevronLeft />
        </Button>
        <h1 className="text-3xl font-bold text-gray-800 ml-4">Task Details</h1>
      </div>

      <Card className="rounded-xl shadow-lg border border-gray-200">
        <CardBody className="px-6 py-4 space-y-4">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center">
              <span className="text-sm font-semibold text-gray-500">Task ID</span>
              <Spacer />
              <Chip color="default" className="mr-2">
                {task.id}
              </Chip>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-sm font-semibold text-gray-500">Status</span>
              <Chip className="capitalize" color={statusColorMap[task.status]} size="sm" variant="flat">
                {task.status}
              </Chip>
            </div>
          </div>
          <div className="space-y-4">
            <InfoBox label="Task Name" value={task.taskName} />
            <InfoBox label="URL" value={task.url} />
            <InfoBox label="Date Created" value={task.dateCreated} />
            <InfoBox label="Time Created" value={task.timeCreated} />
            <InfoBox label="Output Type" value={task.taskDefinition.output[0]?.type ? OutputType[task.taskDefinition.output[0].type] : 'N/A'} />
            <InfoBox 
              label="Keywords [Data Types]" 
              value={
                <KeywordDataTypeList 
                  keywords={task.taskDefinition.target.map(t => t.name)}
                  dataTypes={task.taskDefinition.target.map(t => t.value)}
                />
              }
            />
            <InfoBox 
              label="Preview Result" 
              value={<pre className="whitespace-pre-wrap text-sm">{GPTResponse}</pre>} 
            />
          </div>
        </CardBody>
      </Card>

      <div className="flex justify-end gap-4">
        {(task.status === "created" || task.status === "running") && (
          <Button color="danger" variant="flat" className="hover:opacity-80" onClick={() => setIsCancelModalOpen(true)}>
            Cancel Task
          </Button>
        )}
        {(task.status === "canceled" || task.status === "completed") && (
          <Button color="danger" variant="flat" className="hover:opacity-80" onClick={() => setIsDeleteModalOpen(true)}>
            Delete Task
          </Button>
        )}
        {(task.status === "created" || task.status === "completed") && (
          <Button color="primary" variant="flat" className="hover:opacity-80" onClick={handleDownloadResult}>
            Download Result
          </Button>
        )}
        <Button color="secondary" variant="flat" className="hover:opacity-80 flex items-center" onClick={handleAISummary}>
          <RiSparklingFill className="mr-0" />
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