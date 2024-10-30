import { Input, Button, Avatar, Skeleton, Card, CardBody } from '@nextui-org/react';
import { useForm, Controller } from 'react-hook-form';
import { useAuth0 } from '@auth0/auth0-react';
import { useHttp } from '../providers/http-provider';
import { toast } from 'react-hot-toast';
import { validateEmail, validateName, validateURL } from '../utils/validationUtils';
import { useUser } from '../providers/user-provider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

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
  const queryClient = useQueryClient();
  const { currentUser, isLoading } = useUser();

  const isEditable = currentUser?.user_id.startsWith('auth0|') ?? false;

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormInputs>({
    mode: 'onChange',
    defaultValues: {
      email: '',
      name: '',
      given_name: '',
      family_name: '',
      picture: '',
    },
  });

  useEffect(() => {
    if (currentUser) {
      reset(currentUser);
    }
  }, [currentUser, reset]);

  const updateUserMutation = useMutation({
    mutationFn: async (data: ProfileFormInputs) => {
      const updatedData = {
        ...data,
        given_name: data.given_name,
        family_name: data.family_name,
      };
      await http.put(`/user/${currentUser?.user_id}`, updatedData);
      return updatedData;
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Profile updated successfully');
    },
  });

  const onSubmit = async (data: ProfileFormInputs) => {
    if (isAuthenticated && user?.sub) {
      await updateUserMutation.mutateAsync(data);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto">
        <Card className="mx-auto max-w-2xl">
          <CardBody className="p-8">
            <Skeleton className="w-24 h-24 rounded-full mb-4" />
            <Skeleton className="w-48 h-6 mb-2" />
            <Skeleton className="w-64 h-4 mb-6" />
            <Skeleton className="w-full h-10" />
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated || !currentUser) {
    return <div>Unable to load profile data. Please try again later.</div>;
  }

  return (
    <div className="container mx-auto">
      <Card className="mx-auto max-w-2xl">
        <CardBody className="p-8">
          <h1 className="text-3xl font-bold mb-2 text-black">Profile Dashboard</h1>
          <p className="text-gray-600 mb-6">
            {isEditable ? "Customize Profile Information" : "View Profile Information"}
          </p>
          {!isEditable && (
            <div className="mb-6 p-4 bg-blue-50 text-blue-700 rounded-lg">
              Note: Profile editing is only available for email/password accounts. Social login profiles are managed through their respective providers.
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex items-center mb-6 bg-slate-100 rounded-lg p-4">
              <Avatar
                size="lg"
                src={currentUser?.picture}
                alt={currentUser?.name}
                className="rounded-full"
              />
              <div className="ml-4">
                <p className="text-md font-semibold text-black">{currentUser?.name}</p>
                <p className="text-xs text-slate-400">{currentUser?.email}</p>
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
                        value={field.value ?? ''}
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
                        value={field.value ?? ''}
                      />
                    )}
                  />
                </>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-black text-white"
              isDisabled={!isEditable}
              isLoading={updateUserMutation.isPending}
            >
              Update Profile
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};

export default ProfilePage;