import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import { teamsApi } from '../utils/api';
import { Team, CreateTeamData } from '../types';
import TeamModal from '../components/TeamModal';

const Teams: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const data = await teamsApi.getAll();
      setTeams(data);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (teamData: CreateTeamData) => {
    try {
      await teamsApi.create(teamData);
      fetchTeams();
      setShowModal(false);
    } catch (error) {
      console.error('Error creating team:', error);
    }
  };

  const handleUpdateTeam = async (teamData: Partial<CreateTeamData>) => {
    if (!editingTeam) return;

    try {
      await teamsApi.update(editingTeam.id, teamData);
      fetchTeams();
      setShowModal(false);
      setEditingTeam(null);
    } catch (error) {
      console.error('Error updating team:', error);
    }
  };

  const handleDeleteTeam = async (teamId: number) => {
    if (!confirm('Are you sure you want to delete this team? This will also delete all associated players.')) {
      return;
    }

    try {
      await teamsApi.delete(teamId);
      fetchTeams();
    } catch (error) {
      console.error('Error deleting team:', error);
    }
  };

  const openEditModal = (team: Team) => {
    setEditingTeam(team);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTeam(null);
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
          <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
          <p className="text-gray-600">Manage your soccer teams</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Team
        </button>
      </div>

      {/* Teams Grid */}
      {teams.length === 0 ? (
        <div className="text-center py-12">
          <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No teams yet</h3>
          <p className="text-gray-500 mb-4">Get started by creating your first team</p>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary"
          >
            Create Team
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <div key={team.id} className="card hover:shadow-lg transition-shadow duration-200">
              {/* Team Logo/Header */}
              <div className="text-center mb-4">
                {team.logo_url ? (
                  <img
                    src={team.logo_url}
                    alt={`${team.name} logo`}
                    className="h-16 w-16 mx-auto rounded-full object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 mx-auto bg-soccer-green rounded-full flex items-center justify-center">
                    <UserGroupIcon className="h-8 w-8 text-white" />
                  </div>
                )}
                <h3 className="text-lg font-semibold text-gray-900 mt-3">{team.name}</h3>
                {team.stadium && (
                  <p className="text-sm text-gray-500">{team.stadium}</p>
                )}
              </div>

              {/* Team Info */}
              <div className="space-y-2 mb-4">
                {team.founded_year && (
                  <p className="text-sm text-gray-600">
                    <strong>Founded:</strong> {team.founded_year}
                  </p>
                )}
                {team.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{team.description}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <button
                    onClick={() => openEditModal(team)}
                    className="p-2 text-gray-500 hover:text-soccer-green transition-colors"
                    title="Edit team"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTeam(team.id)}
                    className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                    title="Delete team"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
                <Link
                  to={`/teams/${team.id}`}
                  className="text-sm btn-primary"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Team Modal */}
      {showModal && (
        <TeamModal
          team={editingTeam}
          onSave={editingTeam ? handleUpdateTeam : handleCreateTeam}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default Teams;