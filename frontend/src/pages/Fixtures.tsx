import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CalendarDaysIcon,
  PlayIcon,
  StopIcon,
  ClockIcon,
  TrophyIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  XCircleIcon,
  MapPinIcon,
  EyeIcon,
  SparklesIcon,
  FireIcon,
  BoltIcon,
  FunnelIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { fixturesApi, teamsApi, gameweeksApi, lineupsApi } from '../utils/api';
import { FixtureWithTeams, FixtureWithLineups, Team, CreateFixtureData, Gameweek } from '../types';
import FixtureModal from '../components/FixtureModal';
import ScoreModal from '../components/ScoreModal';
import LineupModal from '../components/LineupModal';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface LineupStatus {
  [fixtureId: number]: {
    homeLineupReady: boolean;
    awayLineupReady: boolean;
    homeStarterCount: number;
    awayStarterCount: number;
  };
}

const Fixtures: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [fixtures, setFixtures] = useState<FixtureWithTeams[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [gameweeks, setGameweeks] = useState<Gameweek[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFixtureModal, setShowFixtureModal] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [showLineupModal, setShowLineupModal] = useState(false);
  const [editingFixture, setEditingFixture] = useState<FixtureWithTeams | null>(null);
  const [scoringFixture, setScoringFixture] = useState<FixtureWithTeams | null>(null);
  const [lineupFixture, setLineupFixture] = useState<FixtureWithLineups | null>(null);
  const [lineupStatuses, setLineupStatuses] = useState<LineupStatus>({});
  const [filters, setFilters] = useState({
    status: '',
    teamId: '',
    gameweekId: ''
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  useEffect(() => {
    // Initialize filters from URL parameters
    const gameweekParam = searchParams.get('gameweek');
    const statusParam = searchParams.get('status');

    if (gameweekParam) {
      setFilters(prev => ({ ...prev, gameweekId: gameweekParam }));
    }

    if (statusParam) {
      setFilters(prev => ({ ...prev, status: statusParam }));
    }
  }, [searchParams]);

  const fetchLineupStatuses = async (fixtures: FixtureWithTeams[]) => {
    const statuses: LineupStatus = {};

    for (const fixture of fixtures) {
      try {
        const fixtureWithLineups = await lineupsApi.getFixtureLineups(fixture.id);

        const homeStarters = fixtureWithLineups.home_lineup?.starters?.length || 0;
        const awayStarters = fixtureWithLineups.away_lineup?.starters?.length || 0;

        statuses[fixture.id] = {
          homeLineupReady: homeStarters === 11,
          awayLineupReady: awayStarters === 11,
          homeStarterCount: homeStarters,
          awayStarterCount: awayStarters
        };
      } catch (error) {
        // If lineup doesn't exist yet, set as not ready
        statuses[fixture.id] = {
          homeLineupReady: false,
          awayLineupReady: false,
          homeStarterCount: 0,
          awayStarterCount: 0
        };
      }
    }

    setLineupStatuses(statuses);
  };

  const fetchData = async () => {
    try {
      const [fixturesData, teamsData, gameweeksData] = await Promise.all([
        fixturesApi.getAll(),
        teamsApi.getAll(),
        gameweeksApi.getAll()
      ]);

      // Filter fixtures based on user role
      let filteredFixtures = fixturesData;
      if (user?.role === 'tagger') {
        // For taggers, only show fixtures from active gameweeks
        const activeGameweekIds = gameweeksData
          .filter(gw => gw.is_active)
          .map(gw => gw.id);

        filteredFixtures = fixturesData.filter(fixture =>
          fixture.gameweek_id && activeGameweekIds.includes(fixture.gameweek_id)
        );
      }

      setFixtures(filteredFixtures);
      setTeams(teamsData);
      setGameweeks(gameweeksData);

      // Fetch lineup statuses for filtered fixtures
      await fetchLineupStatuses(filteredFixtures);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFixture = async (fixtureData: CreateFixtureData) => {
    try {
      await fixturesApi.create(fixtureData);
      fetchData();
      setShowFixtureModal(false);
    } catch (error) {
      console.error('Error creating fixture:', error);
    }
  };

  const handleUpdateFixture = async (fixtureData: Partial<CreateFixtureData>) => {
    if (!editingFixture) return;

    try {
      await fixturesApi.update(editingFixture.id, fixtureData);
      fetchData();
      setShowFixtureModal(false);
      setEditingFixture(null);
    } catch (error) {
      console.error('Error updating fixture:', error);
    }
  };

  const handleDeleteFixture = async (fixtureId: number) => {
    if (!confirm('Are you sure you want to delete this fixture?')) {
      return;
    }

    try {
      await fixturesApi.delete(fixtureId);
      fetchData();
    } catch (error) {
      console.error('Error deleting fixture:', error);
    }
  };

  const handleUpdateScore = async (homeScore: number, awayScore: number) => {
    if (!scoringFixture) return;

    try {
      console.log('Updating score:', { fixtureId: scoringFixture.id, homeScore, awayScore });
      const result = await fixturesApi.updateScore(scoringFixture.id, homeScore, awayScore);
      console.log('Score update result:', result);
      fetchData();
      setShowScoreModal(false);
      setScoringFixture(null);
    } catch (error: any) {
      console.error('Error updating score:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to update score';
      alert(`Error updating score: ${errorMessage}`);
    }
  };

  const handleCompleteFixture = async (fixtureId: number) => {
    try {
      await fixturesApi.complete(fixtureId);
      fetchData();
    } catch (error) {
      console.error('Error completing fixture:', error);
    }
  };

  const openEditModal = (fixture: FixtureWithTeams) => {
    setEditingFixture(fixture);
    setShowFixtureModal(true);
  };

  const openScoreModal = (fixture: FixtureWithTeams) => {
    setScoringFixture(fixture);
    setShowScoreModal(true);
  };

  const openLineupModal = async (fixture: FixtureWithTeams) => {
    try {
      const fixtureWithLineups = await lineupsApi.getFixtureLineups(fixture.id);
      setLineupFixture(fixtureWithLineups);
      setShowLineupModal(true);
    } catch (error) {
      console.error('Error fetching fixture lineups:', error);
    }
  };

  const closeModals = () => {
    setShowFixtureModal(false);
    setShowScoreModal(false);
    setShowLineupModal(false);
    setEditingFixture(null);
    setScoringFixture(null);
    setLineupFixture(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'live':
        return <PlayIcon className="h-5 w-5 text-red-500" />;
      case 'completed':
        return <TrophyIcon className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <StopIcon className="h-5 w-5 text-gray-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  const filteredFixtures = fixtures.filter(fixture => {
    if (filters.status && fixture.status !== filters.status) {
      return false;
    }
    if (filters.teamId) {
      const teamId = parseInt(filters.teamId);
      if (fixture.home_team_id !== teamId && fixture.away_team_id !== teamId) {
        return false;
      }
    }
    if (filters.gameweekId) {
      const gameweekId = parseInt(filters.gameweekId);
      if (fixture.gameweek_id !== gameweekId) {
        return false;
      }
    }
    return true;
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getGameweekForFixture = (fixtureGameweekId?: number) => {
    if (!fixtureGameweekId) return null;
    return gameweeks.find(gw => gw.id === fixtureGameweekId);
  };

  const getLineupStatusIndicator = (fixtureId: number) => {
    const status = lineupStatuses[fixtureId];
    if (!status) return null;

    const { homeLineupReady, awayLineupReady, homeStarterCount, awayStarterCount } = status;

    if (homeLineupReady && awayLineupReady) {
      return (
        <div className="flex items-center">
          <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
          <span className="text-xs text-green-600 font-medium">Ready</span>
        </div>
      );
    } else if (homeStarterCount > 0 || awayStarterCount > 0) {
      return (
        <div className="flex items-center">
          <ExclamationCircleIcon className="h-4 w-4 text-yellow-500 mr-1" />
          <span className="text-xs text-yellow-600 font-medium">
            {homeStarterCount}/11 - {awayStarterCount}/11
          </span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center">
          <XCircleIcon className="h-4 w-4 text-red-500 mr-1" />
          <span className="text-xs text-red-600 font-medium">Not Set</span>
        </div>
      );
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
      <div className="relative overflow-hidden bg-gradient-to-br from-green-600 via-emerald-700 to-teal-800 rounded-2xl p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10"></div>
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <CalendarDaysIcon className="h-10 w-10 text-yellow-300" />
                <h1 className="text-4xl font-bold">Fixtures</h1>
              </div>
              <p className="text-green-100 text-lg mb-4">Manage match schedules, scores and live events</p>
              <div className="flex flex-wrap gap-3">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                  ⚽ {fixtures.length} Total Fixtures
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                  🔴 {fixtures.filter(f => f.status === 'live').length} Live
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                  ✅ {fixtures.filter(f => f.status === 'completed').length} Completed
                </Badge>
              </div>
            </div>
            <div className="mt-6 sm:mt-0">
              <Button
                onClick={() => setShowFixtureModal(true)}
                size="lg"
                className="bg-white text-green-600 hover:bg-gray-100 shadow-lg flex items-center"
                disabled={teams.length < 2}
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Schedule Match
              </Button>
            </div>
          </div>
        </div>
      </div>

      {teams.length < 2 && (
        <Card className="border-l-4 border-l-yellow-500 bg-yellow-50 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <ExclamationCircleIcon className="h-6 w-6 text-yellow-600 mr-3" />
              <p className="text-yellow-700 font-medium">
                You need at least two teams to schedule a match. Please create teams first.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2 text-gray-900">
            <FunnelIcon className="h-5 w-5 text-emerald-600" />
            <span>Filter Fixtures</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="">All Fixtures</option>
                <option value="scheduled">⏰ Scheduled</option>
                <option value="live">🔴 Live</option>
                <option value="completed">✅ Completed</option>
                <option value="cancelled">❌ Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Team
              </label>
              <select
                name="teamId"
                value={filters.teamId}
                onChange={handleFilterChange}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="">All Teams</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Gameweek
              </label>
              <select
                name="gameweekId"
                value={filters.gameweekId}
                onChange={handleFilterChange}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="">All Gameweeks</option>
                {gameweeks.map(gameweek => (
                  <option key={gameweek.id} value={gameweek.id}>
                    {gameweek.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fixtures List */}
      {filteredFixtures.length === 0 ? (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-white">
          <CardContent className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <CalendarDaysIcon className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {fixtures.length === 0 ? 'No fixtures scheduled' : 'No fixtures match your filters'}
            </h3>
            <p className="text-gray-600 mb-8 max-w-sm mx-auto">
              {fixtures.length === 0
                ? 'Schedule your first match to get started with live events'
                : 'Try adjusting your filters to find fixtures'
              }
            </p>
            {fixtures.length === 0 && teams.length >= 2 && (
              <Button
                onClick={() => setShowFixtureModal(true)}
                size="lg"
                className="shadow-lg"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Schedule Your First Match
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredFixtures.map((fixture, index) => {
            const { date, time } = formatDate(fixture.match_date);
            const gameweek = getGameweekForFixture(fixture.gameweek_id);

            const statusColors = {
              live: 'from-red-500 to-red-600',
              completed: 'from-green-500 to-green-600',
              scheduled: 'from-blue-500 to-blue-600',
              cancelled: 'from-gray-500 to-gray-600'
            };

            const statusColor = statusColors[fixture.status as keyof typeof statusColors] || statusColors.scheduled;

            return (
              <Card
                key={fixture.id}
                className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg overflow-hidden"
              >
                {/* Status Header */}
                <div className={`bg-gradient-to-r ${statusColor} p-4 text-white relative`}>
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(fixture.status)}
                      <Badge
                        variant="secondary"
                        className={`bg-white/20 text-white border-white/30 ${
                          fixture.status === 'live' ? 'animate-pulse' : ''
                        }`}
                      >
                        {fixture.status.charAt(0).toUpperCase() + fixture.status.slice(1)}
                      </Badge>
                    </div>
                    {gameweek && (
                      <Link to="/gameweeks">
                        <Badge
                          variant="secondary"
                          className="bg-white/20 text-white border-white/30 hover:bg-white/30 cursor-pointer"
                        >
                          🏆 {gameweek.name}
                        </Badge>
                      </Link>
                    )}
                  </div>
                </div>

                <CardContent className="p-4">
                  {/* Match Details */}
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-center">
                    {/* Home Team */}
                    <div className="lg:col-span-2 text-center lg:text-right">
                      <div className="flex items-center justify-center lg:justify-end space-x-3 mb-1">
                        {fixture.home_team.logo_url && (
                          <img
                            src={`http://localhost:8000${fixture.home_team.logo_url}`}
                            alt={`${fixture.home_team.name} logo`}
                            className="w-16 h-16 object-contain rounded-full border border-gray-200 bg-white"
                            onError={(e) => {
                              console.log('Failed to load home team logo:', fixture.home_team.name, fixture.home_team.logo_url);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                        <h3 className="text-lg font-bold text-gray-900">
                          {fixture.home_team.name}
                        </h3>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        🏠 Home
                      </Badge>
                    </div>

                    {/* Score & Time */}
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {fixture.home_score} - {fixture.away_score}
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div className="font-semibold">{date}</div>
                        <div className="flex items-center justify-center space-x-1">
                          <ClockIcon className="h-3 w-3" />
                          <span>{time}</span>
                        </div>
                        {fixture.venue && (
                          <div className="flex items-center justify-center space-x-1">
                            <MapPinIcon className="h-3 w-3" />
                            <span>{fixture.venue}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Away Team */}
                    <div className="lg:col-span-2 text-center lg:text-left">
                      <div className="flex items-center justify-center lg:justify-start space-x-3 mb-1">
                        <h3 className="text-lg font-bold text-gray-900">
                          {fixture.away_team.name}
                        </h3>
                        {fixture.away_team.logo_url && (
                          <img
                            src={`http://localhost:8000${fixture.away_team.logo_url}`}
                            alt={`${fixture.away_team.name} logo`}
                            className="w-16 h-16 object-contain rounded-full border border-gray-200 bg-white"
                            onError={(e) => {
                              console.log('Failed to load away team logo:', fixture.away_team.name, fixture.away_team.logo_url);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        ✈️ Away
                      </Badge>
                    </div>
                  </div>

                  {/* Lineup Status */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-center">
                      {getLineupStatusIndicator(fixture.id)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex flex-wrap gap-2 justify-center">
                      <Link to={`/match/${fixture.id}`}>
                        <Button size="sm" className="shadow-md">
                          <EyeIcon className="h-3 w-3 mr-1" />
                          Match Center
                        </Button>
                      </Link>

                      {(fixture.status === 'scheduled' || fixture.status === 'live') && (
                        <Button
                          onClick={() => openScoreModal(fixture)}
                          variant="secondary"
                          size="sm"
                          className="shadow-md"
                        >
                          <BoltIcon className="h-3 w-3 mr-1" />
                          Update Score
                        </Button>
                      )}

                      {fixture.status === 'live' && (
                        <Button
                          onClick={() => handleCompleteFixture(fixture.id)}
                          variant="default"
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white shadow-md"
                        >
                          <CheckCircleIcon className="h-3 w-3 mr-1" />
                          Complete Match
                        </Button>
                      )}

                      <Button
                        onClick={() => openLineupModal(fixture)}
                        variant="outline"
                        size="sm"
                        className="shadow-md"
                      >
                        👥 Lineups
                      </Button>

                      <Button
                        onClick={() => openEditModal(fixture)}
                        variant="ghost"
                        size="sm"
                        className="p-1.5"
                      >
                        <PencilIcon className="h-3 w-3" />
                      </Button>

                      <Button
                        onClick={() => handleDeleteFixture(fixture.id)}
                        variant="ghost"
                        size="sm"
                        className="p-1.5 hover:bg-red-50 hover:text-red-600"
                      >
                        <TrashIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Fixture Modal */}
      {showFixtureModal && (
        <FixtureModal
          fixture={editingFixture}
          teams={teams}
          gameweeks={gameweeks}
          onSave={editingFixture ? handleUpdateFixture : handleCreateFixture}
          onClose={closeModals}
        />
      )}

      {/* Score Modal */}
      {showScoreModal && scoringFixture && (
        <ScoreModal
          fixture={scoringFixture}
          onSave={handleUpdateScore}
          onClose={closeModals}
        />
      )}

      {/* Lineup Modal */}
      {showLineupModal && lineupFixture && (
        <LineupModal
          fixture={lineupFixture}
          onSave={async () => {
            await fetchData(); // This will refresh both fixtures and lineup statuses
          }}
          onClose={closeModals}
        />
      )}
    </div>
  );
};

export default Fixtures;