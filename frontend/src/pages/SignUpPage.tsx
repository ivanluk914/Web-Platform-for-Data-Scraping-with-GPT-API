import { Link, useNavigate } from 'react-router-dom';
import { Input, Checkbox, Button } from '@nextui-org/react';
import { useForm, Controller } from 'react-hook-form';
import {
  validateEmail,
  validatePassword,
  getPasswordErrorMessage,
  isEmpty,
  validateName,
} from '../utils/validationUtils';

interface SignUpFormInputs {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  agree: boolean;
}

const SignUpPage = () => {
  const navigate = useNavigate();

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<SignUpFormInputs>({
    mode: 'onChange',
  });

  const onSubmit = (data: SignUpFormInputs) => {
    // Handle form submission
    console.log(data);
    // Navigate to home or display success message
    navigate('/home');
  };

  const passwordValue = watch('password');

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="border border-gray-300 rounded-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-start text-black">
          Sign Up
        </h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Controller
            name="username"
            control={control}
            rules={{
              required: 'Username is required',
              validate: {
                isEmpty: (value) =>
                  !isEmpty(value) || 'Username cannot be empty',
                // Add your unique username check here
              },
            }}
            render={({ field, fieldState: { error } }) => (
              <Input
                {...field}
                type="text"
                label="Username"
                placeholder="Enter your username"
                className="mb-4"
                isInvalid={!!error}
                errorMessage={error?.message}
                variant="bordered"
              />
            )}
          />

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

          <Controller
            name="password"
            control={control}
            rules={{
              required: 'Password is required',
              validate: (value) =>
                validatePassword(value) || getPasswordErrorMessage(),
            }}
            render={({ field, fieldState: { error } }) => (
              <Input
                {...field}
                type="password"
                label="Password"
                placeholder="Enter your password"
                className="mb-4"
                isInvalid={!!error}
                errorMessage={error?.message}
                variant="bordered"
              />
            )}
          />

          <Controller
            name="confirmPassword"
            control={control}
            rules={{
              required: 'Please confirm your password',
              validate: (value) =>
                value === passwordValue || 'Passwords do not match',
            }}
            render={({ field, fieldState: { error } }) => (
              <Input
                {...field}
                type="password"
                label="Confirm Password"
                placeholder="Confirm your password"
                className="mb-4"
                isInvalid={!!error}
                errorMessage={error?.message}
                variant="bordered"
              />
            )}
          />

          <div className="flex items-center justify-start gap-2 mb-4">
            <Controller
              name="agree"
              control={control}
              rules={{ required: 'You must agree to the terms' }}
              render={({ field, fieldState: { error } }) => (
                <>
                  <Checkbox
                    isSelected={field.value}
                    onChange={(value) => field.onChange(value)}
                    isInvalid={!!error}
                  >
                    <slot className="text-black">
                      I agree with the{' '}
                    </slot>
                  </Checkbox>
                  {error && (
                    <span className="text-red-500 text-sm">
                      {error.message}
                    </span>
                  )}
                </>
              )}
            />
            <div className="flex text-black gap-1">
              <Link to="/terms" className="text-blue-500 font-bold">
                Terms
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-blue-500 font-bold">
                Privacy Policy
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            isDisabled={!isValid}
            color="primary"
            className="w-full mb-4 bg-black"
          >
            Sign Up
          </Button>
          <p className="text-center text-black">
            Already have an account?{' '}
            <Link to="/" className="text-blue-500 font-bold">
              Log In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignUpPage;
