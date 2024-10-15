import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Auth0ProviderWithNavigate } from './providers/auth-provider';
import { HttpProvider } from './providers/http-provider'
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import { CallbackPage } from "./pages/CallbackPage";

function App() {
  return (
    <Router>
      <Auth0ProviderWithNavigate>
        <HttpProvider>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/callback" element={<CallbackPage />} />
            <Route path="/home/*" element={<HomePage />} />
          </Routes>
        </HttpProvider>
      </Auth0ProviderWithNavigate>
    </Router>
  );
}

export default App;