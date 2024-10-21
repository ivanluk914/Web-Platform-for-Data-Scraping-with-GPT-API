import React from 'react';
import { Routes, Route } from 'react-router-dom';
import TaskDetailPage from '../pages/TaskDetailPage';
import TaskManagement from '../pages/TaskManagement';
import CanceledTaskDetailPage from '../pages/CanceledTaskDetailPage';

const TaskActions: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<TaskManagement />} />
      <Route path="/:taskId" element={<TaskDetailPage />} />
      <Route path="/canceled/:taskId" element={<CanceledTaskDetailPage />} />
    </Routes>
  );
};

export default TaskActions;