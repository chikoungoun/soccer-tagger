import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  UserPlusIcon,
  UserMinusIcon,
  ArrowPathIcon,
  StarIcon,
  CheckIcon,
  PlayIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import {
  StarIcon as StarIconSolid
} from '@heroicons/react/24/solid';
import { FixtureWithLineups, Player, TeamLineup, CreateLineupData } from '../types';
import { teamsApi, lineupsApi } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface LineupModalProps {
  fixture: FixtureWithLineups;
  onSave: () => void;
  onClose: () => void;
}

interface Formation {
  name: string;
  value: string;
  positions: {
    GK: { x: number; y: number }[];
    DF: { x: number; y: number }[];
    MF: { x: number; y: number }[];
    FW: { x: number; y: number }[];
  };
}

interface PositionSlot {
  position: string;
  x: number;
  y: number;
  slotIndex: number;
  player?: Player;
  isCaptain?: boolean;
}

const FORMATIONS: Formation[] = [
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

const LineupModal: React.FC<LineupModalProps> = ({ fixture, onSave, onClose }) => {
  const [homeTeamPlayers, setHomeTeamPlayers] = useState<Player[]>([]);
  const [awayTeamPlayers, setAwayTeamPlayers] = useState<Player[]>([]);
  const [homeLineup, setHomeLineup] = useState<CreateLineupData[]>([]);
  const [awayLineup, setAwayLineup] = useState<CreateLineupData[]>([]);
  const [homeFormation, setHomeFormation] = useState<string>('442');
  const [awayFormation, setAwayFormation] = useState<string>('442');
  const [homeCaptain, setHomeCaptain] = useState<number | null>(null);
  const [awayCaptain, setAwayCaptain] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draggedPlayer, setDraggedPlayer] = useState<Player | null>(null);
  const [draggedFromTeam, setDraggedFromTeam] = useState<number | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<string | null>(null);
  const [homePlayerPositions, setHomePlayerPositions] = useState<Map<number, {position: string, slotIndex: number}>>(new Map());
  const [awayPlayerPositions, setAwayPlayerPositions] = useState<Map<number, {position: string, slotIndex: number}>>(new Map());
  const [activeTab, setActiveTab] = useState('home');

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

  const getFormationPositions = (formationValue: string): PositionSlot[] => {
    const formation = FORMATIONS.find(f => f.value === formationValue) || FORMATIONS[0];
    const slots: PositionSlot[] = [];

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

  const applyFormation = (teamId: number, formationValue: string) => {
    const isHome = teamId === fixture.home_team_id;
    const players = isHome ? homeTeamPlayers : awayTeamPlayers;
    const setLineup = isHome ? setHomeLineup : setAwayLineup;

    const positions = getFormationPositions(formationValue);
    const newLineup: CreateLineupData[] = [];
    const availablePlayers = [...players];

    // First, assign goalkeeper
    const gkPositions = positions.filter(p => p.position === 'GK');
    const gks = availablePlayers.filter(p => p.position === 'GK');
    if (gks.length > 0 && gkPositions.length > 0) {
      newLineup.push({
        fixture_id: fixture.id,
        team_id: teamId,
        player_id: gks[0].id,
        is_starter: true,
        position_played: 'GK'
      });
      availablePlayers.splice(availablePlayers.indexOf(gks[0]), 1);
    }

    // Then assign other positions
    ['DF', 'MF', 'FW'].forEach(pos => {
      const positionSlots = positions.filter(p => p.position === pos);
      const positionPlayers = availablePlayers.filter(p => p.position === pos);

      for (let i = 0; i < Math.min(positionSlots.length, positionPlayers.length); i++) {
        newLineup.push({
          fixture_id: fixture.id,
          team_id: teamId,
          player_id: positionPlayers[i].id,
          is_starter: true,
          position_played: pos
        });
        availablePlayers.splice(availablePlayers.indexOf(positionPlayers[i]), 1);
      }
    });

    // Add remaining players as substitutes
    const remainingPlayers = availablePlayers.slice(0, 7);
    remainingPlayers.forEach(player => {
      newLineup.push({
        fixture_id: fixture.id,
        team_id: teamId,
        player_id: player.id,
        is_starter: false,
        position_played: player.position
      });
    });

    setLineup(newLineup);
  };

  const addPlayerToPosition = (teamId: number, player: Player, formationPosition: string, positionIndex: number) => {
    const isHome = teamId === fixture.home_team_id;
    const lineup = isHome ? homeLineup : awayLineup;
    const setLineup = isHome ? setHomeLineup : setAwayLineup;
    const playerPositions = isHome ? homePlayerPositions : awayPlayerPositions;
    const setPlayerPositions = isHome ? setHomePlayerPositions : setAwayPlayerPositions;

    // Check if player is already in lineup
    const existingEntry = lineup.find(l => l.player_id === player.id);

    // Handle position conflicts - if there's already a player in this exact slot, move them to bench
    const existingPlayerInSlot = Array.from(playerPositions.entries()).find(([playerId, pos]) =>
      pos.position === formationPosition && pos.slotIndex === positionIndex
    );

    if (existingPlayerInSlot) {
      const [existingPlayerId] = existingPlayerInSlot;
      if (existingPlayerId !== player.id) {
        // Move existing player to bench
        setLineup(prevLineup => prevLineup.map(l =>
          l.player_id === existingPlayerId
            ? { ...l, is_starter: false }
            : l
        ));
        // Remove from position map
        const newPositions = new Map(playerPositions);
        newPositions.delete(existingPlayerId);
        setPlayerPositions(newPositions);
      }
    }

    if (existingEntry) {
      // If player is already a starter but just changing position, simply update position
      if (existingEntry.is_starter) {
        setLineup(lineup.map(l =>
          l.player_id === player.id
            ? { ...l, position_played: formationPosition }
            : l
        ));
        // Update position map
        const newPositions = new Map(playerPositions);
        newPositions.set(player.id, { position: formationPosition, slotIndex: positionIndex });
        setPlayerPositions(newPositions);
        return;
      }

      // If moving from bench to field, check starter limit
      const currentStarters = lineup.filter(l => l.is_starter && l.player_id !== player.id).length;
      if (currentStarters >= 11) {
        alert('Cannot add more than 11 starters. Move a player to bench first.');
        return;
      }

      // Update existing bench player to be a starter
      setLineup(lineup.map(l =>
        l.player_id === player.id
          ? { ...l, is_starter: true, position_played: formationPosition }
          : l
      ));
      // Add to position map
      const newPositions = new Map(playerPositions);
      newPositions.set(player.id, { position: formationPosition, slotIndex: positionIndex });
      setPlayerPositions(newPositions);
    } else {
      // Check starter limit for new player
      const currentStarters = lineup.filter(l => l.is_starter).length;
      if (currentStarters >= 11) {
        alert('Cannot add more than 11 starters. Move a player to bench first.');
        return;
      }

      // Add new player to lineup
      const newEntry: CreateLineupData = {
        fixture_id: fixture.id,
        team_id: teamId,
        player_id: player.id,
        is_starter: true,
        position_played: formationPosition
      };

      setLineup([...lineup, newEntry]);
      // Add to position map
      const newPositions = new Map(playerPositions);
      newPositions.set(player.id, { position: formationPosition, slotIndex: positionIndex });
      setPlayerPositions(newPositions);
    }
  };

  const removePlayerFromLineup = (teamId: number, playerId: number) => {
    const isHome = teamId === fixture.home_team_id;
    const lineup = isHome ? homeLineup : awayLineup;
    const setLineup = isHome ? setHomeLineup : setAwayLineup;
    const playerPositions = isHome ? homePlayerPositions : awayPlayerPositions;
    const setPlayerPositions = isHome ? setHomePlayerPositions : setAwayPlayerPositions;

    setLineup(lineup.filter(l => l.player_id !== playerId));
    // Remove from position map
    const newPositions = new Map(playerPositions);
    newPositions.delete(playerId);
    setPlayerPositions(newPositions);
  };

  const movePlayerToBench = (teamId: number, playerId: number) => {
    const isHome = teamId === fixture.home_team_id;
    const lineup = isHome ? homeLineup : awayLineup;
    const setLineup = isHome ? setHomeLineup : setAwayLineup;
    const playerPositions = isHome ? homePlayerPositions : awayPlayerPositions;
    const setPlayerPositions = isHome ? setHomePlayerPositions : setAwayPlayerPositions;

    // Find the player and move them to bench, keeping them in the lineup but as a substitute
    setLineup(lineup.map(l =>
      l.player_id === playerId ? { ...l, is_starter: false } : l
    ));
    // Remove from position map
    const newPositions = new Map(playerPositions);
    newPositions.delete(playerId);
    setPlayerPositions(newPositions);
  };

  const movePlayerToField = (teamId: number, playerId: number) => {
    const isHome = teamId === fixture.home_team_id;
    const lineup = isHome ? homeLineup : awayLineup;
    const setLineup = isHome ? setHomeLineup : setAwayLineup;

    // Check starter limit
    const currentStarters = lineup.filter(l => l.is_starter && l.player_id !== playerId).length;
    if (currentStarters >= 11) {
      alert('Cannot have more than 11 starters. Move a player to bench first.');
      return;
    }

    setLineup(lineup.map(l =>
      l.player_id === playerId ? { ...l, is_starter: true } : l
    ));
  };

  const addPlayerToBench = (teamId: number, player: Player) => {
    const isHome = teamId === fixture.home_team_id;
    const lineup = isHome ? homeLineup : awayLineup;
    const setLineup = isHome ? setHomeLineup : setAwayLineup;

    const newEntry: CreateLineupData = {
      fixture_id: fixture.id,
      team_id: teamId,
      player_id: player.id,
      is_starter: false,
      position_played: player.position
    };
    setLineup([...lineup, newEntry]);
  };

  const findFirstAvailableSlot = (teamId: number, position: string): number | null => {
    const isHome = teamId === fixture.home_team_id;
    const formation = isHome ? homeFormation : awayFormation;
    const playerPositions = isHome ? homePlayerPositions : awayPlayerPositions;

    const formationPositions = getFormationPositions(formation);
    const positionSlots = formationPositions.filter(slot => slot.position === position);

    // Find first empty slot
    for (let i = 0; i < positionSlots.length; i++) {
      const isOccupied = Array.from(playerPositions.entries()).some(([playerId, pos]) =>
        pos.position === position && pos.slotIndex === i
      );
      if (!isOccupied) {
        return i;
      }
    }

    return null; // No available slots
  };

  const findFirstAvailableSlotAnyPosition = (teamId: number): {position: string, slotIndex: number} | null => {
    const isHome = teamId === fixture.home_team_id;
    const formation = isHome ? homeFormation : awayFormation;
    const playerPositions = isHome ? homePlayerPositions : awayPlayerPositions;

    const formationPositions = getFormationPositions(formation);

    // Check all positions in order: GK, DF, MF, FW
    const positionOrder = ['GK', 'DF', 'MF', 'FW'];

    for (const position of positionOrder) {
      const positionSlots = formationPositions.filter(slot => slot.position === position);

      for (let i = 0; i < positionSlots.length; i++) {
        const isOccupied = Array.from(playerPositions.entries()).some(([playerId, pos]) =>
          pos.position === position && pos.slotIndex === i
        );
        if (!isOccupied) {
          return { position, slotIndex: i };
        }
      }
    }

    return null; // No available slots
  };

  const addPlayerToFirstAvailableSlot = (teamId: number, player: Player) => {
    // First try to find a slot in the player's natural position
    const naturalPositionSlot = findFirstAvailableSlot(teamId, player.position);

    if (naturalPositionSlot !== null) {
      addPlayerToPosition(teamId, player, player.position, naturalPositionSlot);
      return;
    }

    // If no natural position slot available, find any available slot
    const anyAvailableSlot = findFirstAvailableSlotAnyPosition(teamId);

    if (anyAvailableSlot) {
      addPlayerToPosition(teamId, player, anyAvailableSlot.position, anyAvailableSlot.slotIndex);
    } else {
      alert('No available slots in the current formation. All 11 positions are filled.');
    }
  };

  const resetLineup = (teamId: number) => {
    const isHome = teamId === fixture.home_team_id;
    const setLineup = isHome ? setHomeLineup : setAwayLineup;
    const setCaptain = isHome ? setHomeCaptain : setAwayCaptain;
    const setPlayerPositions = isHome ? setHomePlayerPositions : setAwayPlayerPositions;

    setLineup([]);
    setCaptain(null);
    setPlayerPositions(new Map());
  };

  const handleDragStart = (e: React.DragEvent, player: Player, teamId: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', player.id.toString());
    setDraggedPlayer(player);
    setDraggedFromTeam(teamId);
  };

  const handleDragEnd = () => {
    setDraggedPlayer(null);
    setDraggedFromTeam(null);
    setDragOverPosition(null);
  };

  const handleDrop = (e: React.DragEvent, formationPosition: string, positionIndex: number, teamId: number) => {
    e.preventDefault();
    setDragOverPosition(null);
    if (draggedPlayer && draggedFromTeam === teamId) {
      // Allow any player to be placed in any formation position
      addPlayerToPosition(teamId, draggedPlayer, formationPosition, positionIndex);
    }
    handleDragEnd();
  };

  const handleDragOver = (e: React.DragEvent, position: string, positionIndex: number) => {
    e.preventDefault();
    setDragOverPosition(`${position}-${positionIndex}`);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverPosition(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
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

  const getPlayerAtPosition = (teamId: number, position: string, positionIndex: number): Player | null => {
    const isHome = teamId === fixture.home_team_id;
    const players = isHome ? homeTeamPlayers : awayTeamPlayers;
    const playerPositions = isHome ? homePlayerPositions : awayPlayerPositions;

    // Find player by exact position and slot index
    const playerEntry = Array.from(playerPositions.entries()).find(([playerId, pos]) =>
      pos.position === position && pos.slotIndex === positionIndex
    );

    if (playerEntry) {
      const [playerId] = playerEntry;
      return players.find(p => p.id === playerId) || null;
    }

    return null;
  };

  const toggleCaptain = (teamId: number, playerId: number) => {
    const isHome = teamId === fixture.home_team_id;
    if (isHome) {
      setHomeCaptain(homeCaptain === playerId ? null : playerId);
    } else {
      setAwayCaptain(awayCaptain === playerId ? null : playerId);
    }
  };

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'GK': return 'bg-blue-500 border-blue-600';
      case 'DF': return 'bg-yellow-500 border-yellow-600';
      case 'MF': return 'bg-green-500 border-green-600';
      case 'FW': return 'bg-red-500 border-red-600';
      default: return 'bg-gray-500 border-gray-600';
    }
  };

  const renderPitch = (teamId: number) => {
    const isHome = teamId === fixture.home_team_id;
    const formation = isHome ? homeFormation : awayFormation;
    const captain = isHome ? homeCaptain : awayCaptain;
    const positions = getFormationPositions(formation);

    // Group positions by type to handle multiple players per position
    const positionGroups = positions.reduce((groups, pos, index) => {
      if (!groups[pos.position]) groups[pos.position] = [];
      groups[pos.position].push({ ...pos, index });
      return groups;
    }, {} as Record<string, (PositionSlot & { index: number })[]>);

    return (
      <div className="relative w-full h-64 md:h-80 lg:h-96 bg-gradient-to-b from-green-400 to-green-500 rounded-lg border-4 border-white shadow-lg">
        {/* Pitch markings */}
        <div className="absolute inset-2 md:inset-4 border-2 border-white rounded">
          {/* Center circle */}
          <div className="absolute top-1/2 left-1/2 w-12 h-12 md:w-16 md:h-16 border-2 border-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>

          {/* Penalty areas */}
          <div className="absolute bottom-0 left-1/2 w-20 h-8 md:w-28 md:h-12 border-2 border-white border-b-0 -translate-x-1/2"></div>
          <div className="absolute top-0 left-1/2 w-20 h-8 md:w-28 md:h-12 border-2 border-white border-t-0 -translate-x-1/2"></div>

          {/* Goal areas */}
          <div className="absolute bottom-0 left-1/2 w-12 h-4 md:w-16 md:h-6 border-2 border-white border-b-0 -translate-x-1/2"></div>
          <div className="absolute top-0 left-1/2 w-12 h-4 md:w-16 md:h-6 border-2 border-white border-t-0 -translate-x-1/2"></div>
        </div>

        {/* Position slots */}
        {Object.entries(positionGroups).map(([position, slots]) =>
          slots.map((slot, slotIndex) => {
            const player = getPlayerAtPosition(teamId, position, slotIndex);
            const isCaptain = player && captain === player.id;

            const isDropTarget = dragOverPosition === `${position}-${slotIndex}`;

            return (
              <div
                key={`${position}-${slotIndex}`}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                onDragOver={(e) => handleDragOver(e, position, slotIndex)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, position, slotIndex, teamId)}
              >
                {player ? (
                  <div className="relative">
                    <div
                      className={`w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full ${
                        getPositionColor(player.position)
                      }
                        border-2 flex items-center justify-center text-white font-bold text-xs
                        shadow-lg cursor-move hover:scale-110 transition-transform ${
                        player.position !== position ? 'ring-2 ring-orange-300' : ''
                      }`}
                      onClick={() => toggleCaptain(teamId, player.id)}
                      draggable
                      onDragStart={(e) => handleDragStart(e, player, teamId)}
                      onDragEnd={handleDragEnd}
                      title={
                        player.position !== position ?
                        `${player.name} (${player.position}) playing out of position as ${position}` :
                        player.name
                      }
                    >
                      {player.jersey_number || player.name.charAt(0)}
                    </div>
                    {isCaptain && (
                      <StarIconSolid className="absolute -top-1 -right-1 w-3 h-3 md:w-4 md:h-4 text-yellow-400" />
                    )}
                    <div className="absolute top-10 md:top-14 left-1/2 transform -translate-x-1/2
                      bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded
                      opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {player.name}
                    </div>
                    <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 flex space-x-1
                      opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="p-1 h-6 w-6 bg-yellow-500 hover:bg-yellow-600 text-white text-xs"
                        onClick={() => movePlayerToBench(teamId, player.id)}
                        title="Move to bench"
                      >
                        ↓
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="p-1 h-6 w-6 bg-red-500 hover:bg-red-600 text-white"
                        onClick={() => removePlayerFromLineup(teamId, player.id)}
                        title="Remove from lineup"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full border-2 border-dashed ${
                      position === 'GK' ? 'border-blue-400' :
                      position === 'DF' ? 'border-yellow-400' :
                      position === 'MF' ? 'border-green-400' : 'border-red-400'
                    } flex items-center justify-center text-white font-bold text-xs
                      bg-white bg-opacity-20 hover:bg-opacity-40 transition-all ${
                      isDropTarget && draggedPlayer ?
                        (draggedPlayer.position === position ?
                          'border-solid border-white bg-opacity-80 scale-110' :
                          'border-solid border-orange-400 bg-orange-400 bg-opacity-60 scale-110'
                        ) :
                      draggedPlayer ? 'border-solid bg-opacity-60' : ''
                    }`}
                    title={
                      isDropTarget && draggedPlayer && draggedPlayer.position !== position ?
                      `Playing ${draggedPlayer.name} (${draggedPlayer.position}) out of position as ${position}` :
                      undefined
                    }
                  >
                    {position}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    );
  };

  const getAvailablePlayers = (teamId: number) => {
    const isHome = teamId === fixture.home_team_id;
    const players = isHome ? homeTeamPlayers : awayTeamPlayers;
    const lineup = isHome ? homeLineup : awayLineup;

    const usedPlayerIds = lineup.map(l => l.player_id);
    return players.filter(p => !usedPlayerIds.includes(p.id));
  };

  const getStarters = (teamId: number) => {
    const isHome = teamId === fixture.home_team_id;
    const players = isHome ? homeTeamPlayers : awayTeamPlayers;
    const lineup = isHome ? homeLineup : awayLineup;

    return lineup
      .filter(l => l.is_starter)
      .map(l => players.find(p => p.id === l.player_id))
      .filter(Boolean) as Player[];
  };

  const getSubstitutes = (teamId: number) => {
    const isHome = teamId === fixture.home_team_id;
    const players = isHome ? homeTeamPlayers : awayTeamPlayers;
    const lineup = isHome ? homeLineup : awayLineup;

    return lineup
      .filter(l => !l.is_starter)
      .map(l => players.find(p => p.id === l.player_id))
      .filter(Boolean) as Player[];
  };

  const renderPlayerList = (teamId: number) => {
    const availablePlayers = getAvailablePlayers(teamId);
    const substitutes = getSubstitutes(teamId);

    return (
      <div className="space-y-4">
        {/* Available Players */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center">
              <UserPlusIcon className="w-4 h-4 mr-2" />
              Available ({availablePlayers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-32 md:max-h-40 overflow-y-auto">
            {availablePlayers.map(player => (
              <div
                key={player.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg cursor-move hover:bg-gray-100 transition-colors"
                draggable
                onDragStart={(e) => handleDragStart(e, player, teamId)}
                onDragEnd={handleDragEnd}
              >
                <div className="flex items-center space-x-2">
                  <div className={`w-6 h-6 rounded-full ${getPositionColor(player.position)}
                    border flex items-center justify-center text-white text-xs font-bold`}>
                    {player.jersey_number}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{player.name}</p>
                    <Badge variant="outline" className="text-xs">
                      {player.position}
                    </Badge>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs"
                    onClick={() => addPlayerToFirstAvailableSlot(teamId, player)}
                  >
                    Field
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={() => addPlayerToBench(teamId, player)}
                  >
                    Bench
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Substitutes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center">
              <UserMinusIcon className="w-4 h-4 mr-2" />
              Bench ({substitutes.length}/7)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-32 md:max-h-40 overflow-y-auto">
            {substitutes.map(player => (
              <div
                key={player.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg cursor-move hover:bg-gray-100 transition-colors"
                draggable
                onDragStart={(e) => handleDragStart(e, player, teamId)}
                onDragEnd={handleDragEnd}
              >
                <div className="flex items-center space-x-2">
                  <div className={`w-6 h-6 rounded-full ${getPositionColor(player.position)}
                    border flex items-center justify-center text-white text-xs font-bold`}>
                    {player.jersey_number}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{player.name}</p>
                    <Badge variant="outline" className="text-xs">
                      {player.position}
                    </Badge>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs"
                    onClick={() => {
                      // First try natural position slot
                      const naturalPositionSlot = findFirstAvailableSlot(teamId, player.position);

                      if (naturalPositionSlot !== null) {
                        movePlayerToField(teamId, player.id);
                        const isHome = teamId === fixture.home_team_id;
                        const playerPositions = isHome ? homePlayerPositions : awayPlayerPositions;
                        const setPlayerPositions = isHome ? setHomePlayerPositions : setAwayPlayerPositions;
                        const newPositions = new Map(playerPositions);
                        newPositions.set(player.id, { position: player.position, slotIndex: naturalPositionSlot });
                        setPlayerPositions(newPositions);
                        return;
                      }

                      // If no natural position slot, find any available slot
                      const anyAvailableSlot = findFirstAvailableSlotAnyPosition(teamId);

                      if (anyAvailableSlot) {
                        movePlayerToField(teamId, player.id);
                        const isHome = teamId === fixture.home_team_id;
                        const playerPositions = isHome ? homePlayerPositions : awayPlayerPositions;
                        const setPlayerPositions = isHome ? setHomePlayerPositions : setAwayPlayerPositions;
                        const newPositions = new Map(playerPositions);
                        newPositions.set(player.id, { position: anyAvailableSlot.position, slotIndex: anyAvailableSlot.slotIndex });
                        setPlayerPositions(newPositions);
                      } else {
                        alert('No available slots in the current formation. All 11 positions are filled.');
                      }
                    }}
                  >
                    Field
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs text-red-600 hover:text-red-700"
                    onClick={() => removePlayerFromLineup(teamId, player.id)}
                  >
                    <TrashIcon className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <Card className="w-96">
          <CardContent className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
              <p className="text-gray-600">Loading lineups...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 md:p-4">
      <Card className="w-full max-w-6xl max-h-[95vh] overflow-hidden">
        <CardHeader className="border-b bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg md:text-xl flex items-center">
                <PlayIcon className="w-5 h-5 md:w-6 md:h-6 mr-2" />
                <span className="hidden md:inline">Lineup Manager: </span>
                {fixture.home_team.name} vs {fixture.away_team.name}
              </CardTitle>
              <p className="text-emerald-100 text-sm mt-1 hidden md:block">
                Manage your team formation and substitutes
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <XMarkIcon className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-y-auto max-h-[calc(95vh-140px)]">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 m-2 md:m-4 mb-0">
              <TabsTrigger value="home" className="flex items-center text-sm">
                🏠 <span className="hidden md:inline ml-1">{fixture.home_team.name}</span>
              </TabsTrigger>
              <TabsTrigger value="away" className="flex items-center text-sm">
                ✈️ <span className="hidden md:inline ml-1">{fixture.away_team.name}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="home" className="p-2 md:p-4 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
                <div className="flex items-center space-x-2 md:space-x-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Formation:</label>
                    <Select value={homeFormation} onValueChange={setHomeFormation}>
                      <SelectTrigger className="w-24 md:w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FORMATIONS.map(formation => (
                          <SelectItem key={formation.value} value={formation.value}>
                            {formation.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() => resetLineup(fixture.home_team_id)}
                    variant="outline"
                    size="sm"
                    className="flex items-center text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                  >
                    <XMarkIcon className="w-4 h-4 mr-1 md:mr-2" />
                    <span className="hidden md:inline">Reset</span>
                    <span className="md:hidden">Reset</span>
                  </Button>
                </div>
                <div className="text-sm text-gray-600">
                  Starters: {getStarters(fixture.home_team_id).length}/11
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                <div className="lg:col-span-2 order-2 lg:order-1">
                  {renderPitch(fixture.home_team_id)}
                </div>
                <div className="order-1 lg:order-2">
                  {renderPlayerList(fixture.home_team_id)}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="away" className="p-2 md:p-4 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
                <div className="flex items-center space-x-2 md:space-x-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Formation:</label>
                    <Select value={awayFormation} onValueChange={setAwayFormation}>
                      <SelectTrigger className="w-24 md:w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FORMATIONS.map(formation => (
                          <SelectItem key={formation.value} value={formation.value}>
                            {formation.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() => resetLineup(fixture.away_team_id)}
                    variant="outline"
                    size="sm"
                    className="flex items-center text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                  >
                    <XMarkIcon className="w-4 h-4 mr-1 md:mr-2" />
                    <span className="hidden md:inline">Reset</span>
                    <span className="md:hidden">Reset</span>
                  </Button>
                </div>
                <div className="text-sm text-gray-600">
                  Starters: {getStarters(fixture.away_team_id).length}/11
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                <div className="lg:col-span-2 order-2 lg:order-1">
                  {renderPitch(fixture.away_team_id)}
                </div>
                <div className="order-1 lg:order-2">
                  {renderPlayerList(fixture.away_team_id)}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>

        <div className="border-t bg-gray-50 p-3 md:p-4 flex flex-col md:flex-row justify-between md:justify-end space-y-2 md:space-y-0 md:space-x-3">
          <div className="text-sm text-gray-600 hidden md:block">
            Home: {getStarters(fixture.home_team_id).length}/11 starters |
            Away: {getStarters(fixture.away_team_id).length}/11 starters
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose} disabled={saving} className="flex-1 md:flex-none">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 flex-1 md:flex-none"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <CheckIcon className="w-4 h-4 mr-2" />
                  Save Lineups
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LineupModal;