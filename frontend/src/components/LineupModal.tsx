import React, { useState, useEffect } from 'react';
import { XMarkIcon, UserPlusIcon, UserMinusIcon } from '@heroicons/react/24/outline';
import { FixtureWithLineups, Player, TeamLineup, CreateLineupData } from '../types';
import { teamsApi, lineupsApi } from '../utils/api';

interface LineupModalProps {
  fixture: FixtureWithLineups;
  onSave: () => void;
  onClose: () => void;
}

const LineupModal: React.FC<LineupModalProps> = ({ fixture, onSave, onClose }) => {
  const [homeTeamPlayers, setHomeTeamPlayers] = useState<Player[]>([]);
  const [awayTeamPlayers, setAwayTeamPlayers] = useState<Player[]>([]);
  const [homeLineup, setHomeLineup] = useState<CreateLineupData[]>([]);
  const [awayLineup, setAwayLineup] = useState<CreateLineupData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTeamPlayers();
    initializeLineups();
  }, [fixture]);

  const fetchTeamPlayers = async () => {
    try {
      const [homeTeam, awayTeam] = await Promise.all([
        teamsApi.getById(fixture.home_team_id),
        teamsApi.getById(fixture.away_team_id)
      ]);
      setHomeTeamPlayers(homeTeam.players || []);
      setAwayTeamPlayers(awayTeam.players || []);
    } catch (error) {
      console.error('Error fetching team players:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeLineups = () => {
    // Convert existing lineups to CreateLineupData format
    if (fixture.home_lineup) {
      const homeLineupData = [
        ...fixture.home_lineup.starters.map(l => ({
          fixture_id: fixture.id,
          team_id: fixture.home_team_id,
          player_id: l.player_id,
          is_starter: true,
          position_played: l.position_played
        })),
        ...fixture.home_lineup.substitutes.map(l => ({
          fixture_id: fixture.id,
          team_id: fixture.home_team_id,
          player_id: l.player_id,
          is_starter: false,
          position_played: l.position_played
        }))
      ];
      setHomeLineup(homeLineupData);
    }

    if (fixture.away_lineup) {
      const awayLineupData = [
        ...fixture.away_lineup.starters.map(l => ({
          fixture_id: fixture.id,
          team_id: fixture.away_team_id,
          player_id: l.player_id,
          is_starter: true,
          position_played: l.position_played
        })),
        ...fixture.away_lineup.substitutes.map(l => ({
          fixture_id: fixture.id,
          team_id: fixture.away_team_id,
          player_id: l.player_id,
          is_starter: false,
          position_played: l.position_played
        }))
      ];
      setAwayLineup(awayLineupData);
    }
  };

  const addPlayerToLineup = (teamId: number, player: Player, isStarter: boolean) => {
    const lineupEntry: CreateLineupData = {
      fixture_id: fixture.id,
      team_id: teamId,
      player_id: player.id,
      is_starter: isStarter,
      position_played: player.position
    };

    if (teamId === fixture.home_team_id) {
      // Check starter limit
      const currentStarters = homeLineup.filter(l => l.is_starter).length;
      if (isStarter && currentStarters >= 11) {
        alert('Cannot add more than 11 starters');
        return;
      }
      setHomeLineup(prev => [...prev, lineupEntry]);
    } else {
      // Check starter limit
      const currentStarters = awayLineup.filter(l => l.is_starter).length;
      if (isStarter && currentStarters >= 11) {
        alert('Cannot add more than 11 starters');
        return;
      }
      setAwayLineup(prev => [...prev, lineupEntry]);
    }
  };

  const removePlayerFromLineup = (teamId: number, playerId: number) => {
    if (teamId === fixture.home_team_id) {
      setHomeLineup(prev => prev.filter(l => l.player_id !== playerId));
    } else {
      setAwayLineup(prev => prev.filter(l => l.player_id !== playerId));
    }
  };

  const togglePlayerStatus = (teamId: number, playerId: number) => {
    if (teamId === fixture.home_team_id) {
      setHomeLineup(prev => prev.map(l => {
        if (l.player_id === playerId) {
          // Check starter limit when promoting to starter
          if (!l.is_starter) {
            const currentStarters = prev.filter(p => p.is_starter && p.player_id !== playerId).length;
            if (currentStarters >= 11) {
              alert('Cannot have more than 11 starters');
              return l;
            }
          }
          return { ...l, is_starter: !l.is_starter };
        }
        return l;
      }));
    } else {
      setAwayLineup(prev => prev.map(l => {
        if (l.player_id === playerId) {
          // Check starter limit when promoting to starter
          if (!l.is_starter) {
            const currentStarters = prev.filter(p => p.is_starter && p.player_id !== playerId).length;
            if (currentStarters >= 11) {
              alert('Cannot have more than 11 starters');
              return l;
            }
          }
          return { ...l, is_starter: !l.is_starter };
        }
        return l;
      }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save both team lineups
      await Promise.all([
        lineupsApi.setTeamLineup(fixture.id, fixture.home_team_id, homeLineup),
        lineupsApi.setTeamLineup(fixture.id, fixture.away_team_id, awayLineup)
      ]);
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving lineups:', error);
      alert('Failed to save lineups. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const isPlayerInLineup = (teamId: number, playerId: number) => {
    const lineup = teamId === fixture.home_team_id ? homeLineup : awayLineup;
    return lineup.some(l => l.player_id === playerId);
  };

  const getPlayerLineupEntry = (teamId: number, playerId: number) => {
    const lineup = teamId === fixture.home_team_id ? homeLineup : awayLineup;
    return lineup.find(l => l.player_id === playerId);
  };

  const getAvailablePlayers = (teamId: number) => {
    const allPlayers = teamId === fixture.home_team_id ? homeTeamPlayers : awayTeamPlayers;
    return allPlayers.filter(p => !isPlayerInLineup(teamId, p.id));
  };

  const getLineupPlayers = (teamId: number, isStarter: boolean) => {
    const lineup = teamId === fixture.home_team_id ? homeLineup : awayLineup;
    const allPlayers = teamId === fixture.home_team_id ? homeTeamPlayers : awayTeamPlayers;

    return lineup
      .filter(l => l.is_starter === isStarter)
      .map(l => {
        const player = allPlayers.find(p => p.id === l.player_id);
        return { lineupEntry: l, player };
      })
      .filter(item => item.player);
  };

  const getPositionBackgroundColor = (position: string) => {
    switch (position) {
      case 'GK':
        return 'bg-blue-100/60';
      case 'DF':
        return 'bg-yellow-100/60';
      case 'MF':
        return 'bg-green-100/60';
      case 'FW':
        return 'bg-red-100/60';
      default:
        return 'bg-white';
    }
  };

  const getPositionBadgeColor = (position: string) => {
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

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-soccer-green"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            Manage Lineups: {fixture.home_team.name} vs {fixture.away_team.name}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Home Team */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">
              {fixture.home_team.name}
            </h4>

            {/* Starting XI */}
            <div>
              <h5 className="font-medium text-gray-700 mb-3">
                Starting XI ({getLineupPlayers(fixture.home_team_id, true).length}/11)
              </h5>
              <div className="space-y-2 min-h-[200px] bg-gray-50 p-3 rounded">
                {getLineupPlayers(fixture.home_team_id, true).map(({ lineupEntry, player }) => (
                  <div key={player!.id} className={`flex items-center justify-between p-2 rounded shadow-sm ${getPositionBackgroundColor(player!.position)}`}>
                    <div className="flex items-center space-x-3">
                      <span className="font-medium">#{player!.jersey_number}</span>
                      <div>
                        <p className="font-medium">{player!.name}</p>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getPositionBadgeColor(player!.position)}`}>
                          {player!.position}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => togglePlayerStatus(fixture.home_team_id, player!.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        To Bench
                      </button>
                      <button
                        onClick={() => removePlayerFromLineup(fixture.home_team_id, player!.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <UserMinusIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Substitutes */}
            <div>
              <h5 className="font-medium text-gray-700 mb-3">
                Substitutes ({getLineupPlayers(fixture.home_team_id, false).length})
              </h5>
              <div className="space-y-2 min-h-[150px] bg-gray-50 p-3 rounded">
                {getLineupPlayers(fixture.home_team_id, false).map(({ lineupEntry, player }) => (
                  <div key={player!.id} className={`flex items-center justify-between p-2 rounded shadow-sm ${getPositionBackgroundColor(player!.position)}`}>
                    <div className="flex items-center space-x-3">
                      <span className="font-medium">#{player!.jersey_number}</span>
                      <div>
                        <p className="font-medium">{player!.name}</p>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getPositionBadgeColor(player!.position)}`}>
                          {player!.position}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => togglePlayerStatus(fixture.home_team_id, player!.id)}
                        className="text-green-600 hover:text-green-800 text-sm"
                      >
                        To Starting XI
                      </button>
                      <button
                        onClick={() => removePlayerFromLineup(fixture.home_team_id, player!.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <UserMinusIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Available Players */}
            <div>
              <h5 className="font-medium text-gray-700 mb-3">Available Players</h5>
              <div className="space-y-2 max-h-48 overflow-y-auto bg-gray-50 p-3 rounded">
                {getAvailablePlayers(fixture.home_team_id).map(player => (
                  <div key={player.id} className={`flex items-center justify-between p-2 rounded shadow-sm ${getPositionBackgroundColor(player.position)}`}>
                    <div className="flex items-center space-x-3">
                      <span className="font-medium">#{player.jersey_number}</span>
                      <div>
                        <p className="font-medium">{player.name}</p>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getPositionBadgeColor(player.position)}`}>
                          {player.position}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => addPlayerToLineup(fixture.home_team_id, player, true)}
                        className="text-green-600 hover:text-green-800 text-sm"
                        title="Add to Starting XI"
                      >
                        Starter
                      </button>
                      <button
                        onClick={() => addPlayerToLineup(fixture.home_team_id, player, false)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                        title="Add to Substitutes"
                      >
                        Sub
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Away Team */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">
              {fixture.away_team.name}
            </h4>

            {/* Starting XI */}
            <div>
              <h5 className="font-medium text-gray-700 mb-3">
                Starting XI ({getLineupPlayers(fixture.away_team_id, true).length}/11)
              </h5>
              <div className="space-y-2 min-h-[200px] bg-gray-50 p-3 rounded">
                {getLineupPlayers(fixture.away_team_id, true).map(({ lineupEntry, player }) => (
                  <div key={player!.id} className={`flex items-center justify-between p-2 rounded shadow-sm ${getPositionBackgroundColor(player!.position)}`}>
                    <div className="flex items-center space-x-3">
                      <span className="font-medium">#{player!.jersey_number}</span>
                      <div>
                        <p className="font-medium">{player!.name}</p>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getPositionBadgeColor(player!.position)}`}>
                          {player!.position}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => togglePlayerStatus(fixture.away_team_id, player!.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        To Bench
                      </button>
                      <button
                        onClick={() => removePlayerFromLineup(fixture.away_team_id, player!.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <UserMinusIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Substitutes */}
            <div>
              <h5 className="font-medium text-gray-700 mb-3">
                Substitutes ({getLineupPlayers(fixture.away_team_id, false).length})
              </h5>
              <div className="space-y-2 min-h-[150px] bg-gray-50 p-3 rounded">
                {getLineupPlayers(fixture.away_team_id, false).map(({ lineupEntry, player }) => (
                  <div key={player!.id} className={`flex items-center justify-between p-2 rounded shadow-sm ${getPositionBackgroundColor(player!.position)}`}>
                    <div className="flex items-center space-x-3">
                      <span className="font-medium">#{player!.jersey_number}</span>
                      <div>
                        <p className="font-medium">{player!.name}</p>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getPositionBadgeColor(player!.position)}`}>
                          {player!.position}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => togglePlayerStatus(fixture.away_team_id, player!.id)}
                        className="text-green-600 hover:text-green-800 text-sm"
                      >
                        To Starting XI
                      </button>
                      <button
                        onClick={() => removePlayerFromLineup(fixture.away_team_id, player!.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <UserMinusIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Available Players */}
            <div>
              <h5 className="font-medium text-gray-700 mb-3">Available Players</h5>
              <div className="space-y-2 max-h-48 overflow-y-auto bg-gray-50 p-3 rounded">
                {getAvailablePlayers(fixture.away_team_id).map(player => (
                  <div key={player.id} className={`flex items-center justify-between p-2 rounded shadow-sm ${getPositionBackgroundColor(player.position)}`}>
                    <div className="flex items-center space-x-3">
                      <span className="font-medium">#{player.jersey_number}</span>
                      <div>
                        <p className="font-medium">{player.name}</p>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getPositionBadgeColor(player.position)}`}>
                          {player.position}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => addPlayerToLineup(fixture.away_team_id, player, true)}
                        className="text-green-600 hover:text-green-800 text-sm"
                        title="Add to Starting XI"
                      >
                        Starter
                      </button>
                      <button
                        onClick={() => addPlayerToLineup(fixture.away_team_id, player, false)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                        title="Add to Substitutes"
                      >
                        Sub
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 mt-8 pt-6 border-t">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn-primary"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Lineups'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LineupModal;