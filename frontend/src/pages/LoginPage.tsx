// import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@nextui-org/react';
import { useAuth0 } from '@auth0/auth0-react';
import React from 'react'
import { Auth0ProviderWithNavigate } from "../auth0-provider-with-navigate";


const LoginPage = () => {
  const { loginWithRedirect } = useAuth0();
  // const navigate = useNavigate();

  return (
    <Auth0ProviderWithNavigate>
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="border border-gray-300 rounded-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-start text-black">Claude Collaborators</h2>
          <Button
            type="submit"
            className="w-full mb-4 bg-black text-white"
            onClick={() => loginWithRedirect()}
          >
            Login / Sign Up
          </Button>
      </div>
    </div>
    </Auth0ProviderWithNavigate>
  );
};

export default LoginPage;
