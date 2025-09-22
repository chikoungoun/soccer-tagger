import React, { useState, useEffect } from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';
import { eventsApi } from '../utils/api';

interface PlayerMinute {
  player_id: number;
  player_name: string;
  player_position: string;
  is_starter: boolean;
  position_played: string | null;
  minutes_played: number;
  team_id: number;
}

interface PlayerMinutesProps {
  fixtureId: number;
  homeTeamId: number;
  awayTeamId: number;
  refreshTrigger?: number;
}

const PlayerMinutes: React.FC<PlayerMinutesProps> = ({
  fixtureId,
  homeTeamId,
  awayTeamId,
  refreshTrigger
}) => {
  const [playerMinutes, setPlayerMinutes] = useState<PlayerMinute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlayerMinutes();
  }, [fixtureId, refreshTrigger]);

  const fetchPlayerMinutes = async () => {
    try {
      const data = await eventsApi.getPlayerMinutes(fixtureId);
      setPlayerMinutes(data);
    } catch (error) {
      console.error('Error fetching player minutes:', error);
    } finally {
      setLoading(false);
    }
  };

  const homeTeamPlayers = playerMinutes.filter(p => p.team_id === homeTeamId);
  const awayTeamPlayers = playerMinutes.filter(p => p.team_id === awayTeamId);

  const formatMinutes = (minutes: number) => {
    if (minutes === 0) return '0\'';
    return `${minutes}'`;
  };

  const getMinutesColor = (minutes: number, isStarter: boolean) => {
    if (minutes === 0) return 'text-gray-400';
    if (isStarter && minutes >= 45) return 'text-green-600';
    if (!isStarter && minutes > 0) return 'text-blue-600';
    return 'text-orange-600';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <ClockIcon className="h-5 w-5 mr-2" />
          Player Minutes
        </h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-soccer-green"></div>
        </div>
      </div>
    );
  }

  const renderTeamMinutes = (players: PlayerMinute[], teamName: string) => (
    <div className="mb-6">
      <h4 className="font-medium text-gray-900 mb-3">{teamName}</h4>
      <div className="space-y-2">
        {players
          .sort((a, b) => b.minutes_played - a.minutes_played)
          .map((player) => (
            <div
              key={player.player_id}
              className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">
                    {player.player_name}
                  </span>
                  <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                    {player.position_played || player.player_position}
                  </span>
                  {player.is_starter && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Starter
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <ClockIcon className="h-4 w-4 text-gray-400" />
                <span className={`font-bold ${getMinutesColor(player.minutes_played, player.is_starter)}`}>
                  {formatMinutes(player.minutes_played)}
                </span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <ClockIcon className="h-5 w-5 mr-2" />
        Player Minutes
      </h3>

      {playerMinutes.length === 0 ? (
        <div className="text-center py-8">
          <ClockIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-600">No lineup data available</p>
        </div>
      ) : (
        <div>
          {homeTeamPlayers.length > 0 && renderTeamMinutes(homeTeamPlayers, "Home Team")}
          {awayTeamPlayers.length > 0 && renderTeamMinutes(awayTeamPlayers, "Away Team")}
        </div>
      )}
    </div>
  );
};

export default PlayerMinutes;