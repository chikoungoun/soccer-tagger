import React, { useState, useEffect } from 'react';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { TeamLineup, Player } from '../types';
import { eventsApi } from '../utils/api';

const FORMATIONS = [
  {
    name: '4-4-2',
    value: '442',
    positions: {
      GK: [{ x: 50, y: 90 }],
      DF: [{ x: 20, y: 75 }, { x: 40, y: 75 }, { x: 60, y: 75 }, { x: 80, y: 75 }],
      MF: [{ x: 20, y: 50 }, { x: 40, y: 50 }, { x: 60, y: 50 }, { x: 80, y: 50 }],
      FW: [{ x: 40, y: 25 }, { x: 60, y: 25 }]
    }
  },
  {
    name: '4-3-3',
    value: '433',
    positions: {
      GK: [{ x: 50, y: 90 }],
      DF: [{ x: 20, y: 75 }, { x: 40, y: 75 }, { x: 60, y: 75 }, { x: 80, y: 75 }],
      MF: [{ x: 30, y: 55 }, { x: 50, y: 55 }, { x: 70, y: 55 }],
      FW: [{ x: 25, y: 25 }, { x: 50, y: 25 }, { x: 75, y: 25 }]
    }
  },
  {
    name: '3-5-2',
    value: '352',
    positions: {
      GK: [{ x: 50, y: 90 }],
      DF: [{ x: 30, y: 75 }, { x: 50, y: 75 }, { x: 70, y: 75 }],
      MF: [{ x: 15, y: 55 }, { x: 35, y: 50 }, { x: 50, y: 50 }, { x: 65, y: 50 }, { x: 85, y: 55 }],
      FW: [{ x: 40, y: 25 }, { x: 60, y: 25 }]
    }
  },
  {
    name: '4-2-3-1',
    value: '4231',
    positions: {
      GK: [{ x: 50, y: 90 }],
      DF: [{ x: 20, y: 75 }, { x: 40, y: 75 }, { x: 60, y: 75 }, { x: 80, y: 75 }],
      MF: [{ x: 40, y: 60 }, { x: 60, y: 60 }, { x: 25, y: 40 }, { x: 50, y: 40 }, { x: 75, y: 40 }],
      FW: [{ x: 50, y: 20 }]
    }
  },
  {
    name: '3-4-3',
    value: '343',
    positions: {
      GK: [{ x: 50, y: 90 }],
      DF: [{ x: 30, y: 75 }, { x: 50, y: 75 }, { x: 70, y: 75 }],
      MF: [{ x: 20, y: 55 }, { x: 40, y: 55 }, { x: 60, y: 55 }, { x: 80, y: 55 }],
      FW: [{ x: 30, y: 25 }, { x: 50, y: 25 }, { x: 70, y: 25 }]
    }
  }
];

interface FormationPitchProps {
  homeTeamLineup: TeamLineup | null;
  awayTeamLineup: TeamLineup | null;
  fixtureId?: number;
}

