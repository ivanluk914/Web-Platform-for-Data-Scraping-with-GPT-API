import { Button, Card, CardBody, CardHeader, Image } from '@nextui-org/react';
import { useAuth0 } from '@auth0/auth0-react';
import { FiLogIn } from 'react-icons/fi';

const LoginPage = () => {
  const { loginWithRedirect } = useAuth0();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
      <Card className="w-full max-w-md bg-white/90 backdrop-blur-md">
        <CardHeader className="flex gap-3">
          <Image
            alt="Claude Collaborators logo"
            height={40}
            radius="sm"
            src="https://avatars.githubusercontent.com/u/86160567?s=200&v=4"
            width={40}
          />
          <div className="flex flex-col">
            <p className="text-md font-bold">Claude Collaborators</p>
            <p className="text-small text-default-500">Collaborate smarter, not harder</p>
          </div>
        </CardHeader>
        <CardBody className="flex flex-col items-center gap-6">
          <p className="text-center text-default-700">
            Welcome to Claude Collaborators. Sign in to start collaborating with your team.
          </p>
          <Button
            color="primary"
            endContent={<FiLogIn />}
            size="lg"
            className="w-full"
            onClick={() => loginWithRedirect()}
          >
            Login / Sign Up
          </Button>
        </CardBody>
      </Card>
      <p className="mt-4 text-white text-small">
        © 2023 Claude Collaborators. All rights reserved.
      </p>
    </div>
  );
};

export default LoginPage;