import { useState, useRef } from 'react';
import { Input, Button, Avatar } from '@nextui-org/react';
import { useForm, Controller } from 'react-hook-form';
import {
  validateEmail,
  validatePassword,
  getPasswordErrorMessage,
  validatePhone,
} from '../utils/validationUtils';
import { FiEdit } from "react-icons/fi";

interface ProfileFormInputs {
  username: string;
  currentEmail: string;
  password: string;
  email: string;
  phone: string;
  address: string;
}

const ProfilePage = () => {
  const [avatarImage, setAvatarImage] = useState(
    'https://i.pravatar.cc/150?u=a042581f4e29026704d'
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ProfileFormInputs>({
    mode: 'onChange',
    defaultValues: {
      username: 'Jane Doe',
      currentEmail: 'test@test.com',
      password: '',
      email: 'test@test.com',
      phone: '',
      address: '',
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
                name="currentEmail"
                control={control}
                render={({ field }) => (
                  <p className="text-slate-500">{field.value}</p>
                )}
              />
            </div>
          </div>

          {/* Password Field */}
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

          {/* Email Field */}
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

          {/* Phone Number Field */}
          <div className="mb-4">
            <Controller
              name="phone"
              control={control}
              rules={{
                validate: (value) =>
                  value === '' ||
                  validatePhone(value) ||
                  'Invalid phone number',
              }}
              render={({ field, fieldState: { error } }) => (
                <Input
                  {...field}
                  type="tel"
                  label="Phone Number"
                  placeholder="Optional"
                  className="bg-white text-black"
                  isInvalid={!!error}
                  errorMessage={error?.message}
                  variant="bordered"
                />
              )}
            />
          </div>

          {/* Home Address Field */}
          <div className="mb-6">
            <Controller
              name="address"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="text"
                  label="Home Address"
                  placeholder="Optional"
                  className="bg-white text-black"
                  variant="bordered"
                />
              )}
            />
          </div>

          {/* Update Profile Button */}
          <Button
            type="submit"
            className="w-36 bg-black text-white"
            isDisabled={!isValid}
          >
            Update Profile
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
