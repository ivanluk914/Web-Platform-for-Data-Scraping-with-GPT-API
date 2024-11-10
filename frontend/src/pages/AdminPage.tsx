import React from 'react';
import { Tab, Tabs } from '@nextui-org/react';
import UserManagement from '../components/UserManagement';
import TaskManagement from '../components/TaskManagement';

const AdminPage: React.FC = () => {
  return (
    <div className="admin-page">
      <Tabs aria-label="Admin Tabs">
        <Tab key="user_management" title="User Management">
          <UserManagement />
        </Tab>
        <Tab key="task_management" title="Task Management">
          {/* Future development */}
          <TaskManagement />
        </Tab>
      </Tabs>
    </div>
  );
};

export default AdminPage;