import { Link, useNavigate } from 'react-router-dom';
import { Input, Checkbox, Button } from '@nextui-org/react';
import { useForm, Controller } from 'react-hook-form';
import { validateEmail } from '../utils/validationUtils';

interface LoginFormInputs {
  email: string;
  password: string;
  rememberMe: boolean;
}

const LoginPage = () => {
  const navigate = useNavigate();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginFormInputs>({
    mode: 'onChange',
  });

  const onSubmit = (data: LoginFormInputs) => {
    // Replace with your authentication logic
    console.log(data);
    // Navigate to home on successful login
    navigate('/home');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="border border-gray-300 rounded-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-start text-black">Log In</h2>
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
                label="Email"
                placeholder="Enter your email"
                className="bg-white text-black mb-4"
                isInvalid={!!error}
                errorMessage={error?.message}
                variant="bordered"
              />
            )}
          />

          <Controller
            name="password"
            control={control}
            rules={{
              required: 'Password is required',
            }}
            render={({ field, fieldState: { error } }) => (
              <Input
                {...field}
                type="password"
                label="Password"
                placeholder="Enter your password"
                className="bg-white text-black mb-4"
                isInvalid={!!error}
                errorMessage={error?.message}
                variant="bordered"
              />
            )}
          />

          <div className="flex items-center justify-between mb-4">
            <Controller
              name="rememberMe"
              control={control}
              defaultValue={false}
              render={({ field }) => (
                <Checkbox
                  isSelected={field.value}
                  onChange={(value) => field.onChange(value)}
                >
                  <slot className="text-black">Remember me</slot>
                </Checkbox>
              )}
            />
            <Link to="/forgot-password" className="text-black">
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full mb-4 bg-black text-white"
            isDisabled={!isValid}
          >
            Log In
          </Button>
          <p className="text-center text-black">
            Need to create an account?{' '}
            <Link to="/signup" className="text-blue-500 font-bold">
              Sign Up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
