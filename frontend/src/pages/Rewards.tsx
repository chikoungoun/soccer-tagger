import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CurrencyDollarIcon,
  TrophyIcon,
  UserGroupIcon,
  ChartBarIcon,
  ClockIcon,
  SparklesIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { rewardsApi } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const Rewards: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [rewardStats, setRewardStats] = useState<any>(null);
  const [userPerformance, setUserPerformance] = useState<any>(null);
  const [allUsersPerformance, setAllUsersPerformance] = useState<any[]>([]);
  const [matchHistory, setMatchHistory] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch reward system stats (admin only)
        if (user?.role === 'super_admin') {
          const stats = await rewardsApi.getRewardStats();
          setRewardStats(stats);

          const leaderboardData = await rewardsApi.getLeaderboard(20);
          setLeaderboard(leaderboardData);

          // Fetch all users performance for admin view
          try {
            const allUsers = await rewardsApi.getAllUsersPerformance();
            setAllUsersPerformance(allUsers);
          } catch (error) {
            console.log('Error fetching all users performance:', error);
          }
        }

        // Fetch user's own performance (for taggers only, not admins)
        if (user?.id && user?.role === 'tagger') {
          try {
            console.log('Fetching performance for user:', user.id);
            const performance = await rewardsApi.getTaggerPerformance(user.id);
            console.log('Performance data:', performance);
            setUserPerformance(performance);

            // Fetch detailed match history for taggers
            console.log('Fetching match history for user:', user.id);
            const history = await rewardsApi.getTaggerMatchHistory(user.id);
            console.log('Match history data:', history);
            setMatchHistory(history);
          } catch (error) {
            // User might not have any tagged matches yet
            console.log('Error fetching rewards data:', error);
          }
        }

      } catch (error) {
        console.error('Error fetching rewards data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatAccuracy = (accuracy: number) => {
    return `${accuracy.toFixed(1)}%`;
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
      <div className="relative overflow-hidden bg-gradient-to-br from-green-500 via-emerald-600 to-teal-700 rounded-2xl p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10"></div>
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-4">
            <CurrencyDollarIcon className="h-8 w-8 text-yellow-300" />
            <h1 className="text-4xl font-bold">Tagger Rewards</h1>
          </div>
          <p className="text-green-100 text-lg mb-6">
            {user?.role === 'super_admin'
              ? 'Manage tagger performance and rewards system'
              : 'Track your tagging performance and earnings'
            }
          </p>
        </div>
      </div>

      {/* All Users Performance (Admin View) */}
      {user?.role === 'super_admin' && allUsersPerformance.length > 0 && (
        <Card className="shadow-lg border-0 bg-gradient-to-br from-indigo-50 to-indigo-100/30">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl text-gray-900 flex items-center space-x-2">
              <UserGroupIcon className="h-6 w-6 text-indigo-600" />
              <span>All Taggers Performance</span>
            </CardTitle>
            <CardDescription>Aggregated performance data for all taggers in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left p-3 font-semibold text-gray-700">Tagger</th>
                    <th className="text-right p-3 font-semibold text-gray-700">Matches</th>
                    <th className="text-right p-3 font-semibold text-gray-700">Events</th>
                    <th className="text-right p-3 font-semibold text-gray-700">Accuracy</th>
                    <th className="text-right p-3 font-semibold text-gray-700">Corrections</th>
                    <th className="text-right p-3 font-semibold text-gray-700">Total Earnings</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsersPerformance.map((tagger) => (
                    <tr key={tagger.tagger_id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {tagger.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">{tagger.username}</span>
                        </div>
                      </td>
                      <td className="p-3 text-right font-medium">{tagger.matches_tagged}</td>
                      <td className="p-3 text-right font-medium">{tagger.total_events_logged}</td>
                      <td className="p-3 text-right">
                        <Badge
                          variant={tagger.average_accuracy >= 95 ? 'default' :
                                   tagger.average_accuracy >= 85 ? 'secondary' : 'destructive'}
                          className="font-medium"
                        >
                          {formatAccuracy(tagger.average_accuracy)}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <span className={`font-medium ${tagger.total_corrections > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                          {tagger.total_corrections}
                        </span>
                      </td>
                      <td className="p-3 text-right font-bold text-green-600">
                        {formatCurrency(tagger.total_earnings)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Stats */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {allUsersPerformance.length}
                  </div>
                  <div className="text-sm text-gray-600">Active Taggers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {allUsersPerformance.reduce((sum, tagger) => sum + tagger.matches_tagged, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Matches</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(allUsersPerformance.reduce((sum, tagger) => sum + tagger.total_earnings, 0))}
                  </div>
                  <div className="text-sm text-gray-600">Total Paid</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatAccuracy(allUsersPerformance.length > 0 ?
                      allUsersPerformance.reduce((sum, tagger) => sum + tagger.average_accuracy, 0) / allUsersPerformance.length : 0)}
                  </div>
                  <div className="text-sm text-gray-600">Avg Accuracy</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Performance (Personal Dashboard for Taggers) */}
      {userPerformance && user?.role === 'tagger' && (
        <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-blue-100/30">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl text-gray-900 flex items-center space-x-2">
              <SparklesIcon className="h-6 w-6 text-blue-600" />
              <span>Your Performance</span>
            </CardTitle>
            <CardDescription>Your tagging statistics and earnings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CurrencyDollarIcon className="h-8 w-8 text-white" />
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(userPerformance.total_earnings)}
                </p>
                <p className="text-sm text-gray-600">Total Earnings</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrophyIcon className="h-8 w-8 text-white" />
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {formatAccuracy(userPerformance.average_accuracy)}
                </p>
                <p className="text-sm text-gray-600">Average Accuracy</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ClockIcon className="h-8 w-8 text-white" />
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {userPerformance.matches_tagged}
                </p>
                <p className="text-sm text-gray-600">Matches Tagged</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ChartBarIcon className="h-8 w-8 text-white" />
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {userPerformance.total_events_logged}
                </p>
                <p className="text-sm text-gray-600">Events Logged</p>
              </div>
            </div>

            {userPerformance.total_corrections > 0 && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                  <span className="font-medium text-yellow-800">
                    {userPerformance.total_corrections} events required admin corrections
                  </span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  Focus on accuracy to maximize your earnings!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Match History (Tagger View) */}
      {userPerformance && matchHistory.length > 0 && user?.role === 'tagger' && (
        <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-green-100/30">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl text-gray-900 flex items-center space-x-2">
              <ClockIcon className="h-6 w-6 text-green-600" />
              <span>Match History</span>
            </CardTitle>
            <CardDescription>Detailed breakdown of your tagging performance per match</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {matchHistory.map((match, index) => (
                <div
                  key={match.fixture_id}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                    {/* Match Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {match.home_team.short_name} vs {match.away_team.short_name}
                        </h3>
                        <Badge
                          variant={match.status === 'completed' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {match.status}
                        </Badge>
                        {match.is_finalized && (
                          <Badge variant="outline" className="text-xs bg-green-50 border-green-200 text-green-700">
                            Finalized
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Score:</strong> {match.score}</p>
                        <p><strong>Gameweek:</strong> {match.gameweek}</p>
                        {match.fixture_date && (
                          <p><strong>Date:</strong> {new Date(match.fixture_date).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{match.events_logged}</div>
                        <div className="text-xs text-gray-500">Events</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {match.accuracy_percentage.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500">Accuracy</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {formatCurrency(match.final_reward)}
                        </div>
                        <div className="text-xs text-gray-500">Reward</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {match.admin_corrections + match.events_added_by_admin + match.events_removed_by_admin}
                        </div>
                        <div className="text-xs text-gray-500">Corrections</div>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Stats */}
                  {match.admin_corrections > 0 || match.events_added_by_admin > 0 || match.events_removed_by_admin > 0 ? (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="text-sm text-gray-600 grid grid-cols-1 md:grid-cols-3 gap-2">
                        {match.admin_corrections > 0 && (
                          <span>🔄 {match.admin_corrections} edited</span>
                        )}
                        {match.events_added_by_admin > 0 && (
                          <span>➕ {match.events_added_by_admin} added</span>
                        )}
                        {match.events_removed_by_admin > 0 && (
                          <span>➖ {match.events_removed_by_admin} removed</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <span className="text-sm text-green-600 flex items-center space-x-1">
                        <span>✅</span>
                        <span>Perfect accuracy - no corrections needed!</span>
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Stats (Admin Only) */}
      {user?.role === 'super_admin' && rewardStats && (
        <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-purple-100/30">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl text-gray-900 flex items-center space-x-2">
              <ChartBarIcon className="h-6 w-6 text-purple-600" />
              <span>Reward System Overview</span>
            </CardTitle>
            <CardDescription>System-wide statistics and performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(rewardStats.total_rewards_paid)}
                </p>
                <p className="text-sm text-gray-600">Total Rewards Paid</p>
              </div>

              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {rewardStats.active_taggers}
                </p>
                <p className="text-sm text-gray-600">Active Taggers</p>
              </div>

              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {formatAccuracy(rewardStats.average_accuracy)}
                </p>
                <p className="text-sm text-gray-600">System Accuracy</p>
              </div>

              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {rewardStats.total_matches_tagged}
                </p>
                <p className="text-sm text-gray-600">Matches Tagged</p>
              </div>

              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(rewardStats.average_reward_per_match)}
                </p>
                <p className="text-sm text-gray-600">Avg Reward/Match</p>
              </div>

              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {rewardStats.total_corrections}
                </p>
                <p className="text-sm text-gray-600">Total Corrections</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <Card className="shadow-lg border-0 bg-gradient-to-br from-yellow-50 to-yellow-100/30">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl text-gray-900 flex items-center space-x-2">
              <TrophyIcon className="h-6 w-6 text-yellow-600" />
              <span>Tagger Leaderboard</span>
            </CardTitle>
            <CardDescription>Top performing taggers ranked by accuracy and earnings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leaderboard.map((tagger, index) => (
                <Card key={tagger.tagger_id} className={`p-4 ${index < 3 ? 'border-2 border-yellow-300' : 'border-gray-100'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-orange-400' :
                        'bg-gray-300'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{tagger.username}</p>
                        <p className="text-sm text-gray-600">
                          {tagger.matches_tagged} matches • {tagger.total_events_logged} events
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-gray-900">
                        {formatCurrency(tagger.total_earnings)}
                      </p>
                      <Badge variant={tagger.average_accuracy >= 95 ? 'success' :
                                     tagger.average_accuracy >= 85 ? 'default' : 'destructive'}>
                        {formatAccuracy(tagger.average_accuracy)} accuracy
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Data State */}
      {!userPerformance && !rewardStats && leaderboard.length === 0 && allUsersPerformance.length === 0 && (
        <Card className="text-center p-12">
          <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Reward Data Available</h3>
          <p className="text-gray-500">
            {user?.role === 'tagger'
              ? 'Start tagging matches to see your performance and earnings!'
              : 'No tagger activity recorded yet.'
            }
          </p>
        </Card>
      )}
    </div>
  );
};

export default Rewards;