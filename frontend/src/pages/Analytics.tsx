import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChartBarIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  DeviceTabletIcon,
  UserIcon,
  ClockIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  GlobeAltIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardSkeleton } from '@/components/SkeletonLoaders';

interface UserSession {
  id: number;
  user_id: number;
  username: string;
  login_time: string;
  logout_time?: string;
  last_activity: string;
  is_active: boolean;
  device_type: string;
  browser_name: string;
  browser_version: string;
  os_name: string;
  os_version: string;
  ip_address: string;
  pages_visited: number;
  actions_performed: number;
  session_duration: number;
  country?: string;
  country_code?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}

interface LoginAttempt {
  id: number;
  username: string;
  ip_address: string;
  success: boolean;
  failure_reason?: string;
  timestamp: string;
  user_id?: number;
}

interface UserActivity {
  id: number;
  user_id: number;
  session_id?: number;
  activity_type: string;
  page_url?: string;
  action_name?: string;
  additional_data?: string;
  timestamp: string;
}

const Analytics: React.FC = () => {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const [sessionsRes, attemptsRes, activitiesRes] = await Promise.all([
        fetch('/api/auth/analytics/sessions', { credentials: 'include' }),
        fetch('/api/auth/analytics/login-attempts', { credentials: 'include' }),
        fetch('/api/auth/analytics/user-activity', { credentials: 'include' })
      ]);

      if (!sessionsRes.ok || !attemptsRes.ok || !activitiesRes.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const [sessionsData, attemptsData, activitiesData] = await Promise.all([
        sessionsRes.json(),
        attemptsRes.json(),
        activitiesRes.json()
      ]);

      setSessions(sessionsData.sessions || []);
      setLoginAttempts(attemptsData.login_attempts || []);
      setActivities(activitiesData.activities || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate analytics metrics
  const activeSessions = sessions.filter(s => s.is_active).length;
  const totalSessions = sessions.length;
  const failedLogins = loginAttempts.filter(a => !a.success).length;
  const successfulLogins = loginAttempts.filter(a => a.success).length;

  const deviceStats = sessions.reduce((acc, session) => {
    acc[session.device_type] = (acc[session.device_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return DevicePhoneMobileIcon;
      case 'tablet':
        return DeviceTabletIcon;
      default:
        return ComputerDesktopIcon;
    }
  };

  const getLocationStats = (sessions: UserSession[]) => {
    const locationStats: { [key: string]: number } = {};

    sessions.forEach((session) => {
      let location = 'Unknown Location';

      if (session.city && session.country) {
        location = `${session.city}, ${session.country}`;
      } else if (session.region && session.country) {
        location = `${session.region}, ${session.country}`;
      } else if (session.country) {
        location = session.country;
      }

      locationStats[location] = (locationStats[location] || 0) + 1;
    });

    return Object.fromEntries(
      Object.entries(locationStats).sort(([,a], [,b]) => b - a)
    );
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-700 to-indigo-800 rounded-2xl p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10"></div>
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <ChartBarIcon className="h-10 w-10 text-yellow-300" />
                <h1 className="text-4xl font-bold">User Activity</h1>
              </div>
              <p className="text-purple-100 text-lg mb-4">Monitor user sessions, activity, and security</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <UserIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Sessions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{activeSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <ClockIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Sessions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <CheckCircleIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Successful Logins</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{successfulLogins}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                <XCircleIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Failed Logins</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{failedLogins}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Device Distribution</CardTitle>
          <CardDescription>Sessions by device type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(deviceStats).map(([deviceType, count]) => {
              const Icon = getDeviceIcon(deviceType);
              return (
                <div key={deviceType} className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Icon className="h-8 w-8 text-gray-600 dark:text-gray-400" />
                  <div>
                    <p className="font-medium capitalize">{deviceType}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{count} sessions</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Geographic Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <GlobeAltIcon className="h-5 w-5" />
            <span>Geographic Distribution</span>
          </CardTitle>
          <CardDescription>Sessions by location</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(getLocationStats(sessions)).slice(0, 10).map(([location, count]) => (
              <div key={location} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <MapPinIcon className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">{location || 'Unknown Location'}</span>
                </div>
                <Badge variant="outline">{count} sessions</Badge>
              </div>
            ))}
            {Object.keys(getLocationStats(sessions)).length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <GlobeAltIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No location data available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
          <CardDescription>Latest user sessions and activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sessions.slice(0, 10).map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                    <UserIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium">{session.username}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {session.browser_name} on {session.os_name}
                    </p>
                    {(session.city || session.country) && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center mt-1">
                        <MapPinIcon className="h-3 w-3 mr-1" />
                        {session.city && session.country
                          ? `${session.city}, ${session.country}`
                          : session.country || session.city}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    <Badge variant={session.is_active ? 'default' : 'secondary'}>
                      {session.is_active ? 'Active' : 'Ended'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {formatDateTime(session.login_time)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Login Attempts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Login Attempts</CardTitle>
          <CardDescription>Security monitoring</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loginAttempts.slice(0, 10).map((attempt) => (
              <div key={attempt.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    attempt.success
                      ? 'bg-green-100 dark:bg-green-900/20'
                      : 'bg-red-100 dark:bg-red-900/20'
                  }`}>
                    {attempt.success ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{attempt.username}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {attempt.ip_address}
                      {attempt.failure_reason && ` • ${attempt.failure_reason}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={attempt.success ? 'default' : 'destructive'}>
                    {attempt.success ? 'Success' : 'Failed'}
                  </Badge>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {formatDateTime(attempt.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;