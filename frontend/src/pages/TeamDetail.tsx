import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  ShieldCheckIcon,
  BoltIcon,
  FireIcon,
  ArrowsRightLeftIcon
} from '@heroicons/react/24/outline';
import { teamsApi, playersApi } from '../utils/api';
import { TeamWithPlayers, Player, CreatePlayerData, Team } from '../types';
import PlayerModal from '../components/PlayerModal';
import { getImageUrl } from '../utils/imageUtils';

const TeamDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [team, setTeam] = useState<TeamWithPlayers | null>(null);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [isTransferMode, setIsTransferMode] = useState(false);

  useEffect(() => {
    if (id) {
      fetchData(parseInt(id));
    }
  }, [id]);

  const fetchData = async (teamId: number) => {
    try {
      const [teamData, teamsData] = await Promise.all([
        teamsApi.getById(teamId),
        teamsApi.getAll()
      ]);
      setTeam(teamData);
      setAllTeams(teamsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeam = async (teamId: number) => {
    try {
      const data = await teamsApi.getById(teamId);
      setTeam(data);
    } catch (error) {
      console.error('Error fetching team:', error);
    }
  };

  const handleCreatePlayer = async (playerData: CreatePlayerData) => {
    try {
      await playersApi.create({ ...playerData, team_id: parseInt(id!) });
      fetchTeam(parseInt(id!));
      setShowPlayerModal(false);
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
      fetchTeam(parseInt(id!));
      setShowPlayerModal(false);
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
      fetchTeam(parseInt(id!));
    } catch (error) {
      console.error('Error deleting player:', error);
    }
  };

  const openEditPlayerModal = (player: Player) => {
    setEditingPlayer(player);
    setIsTransferMode(false);
    setShowPlayerModal(true);
  };

  const openTransferModal = (player: Player) => {
    setEditingPlayer(player);
    setIsTransferMode(true);
    setShowPlayerModal(true);
  };

  const closePlayerModal = () => {
    setShowPlayerModal(false);
    setEditingPlayer(null);
    setIsTransferMode(false);
  };

  const getPositionIcon = (position: string) => {
    switch (position) {
      case 'GK':
        return <ShieldCheckIcon className="h-5 w-5" />;
      case 'DF':
        return <ShieldCheckIcon className="h-5 w-5" />;
      case 'MF':
        return <BoltIcon className="h-5 w-5" />;
      case 'FW':
        return <FireIcon className="h-5 w-5" />;
      default:
        return <UserIcon className="h-5 w-5" />;
    }
  };

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'GK':
        return 'bg-yellow-100 text-yellow-800';
      case 'DF':
        return 'bg-blue-100 text-blue-800';
      case 'MF':
        return 'bg-green-100 text-green-800';
      case 'FW':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const groupPlayersByPosition = (players: Player[]) => {
    return players.reduce((groups, player) => {
      if (!groups[player.position]) {
        groups[player.position] = [];
      }
      groups[player.position].push(player);
      return groups;
    }, {} as Record<string, Player[]>);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-soccer-green"></div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-medium text-gray-900">Team not found</h2>
        <Link to="/teams" className="btn-primary mt-4 inline-block">
          Back to Teams
        </Link>
      </div>
    );
  }

  const playersByPosition = groupPlayersByPosition(team.players);
  const positionOrder = ['GK', 'DF', 'MF', 'FW'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link to="/teams" className="text-gray-500 hover:text-gray-700">
          <ArrowLeftIcon className="h-6 w-6" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
          <p className="text-gray-600">Team Details</p>
        </div>
      </div>

      {/* Team Info Card */}
      <div className="card">
        <div className="flex items-start space-x-6">
          {team.logo_url ? (
            <img
              src={getImageUrl(team.logo_url)}
              alt={`${team.name} logo`}
              className="h-24 w-24 rounded-full object-cover"
            />
          ) : (
            <div className="h-24 w-24 bg-soccer-green rounded-full flex items-center justify-center">
              <UserIcon className="h-12 w-12 text-white" />
            </div>
          )}
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Team Name</h3>
                <p className="text-lg font-semibold text-gray-900">{team.name}</p>
              </div>
              {team.founded_year && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Founded</h3>
                  <p className="text-lg font-semibold text-gray-900">{team.founded_year}</p>
                </div>
              )}
              {team.stadium && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Stadium</h3>
                  <p className="text-lg font-semibold text-gray-900">{team.stadium}</p>
                </div>
              )}
            </div>
            {team.description && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-500">Description</h3>
                <p className="text-gray-900 mt-1">{team.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Players Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Squad ({team.players.length} players)
          </h2>
          <button
            onClick={() => setShowPlayerModal(true)}
            className="btn-primary flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Player
          </button>
        </div>

        {team.players.length === 0 ? (
          <div className="text-center py-12">
            <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No players yet</h3>
            <p className="text-gray-500 mb-4">Add your first player to get started</p>
            <button
              onClick={() => setShowPlayerModal(true)}
              className="btn-primary"
            >
              Add Player
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {positionOrder.map((position) => {
              const players = playersByPosition[position] || [];
              if (players.length === 0) return null;

              return (
                <div key={position}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    {getPositionIcon(position)}
                    <span className="ml-2">
                      {position === 'GK' && 'Goalkeepers'}
                      {position === 'DF' && 'Defenders'}
                      {position === 'MF' && 'Midfielders'}
                      {position === 'FW' && 'Forwards'}
                    </span>
                    <span className="ml-2 text-sm text-gray-500">({players.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {players.map((player) => (
                      <div
                        key={player.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            {player.photo_url ? (
                              <img
                                src={getImageUrl(player.photo_url)}
                                alt={player.name}
                                className="h-12 w-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
                                <UserIcon className="h-6 w-6 text-gray-500" />
                              </div>
                            )}
                            <div>
                              <h4 className="font-semibold text-gray-900">{player.name}</h4>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPositionColor(player.position)}`}>
                                  {player.position}
                                </span>
                                <span className="text-sm text-gray-500">#{player.jersey_number}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => openEditPlayerModal(player)}
                              className="p-1 text-gray-500 hover:text-soccer-green"
                              title="Edit player"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openTransferModal(player)}
                              className="p-1 text-gray-500 hover:text-blue-500"
                              title="Transfer player"
                            >
                              <ArrowsRightLeftIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePlayer(player.id)}
                              className="p-1 text-gray-500 hover:text-red-500"
                              title="Delete player"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        {(player.age || player.nationality) && (
                          <div className="mt-3 text-sm text-gray-600">
                            {player.age && <span>Age: {player.age}</span>}
                            {player.age && player.nationality && <span> • </span>}
                            {player.nationality && <span>{player.nationality}</span>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Player Modal */}
      {showPlayerModal && (
        <PlayerModal
          player={editingPlayer}
          teamId={!isTransferMode ? parseInt(id!) : undefined}
          teams={isTransferMode ? allTeams : undefined}
          onSave={editingPlayer ? handleUpdatePlayer : handleCreatePlayer}
          onClose={closePlayerModal}
        />
      )}
    </div>
  );
};

export default TeamDetail;