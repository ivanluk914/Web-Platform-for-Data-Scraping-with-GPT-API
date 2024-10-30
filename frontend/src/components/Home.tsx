import React from 'react';
import { Card, CardBody, Button } from '@nextui-org/react';
import { useNavigate } from 'react-router-dom';
import { FiPlusCircle, FiList } from 'react-icons/fi';
import { RiSparklingFill } from "react-icons/ri";
import { toast } from 'react-hot-toast';
import { useAuth0 } from '@auth0/auth0-react';

const HomeComponent: React.FC = () => {
  const { user } = useAuth0();
  const navigate = useNavigate();

  React.useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisitedHomePage');
    
    if (!hasVisited) {
      toast.success(`Welcome, ${user?.name || 'Guest'}!`);
      localStorage.setItem('hasVisitedHomePage', 'true');
    }
  }, [user?.name]);

  const features = [
    {
      title: "Create New Task",
      description: "Start a new data extraction task with our AI-powered system",
      icon: <FiPlusCircle className="w-6 h-6" />,
      action: () => navigate('/home/create-task'),
      buttonText: "Create Task"
    },
    {
      title: "Manage Tasks",
      description: "View and manage your existing data extraction tasks",
      icon: <FiList className="w-6 h-6" />,
      action: () => navigate('/home/tasks'),
      buttonText: "View Tasks"
    },
    {
      title: "AI Assistance",
      description: "Get AI-powered insights and summaries from your extracted data",
      icon: <RiSparklingFill className="w-6 h-6" />,
      action: () => navigate('/home/tasks'),
      buttonText: "Explore"
    }
  ];

  return (
    <>
        <div className="container mx-auto p-6">
          <Card className="mb-6">
            <CardBody className="p-8">
              <h1 className="text-4xl font-bold mb-4">Welcome to Claude Collaborators</h1>
              <p className="text-gray-600 text-lg mb-2">
                Your AI-powered data extraction and analysis platform
              </p>
              <p className="text-gray-500">
                Get started by creating a new task or managing your existing extractions
              </p>
            </CardBody>
          </Card>

          <div className="grid md:grid-cols-3 gap-6 mt-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow h-full">
                <CardBody className="p-6 flex flex-col">
                  <div className="flex items-center mb-4 text-primary">
                    {feature.icon}
                  </div>
                  <h2 className="text-xl font-semibold mb-2">{feature.title}</h2>
                  <p className="text-gray-600 mb-4 flex-grow">{feature.description}</p>
                  <Button
                    color="primary"
                    endContent={feature.icon}
                    onClick={feature.action}
                    className="w-full mt-auto"
                  >
                    {feature.buttonText}
                  </Button>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
    </>
  );
};

export default HomeComponent;
