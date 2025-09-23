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
  Bars3Icon,
  XMarkIcon,
  SparklesIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ThemeToggle from './ThemeToggle';
import LanguageToggle from './LanguageToggle';
import NotificationBell from './NotificationBell';

const Navigation: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navigationItems = [
    {
      name: t('navigation.dashboard'),
      href: '/',
      icon: HomeIcon,
      allowedRoles: ['super_admin', 'tagger']
    },
    {
      name: t('navigation.teams'),
      href: '/teams',
      icon: UserGroupIcon,
      allowedRoles: ['super_admin']
    },
    {
      name: t('navigation.players'),
      href: '/players',
      icon: UsersIcon,
      allowedRoles: ['super_admin']
    },
    {
      name: t('navigation.gameweeks'),
      href: '/gameweeks',
      icon: ClockIcon,
      allowedRoles: ['super_admin']
    },
    {
      name: t('navigation.fixtures'),
      href: '/fixtures',
      icon: CalendarDaysIcon,
      allowedRoles: ['super_admin', 'tagger']
    },
    {
      name: t('navigation.events'),
      href: '/events',
      icon: ChartBarIcon,
      allowedRoles: ['super_admin']
    },
    {
      name: t('navigation.analytics'),
      href: '/analytics',
      icon: SparklesIcon,
      allowedRoles: ['super_admin']
    },
    {
      name: t('navigation.users'),
      href: '/users',
      icon: Cog6ToothIcon,
      allowedRoles: ['super_admin']
    }
  ];

  const allowedNavItems = navigationItems.filter(item =>
    item.allowedRoles.includes(user?.role || '')
  );

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'destructive';
      case 'tagger':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'super_admin':
        return t('roles.super_admin');
      case 'tagger':
        return t('roles.tagger');
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-gradient-to-r from-soccer-green via-emerald-600 to-teal-700 shadow-2xl border-b border-emerald-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                  <TrophyIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">{t('branding.appName')}</h1>
                  <div className="text-xs text-emerald-100 font-medium">{t('branding.tagline')}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Language Toggle */}
              <LanguageToggle />

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Notifications */}
              <NotificationBell />

              {/* Enhanced Mobile menu button */}
              <button
                type="button"
                className="md:hidden p-3 rounded-xl text-white hover:bg-white/20 transition-all duration-200 active:scale-95 min-h-[44px] min-w-[44px] touch-manipulation"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>

              {/* Desktop user menu */}
              <div className="hidden md:block relative">
                <Button
                  variant="ghost"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 hover:border-white/30 h-auto px-3 py-2"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <UserIcon className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-left min-w-0">
                      <div className="text-sm font-medium text-white leading-none mb-1">{user?.username}</div>
                      <Badge
                        variant={getRoleBadgeVariant(user?.role || '') as any}
                        className="text-xs h-4 px-1.5 py-0"
                      >
                        {getRoleDisplayName(user?.role || '')}
                      </Badge>
                    </div>
                    <ChevronDownIcon className="h-4 w-4 text-white flex-shrink-0" />
                  </div>
                </Button>

                {userMenuOpen && (
                  <Card className="absolute right-0 mt-2 w-56 border-0 shadow-2xl z-50">
                    <CardContent className="p-2">
                      <Button
                        onClick={handleLogout}
                        variant="ghost"
                        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <ArrowRightOnRectangleIcon className="mr-3 h-4 w-4" />
                        {t('navigation.signOut')}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm shadow-xl border-r border-gray-200/50 dark:border-gray-700/50 min-h-screen">
          <nav className="mt-8 px-4">
            <div className="mb-6">
              <div className="flex items-center space-x-2 px-3 py-2">
                <SparklesIcon className="h-5 w-5 text-emerald-500" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Navigation</span>
              </div>
            </div>
            <ul className="space-y-2">
              {allowedNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                        isActive(item.href)
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg scale-105'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-700/70 hover:text-gray-900 dark:hover:text-white hover:scale-105'
                      }`}
                    >
                      <Icon
                        className={`mr-3 h-5 w-5 ${
                          isActive(item.href) ? 'text-white' : 'text-gray-400 dark:text-gray-500 group-hover:text-emerald-500'
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

        {/* Mobile Slide-out Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
            <div className="absolute top-0 left-0 w-80 h-full bg-white dark:bg-gray-800 shadow-2xl">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                    <TrophyIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('branding.appName')}</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{t('branding.tagline')}</p>
                  </div>
                </div>
              </div>

              <nav className="p-4">
                <ul className="space-y-2">
                  {allowedNavItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.name}>
                        <Link
                          to={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`group flex items-center px-4 py-4 text-base font-medium rounded-xl transition-all duration-200 ${
                            isActive(item.href)
                              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg'
                              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                          }`}
                        >
                          <Icon
                            className={`mr-4 h-6 w-6 ${
                              isActive(item.href) ? 'text-white' : 'text-gray-400 group-hover:text-emerald-500'
                            }`}
                          />
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              <div className="absolute bottom-6 left-4 right-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user?.username}</div>
                      <Badge variant={getRoleBadgeVariant(user?.role || '')} className="text-xs mt-1">
                        {getRoleDisplayName(user?.role || '')}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="w-full text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <ArrowRightOnRectangleIcon className="mr-2 h-4 w-4" />
                    {t('navigation.signOut')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-t border-gray-200/50 dark:border-gray-700/50 z-40 shadow-2xl">
          <div className="safe-area-inset-bottom">
            <nav className="flex justify-around py-1">
              {allowedNavItems.slice(0, 5).map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex flex-col items-center py-3 px-3 text-xs transition-all duration-200 rounded-xl min-h-[60px] min-w-[60px] active:scale-95 ${
                      active
                        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 scale-105'
                        : 'text-gray-600 dark:text-gray-400 hover:text-emerald-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className={`relative p-2 rounded-xl transition-all duration-200 ${
                      active
                        ? 'bg-emerald-100 dark:bg-emerald-900/50 shadow-sm'
                        : 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                    }`}>
                      <Icon className="h-5 w-5" />
                      {active && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      )}
                    </div>
                    <span className={`mt-1 font-medium truncate max-w-[50px] ${
                      active ? 'text-emerald-700 dark:text-emerald-300' : ''
                    }`}>
                      {item.name}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 pb-20 md:pb-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Navigation;