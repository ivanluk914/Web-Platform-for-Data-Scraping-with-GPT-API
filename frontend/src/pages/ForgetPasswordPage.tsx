import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input, Button } from '@nextui-org/react';

const ForgetPasswordPage = () => {
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate email being sent
    setEmailSent(true);
  };

  const handleReturnToLogin = () => {
    navigate('/');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="border border-gray-300 rounded-lg p-8 w-full max-w-md">
        {!emailSent ? (
          <>
            <h2 className="text-3xl font-bold mb-4 text-center text-black">
              Forgot your password?
            </h2>
            <p className="mb-6 text-center text-gray-700">
              Enter your email address associated with your account
            </p>
            <form onSubmit={handleSubmit}>
              <Input
                type="email"
                label="Email Address"
                placeholder="Enter your email"
                className="mb-4"
                required
              />
              <Button type="submit" color="primary" className="w-full mb-4 bg-black">
                Submit
              </Button>
              <p className="text-center text-black">
                Remember your password?{' '}
                <Link to="/" className="text-blue-500 text-bold">
                  Log In
                </Link>
              </p>
            </form>
          </>
        ) : (
          <>
            <h2 className="text-3xl font-bold mb-4 text-center text-black">
              Check your email
            </h2>
            <p className="mb-6 text-center text-gray-700">
              We have sent you a password recovery instruction to your registered email
            </p>
            <Button onClick={handleReturnToLogin} color="primary" className="w-full mb-4 bg-black">
              Return to the Login Page
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgetPasswordPage;
