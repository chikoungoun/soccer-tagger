import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  UserGroupIcon,
  UsersIcon,
  CalendarDaysIcon,
  TrophyIcon,
  PlayIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { teamsApi, playersApi, fixturesApi } from '../utils/api';
import { Team, Player, FixtureWithTeams } from '../types';

const Dashboard: React.FC = () => {
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
      try {
        const [teams, players, fixtures] = await Promise.all([
          teamsApi.getAll(),
          playersApi.getAll(),
          fixturesApi.getAll()
        ]);

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
  }, []);

  const statCards = [
    {
      name: 'Total Teams',
      value: stats.totalTeams,
      icon: UserGroupIcon,
      color: 'bg-blue-500',
      link: '/teams'
    },
    {
      name: 'Total Players',
      value: stats.totalPlayers,
      icon: UsersIcon,
      color: 'bg-green-500',
      link: '/players'
    },
    {
      name: 'Total Fixtures',
      value: stats.totalFixtures,
      icon: CalendarDaysIcon,
      color: 'bg-purple-500',
      link: '/fixtures'
    },
    {
      name: 'Live Matches',
      value: stats.liveMatches,
      icon: PlayIcon,
      color: 'bg-red-500',
      link: '/fixtures?status=live'
    }
  ];

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
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-soccer-green"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-soccer-green to-soccer-dark rounded-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome to Soccer Manager</h1>
        <p className="text-soccer-light">Manage your teams, players, and fixtures all in one place</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.name}
              to={card.link}
              className="card hover:shadow-lg transition-shadow duration-200 group"
            >
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${card.color} mr-4`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent Fixtures */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Recent Fixtures</h2>
          <Link to="/fixtures" className="btn-primary">
            View All
          </Link>
        </div>

        {recentFixtures.length === 0 ? (
          <div className="text-center py-12">
            <CalendarDaysIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No fixtures scheduled yet</p>
            <Link to="/fixtures" className="btn-primary mt-4 inline-block">
              Schedule a Match
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recentFixtures.map((fixture) => (
              <div
                key={fixture.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  {getStatusIcon(fixture.status)}
                  <div>
                    <div className="font-medium text-gray-900">
                      {fixture.home_team.name} vs {fixture.away_team.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(fixture.match_date).toLocaleDateString()} at{' '}
                      {new Date(fixture.match_date).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">
                    {fixture.home_score} - {fixture.away_score}
                  </div>
                  <span className={`status-${fixture.status}`}>
                    {fixture.status.charAt(0).toUpperCase() + fixture.status.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/teams" className="card hover:shadow-lg transition-shadow duration-200 text-center">
          <UserGroupIcon className="h-12 w-12 text-soccer-green mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Manage Teams</h3>
          <p className="text-gray-500">Create and manage your soccer teams</p>
        </Link>

        <Link to="/players" className="card hover:shadow-lg transition-shadow duration-200 text-center">
          <UsersIcon className="h-12 w-12 text-soccer-green mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Manage Players</h3>
          <p className="text-gray-500">Add and organize your team players</p>
        </Link>

        <Link to="/fixtures" className="card hover:shadow-lg transition-shadow duration-200 text-center">
          <CalendarDaysIcon className="h-12 w-12 text-soccer-green mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Schedule Matches</h3>
          <p className="text-gray-500">Create and track match fixtures</p>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;