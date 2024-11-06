import { Routes, Route } from 'react-router-dom';
import ProfilePage from '../pages/ProfilePage';
import CreateTaskPage from '../pages/CreateTask';
import TaskActions from './TaskActions';
import HomeComponent from './Home';
import ProtectedRoute from './RouteProtector';
import { UserRole } from '../models/user';
import AdminPage from '../pages/AdminPage';

const Content = () => {
  return (
    <div className="flex justify-start rounded-lg m-4">
      <div className="p-4">
        <Routes>
          <Route path="/" element={<HomeComponent />} />
          <Route path="tasks/*" element={<TaskActions />} />
          <Route path="notifications" element={<h1>Notifications</h1>} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="admin" element={<ProtectedRoute requiredRoles={[UserRole.Admin]}><AdminPage /></ProtectedRoute>} />
          <Route path="create-task" element={<CreateTaskPage />} />
        </Routes>
      </div>
    </div>
  );
};

export default Content;