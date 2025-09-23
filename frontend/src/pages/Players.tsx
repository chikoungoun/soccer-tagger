import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  FireIcon,
  SparklesIcon,
  StarIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline';
import { playersApi, teamsApi } from '../utils/api';
import { Player, Team, CreatePlayerData } from '../types';
import PlayerModal from '../components/PlayerModal';
import { getImageUrl } from '../utils/imageUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const Players: React.FC = () => {
  const { t } = useTranslation();
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [filters, setFilters] = useState({
    search: '',
    teamId: '',
    position: '',
    isActive: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [playersData, teamsData] = await Promise.all([
        playersApi.getAll(),
        teamsApi.getAll()
      ]);
      setPlayers(playersData);
      setTeams(teamsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlayer = async (playerData: CreatePlayerData) => {
    try {
      await playersApi.create(playerData);
      fetchData();
      setShowModal(false);
    } catch (error: any) {
      console.error('Error creating player:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to create player';
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleUpdatePlayer = async (playerData: Partial<CreatePlayerData>) => {
    if (!editingPlayer) return;

    try {
      await playersApi.update(editingPlayer.id, playerData);
      fetchData();
      setShowModal(false);
      setEditingPlayer(null);
    } catch (error: any) {
      console.error('Error updating player:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to update player';
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleDeletePlayer = async (playerId: number) => {
    if (!confirm('Are you sure you want to delete this player?')) {
      return;
    }

    try {
      await playersApi.delete(playerId);
      fetchData();
    } catch (error) {
      console.error('Error deleting player:', error);
    }
  };

  const openEditModal = (player: Player) => {
    setEditingPlayer(player);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPlayer(null);
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    try {
      console.log('Starting player import for file:', file.name);

      const result = await playersApi.importCsv(file);
      console.log('Player import result:', result);
      setImportResult(result);

      // Always refresh players list to show any changes
      fetchData();

    } catch (error: any) {
      console.error('Error importing players CSV:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Unknown error occurred';
      alert(`Failed to import CSV file: ${errorMessage}`);
    } finally {
      setImporting(false);
      // Reset the file input
      event.target.value = '';
    }
  };

  const getTeamData = (teamId: number) => {
    return teams.find(t => t.id === teamId) || null;
  };

  const getTeamName = (teamId: number) => {
    const team = getTeamData(teamId);
    return team ? team.name : 'Unknown Team';
  };

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'GK':
        return 'bg-blue-100 text-blue-800';
      case 'DF':
        return 'bg-yellow-100 text-yellow-800';
      case 'MF':
        return 'bg-green-100 text-green-800';
      case 'FW':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPositionName = (position: string) => {
    switch (position) {
      case 'GK':
        return 'Goalkeeper';
      case 'DF':
        return 'Defender';
      case 'MF':
        return 'Midfielder';
      case 'FW':
        return 'Forward';
      default:
        return position;
    }
  };

  const filteredPlayers = players.filter(player => {
    if (filters.search && !player.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.teamId && player.team_id !== parseInt(filters.teamId)) {
      return false;
    }
    if (filters.position && player.position !== filters.position) {
      return false;
    }
    if (filters.isActive !== '' && player.is_active !== (filters.isActive === 'true')) {
      return false;
    }
    return true;
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="relative">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-soccer-green"></div>
          <UserIcon className="h-12 w-12 text-soccer-green absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-green-800 rounded-2xl p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10"></div>
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <UserIcon className="h-10 w-10 text-yellow-300" />
                <h1 className="text-4xl font-bold">{t('players.title')}</h1>
              </div>
              <p className="text-emerald-100 text-lg mb-4">Manage all players across your teams</p>
              <div className="flex flex-wrap gap-3">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                  {players.length} Total Players
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                  {players.filter(p => p.is_active).length} Active
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                  {teams.length} Teams
                </Badge>
              </div>
            </div>
            <div className="mt-6 sm:mt-0 flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileImport}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={importing || teams.length === 0}
                />
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white/10 text-white border-white/30 hover:bg-white/20 shadow-lg flex items-center"
                  disabled={importing || teams.length === 0}
                >
                  <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
                  {importing ? t('players.importing') : t('players.import')}
                </Button>
              </div>
              <Button
                onClick={() => setShowModal(true)}
                size="lg"
                className="bg-white text-emerald-600 hover:bg-gray-100 shadow-lg flex items-center"
                disabled={teams.length === 0}
              >
                <PlusIcon className="h-5 w-5 mr-2" />
{t('players.addNew')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Import Result */}
      {importResult && (
        <Card className="border-l-4 border-l-green-500 bg-green-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  CSV Import Results
                </h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {importResult.summary.imported}
                    </div>
                    <div className="text-sm text-green-700">Imported</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {importResult.summary.skipped}
                    </div>
                    <div className="text-sm text-yellow-700">Skipped</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {importResult.summary.failed}
                    </div>
                    <div className="text-sm text-red-700">Failed</div>
                  </div>
                </div>

                {importResult.details.imported_players.length > 0 && (
                  <div className="mb-3">
                    <h4 className="font-medium text-green-800 mb-1">Successfully Imported:</h4>
                    <div className="text-sm text-green-700">
                      {importResult.details.imported_players.map((player: any) =>
                        `${player.name} (#${player.jersey_number}, ${player.team})`
                      ).join(', ')}
                    </div>
                  </div>
                )}

                {importResult.details.skipped_players.length > 0 && (
                  <div className="mb-3">
                    <h4 className="font-medium text-yellow-800 mb-1">Skipped (Already Exist):</h4>
                    <div className="text-sm text-yellow-700">
                      {importResult.details.skipped_players.map((player: any) => player.reason).join(', ')}
                    </div>
                  </div>
                )}

                {importResult.details.failed_players.length > 0 && (
                  <div className="mb-3">
                    <h4 className="font-medium text-red-800 mb-1">Failed:</h4>
                    <div className="text-sm text-red-700">
                      {importResult.details.failed_players.map((player: any) => `Row ${player.row}: ${player.error}`).join(', ')}
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => setImportResult(null)}
                className="text-green-600 hover:text-green-800"
              >
                ✕
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {teams.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-700">
            You need to create at least one team before adding players.
          </p>
        </div>
      )}

      {/* Filters */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/30">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-lg">Filters</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Players
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  className="pl-10"
                  placeholder="Search by name..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team
              </label>
              <select
                name="teamId"
                value={filters.teamId}
                onChange={handleFilterChange}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Position
              </label>
              <select
                name="position"
                value={filters.position}
                onChange={handleFilterChange}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">All Positions</option>
                <option value="GK">🧤 Goalkeeper</option>
                <option value="DF">🛡️ Defender</option>
                <option value="MF">⚡ Midfielder</option>
                <option value="FW">⚽ Forward</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                name="isActive"
                value={filters.isActive}
                onChange={handleFilterChange}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">All Players</option>
                <option value="true">✅ Active Only</option>
                <option value="false">⏸️ Inactive Only</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Players List */}
      {filteredPlayers.length === 0 ? (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-white">
          <CardContent className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <UserIcon className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {players.length === 0 ? 'No players yet' : 'No players match your filters'}
            </h3>
            <p className="text-gray-600 mb-8 max-w-sm mx-auto">
              {players.length === 0
                ? 'Add your first player to get started building your squad'
                : 'Try adjusting your search filters to find players'
              }
            </p>
            {players.length === 0 && teams.length > 0 && (
              <Button
                onClick={() => setShowModal(true)}
                size="lg"
                className="shadow-lg"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Your First Player
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="divide-y divide-gray-100">
            {filteredPlayers.map((player, index) => {
              const positionGradients = {
                'GK': 'from-blue-50 to-blue-100/50',
                'DF': 'from-yellow-50 to-yellow-100/50',
                'MF': 'from-emerald-50 to-emerald-100/50',
                'FW': 'from-red-50 to-red-100/50'
              };
              const positionColors = {
                'GK': 'bg-blue-500',
                'DF': 'bg-yellow-500',
                'MF': 'bg-emerald-500',
                'FW': 'bg-red-500'
              };

              return (
                <div
                  key={player.id}
                  className={`px-6 py-5 hover:shadow-md transition-all duration-200 bg-gradient-to-r ${positionGradients[player.position as keyof typeof positionGradients] || 'from-gray-50 to-gray-100/50'} group hover:scale-[1.005] hover:z-10 relative`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Player Photo/Icon */}
                      <div className="relative">
                        {player.photo_url ? (
                          <img
                            src={getImageUrl(player.photo_url)}
                            alt={player.name}
                            className="h-16 w-16 rounded-full object-cover border-4 border-white shadow-md"
                          />
                        ) : (
                          <div className={`h-16 w-16 rounded-full flex items-center justify-center ${positionColors[player.position as keyof typeof positionColors] || 'bg-gray-500'} shadow-md`}>
                            <UserIcon className="h-8 w-8 text-white" />
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md">
                          <span className="text-xs font-bold text-gray-700">#{player.jersey_number}</span>
                        </div>
                      </div>

                      {/* Player Info */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                            {player.name}
                          </h3>
                          {player.is_active ? (
                            <Badge variant="success" className="text-xs">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              Inactive
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mt-2">
                          <Badge
                            className={`
                              ${player.position === 'GK' ? 'bg-blue-500 hover:bg-blue-600' : ''}
                              ${player.position === 'DF' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
                              ${player.position === 'MF' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                              ${player.position === 'FW' ? 'bg-red-500 hover:bg-red-600' : ''}
                              text-white border-0
                            `}
                          >
                            {player.position === 'GK' && '🧤'}
                            {player.position === 'DF' && '🛡️'}
                            {player.position === 'MF' && '⚡'}
                            {player.position === 'FW' && '⚽'}
                            {getPositionName(player.position)}
                          </Badge>

                          <Badge variant="outline" className="text-xs flex items-center space-x-2">
                            {(() => {
                              const team = getTeamData(player.team_id);
                              return (
                                <>
                                  {team?.logo_url ? (
                                    <img
                                      src={getImageUrl(team.logo_url)}
                                      alt={`${team.name} logo`}
                                      className="h-4 w-4 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="h-4 w-4 rounded-full bg-gray-400 flex items-center justify-center">
                                      <span className="text-[8px] text-white font-bold">
                                        {team?.name.substring(0, 2).toUpperCase() || '??'}
                                      </span>
                                    </div>
                                  )}
                                  <span>{getTeamName(player.team_id)}</span>
                                </>
                              );
                            })()}
                          </Badge>

                          {player.birth_date && (
                            <Badge variant="outline" className="text-xs">
                              🎂 {new Date().getFullYear() - new Date(player.birth_date).getFullYear()} years
                            </Badge>
                          )}

                          {player.nationality && (
                            <Badge variant="outline" className="text-xs">
                              🌍 {player.nationality}
                            </Badge>
                          )}
                        </div>

                        {/* Stats Preview */}
                        <div className="flex items-center space-x-4 mt-3 text-sm">
                          <div className="flex items-center space-x-1">
                            <StarIcon className="h-4 w-4 text-yellow-500" />
                            <span className="font-medium text-gray-700">Rating: 85</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <FireIcon className="h-4 w-4 text-orange-500" />
                            <span className="font-medium text-gray-700">Form: Good</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => openEditModal(player)}
                        variant="ghost"
                        size="sm"
                        className="text-gray-600 hover:text-emerald-600 hover:bg-emerald-100"
                        title="Edit player"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </Button>
                      <Button
                        onClick={() => handleDeletePlayer(player.id)}
                        variant="ghost"
                        size="sm"
                        className="text-gray-600 hover:text-red-600 hover:bg-red-100"
                        title="Delete player"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Player Modal */}
      {showModal && (
        <PlayerModal
          player={editingPlayer}
          teams={teams}
          onSave={editingPlayer ? handleUpdatePlayer : handleCreatePlayer}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default Players;