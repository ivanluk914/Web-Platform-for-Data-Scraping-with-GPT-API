import { Routes, Route } from 'react-router-dom';
import ProfilePage from '../pages/ProfilePage';

const Content = () => {
  return (
    <div className="flex-1 p-4">
      <div className="border rounded-lg p-4">
        <Routes>
          <Route path="/" element={<h1>Home Content</h1>} />
          <Route path="task-creation" element={<h1>Task Creation</h1>} />
          {/* Task Management Sub-pages */}
          <Route path="task-management/ongoing" element={<h1>On Going Tasks</h1>} />
          <Route path="task-management/completed" element={<h1>Completed Tasks</h1>} />
          <Route path="task-management/cancelled" element={<h1>Cancelled Tasks</h1>} />
          <Route path="notifications" element={<h1>Notifications</h1>} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="admin" element={<h1>Admin</h1>} />
        </Routes>
      </div>
    </div>
  );
};

export default Content;
