import React from 'react';
import { Tabs, Tab } from "@nextui-org/react";
import OngoingTasks from '../components/OngoingTasks';
import CancelledTasks from '../components/CancelledTasks';
import CompletedTasks from '../components/CompletedTasks';

const TaskManagement: React.FC = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Task Management</h1>
      <Tabs aria-label="Task Management Tabs">
        <Tab key="ongoing" title="On-going Tasks">
          <OngoingTasks />
        </Tab>
        <Tab key="cancelled" title="Cancelled Tasks">
          <CancelledTasks />
        </Tab>
        <Tab key="completed" title="Completed Tasks">
          <CompletedTasks />
        </Tab>
      </Tabs>
    </div>
  );
};

export default TaskManagement;