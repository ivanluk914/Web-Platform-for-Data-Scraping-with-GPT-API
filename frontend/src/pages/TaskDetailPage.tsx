import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardBody, Button, Progress, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Chip } from "@nextui-org/react";
// import axios from 'axios';

interface Task {
  id: string;
  name: string;
  status: 'ongoing' | 'completed' | 'cancelled';
  createdOn: string;
  completedOn: string | null;
  cancelledOn: string | null;
  url: string;
  outputFormat: string;
  keywords: string;
  dataType: string;
  frequency: string;
  scrapProcess: number;
}

const TaskDetailPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [task, setTask] = useState<Task | null>(null);
  // const [isLoading, setIsLoading] = useState(true);
  // const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch task details from backend
    // const fetchTaskDetails = async () => {
    //   try {
    //     setIsLoading(true);
    //     const response = await axios.get(`/api/tasks/${taskId}`);
    //     setTask(response.data);
    //     setError(null);
    //   } catch (err) {
    //     setError('Failed to fetch task details. Please try again later.');
    //     console.error('Error fetching task details:', err);
    //   } finally {
    //     setIsLoading(false);
    //   }
    // };

    // fetchTaskDetails();

    // Mock data (remove this when connecting to backend)
    const mockTasks: Record<string, Task> = {
      'task1': {
        id: 'task1',
        name: 'Web Scraping UNSW',
        status: 'ongoing',
        createdOn: '2023-01-01',
        completedOn: null,
        cancelledOn: null,
        url: 'https://www.unsw.edu.au',
        outputFormat: 'JSON',
        keywords: 'course_name, course_code',
        dataType: 'Text',
        frequency: '48 Hours',
        scrapProcess: 40,
      },
      'task2': {
        id: 'task2',
        name: 'Data Collection EDX',
        status: 'completed',
        createdOn: '2023-02-15',
        completedOn: '2023-07-01',
        cancelledOn: null,
        url: 'https://www.edx.org',
        outputFormat: 'CSV',
        keywords: 'course_title, instructor',
        dataType: 'Text',
        frequency: '24 Hours',
        scrapProcess: 100,
      },
      'task3': {
        id: 'task3',
        name: 'Course Info Extraction',
        status: 'cancelled',
        createdOn: '2023-03-01',
        completedOn: null,
        cancelledOn: '2023-06-15',
        url: 'https://www.coursera.org',
        outputFormat: 'XML',
        keywords: 'course_description, duration',
        dataType: 'Text',
        frequency: '72 Hours',
        scrapProcess: 25,
      },
    };

    setTask(mockTasks[taskId || ''] || null);
  }, [taskId]);

  // if (isLoading) return <div>Loading...</div>;
  // if (error) return <div>{error}</div>;
  if (!task) return <div>Task not found</div>;

  const handleBack = () => {
    navigate(-1);
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
    navigate('/tasks');
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

  const InfoBox: React.FC<{ label: string; value: string | null }> = ({ label, value }) => (
    <div className="space-y-1">
      <p className="font-semibold text-sm text-gray-500">{label}</p>
      <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
        <p className="text-base text-gray-700">{value || 'N/A'}</p>
      </div>
    </div>
  );

  const statusColors: Record<Task['status'], "primary" | "success" | "danger"> = {
    ongoing: "primary",
    completed: "success",
    cancelled: "danger"
  };

  const renderStatus = (status: Task['status']) => {
    return <Chip color={statusColors[status]}>{status}</Chip>;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Task Details</h1>
      <div className="flex items-center space-x-4">
        <p className="text-lg text-gray-600">Status: {renderStatus(task.status)}</p>
      </div>

      <Card className="rounded-xl shadow-lg">
        <CardBody className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoBox label="Task Name" value={task.name} />
            <InfoBox label="Task created on" value={task.createdOn} />
            <InfoBox label="Task completed on" value={task.completedOn} />
            <InfoBox label="Task cancelled on" value={task.cancelledOn} />
            <InfoBox label="URL" value={task.url} />
            <InfoBox label="Output Format" value={task.outputFormat} />
            <InfoBox label="Keywords" value={task.keywords} />
            <InfoBox label="Data Type" value={task.dataType} />
            <InfoBox label="Frequency" value={task.frequency} />
          </div>

          {task.status === 'ongoing' && (
            <div className="space-y-2">
              <p className="font-semibold text-lg text-gray-700">Scrap Process</p>
              <Progress 
                value={task.scrapProcess} 
                className="max-w-md rounded-full border border-gray-300" 
              />
              <p className="text-sm text-gray-500">{task.scrapProcess}% complete</p>
            </div>
          )}
        </CardBody>
      </Card>

      <div className="flex flex-wrap gap-4">
        <Button color="default" className="hover:opacity-80" onClick={handleBack}>
          Back
        </Button>
        {task.status === 'ongoing' && (
          <Button color="danger" className="hover:opacity-80" onClick={() => setIsDeleteModalOpen(true)}>
            Cancel Task
          </Button>
        )}
        {task.status !== 'ongoing' && (
          <Button color="danger" className="hover:opacity-80" onClick={() => setIsDeleteModalOpen(true)}>
            Delete Task
          </Button>
        )}
        {task.status === 'completed' && (
          <Button color="primary" className="hover:opacity-80" onClick={handleDownloadResult}>
            Download Result
          </Button>
        )}
        <Button color="secondary" className="hover:opacity-80" onClick={handleAISummary}>
          AI Summary
        </Button>
      </div>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">Confirm {task.status === 'ongoing' ? 'Cancellation' : 'Deletion'}</ModalHeader>
          <ModalBody>
            <p>Are you sure you want to {task.status === 'ongoing' ? 'cancel' : 'delete'} this task? This action cannot be undone.</p>
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="light" onPress={() => setIsDeleteModalOpen(false)}>
              No, Keep Task
            </Button>
            <Button color="danger" onPress={handleDeleteTask}>
              Yes, {task.status === 'ongoing' ? 'Cancel' : 'Delete'} Task
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default TaskDetailPage;