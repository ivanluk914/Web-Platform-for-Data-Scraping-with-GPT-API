import { Routes, Route } from 'react-router-dom';
import ProfilePage from '../pages/ProfilePage';
import AdminPage from '../pages/AdminPage';
import CreateTaskPage from '../pages/CreateTask';

const Content = () => {
  return (
    <div className="flex justify-start rounded-lg m-4">
      <div className="p-4">
        <Routes>
          <Route path="/" element={<h1>Home Content</h1>} />
          <Route path="tasks" element={<h1>Tasks</h1>} />
          <Route path="notifications" element={<h1>Notifications</h1>} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="create-task" element={<CreateTaskPage />} />
        </Routes>
      </div>
    </div>
  );
};

export default Content;
