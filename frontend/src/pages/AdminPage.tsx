import React from 'react';
import { Tab, Tabs } from '@nextui-org/react';
import UserManagement from '../components/UserManagement';

const AdminPage: React.FC = () => {
  return (
    <div className="admin-page">
      <Tabs aria-label="Admin Tabs">
        <Tab key="user_management" title="User Management">
          <UserManagement />
        </Tab>
        <Tab key="placeholder_tab_1" title="Placeholder Tab 1">
          {/* Future development */}
        </Tab>
        <Tab key="placeholder_tab_2" title="Placeholder Tab 2">
          {/* Future development */}
        </Tab>
      </Tabs>
    </div>
  );
};

export default AdminPage;



