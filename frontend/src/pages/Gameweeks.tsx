import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CalendarDaysIcon,
  PlayIcon,
  StopIcon,
  ClockIcon,
  TrophyIcon,
  CheckIcon,
  BoltIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  EyeIcon,
  ArrowTopRightOnSquareIcon,
  SparklesIcon,
  FireIcon,
  ChartBarIcon,
  FlagIcon
} from '@heroicons/react/24/outline';
import { gameweeksApi, fixturesApi } from '../utils/api';
import { Gameweek, CreateGameweekData, GameweekWithFixtures, FixtureWithTeams } from '../types';
import GameweekModal from '../components/GameweekModal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const Gameweeks: React.FC = () => {
  const [gameweeks, setGameweeks] = useState<Gameweek[]>([]);
  const [allFixtures, setAllFixtures] = useState<FixtureWithTeams[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGameweekModal, setShowGameweekModal] = useState(false);
  const [editingGameweek, setEditingGameweek] = useState<Gameweek | null>(null);
  const [expandedGameweeks, setExpandedGameweeks] = useState<Set<number>>(new Set());
  const [gameweekFixtures, setGameweekFixtures] = useState<Record<number, GameweekWithFixtures>>({});

  useEffect(() => {
    fetchGameweeks();
  }, []);

  const fetchGameweeks = async () => {
    try {
      const [gameweeksData, fixturesData] = await Promise.all([
        gameweeksApi.getAll(),
        fixturesApi.getAll()
      ]);
      setGameweeks(gameweeksData);
      setAllFixtures(fixturesData);
    } catch (error) {
      console.error('Error fetching gameweeks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGameweek = async (gameweekData: CreateGameweekData) => {
    try {
      await gameweeksApi.create(gameweekData);
      fetchGameweeks();
      setShowGameweekModal(false);
    } catch (error) {
      console.error('Error creating gameweek:', error);
    }
  };

  const handleUpdateGameweek = async (gameweekData: Partial<CreateGameweekData>) => {
    if (!editingGameweek) return;

    try {
      await gameweeksApi.update(editingGameweek.id, gameweekData);
      fetchGameweeks();
      setShowGameweekModal(false);
      setEditingGameweek(null);
    } catch (error) {
      console.error('Error updating gameweek:', error);
    }
  };

  const handleDeleteGameweek = async (gameweekId: number) => {
    if (!confirm('Are you sure you want to delete this gameweek? This will also delete all associated fixtures.')) {
      return;
    }

    try {
      await gameweeksApi.delete(gameweekId);
      fetchGameweeks();
    } catch (error) {
      console.error('Error deleting gameweek:', error);
    }
  };

  const handleGenerateFixtures = async (gameweekId: number) => {
    try {
      const result = await gameweeksApi.generateFixtures(gameweekId);
      alert(result.message);
      fetchGameweeks();
      // Also refresh the fixtures for this gameweek if it's expanded
      if (expandedGameweeks.has(gameweekId)) {
        const gameweekWithFixtures = await gameweeksApi.getById(gameweekId);
        setGameweekFixtures(prev => ({
          ...prev,
          [gameweekId]: gameweekWithFixtures
        }));
      }
    } catch (error: any) {
      console.error('Error generating fixtures:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to generate fixtures';

      if (errorMessage.includes('maximum number')) {
        alert(`This gameweek already has the maximum number of fixtures (8). You can view them by expanding the gameweek details.`);
      } else {
        alert(`Error: ${errorMessage}`);
      }
    }
  };

  const handleActivateGameweek = async (gameweekId: number) => {
    try {
      await gameweeksApi.activate(gameweekId);
      fetchGameweeks();
    } catch (error) {
      console.error('Error activating gameweek:', error);
    }
  };

  const openEditModal = (gameweek: Gameweek) => {
    setEditingGameweek(gameweek);
    setShowGameweekModal(true);
  };

  const closeModal = () => {
    setShowGameweekModal(false);
    setEditingGameweek(null);
  };

  const toggleGameweekExpansion = async (gameweekId: number) => {
    const newExpanded = new Set(expandedGameweeks);

    if (expandedGameweeks.has(gameweekId)) {
      newExpanded.delete(gameweekId);
    } else {
      newExpanded.add(gameweekId);
      // Load fixtures for this gameweek if not already loaded
      if (!gameweekFixtures[gameweekId]) {
        try {
          const gameweekWithFixtures = await gameweeksApi.getById(gameweekId);
          setGameweekFixtures(prev => ({
            ...prev,
            [gameweekId]: gameweekWithFixtures
          }));
        } catch (error) {
          console.error('Error fetching gameweek fixtures:', error);
        }
      }
    }

    setExpandedGameweeks(newExpanded);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'live':
        return <PlayIcon className="h-4 w-4 text-red-500" />;
      case 'completed':
        return <TrophyIcon className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <StopIcon className="h-4 w-4 text-gray-500" />;
      default:
        return <ClockIcon className="h-4 w-4 text-blue-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="relative">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-soccer-green"></div>
          <CalendarDaysIcon className="h-12 w-12 text-soccer-green absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 rounded-2xl p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10"></div>
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <CalendarDaysIcon className="h-10 w-10 text-yellow-300" />
                <h1 className="text-4xl font-bold">Gameweeks</h1>
              </div>
              <p className="text-purple-100 text-lg mb-4">Manage gameweeks and generate fixtures</p>
              <div className="flex flex-wrap gap-3">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                  📅 {gameweeks.length} Gameweeks
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                  ⚽ {allFixtures.length} Total Fixtures
                </Badge>
                {gameweeks.find(gw => gw.is_active) && (
                  <Badge variant="secondary" className="bg-green-500/30 text-white border-green-300/50 hover:bg-green-500/40">
                    ✅ Week {gameweeks.find(gw => gw.is_active)?.week_number} Active
                  </Badge>
                )}
              </div>
            </div>
            <div className="mt-6 sm:mt-0">
              <Button
                onClick={() => setShowGameweekModal(true)}
                size="lg"
                className="bg-white text-purple-600 hover:bg-gray-100 shadow-lg flex items-center"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Gameweek
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Gameweeks Grid */}
      {gameweeks.length === 0 ? (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-white">
          <CardContent className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <CalendarDaysIcon className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No gameweeks created</h3>
            <p className="text-gray-600 mb-8 max-w-sm mx-auto">Create your first gameweek to start organizing matches</p>
            <Button
              onClick={() => setShowGameweekModal(true)}
              size="lg"
              className="shadow-lg"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Your First Gameweek
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {gameweeks.map((gameweek, index) => {
            const gradients = [
              'from-blue-500 to-indigo-600',
              'from-emerald-500 to-teal-600',
              'from-purple-500 to-pink-600',
              'from-orange-500 to-red-600',
              'from-cyan-500 to-blue-600',
              'from-rose-500 to-pink-600',
            ];
            const gradient = gradients[index % gradients.length];

            return (
              <Card
                key={gameweek.id}
                className={`border-0 shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
                  gameweek.is_active ? 'ring-2 ring-emerald-500 ring-offset-2' : ''
                }`}
              >
                {/* Gradient Header */}
                <div className={`bg-gradient-to-br ${gradient} p-6 text-white relative`}>
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <FlagIcon className="h-6 w-6 text-white/90" />
                          <h3 className="text-2xl font-bold">{gameweek.name}</h3>
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-white/20 text-white border-white/30"
                        >
                          Week {gameweek.week_number}
                        </Badge>
                      </div>
                      {gameweek.is_active && (
                        <Badge className="bg-emerald-500 text-white border-0 animate-pulse">
                          <CheckIcon className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center text-white/90 text-sm mt-3">
                      <CalendarDaysIcon className="h-4 w-4 mr-2" />
                      <span>{formatDate(gameweek.start_date)} - {formatDate(gameweek.end_date)}</span>
                    </div>
                  </div>
                </div>

                <CardContent className="p-6">
                  {/* Stats */}
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                    <div className="grid grid-cols-2 gap-4 w-full">
                      <div className="flex items-center space-x-2">
                        <ChartBarIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">
                          {allFixtures.filter(f => f.gameweek_id === gameweek.id).length} Total
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FireIcon className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-medium text-gray-700">
                          {allFixtures.filter(f => f.gameweek_id === gameweek.id && f.status === 'live').length} Live
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <ClockIcon className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium text-gray-700">
                          {allFixtures.filter(f => f.gameweek_id === gameweek.id && f.status === 'scheduled').length} Scheduled
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <TrophyIcon className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium text-gray-700">
                          {allFixtures.filter(f => f.gameweek_id === gameweek.id && f.status === 'completed').length} Completed
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3 mb-4">
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleGenerateFixtures(gameweek.id)}
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                      >
                        <BoltIcon className="h-4 w-4 mr-2" />
                        {allFixtures.filter(f => f.gameweek_id === gameweek.id).length > 0
                          ? "Regenerate"
                          : "Generate Fixtures"}
                      </Button>

                      {!gameweek.is_active && (
                        <Button
                          onClick={() => handleActivateGameweek(gameweek.id)}
                          variant="default"
                          size="sm"
                          className="flex-1"
                        >
                          <PlayIcon className="h-4 w-4 mr-2" />
                          Activate
                        </Button>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        onClick={() => toggleGameweekExpansion(gameweek.id)}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        {expandedGameweeks.has(gameweek.id) ? (
                          <>
                            <ChevronDownIcon className="h-4 w-4 mr-2" />
                            Hide Fixtures
                          </>
                        ) : (
                          <>
                            <EyeIcon className="h-4 w-4 mr-2" />
                            View Fixtures
                          </>
                        )}
                      </Button>

                      <Button
                        onClick={() => openEditModal(gameweek)}
                        variant="ghost"
                        size="sm"
                        className="px-3"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>

                      <Button
                        onClick={() => handleDeleteGameweek(gameweek.id)}
                        variant="ghost"
                        size="sm"
                        className="px-3 hover:bg-red-50 hover:text-red-600"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Fixtures */}
                  {expandedGameweeks.has(gameweek.id) && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                          <TrophyIcon className="h-4 w-4 mr-2 text-purple-500" />
                          Match Fixtures
                        </h4>
                        {gameweekFixtures[gameweek.id]?.fixtures?.length > 0 && (
                          <Link
                            to={`/fixtures?gameweek=${gameweek.id}`}
                            className="text-xs text-purple-600 hover:text-purple-800 flex items-center font-medium"
                          >
                            View All
                            <ArrowTopRightOnSquareIcon className="h-3 w-3 ml-1" />
                          </Link>
                        )}
                      </div>

                      {gameweekFixtures[gameweek.id] ? (
                        gameweekFixtures[gameweek.id].fixtures.length > 0 ? (
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {gameweekFixtures[gameweek.id].fixtures.map((fixture) => {
                              const { date, time } = formatDateTime(fixture.match_date);
                              return (
                                <div
                                  key={fixture.id}
                                  className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-lg hover:from-purple-50 hover:to-purple-100/50 transition-colors"
                                >
                                  <div className="flex items-center space-x-3">
                                    {getStatusIcon(fixture.status)}
                                    <div className="flex items-center space-x-2 text-sm">
                                      <span className="font-semibold text-gray-900">
                                        {fixture.home_team.name}
                                      </span>
                                      <span className="text-gray-400">vs</span>
                                      <span className="font-semibold text-gray-900">
                                        {fixture.away_team.name}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-lg font-bold text-gray-900">
                                      {fixture.home_score} - {fixture.away_score}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {time}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <CalendarDaysIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">No fixtures scheduled</p>
                            <Button
                              onClick={() => handleGenerateFixtures(gameweek.id)}
                              variant="outline"
                              size="sm"
                              className="mt-3"
                            >
                              Generate Now
                            </Button>
                          </div>
                        )
                      ) : (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Gameweek Modal */}
      {showGameweekModal && (
        <GameweekModal
          gameweek={editingGameweek}
          onSave={editingGameweek ? handleUpdateGameweek : handleCreateGameweek}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default Gameweeks;