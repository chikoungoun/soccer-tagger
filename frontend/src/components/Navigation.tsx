import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  UserGroupIcon,
  UsersIcon,
  CalendarDaysIcon,
  TrophyIcon,
  ClockIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  UserIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

const Navigation: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: HomeIcon,
      allowedRoles: ['super_admin', 'tagger']
    },
    {
      name: 'Teams',
      href: '/teams',
      icon: UserGroupIcon,
      allowedRoles: ['super_admin']
    },
    {
      name: 'Players',
      href: '/players',
      icon: UsersIcon,
      allowedRoles: ['super_admin']
    },
    {
      name: 'Gameweeks',
      href: '/gameweeks',
      icon: ClockIcon,
      allowedRoles: ['super_admin']
    },
    {
      name: 'Fixtures',
      href: '/fixtures',
      icon: CalendarDaysIcon,
      allowedRoles: ['super_admin', 'tagger']
    },
    {
      name: 'Users',
      href: '/users',
      icon: Cog6ToothIcon,
      allowedRoles: ['super_admin']
    }
  ];

  const allowedNavItems = navigationItems.filter(item =>
    item.allowedRoles.includes(user?.role || '')
  );

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-100 text-red-800';
      case 'tagger':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'tagger':
        return 'Tagger';
      default:
        return role;
    }
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-soccer-green shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <TrophyIcon className="h-8 w-8 text-white mr-3" />
              <h1 className="text-xl font-bold text-white">Soccer Manager</h1>
            </div>
            <div className="flex items-center">
              <div className="ml-3 relative">
                <button
                  type="button"
                  className="bg-white bg-opacity-10 hover:bg-opacity-20 flex text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-colors duration-200"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <div className="flex items-center space-x-3 py-2 px-3 rounded-lg">
                    <UserIcon className="h-5 w-5 text-white" />
                    <div className="text-left">
                      <div className="text-sm font-medium text-white">{user?.username}</div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(user?.role || '')}`}>
                          {getRoleDisplayName(user?.role || '')}
                        </span>
                      </div>
                    </div>
                    <ChevronDownIcon className="h-4 w-4 text-white" />
                  </div>
                </button>
                {userMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                    <div className="py-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <ArrowRightOnRectangleIcon className="mr-3 h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:block w-64 bg-white shadow-sm min-h-screen">
          <nav className="mt-8 px-4">
            <ul className="space-y-2">
              {allowedNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                        isActive(item.href)
                          ? 'bg-soccer-green text-white'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon
                        className={`mr-3 h-5 w-5 ${
                          isActive(item.href) ? 'text-white' : 'text-gray-400 group-hover:text-gray-500'
                        }`}
                      />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* Mobile Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
          <nav className="flex justify-around py-2">
            {allowedNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex flex-col items-center py-2 px-3 text-xs ${
                    isActive(item.href)
                      ? 'text-soccer-green'
                      : 'text-gray-600'
                  }`}
                >
                  <Icon className="h-5 w-5 mb-1" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Navigation;