const FormationPitch: React.FC<FormationPitchProps> = ({
  homeTeamLineup,
  awayTeamLineup,
  fixtureId
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [redCardPlayers, setRedCardPlayers] = useState<Set<number>>(new Set());
  const [goalScorers, setGoalScorers] = useState<Set<number>>(new Set());

  // Fetch match events when component mounts or fixtureId changes
  useEffect(() => {
    if (fixtureId) {
      fetchMatchEvents();
    }
  }, [fixtureId]);

  const fetchMatchEvents = async () => {
    if (!fixtureId) return;

    try {
      const events = await eventsApi.getByFixture(fixtureId);

      // Get red card players
      const redCardPlayerIds = new Set(
        events
          .filter((event: any) => event.event_type === 'red_card')
          .map((event: any) => event.player_id)
      );
      setRedCardPlayers(redCardPlayerIds);

      // Get goal scorers
      const goalEvents = events.filter((event: any) => event.event_type === 'goal');
      console.log('Goal events found:', goalEvents);

      const goalScorerIds = new Set(
        goalEvents.map((event: any) => event.player_id)
      );
      console.log('Goal scorer IDs:', Array.from(goalScorerIds));
      setGoalScorers(goalScorerIds);
    } catch (error) {
      console.error('Error fetching match events:', error);
    }
  };

  if (!homeTeamLineup || !awayTeamLineup) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="text-center text-gray-500 py-8">
          <EyeIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p className="font-semibold text-gray-700">Formation View</p>
          <p className="text-sm mt-1">Set lineups for both teams to view formation</p>
        </div>
      </div>
    );
  }

  const getFormationPositions = (formationValue: string) => {
    const formation = FORMATIONS.find(f => f.value === formationValue) || FORMATIONS[0];
    const slots: any[] = [];

    Object.entries(formation.positions).forEach(([position, coords]) => {
      coords.forEach((coord, index) => {
        slots.push({
          position,
          x: coord.x,
          y: coord.y,
          slotIndex: index
        });
      });
    });

    return slots;
  };

  const getPlayerFormationPosition = (player: Player, lineup: TeamLineup, teamSide: 'home' | 'away') => {
    const formation = lineup.formation || '442';
    const formationPositions = getFormationPositions(formation);

    // Find the lineup entry for this player
    const lineupPlayer = lineup.starters.find(l => l.player_id === player.id);
    if (!lineupPlayer || !lineupPlayer.position_played) {
      // Fallback to player's natural position if position_played is not set
      const fallbackPosition = player.position;
      const fallbackSlots = formationPositions.filter(slot => slot.position === fallbackPosition);
      if (fallbackSlots.length > 0) {
        const slot = fallbackSlots[0];
        // Transform coordinates for horizontal layout
        if (teamSide === 'home') {
          const horizontalX = 5 + ((90 - slot.y) * 40 / 70);
          return { x: horizontalX, y: slot.x };
        } else {
          const horizontalX = 55 + ((slot.y - 20) * 40 / 70);
          return { x: horizontalX, y: 100 - slot.x };
        }
      }
      return { x: 50, y: 50 }; // Default center position
    }

    // Get all players with the same position, sorted by their lineup order
    const playersInPosition = lineup.starters
      .filter(l => l.position_played === lineupPlayer.position_played)
      .sort((a, b) => a.id - b.id); // Sort for consistent ordering

    // Find position slots for this player's position
    const positionSlots = formationPositions.filter(slot => slot.position === lineupPlayer.position_played);

    // Find this player's index within their position group
    const playerIndexInPosition = playersInPosition.findIndex(l => l.player_id === player.id);

    // Use the corresponding slot or fallback to available slot
    const slot = positionSlots[playerIndexInPosition] || positionSlots[playerIndexInPosition % positionSlots.length] || { x: 50, y: 50 };

    // Transform coordinates for horizontal layout
    if (teamSide === 'home') {
      // Home team on left half (0-50% of field width)
      // Convert from vertical formation (y) to horizontal position (x)
      // GK at y=90 becomes x=5, FW at y=20 becomes x=45
      const horizontalX = 5 + ((90 - slot.y) * 40 / 70); // Map y(90-20) to x(5-45)
      return { x: horizontalX, y: slot.x }; // Use original x as y coordinate
    } else {
      // Away team on right half (50-100% of field width)
      // Mirror the home team positioning and flip on vertical axis
      const horizontalX = 55 + ((slot.y - 20) * 40 / 70); // Map y(20-90) to x(55-95) - reversed
      return { x: horizontalX, y: 100 - slot.x }; // Flip y coordinate for facing each other
    }
  };

  const renderPlayer = (player: Player, position: { x: number; y: number }, teamColor: string, isSentOff: boolean = false) => {
    const hasRedCard = redCardPlayers.has(player.id) || isSentOff;
    const hasScored = goalScorers.has(player.id);

    return (
      <g key={player.id}>
        {/* Player circle */}
        <circle
          cx={position.x}
          cy={position.y}
          r="3"
          fill={teamColor}
          stroke="white"
          strokeWidth="1"
          className="transition-all duration-200 hover:r-4"
          opacity={hasRedCard ? "0.6" : "1"}
        />
        {/* Jersey number */}
        <text
          x={position.x}
          y={position.y + 0.5}
          textAnchor="middle"
          className="fill-white font-bold pointer-events-none"
          fontSize="2"
        >
          {player.jersey_number}
        </text>
        {/* Player name (below) */}
        <text
          x={position.x}
          y={position.y + 8}
          textAnchor="middle"
          className="fill-gray-700 font-medium pointer-events-none"
          fontSize="1.5"
          opacity={hasRedCard ? "0.6" : "1"}
        >
          {player.name.split(' ').slice(-1)[0]} {/* Show only last name */}
        </text>
        {/* Goal indicator - football icon */}
        {hasScored && (
          <g>
            <circle
              cx={position.x - 5}
              cy={position.y - 3}
              r="2.5"
              fill="#16A34A"
              stroke="white"
              strokeWidth="0.5"
            />
            <text
              x={position.x - 5}
              y={position.y - 2.2}
              textAnchor="middle"
              className="fill-white font-bold pointer-events-none"
              fontSize="1.8"
            >
              ⚽
            </text>
          </g>
        )}
        {/* Red card indicator */}
        {hasRedCard && (
          <g>
            <rect
              x={position.x + 4}
              y={position.y - 2}
              width="2.5"
              height="4"
              fill="#DC2626"
              stroke="#B91C1C"
              strokeWidth="0.2"
              rx="0.3"
            />
            {/* "SENT OFF" banner */}
            <rect
              x={position.x - 8}
              y={position.y + 15}
              width="16"
              height="3"
              fill="#DC2626"
              stroke="#B91C1C"
              strokeWidth="0.2"
              rx="0.5"
            />
            <text
              x={position.x}
              y={position.y + 17.2}
              textAnchor="middle"
              className="fill-white font-bold pointer-events-none"
              fontSize="1.2"
            >
              SENT OFF
            </text>
          </g>
        )}
      </g>
    );
  };

  const renderTeamPlayers = (lineup: TeamLineup, teamSide: 'home' | 'away') => {
    const teamColor = lineup.team.primary_color || (teamSide === 'home' ? '#3B82F6' : '#EF4444');

    return lineup.starters
      .filter((lineupPlayer) => lineupPlayer.player) // Ensure player exists
      .map((lineupPlayer) => {
        const player = lineupPlayer.player;
        const coordinates = getPlayerFormationPosition(player, lineup, teamSide);
        const isSentOff = lineupPlayer.sent_off || false; // Check sent_off status from lineup
        return renderPlayer(player, coordinates, teamColor, isSentOff);
      });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header - Always visible */}
      <div
        className="p-4 bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200 cursor-pointer hover:from-green-100 hover:to-green-150 transition-colors duration-200"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <h3 className="text-lg font-semibold text-gray-900">Formation View</h3>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              {isExpanded ? 'Collapse' : 'Expand'}
            </span>
            {isExpanded ? (
              <ChevronUpIcon className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDownIcon className="h-5 w-5 text-gray-500" />
            )}
          </div>
        </div>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="p-6">
          {/* Team Headers */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                {homeTeamLineup.team.logo_url && (
                  <img
                    src={`http://localhost:8000${homeTeamLineup.team.logo_url}`}
                    alt={homeTeamLineup.team.name}
                    className="w-6 h-6 object-contain"
                  />
                )}
                <h4 className="font-semibold text-gray-900">{homeTeamLineup.team.name}</h4>
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <h4 className="font-semibold text-gray-900">{awayTeamLineup.team.name}</h4>
                {awayTeamLineup.team.logo_url && (
                  <img
                    src={`http://localhost:8000${awayTeamLineup.team.logo_url}`}
                    alt={awayTeamLineup.team.name}
                    className="w-6 h-6 object-contain"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Soccer Pitch SVG */}
          <div className="w-full overflow-x-auto">
            <svg
              viewBox="0 0 100 100"
              className="w-full h-80 md:h-96 lg:h-[32rem] bg-gradient-to-r from-green-400 to-green-500 rounded-lg border-2 border-green-600"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Pitch markings */}
              {/* Outer boundary */}
              <rect
                x="2"
                y="10"
                width="96"
                height="80"
                fill="none"
                stroke="white"
                strokeWidth="0.5"
              />

              {/* Center line */}
              <line
                x1="50"
                y1="10"
                x2="50"
                y2="90"
                stroke="white"
                strokeWidth="0.5"
              />

              {/* Center circle */}
              <circle
                cx="50"
                cy="50"
                r="8"
                fill="none"
                stroke="white"
                strokeWidth="0.5"
              />

              {/* Home penalty area */}
              <rect
                x="2"
                y="30"
                width="15"
                height="40"
                fill="none"
                stroke="white"
                strokeWidth="0.5"
              />

              {/* Home goal area */}
              <rect
                x="2"
                y="42"
                width="8"
                height="16"
                fill="none"
                stroke="white"
                strokeWidth="0.5"
              />

              {/* Away penalty area */}
              <rect
                x="83"
                y="30"
                width="15"
                height="40"
                fill="none"
                stroke="white"
                strokeWidth="0.5"
              />

              {/* Away goal area */}
              <rect
                x="90"
                y="42"
                width="8"
                height="16"
                fill="none"
                stroke="white"
                strokeWidth="0.5"
              />

              {/* Home goal */}
              <rect
                x="0"
                y="45"
                width="2"
                height="10"
                fill="none"
                stroke="white"
                strokeWidth="0.8"
              />

              {/* Away goal */}
              <rect
                x="98"
                y="45"
                width="2"
                height="10"
                fill="none"
                stroke="white"
                strokeWidth="0.8"
              />

              {/* Render players */}
              {renderTeamPlayers(homeTeamLineup, 'home')}
              {renderTeamPlayers(awayTeamLineup, 'away')}
            </svg>
          </div>

          {/* Formation Info */}
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <p className="text-gray-600">
                Formation: {FORMATIONS.find(f => f.value === (homeTeamLineup.formation || '442'))?.name || '4-4-2'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {homeTeamLineup.starters.length} starters
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-600">
                Formation: {FORMATIONS.find(f => f.value === (awayTeamLineup.formation || '442'))?.name || '4-4-2'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {awayTeamLineup.starters.length} starters
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormationPitch;