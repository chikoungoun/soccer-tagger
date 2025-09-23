import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  UserGroupIcon,
  UsersIcon,
  CalendarDaysIcon,
  TrophyIcon,
  PlayIcon,
  ClockIcon,
  ArrowUpIcon,
  ArrowRightIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { teamsApi, playersApi, fixturesApi } from '../utils/api';
import { Team, Player, FixtureWithTeams } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const [stats, setStats] = useState({
    totalTeams: 0,
    totalPlayers: 0,
    totalFixtures: 0,
    liveMatches: 0
  });
  const [recentFixtures, setRecentFixtures] = useState<FixtureWithTeams[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!isAuthenticated) return;

      try {
        setLoading(true);
        const fixtures = await fixturesApi.getAll();

        let teams: Team[] = [];
        let players: Player[] = [];

        // Only fetch teams and players for super_admin
        if (user?.role === 'super_admin') {
          [teams, players] = await Promise.all([
            teamsApi.getAll(),
            playersApi.getAll()
          ]);
        }

        setStats({
          totalTeams: teams.length,
          totalPlayers: players.length,
          totalFixtures: fixtures.length,
          liveMatches: fixtures.filter(f => f.status === 'live').length
        });

        setRecentFixtures(fixtures.slice(0, 5));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAuthenticated, user]);

  const allStatCards = [
    {
      name: t('dashboard.totalTeams'),
      value: stats.totalTeams,
      icon: UserGroupIcon,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      change: '+12%',
      changeType: 'positive',
      link: '/teams',
      allowedRoles: ['super_admin']
    },
    {
      name: t('dashboard.totalPlayers'),
      value: stats.totalPlayers,
      icon: UsersIcon,
      color: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      change: '+8%',
      changeType: 'positive',
      link: '/players',
      allowedRoles: ['super_admin']
    },
    {
      name: t('dashboard.totalFixtures'),
      value: stats.totalFixtures,
      icon: CalendarDaysIcon,
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      change: '+23%',
      changeType: 'positive',
      link: '/fixtures',
      allowedRoles: ['super_admin', 'tagger']
    },
    {
      name: t('dashboard.liveMatches'),
      value: stats.liveMatches,
      icon: PlayIcon,
      color: 'bg-gradient-to-br from-red-500 to-red-600',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      change: 'Live',
      changeType: 'live',
      link: '/fixtures?status=live',
      allowedRoles: ['super_admin', 'tagger']
    }
  ];

  const statCards = allStatCards.filter(card =>
    card.allowedRoles.includes(user?.role || '')
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'live':
        return <PlayIcon className="h-4 w-4 text-red-500" />;
      case 'scheduled':
        return <ClockIcon className="h-4 w-4 text-blue-500" />;
      default:
        return <TrophyIcon className="h-4 w-4 text-green-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-soccer-green via-soccer-dark to-emerald-700 rounded-2xl p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10"></div>
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-4">
            <SparklesIcon className="h-8 w-8 text-yellow-300" />
            <h1 className="text-4xl font-bold">{t('dashboard.welcome')}</h1>
          </div>
          <p className="text-green-100 text-lg mb-6">Manage your teams, players, and fixtures all in one place</p>
          <div className="flex flex-wrap gap-3">
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
              Role: {user?.role || 'User'}
            </Badge>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.name} to={card.link}>
              <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-md bg-gradient-to-br from-white to-gray-50/50">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className={`p-3 rounded-xl ${card.iconBg} group-hover:scale-110 transition-transform duration-300`}>
                          <Icon className={`h-6 w-6 ${card.iconColor}`} />
                        </div>
                        {card.changeType === 'live' ? (
                          <Badge variant="destructive" className="animate-pulse">
                            {card.change}
                          </Badge>
                        ) : card.changeType === 'positive' ? (
                          <Badge variant="success" className="flex items-center space-x-1">
                            <ArrowUpIcon className="h-3 w-3" />
                            <span>{card.change}</span>
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-sm font-medium text-gray-600 mb-1">{card.name}</p>
                      <p className="text-3xl font-bold text-gray-900 group-hover:text-soccer-green transition-colors duration-300">
                        {card.value.toLocaleString()}
                      </p>
                    </div>
                    <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover:text-soccer-green group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Recent Fixtures */}
      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/30">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-gray-900 flex items-center space-x-2">
                <CalendarDaysIcon className="h-6 w-6 text-soccer-green" />
                <span>{t('dashboard.recentFixtures')}</span>
              </CardTitle>
              <CardDescription className="mt-1">
                Latest matches and upcoming games
              </CardDescription>
            </div>
            <Button asChild variant="default" className="shadow-md">
              <Link to="/fixtures">
                <span>View All</span>
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentFixtures.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CalendarDaysIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No fixtures scheduled</h3>
              <p className="text-gray-500 mb-6">Start by creating your first match</p>
              <Button asChild>
                <Link to="/fixtures">
                  Schedule a Match
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentFixtures.map((fixture) => (
                <Card
                  key={fixture.id}
                  className="p-4 hover:shadow-md transition-all duration-200 hover:scale-[1.01] border-gray-100"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {getStatusIcon(fixture.status)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-gray-900 text-lg">
                          {fixture.home_team.name} vs {fixture.away_team.name}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center space-x-2">
                          <span>{new Date(fixture.match_date).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{new Date(fixture.match_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end space-y-2">
                      <div className="font-bold text-2xl text-gray-900">
                        {fixture.home_score} - {fixture.away_score}
                      </div>
                      <Badge
                        variant={
                          fixture.status === 'live' ? 'destructive' :
                          fixture.status === 'completed' ? 'success' :
                          'secondary'
                        }
                        className={fixture.status === 'live' ? 'animate-pulse' : ''}
                      >
                        {fixture.status.charAt(0).toUpperCase() + fixture.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
          <SparklesIcon className="h-6 w-6 text-soccer-green" />
          <span>Quick Actions</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {user?.role === 'super_admin' && (
            <Link to="/teams">
              <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 text-center border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50 hover:from-blue-100 hover:to-blue-200/50">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <UserGroupIcon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                    Manage Teams
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Create and manage your soccer teams with advanced tools
                  </p>
                  <div className="mt-4 flex justify-center">
                    <ArrowRightIcon className="h-5 w-5 text-blue-500 group-hover:translate-x-2 transition-transform duration-300" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}

          {user?.role === 'super_admin' && (
            <Link to="/players">
              <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 text-center border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100/50 hover:from-emerald-100 hover:to-emerald-200/50">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <UsersIcon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-emerald-600 transition-colors">
                    Manage Players
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Add and organize your team players with detailed profiles
                  </p>
                  <div className="mt-4 flex justify-center">
                    <ArrowRightIcon className="h-5 w-5 text-emerald-500 group-hover:translate-x-2 transition-transform duration-300" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}

          <Link to="/fixtures">
            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 text-center border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100/50 hover:from-purple-100 hover:to-purple-200/50">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <CalendarDaysIcon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors">
                  Schedule Matches
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Create and track match fixtures with real-time updates
                </p>
                <div className="mt-4 flex justify-center">
                  <ArrowRightIcon className="h-5 w-5 text-purple-500 group-hover:translate-x-2 transition-transform duration-300" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;