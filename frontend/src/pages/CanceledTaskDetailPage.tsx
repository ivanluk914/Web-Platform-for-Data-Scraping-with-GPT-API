import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardBody, Button, Progress, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@nextui-org/react";
// import { useQuery } from '@tanstack/react-query';
// import { useHttp } from '../providers/http-provider';

const CancelledTaskDetailPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // const http = useHttp();
  // const { data: task, isLoading, error } = useQuery({
  //   queryKey: ['cancelledTaskDetail', taskId],
  //   queryFn: async () => {
  //     const response = await http.get(`/tasks/cancelled/${taskId}`);
  //     return response.data;
  //   },
  // });

  // Mock data
  const task = {
    id: taskId,
    createdOn: '24/9/2024',
    cancelledOn: '15/10/2024',
    url: 'https://www.unsw.edu.au/study/',
    outputFormat: 'JSON',
    keywords: 'course_name',
    dataType: 'Text',
    frequency: '48 Hours',
    scrapProcess: 65, // Added scrap process progress
  };

  // if (isLoading) return <div>Loading...</div>;
  // if (error) return <div>An error occurred: {error.message}</div>;

  const handleBack = () => {
    navigate(-1);
  };

  const handleDeleteTask = () => {
    console.log('Delete task:', taskId);
    setIsDeleteModalOpen(false);
    // After deleting, navigate back to the cancelled tasks list
    navigate('/cancelled-tasks');
  };

  const handleDownloadResult = () => {
    console.log('Download result for task:', taskId);
  };

  const handleAISummary = () => {
    console.log('Generate AI summary for task:', taskId);
  };

  const InfoBox: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="space-y-1">
      <p className="font-semibold text-sm text-gray-500">{label}</p>
      <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
        <p className="text-base text-gray-700">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Cancelled Task Details</h1>
      <p className="text-lg text-gray-600 mb-6">
        View details of the cancelled task and download any available results.
      </p>

      <Card className="rounded-xl shadow-lg">
        <CardBody className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoBox label="Task created on" value={task.createdOn} />
            <InfoBox label="Task cancelled on" value={task.cancelledOn} />
            <InfoBox label="URL" value={task.url} />
            <InfoBox label="Output Format" value={task.outputFormat} />
            <InfoBox label="Keywords" value={task.keywords} />
            <InfoBox label="Data Type" value={task.dataType} />
            <InfoBox label="Frequency" value={task.frequency} />
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-lg text-gray-700">Scrap Process (at time of cancellation)</p>
            <Progress 
              value={task.scrapProcess} 
              className="max-w-md rounded-full border border-gray-300" 
            />
            <p className="text-sm text-gray-500">{task.scrapProcess}% complete when cancelled</p>
          </div>
        </CardBody>
      </Card>

      <div className="flex flex-wrap gap-4">
        <Button color="default" className="hover:opacity-80" onClick={handleBack}>
          Back
        </Button>
        <Button color="primary" className="hover:opacity-80" onClick={handleDownloadResult}>
          Download Result
        </Button>
        <Button color="danger" className="hover:opacity-80" onClick={() => setIsDeleteModalOpen(true)}>
          Delete Task
        </Button>
        <Button color="secondary" className="hover:opacity-80" onClick={handleAISummary}>
          AI Summary
        </Button>
      </div>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">Confirm Deletion</ModalHeader>
          <ModalBody>
            <p>Are you sure you want to delete this cancelled task? This action cannot be undone.</p>
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="light" onPress={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button color="danger" onPress={handleDeleteTask}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default CancelledTaskDetailPage;