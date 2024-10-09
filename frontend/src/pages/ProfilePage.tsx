import { useState, useRef, useEffect } from 'react';
import { Input, Button, Avatar } from '@nextui-org/react';
import { useForm, Controller } from 'react-hook-form';
import {
  validateEmail,
  validatePassword,
  getPasswordErrorMessage,
} from '../utils/validationUtils';
import { FiEdit } from 'react-icons/fi';
import { AiOutlineCheckCircle } from 'react-icons/ai';

interface ProfileFormInputs {
  username: string;
  password: string;
  email: string;
  userRole: string;
  email_verified?: boolean;
  created_at?: string;
  last_login?: string;
}

const ProfilePage = () => {
  const [userOrigin, setUserOrigin] = useState<'acc/pwd' | 'auth0'>('auth0'); // Change as needed
  const [avatarImage, setAvatarImage] = useState(
    'https://i.pravatar.cc/150?u=a042581f4e29026704d'
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userOrigin === 'auth0') {
      // Replace with actual Auth0 picture URL
      setAvatarImage('https://i.pravatar.cc/150?u=auth0user');
    }
  }, [userOrigin]);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ProfileFormInputs>({
    mode: 'onChange',
    defaultValues: {
      username: 'Jane Doe',
      password: '',
      email: 'test@test.com',
      userRole: 'Admin',
      email_verified: true, // or false
      created_at: '2022-01-01',
      last_login: '2022-01-15',
    },
  });

  const onSubmit = (data: ProfileFormInputs) => {
    // Handle profile update logic
    console.log(data);
    alert('Profile updated successfully!');
  };

  const handleEditAvatar = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      if (file.type === 'image/png' || file.type === 'image/jpeg') {
        const imageUrl = URL.createObjectURL(file);
        setAvatarImage(imageUrl);
      } else {
        alert('Please select a PNG or JPG image.');
      }
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white p-8 rounded-lg shadow-md">
        {/* Title */}
        <h1 className="text-3xl font-bold mb-2 text-black">Profile Dashboard</h1>
        {/* Description */}
        <p className="text-gray-900 mb-6">
          Customize settings, email preferences, and password.
        </p>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Avatar and User Info */}
          <div className="flex items-center mb-6 bg-slate-100 rounded-lg p-4">
            <div className="relative">
              <Avatar size="lg" className="rounded-full" src={avatarImage} />
              {userOrigin === 'acc/pwd' && (
                <>
                  <button
                    type="button"
                    className="absolute bottom-0 right-0 bg-white rounded-full p-1"
                    onClick={handleEditAvatar}
                  >
                    <FiEdit size={10} />
                  </button>
                  <input
                    type="file"
                    accept="image/png, image/jpeg"
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                    style={{ display: 'none' }}
                  />
                </>
              )}
            </div>
            <div className="ml-4">
              <Controller
                name="username"
                control={control}
                render={({ field }) => (
                  <p className="text-lg text-black">{field.value}</p>
                )}
              />
              <Controller
                name="userRole"
                control={control}
                render={({ field }) => (
                  <p className="text-slate-500">{field.value}</p>
                )}
              />
            </div>
          </div>

          {/* Email Field */}
          {userOrigin === 'acc/pwd' && (
            <div className="mb-4">
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
                    placeholder="Enter new email address"
                    className="bg-white text-black"
                    isInvalid={!!error}
                    errorMessage={error?.message}
                    variant="bordered"
                  />
                )}
              />
            </div>
          )}
          {/* Password Field */}
          {userOrigin === 'acc/pwd' && (
            <div className="mb-4">
              <Controller
                name="password"
                control={control}
                rules={{
                  validate: (value) =>
                    value === '' ||
                    validatePassword(value) ||
                    getPasswordErrorMessage(),
                }}
                render={({ field, fieldState: { error } }) => (
                  <Input
                    {...field}
                    type="password"
                    label="Password"
                    placeholder="Enter new password"
                    className="bg-white text-black"
                    isInvalid={!!error}
                    errorMessage={error?.message}
                    variant="bordered"
                  />
                )}
              />
            </div>
          )}

          {userOrigin === 'auth0' && (
            <>
              {/* Email Field */}
              <div className="mb-4">
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <Input
                        {...field}
                        type="email"
                        label="Email Address"
                        className="bg-white text-black"
                        readOnly
                        variant="bordered"
                      />
                      {field.value && control._defaultValues.email_verified && (
                        <div className="flex items-center mt-1">
                          <AiOutlineCheckCircle className="text-green-500 mr-1" />
                          <span className="text-green-500 text-sm">Verified</span>
                        </div>
                      )}
                    </div>
                  )}
                />
              </div>

              {/* Created At Field */}
              <div className="mb-4">
                <Controller
                  name="created_at"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="text"
                      label="Account Created At"
                      className="bg-white text-black"
                      readOnly
                      variant="bordered"
                    />
                  )}
                />
              </div>

              {/* Last Login Field */}
              <div className="mb-4">
                <Controller
                  name="last_login"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="text"
                      label="Last Login"
                      className="bg-white text-black"
                      readOnly
                      variant="bordered"
                    />
                  )}
                />
              </div>
            </>
          )}

          {/* Update Profile Button */}
          {userOrigin === 'acc/pwd' && (
            <Button
              type="submit"
              className="w-36 bg-black text-white"
              isDisabled={!isValid}
            >
              Update Profile
            </Button>
          )}
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
