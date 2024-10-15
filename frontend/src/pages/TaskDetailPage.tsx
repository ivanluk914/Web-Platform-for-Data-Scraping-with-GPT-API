import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardBody, Button, Progress } from "@nextui-org/react";
// import { useQuery } from '@tanstack/react-query';
// import { useHttp } from '../providers/http-provider';

const TaskDetailPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();

  // const http = useHttp();
  // const { data: task, isLoading, error } = useQuery({
  //   queryKey: ['taskDetail', taskId],
  //   queryFn: async () => {
  //     const response = await http.get(`/tasks/${taskId}`);
  //     return response.data;
  //   },
  // });

  // Mock data
  const task = {
    id: taskId,
    createdOn: '24/9/2024',
    url: 'https://www.unsw.edu.au/study/',
    outputFormat: 'JSON',
    keywords: 'course_name',
    dataType: 'Text',
    frequency: '48 Hours',
    scrapProcess: 40,
  };

  // if (isLoading) return <div>Loading...</div>;
  // if (error) return <div>An error occurred: {error.message}</div>;

  const handleBack = () => {
    navigate(-1);
  };

  const handleCancelTask = () => {
    console.log('Cancel task:', taskId);
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
      <h1 className="text-3xl font-bold text-gray-800 mb-2">On-going Task Details</h1>
      <p className="text-lg text-gray-600 mb-6">
        View the progress of your task and download results at any point.
      </p>

      <Card className="rounded-xl shadow-lg">
        <CardBody className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoBox label="Task created on" value={task.createdOn} />
            <InfoBox label="URL" value={task.url} />
            <InfoBox label="Output Format" value={task.outputFormat} />
            <InfoBox label="Keywords" value={task.keywords} />
            <InfoBox label="Data Type" value={task.dataType} />
            <InfoBox label="Frequency" value={task.frequency} />
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-lg text-gray-700">Scrap Process</p>
            <Progress 
              value={task.scrapProcess} 
              className="max-w-md rounded-full border border-gray-300" 
            />
          </div>
        </CardBody>
      </Card>

      <div className="flex flex-wrap gap-4">
        <Button color="default" className="hover:opacity-80" onClick={handleBack}>
          Back
        </Button>
        <Button color="danger" className="hover:opacity-80" onClick={handleCancelTask}>
          Cancel Task
        </Button>
        <Button color="primary" className="hover:opacity-80" onClick={handleDownloadResult}>
          Download Result
        </Button>
        <Button color="secondary" className="hover:opacity-80" onClick={handleAISummary}>
          AI Summary
        </Button>
      </div>
    </div>
  );
};

export default TaskDetailPage;
