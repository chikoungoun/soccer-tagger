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
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import { gameweeksApi } from '../utils/api';
import { Gameweek, CreateGameweekData, GameweekWithFixtures } from '../types';
import GameweekModal from '../components/GameweekModal';

const Gameweeks: React.FC = () => {
  const [gameweeks, setGameweeks] = useState<Gameweek[]>([]);
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
      const data = await gameweeksApi.getAll();
      setGameweeks(data);
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
    return date.toLocaleDateString();
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-soccer-green"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gameweeks</h1>
          <p className="text-gray-600">Manage gameweeks and generate fixtures</p>
        </div>
        <button
          onClick={() => setShowGameweekModal(true)}
          className="btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Gameweek
        </button>
      </div>

      {/* Gameweeks List */}
      {gameweeks.length === 0 ? (
        <div className="text-center py-12">
          <CalendarDaysIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No gameweeks created</h3>
          <p className="text-gray-500 mb-4">Create your first gameweek to get started</p>
          <button
            onClick={() => setShowGameweekModal(true)}
            className="btn-primary"
          >
            Create Gameweek
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gameweeks.map((gameweek) => (
            <div
              key={gameweek.id}
              className={`card transition-all duration-200 ${
                gameweek.is_active ? 'ring-2 ring-soccer-green bg-green-50' : 'hover:shadow-lg'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleGameweekExpansion(gameweek.id)}
                    className="flex items-center space-x-2 text-left"
                  >
                    {expandedGameweeks.has(gameweek.id) ? (
                      <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronRightIcon className="h-5 w-5 text-gray-500" />
                    )}
                    <h3 className="text-lg font-semibold text-gray-900">{gameweek.name}</h3>
                  </button>
                  {gameweek.is_active && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckIcon className="h-3 w-3 mr-1" />
                      Active
                    </span>
                  )}
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => toggleGameweekExpansion(gameweek.id)}
                    className="p-1 text-gray-500 hover:text-blue-500 transition-colors"
                    title="View fixtures"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => openEditModal(gameweek)}
                    className="p-1 text-gray-500 hover:text-soccer-green transition-colors"
                    title="Edit gameweek"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteGameweek(gameweek.id)}
                    className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                    title="Delete gameweek"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Week {gameweek.week_number}</p>
                  <p className="text-sm text-gray-600">
                    {formatDate(gameweek.start_date)} - {formatDate(gameweek.end_date)}
                  </p>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <button
                    onClick={() => handleGenerateFixtures(gameweek.id)}
                    className="w-full btn-secondary flex items-center justify-center text-sm"
                    title={gameweekFixtures[gameweek.id] && gameweekFixtures[gameweek.id].fixtures.length > 0
                      ? "Fixtures already exist for this gameweek"
                      : "Generate 8 fixtures for this gameweek"}
                  >
                    <BoltIcon className="h-4 w-4 mr-2" />
                    {gameweekFixtures[gameweek.id] && gameweekFixtures[gameweek.id].fixtures.length > 0
                      ? "Regenerate Fixtures"
                      : "Generate Fixtures"}
                  </button>

                  {!gameweek.is_active && (
                    <button
                      onClick={() => handleActivateGameweek(gameweek.id)}
                      className="w-full btn-primary text-sm"
                    >
                      Activate Gameweek
                    </button>
                  )}
                </div>

                {/* Fixtures Section */}
                {expandedGameweeks.has(gameweek.id) && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-700 flex items-center">
                        <CalendarDaysIcon className="h-4 w-4 mr-2" />
                        Fixtures
                      </h4>
                      {gameweekFixtures[gameweek.id] && gameweekFixtures[gameweek.id].fixtures.length > 0 && (
                        <Link
                          to={`/fixtures?gameweek=${gameweek.id}`}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          View in Fixtures
                          <ArrowTopRightOnSquareIcon className="h-3 w-3 ml-1" />
                        </Link>
                      )}
                    </div>
                    {gameweekFixtures[gameweek.id] ? (
                      gameweekFixtures[gameweek.id].fixtures.length > 0 ? (
                        <div className="space-y-2">
                          {gameweekFixtures[gameweek.id].fixtures.map((fixture) => {
                            const { date, time } = formatDateTime(fixture.match_date);
                            return (
                              <div
                                key={fixture.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                              >
                                <div className="flex items-center space-x-3">
                                  {getStatusIcon(fixture.status)}
                                  <div className="flex items-center space-x-2 text-sm">
                                    <span className="font-medium text-gray-900">
                                      {fixture.home_team.name}
                                    </span>
                                    <span className="text-gray-500">vs</span>
                                    <span className="font-medium text-gray-900">
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
                        <p className="text-sm text-gray-500 italic">No fixtures scheduled for this gameweek</p>
                      )
                    ) : (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-soccer-green"></div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
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