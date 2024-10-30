import { Button, Card, CardBody, CardHeader, Image } from '@nextui-org/react';
import { useAuth0 } from '@auth0/auth0-react';
import { FiLogIn } from 'react-icons/fi';

const LoginPage = () => {
  const { loginWithRedirect } = useAuth0();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen animated-gradient">
      <Card className="w-full max-w-md bg-white/90 backdrop-blur-md">
        <CardHeader className="flex gap-3">
          <Image
            alt="Claude Collaborators logo"
            height={40}
            radius="sm"
            src="./public/logo.png"
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
            className="w-full bg-[#9333ea] text-white hover:bg-[#7928ca]"
            endContent={<FiLogIn />}
            size="lg"
            onClick={() => loginWithRedirect()}
          >
            Login / Sign Up
          </Button>
        </CardBody>
      </Card>
    </div>
  );
};

export default LoginPage;