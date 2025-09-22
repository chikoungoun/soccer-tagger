import React, { useEffect, useState } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { playersApi, teamsApi } from '../utils/api';
import { Player, Team, CreatePlayerData } from '../types';
import PlayerModal from '../components/PlayerModal';

const Players: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
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

  const getTeamName = (teamId: number) => {
    const team = teams.find(t => t.id === teamId);
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
          <h1 className="text-2xl font-bold text-gray-900">Players</h1>
          <p className="text-gray-600">Manage all players across teams</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center"
          disabled={teams.length === 0}
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Player
        </button>
      </div>

      {teams.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-700">
            You need to create at least one team before adding players.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Players
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                className="field-input pl-10"
                placeholder="Search by name..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Team
            </label>
            <select
              name="teamId"
              value={filters.teamId}
              onChange={handleFilterChange}
              className="field-input"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Position
            </label>
            <select
              name="position"
              value={filters.position}
              onChange={handleFilterChange}
              className="field-input"
            >
              <option value="">All Positions</option>
              <option value="GK">Goalkeeper</option>
              <option value="DF">Defender</option>
              <option value="MF">Midfielder</option>
              <option value="FW">Forward</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="isActive"
              value={filters.isActive}
              onChange={handleFilterChange}
              className="field-input"
            >
              <option value="">All Players</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Players List */}
      {filteredPlayers.length === 0 ? (
        <div className="text-center py-12">
          <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {players.length === 0 ? 'No players yet' : 'No players match your filters'}
          </h3>
          <p className="text-gray-500 mb-4">
            {players.length === 0
              ? 'Add your first player to get started'
              : 'Try adjusting your search filters'
            }
          </p>
          {players.length === 0 && teams.length > 0 && (
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary"
            >
              Add Player
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredPlayers.map((player) => (
              <li key={player.id} className={`px-6 py-4 hover:bg-gray-50 ${
                player.position === 'GK' ? 'bg-blue-100/30' :
                player.position === 'DF' ? 'bg-yellow-100/30' :
                player.position === 'MF' ? 'bg-green-100/30' :
                player.position === 'FW' ? 'bg-red-100/30' :
                ''
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {player.photo_url ? (
                      <img
                        src={player.photo_url}
                        alt={player.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                        player.position === 'GK' ? 'bg-blue-200' :
                        player.position === 'DF' ? 'bg-yellow-200' :
                        player.position === 'MF' ? 'bg-green-200' :
                        player.position === 'FW' ? 'bg-red-200' :
                        'bg-gray-200'
                      }`}>
                        <UserIcon className={`h-6 w-6 ${
                          player.position === 'GK' ? 'text-blue-600' :
                          player.position === 'DF' ? 'text-yellow-600' :
                          player.position === 'MF' ? 'text-green-600' :
                          player.position === 'FW' ? 'text-red-600' :
                          'text-gray-500'
                        }`} />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{player.name}</h3>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPositionColor(player.position)}`}>
                          {getPositionName(player.position)}
                        </span>
                        <span className="text-sm text-gray-500">#{player.jersey_number}</span>
                        <span className="text-sm text-gray-500">{getTeamName(player.team_id)}</span>
                        {!player.is_active && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                            Inactive
                          </span>
                        )}
                      </div>
                      {(player.age || player.birth_date || player.nationality) && (
                        <div className="flex items-center space-x-2 mt-1 text-sm text-gray-600">
                          {player.birth_date ? (
                            <span>Born: {new Date(player.birth_date).toLocaleDateString()} ({new Date().getFullYear() - new Date(player.birth_date).getFullYear()} years old)</span>
                          ) : player.age ? (
                            <span>Age: {player.age}</span>
                          ) : null}
                          {(player.birth_date || player.age) && player.nationality && <span>•</span>}
                          {player.nationality && <span>{player.nationality}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openEditModal(player)}
                      className="p-2 text-gray-500 hover:text-soccer-green transition-colors"
                      title="Edit player"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeletePlayer(player.id)}
                      className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                      title="Delete player"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
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