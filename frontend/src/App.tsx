import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import HomePage from './pages/HomePage';
import ForgetPasswordPage from './pages/ForgetPasswordPage';
import { CallbackPage } from "./pages/callback-page";
import React from 'react'
import { Auth0Provider } from "@auth0/auth0-react";

function App() {
  return (
    <Auth0Provider
      domain="dev-dp4vp0xpt7cspfcl.us.auth0.com"
      clientId="EisLX6gz0Hsa6vVrSIIvmczWKdUEYqzy"
      authorizationParams={{
        redirect_uri: "http://localhost:5173/callback"
      }} >
      <Router>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/callback" element={<CallbackPage />} />          
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/forgot-password" element={<ForgetPasswordPage />} />
          <Route path="/home/*" element={<HomePage />} />
        </Routes>
      </Router>
    </Auth0Provider>
  );
}

export default App;
