import React, { useState, useEffect, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { Avatar, Button, Skeleton } from "@nextui-org/react";
import { FiHome, FiPlusCircle, FiBell, FiUser, FiSettings, FiLogOut, FiList } from 'react-icons/fi';
import { useAuth0 } from '@auth0/auth0-react';
import { useHttp } from '../providers/http-provider';
import { UserModel } from '../models/user';
import { PROFILE_UPDATED_EVENT } from '../utils/events';
import { UserService } from '../api/user-service';
import logo from '../../public/logo.png';

const Sidebar: React.FC = () => {
  const { user, isAuthenticated, logout, getAccessTokenSilently } = useAuth0();
  const http = useHttp();
  const [userData, setUserData] = useState<UserModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useUser();

  const fetchUserData = useCallback(async () => {
    if (isAuthenticated) {
      try {
        const token = await getAccessTokenSilently();
        const response = await http.get(`/user/${user?.sub}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const roles = await new UserService(http).getUserRoles(user?.sub || '');
        setUserData({ ...response.data, roles });
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [isAuthenticated, getAccessTokenSilently, http]);

  useEffect(() => {
    fetchUserData();

    const handleProfileUpdate = () => {
      fetchUserData();
    };

    window.addEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdate);

    return () => {
      window.removeEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdate);
    };
  }, [fetchUserData]);

  const handleLogout = () => {
    localStorage.removeItem('hasVisitedHomePage');
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  const mainMenuItems = [
    { name: 'Home', icon: <FiHome />, path: '/home' },
    { name: 'Task Management', icon: <FiList />, path: '/home/tasks' },
    { name: 'Create Task', icon: <FiPlusCircle />, path: '/home/create-task' },
    { name: 'Profile', icon: <FiUser />, path: '/home/profile' },
    { name: 'Admin', icon: <FiSettings />, path: '/home/admin', roles: [UserRole.Admin] },
  ]
    .filter((item) => !item.roles || item.roles?.some((role) => hasRole(currentUser, role)));

  return (
    <aside className="w-64 bg-gray-100 flex flex-col min-h-screen">
      <div className="flex items-center gap-2 p-4">
        <img src={logo} alt="Logo" className="w-10 h-10" />
        <h1 className="w-full text-small font-bold uppercase opacity-100">CLAUDECOLLABORATORS</h1>
      </div>
      <div className="p-4">
        <div className="flex items-center space-x-4 mb-6">
          {isLoading ? (
            <>
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex flex-col space-y-2">
                <Skeleton className="w-24 h-4" />
                <Skeleton className="w-32 h-3" />
              </div>
            </>
          ) : (
            <>
              <Avatar src={userData?.picture} name={userData?.name} />
              <div className="flex flex-col">
                <span className="text-sm font-semibold">{userData?.name}</span>
                <span className="text-xs text-gray-500">{userData?.email}</span>
              </div>
            </>
          )}
        </div>
        <nav className="flex-grow">
          <ul className="space-y-2">
            {mainMenuItems.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.path}
                  end={item.path === '/home'}
                  className={({ isActive }) =>
                    `flex items-center p-2 text-base font-normal rounded-lg ${
                      isActive ? 'bg-gray-200 text-gray-900' : 'text-gray-700 hover:bg-gray-200'
                    }`
                  }
                >
                  {item.icon}
                  <span className="ml-3">{item.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="mt-auto p-4">
        <Button
          color="danger"
          variant="light"
          startContent={<FiLogOut />}
          className="w-full"
          onPress={handleLogout}
        >
          Logout
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;