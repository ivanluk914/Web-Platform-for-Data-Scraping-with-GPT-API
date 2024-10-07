import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input, Button } from '@nextui-org/react';
import { useForm, Controller } from 'react-hook-form';
import { validateEmail } from '../utils/validationUtils';

interface ForgetPasswordFormInputs {
  email: string;
}

const ForgetPasswordPage = () => {
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ForgetPasswordFormInputs>({
    mode: 'onChange',
  });

  const onSubmit = (data: ForgetPasswordFormInputs) => {
    // Handle password reset logic
    console.log(data);
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
            <form onSubmit={handleSubmit(onSubmit)}>
              <Controller
                name="email"
                control={control}
                rules={{
                  required: 'Email is required',
                  validate: (value) =>
                    validateEmail(value) || 'Invalid email address',
                }}
                render={({ field, fieldState: { error } }) => (
                  <Input
                    {...field}
                    type="email"
                    label="Email Address"
                    placeholder="Enter your email"
                    className="mb-4"
                    isInvalid={!!error}
                    errorMessage={error?.message}
                    variant="bordered"
                  />
                )}
              />

              <Button
                type="submit"
                color="primary"
                className="w-full mb-4 bg-black"
                isDisabled={!isValid}
              >
                Submit
              </Button>
              <p className="text-center text-black">
                Remember your password?{' '}
                <Link to="/" className="text-blue-500 font-bold">
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
              We have sent you password recovery instructions to your registered
              email
            </p>
            <Button
              onClick={handleReturnToLogin}
              color="primary"
              className="w-full mb-4 bg-black"
            >
              Return to the Login Page
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgetPasswordPage;
