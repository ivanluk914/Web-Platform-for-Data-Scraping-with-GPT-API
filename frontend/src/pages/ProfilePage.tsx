import { useState, useEffect } from 'react';
import { Input, Button, Avatar, Skeleton } from '@nextui-org/react';
import { useForm, Controller } from 'react-hook-form';
import { useAuth0 } from '@auth0/auth0-react';
import { useHttp } from '../providers/http-provider';
import { UserModel } from '../models/user';
import { toast } from 'react-hot-toast';
import { emitProfileUpdated } from '../utils/events';
import { validateEmail, validateName, validateURL } from '../utils/validationUtils';

interface ProfileFormInputs {
  email: string;
  name: string;
  given_name: string | null;
  family_name: string | null;
  picture: string;
}

const ProfilePage = () => {
  const { user, isAuthenticated } = useAuth0();
  const http = useHttp();
  const [profileData, setProfileData] = useState<UserModel | null>(null);
  const [isEditable, setIsEditable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormInputs>({
    mode: 'onChange',
  });

  useEffect(() => {
    const fetchProfileData = async () => {
      if (isAuthenticated && user?.sub) {
        try {
          setIsLoading(true);
          const response = await http.get(`/user/${user.sub}`);
          const updatedData = {
            ...response.data,
            given_name: response.data.given_name || null,
            family_name: response.data.family_name || null,
          };
          setProfileData(updatedData);
          reset(updatedData);
          setIsEditable(user.sub.startsWith('auth0|'));
        } catch (error) {
          console.error('Error fetching profile data:', error);
          toast.error('Failed to fetch profile data');
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchProfileData();
  }, [isAuthenticated, user, http, reset]);

  const onSubmit = async (data: ProfileFormInputs) => {
    if (isAuthenticated && user?.sub) {
      try {
        const updatedData = {
          ...data,
          given_name: data.given_name,
          family_name: data.family_name,
        };
        await http.put(`/user/${user.sub}`, updatedData);
        setProfileData(updatedData as UserModel);
        toast.success('Profile updated successfully!');
        emitProfileUpdated();
        reset(updatedData); 
      } catch (error) {
        console.error('Error updating profile:', error);
        toast.error('Failed to update profile');
    }
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow-md rounded-lg overflow-hidden max-w-2xl mx-auto p-8">
          <Skeleton className="w-24 h-24 rounded-full mb-4" />
          <Skeleton className="w-48 h-6 mb-2" />
          <Skeleton className="w-64 h-4 mb-6" />
          <Skeleton className="w-full h-10" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !profileData) {
    return <div>Unable to load profile data. Please try again later.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow-md rounded-lg overflow-hidden max-w-2xl mx-auto">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-2 text-black">Profile Dashboard</h1>
          <p className="text-gray-600 mb-6">
            {isEditable ? "Customize Profile Information" : "View Profile Information"}
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex items-center mb-6 bg-slate-100 rounded-lg p-4">
              <Avatar
                size="lg"
                src={profileData?.picture}
                alt={profileData?.name}
                className="rounded-full"
              />
              <div className="ml-4">
                <p className="text-md font-semibold text-black">{profileData?.name}</p>
                <p className="text-xs text-slate-400">{profileData?.email}</p>
              </div>
            </div>

            {isEditable && (
              <div className="mb-4">
                <Controller
                  name="picture"
                  control={control}
                  rules={{
                    validate: (value) => !value || validateURL(value) || "Please enter a valid URL"
                  }}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="text"
                      label="Picture URL"
                      className="bg-white text-black"
                      isInvalid={!!errors.picture}
                      errorMessage={errors.picture?.message}
                    />
                  )}
                />
              </div>
            )}

            <div className="space-y-4">
              <Controller
                name="email"
                control={control}
                rules={{
                  required: 'Email is required',
                  validate: (value) => validateEmail(value) || "Please enter a valid email address"
                }}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="email"
                    label="Email Address"
                    className="bg-white text-black"
                    isInvalid={!!errors.email}
                    errorMessage={errors.email?.message}
                    isDisabled={!isEditable}
                  />
                )}
              />

              <Controller
                name="name"
                control={control}
                rules={{
                  required: 'Name is required',
                  validate: (value) => value !== '' || "Please enter a valid name (2-25 characters, letters, spaces, hyphens, and apostrophes only)"
                }}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="text"
                    label="Name (Will be displayed in the app)"
                    className="bg-white text-black"
                    isInvalid={!!errors.name}
                    errorMessage={errors.name?.message}
                    isDisabled={!isEditable}
                  />
                )}
              />

              {!user?.sub?.startsWith('auth0|') && (
                <>
                  <Controller
                    name="given_name"
                    control={control}
                    rules={{
                      validate: (value) => value === '' || value === null || validateName(value) || "Please enter a valid given name"
                    }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="text"
                        label="Given Name"
                        className="bg-white text-black"
                        isInvalid={!!errors.given_name}
                        errorMessage={errors.given_name?.message}
                        isDisabled={!isEditable}
                        value={field.value || ''}  // Convert null to empty string for input
                        onChange={(e) => field.onChange(e.target.value || null)}  // Convert empty string to null
                      />
                    )}
                  />

                  <Controller
                    name="family_name"
                    control={control}
                    rules={{
                      validate: (value) => value === '' || value === null || validateName(value) || "Please enter a valid family name"
                    }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="text"
                        label="Family Name"
                        className="bg-white text-black"
                        isInvalid={!!errors.family_name}
                        errorMessage={errors.family_name?.message}
                        isDisabled={!isEditable}
                        value={field.value || ''}  // Convert null to empty string for input
                        onChange={(e) => field.onChange(e.target.value || null)}  // Convert empty string to null
                      />
                    )}
                  />
                </>
              )}
            </div>

            {isEditable && (
              <Button
                type="submit"
                className="w-full bg-black text-white"
              >
                Update Profile
              </Button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;