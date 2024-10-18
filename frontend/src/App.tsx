import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Auth0ProviderWithNavigate } from './providers/auth-provider';
import { HttpProvider } from './providers/http-provider';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import { CallbackPage } from "./pages/CallbackPage";
import CancelledTaskDetailPage from './pages/CancelledTaskDetailPage';
import TaskManagement from './pages/TaskManagement';
import TaskDetailPage from './pages/TaskDetailPage';

function App() {
  return (
    <Router>
      <Auth0ProviderWithNavigate>
        <HttpProvider>
          <Routes>
          <Route path="/" element={<LoginPage />} />
            <Route path="/callback" element={<CallbackPage />} />
            <Route path="/home/*" element={<HomePage />} />
            <Route path="/cancelled-task/:taskId" element={<CancelledTaskDetailPage />} />
            <Route path="/tasks" element={<TaskManagement />} />
            <Route path="/task/:taskId" element={<TaskDetailPage />} />
          </Routes>
        </HttpProvider>
      </Auth0ProviderWithNavigate>
    </Router>
  );
}

export default App;
