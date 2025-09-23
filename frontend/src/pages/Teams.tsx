import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  MapPinIcon,
  TrophyIcon,
  ChevronRightIcon,
  SparklesIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline';
import { teamsApi } from '../utils/api';
import { Team, CreateTeamData } from '../types';
import TeamModal from '../components/TeamModal';
import { getImageUrl } from '../utils/imageUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getTeamGradientStyle, getTeamAccentColor } from '../utils/colorUtils';

const Teams: React.FC = () => {
  const { t } = useTranslation();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

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

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    try {
      console.log('Starting import for file:', file.name);

      const result = await teamsApi.importCsv(file);
      console.log('Import result:', result);
      setImportResult(result);

      // Always refresh teams list to show any changes
      fetchTeams();

    } catch (error: any) {
      console.error('Error importing CSV:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Unknown error occurred';
      alert(`Failed to import CSV file: ${errorMessage}`);
    } finally {
      setImporting(false);
      // Reset the file input
      event.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="relative">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-soccer-green"></div>
          <TrophyIcon className="h-12 w-12 text-soccer-green absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10"></div>
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <UserGroupIcon className="h-10 w-10 text-yellow-300" />
                <h1 className="text-4xl font-bold">{t('teams.title')}</h1>
              </div>
              <p className="text-blue-100 text-lg mb-4">Manage your soccer teams and their rosters</p>
              <div className="flex flex-wrap gap-3">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                  {teams.length} Teams
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                  Active Season
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
                  disabled={importing}
                />
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white/10 text-white border-white/30 hover:bg-white/20 shadow-lg flex items-center"
                  disabled={importing}
                >
                  <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
                  {importing ? t('teams.importing') : t('teams.import')}
                </Button>
              </div>
              <Button
                onClick={() => setShowModal(true)}
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 shadow-lg flex items-center"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
{t('teams.addNew')}
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

                {importResult.details.imported_teams.length > 0 && (
                  <div className="mb-3">
                    <h4 className="font-medium text-green-800 mb-1">Successfully Imported:</h4>
                    <div className="text-sm text-green-700">
                      {importResult.details.imported_teams.map((team: any) => team.name).join(', ')}
                    </div>
                  </div>
                )}

                {importResult.details.skipped_teams.length > 0 && (
                  <div className="mb-3">
                    <h4 className="font-medium text-yellow-800 mb-1">Skipped (Already Exist):</h4>
                    <div className="text-sm text-yellow-700">
                      {importResult.details.skipped_teams.map((team: any) => team.reason).join(', ')}
                    </div>
                  </div>
                )}

                {importResult.details.failed_teams.length > 0 && (
                  <div className="mb-3">
                    <h4 className="font-medium text-red-800 mb-1">Failed:</h4>
                    <div className="text-sm text-red-700">
                      {importResult.details.failed_teams.map((team: any) => `Row ${team.row}: ${team.error}`).join(', ')}
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

      {/* Teams Grid */}
      {teams.length === 0 ? (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-white">
          <CardContent className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <UserGroupIcon className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No teams yet</h3>
            <p className="text-gray-600 mb-8 max-w-sm mx-auto">Get started by creating your first team to begin managing your soccer squad</p>
            <Button
              onClick={() => setShowModal(true)}
              size="lg"
              className="shadow-lg"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Your First Team
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {teams.map((team, index) => {
            // Use team colors if available, otherwise fall back to default gradients
            const fallbackGradients = [
              'from-blue-500 via-blue-600 to-indigo-700',
              'from-emerald-500 via-emerald-600 to-teal-700',
              'from-purple-500 via-purple-600 to-pink-700',
              'from-orange-500 via-orange-600 to-red-700',
              'from-cyan-500 via-cyan-600 to-blue-700',
              'from-rose-500 via-rose-600 to-pink-700',
              'from-indigo-500 via-indigo-600 to-purple-700',
              'from-teal-500 via-teal-600 to-emerald-700'
            ];
            const fallbackGradient = fallbackGradients[index % fallbackGradients.length];

            // Use team colors if both primary and secondary are defined
            const hasTeamColors = team.primary_color && team.secondary_color;
            const teamGradientStyle = hasTeamColors ? getTeamGradientStyle(team, 'to bottom right') : null;

            return (
              <Card
                key={team.id}
                className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg overflow-hidden"
              >
                {/* Team Header with Dynamic Gradient */}
                <div
                  className={hasTeamColors ? "p-6 text-white relative" : `bg-gradient-to-br ${fallbackGradient} p-6 text-white relative`}
                  style={teamGradientStyle || undefined}
                >
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      {team.logo_url ? (
                        <img
                          src={getImageUrl(team.logo_url)}
                          alt={`${team.name} logo`}
                          className="h-16 w-16 rounded-full object-cover border-4 border-white/30 shadow-lg"
                        />
                      ) : (
                        <div className="h-16 w-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/30 shadow-lg">
                          <UserGroupIcon className="h-8 w-8 text-white" />
                        </div>
                      )}
                      <div className="flex space-x-1">
                        <button
                          onClick={() => openEditModal(team)}
                          className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-all duration-200"
                          title={t('teams.editTeam')}
                        >
                          <PencilIcon className="h-4 w-4 text-white" />
                        </button>
                        <button
                          onClick={() => handleDeleteTeam(team.id)}
                          className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-red-500/50 transition-all duration-200"
                          title={t('teams.deleteTeam')}
                        >
                          <TrashIcon className="h-4 w-4 text-white" />
                        </button>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-2">{team.name}</h3>
                    {team.stadium && (
                      <div className="flex items-center text-white/90 text-sm">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        <span>{team.stadium}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Team Content */}
                <CardContent
                  className="p-6 border-t-4"
                  style={{
                    borderTopColor: hasTeamColors ? team.primary_color : '#e5e7eb',
                    backgroundColor: hasTeamColors ? getTeamAccentColor(team, 0.02) : undefined
                  }}
                >
                  <div className="space-y-3 mb-6">
                    {team.founded_year && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Founded</span>
                        <Badge variant="outline" className="font-semibold">
                          {team.founded_year}
                        </Badge>
                      </div>
                    )}
                    {team.description && (
                      <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                        {team.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {hasTeamColors && (
                        <div className="flex items-center gap-1 bg-gray-100 rounded-full px-2 py-1">
                          <div
                            className="w-3 h-3 rounded-full border border-gray-300"
                            style={{ backgroundColor: team.primary_color }}
                          ></div>
                          <div
                            className="w-3 h-3 rounded-full border border-gray-300"
                            style={{ backgroundColor: team.secondary_color }}
                          ></div>
                          <span className="text-xs text-gray-600 ml-1">Team Colors</span>
                        </div>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        <TrophyIcon className="h-3 w-3 mr-1" />
                        Professional
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        <CalendarDaysIcon className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                  </div>

                  {/* View Details Button */}
                  <Link to={`/teams/${team.id}`} className="block">
                    <Button
                      variant="default"
                      className="w-full group-hover:shadow-md transition-all duration-200"
                    >
{t('teams.viewDetails')}
                      <ChevronRightIcon className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
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