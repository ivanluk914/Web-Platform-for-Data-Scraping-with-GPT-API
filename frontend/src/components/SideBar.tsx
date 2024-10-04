import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FiHome,
  FiPlusCircle,
  FiClipboard,
  FiBell,
  FiUser,
  FiSettings,
  FiLogOut,
  FiChevronUp,
  FiChevronDown,
} from 'react-icons/fi';
import { TbLayoutSidebarLeftCollapse, TbLayoutSidebarRightCollapse  } from "react-icons/tb";
import { RiProgress5Line, RiProgress8Line  } from "react-icons/ri";
import { MdCancel } from "react-icons/md";


const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isTaskManagementCollapsed, setIsTaskManagementCollapsed] = useState(true);
  const navigate = useNavigate();

  const mainMenuItems = [
    { name: 'Home', icon: <FiHome />, path: '/home' },
    { name: 'Task Creation', icon: <FiPlusCircle />, path: '/home/task-creation' },
    { name: 'Notifications', icon: <FiBell />, path: '/home/notifications' },
    { name: 'Profile', icon: <FiUser />, path: '/home/profile' },
    { name: 'Admin', icon: <FiSettings />, path: '/home/admin' },
  ];

  const taskManagementItems = [
    { name: 'On going', icon: <RiProgress5Line />, path: '/home/task-management/ongoing' },
    { name: 'Completed', icon: <RiProgress8Line />, path: '/home/task-management/completed' },
    { name: 'Cancelled', icon: <MdCancel />, path: '/home/task-management/cancelled' },
  ];

  const handleLogout = () => {
    // Add logout logic here
    navigate('/');
  };

  return (
    <div
      className={`flex flex-col border-r border-gray-200 text-lg p-4 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Collapse Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="mb-6 focus:outline-none text-black"
      >
        {isCollapsed ? <TbLayoutSidebarRightCollapse /> : <TbLayoutSidebarLeftCollapse />}
      </button>

      {/* Menu Items and Logout Button */}
      <div className="flex flex-col flex-grow justify-between">
        {/* Main Menu Items */}
        <ul>
          {mainMenuItems.map((item, index) => (
            <li key={item.name} className="mb-6">
              <NavLink
                to={item.path}
                className="flex items-center text-black hover:text-blue-500"
              >
                {item.icon}
                {!isCollapsed && <span className="ml-3">{item.name}</span>}
              </NavLink>
              
              {/* Insert Task Management after Task Creation */}
              {index === 1 && (
                <div className="mt-6">
                  <button
                    onClick={() => setIsTaskManagementCollapsed(!isTaskManagementCollapsed)}
                    className="flex items-center text-black hover:text-blue-500 focus:outline-none w-full"
                  >
                    <FiClipboard />
                    {!isCollapsed && (
                      <>
                        <span className="ml-3 flex-1 text-left">Task Management</span>
                        {isTaskManagementCollapsed ? <FiChevronDown /> : <FiChevronUp />}
                      </>
                    )}
                  </button>
                  {/* Sub-menu with smooth transition */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isTaskManagementCollapsed ? 'max-h-0' : 'max-h-96'
                    }`}
                  >
                    {!isCollapsed && (
                      <ul className="ml-8 mt-4">
                        {taskManagementItems.map((subItem) => (
                          <li key={subItem.name} className="mb-4">
                            <NavLink
                              to={subItem.path}
                              className="flex items-center text-black hover:text-blue-500 gap-2"
                            >
                              {subItem.icon}
                              <span>{subItem.name}</span>
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>

        {/* Logout Item */}
        <ul>
          <li>
            <button
              onClick={handleLogout}
              className="flex items-center text-black hover:text-red-500 focus:outline-none"
            >
              <FiLogOut />
              {!isCollapsed && <span className="ml-3">Logout</span>}
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;