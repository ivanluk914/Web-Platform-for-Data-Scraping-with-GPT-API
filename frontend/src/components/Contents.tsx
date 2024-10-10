import { Routes, Route } from 'react-router-dom';
import ProfilePage from '../pages/ProfilePage';
import AdminPage from '../pages/AdminPage';

const Content = () => {
  return (
    <div className="flex justify-start border rounded-lg m-4">
      <div className="p-4">
        <Routes>
          <Route path="/" element={<h1>Home Content</h1>} />
          <Route path="task-creation" element={<h1>Task Creation</h1>} />
          {/* Task Management Sub-pages */}
          <Route path="task-management/ongoing" element={<h1>On Going Tasks</h1>} />
          <Route path="task-management/completed" element={<h1>Completed Tasks</h1>} />
          <Route path="task-management/cancelled" element={<h1>Cancelled Tasks</h1>} />
          <Route path="notifications" element={<h1>Notifications</h1>} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="admin" element={<AdminPage />} />
        </Routes>
      </div>
    </div>
  );
};

export default Content;
