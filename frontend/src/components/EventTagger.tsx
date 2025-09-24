import React, { useState } from 'react';
import {
  FireIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftOnRectangleIcon,
  HandRaisedIcon,
  ShieldCheckIcon,
  TrophyIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';
import { Player, TeamLineup } from '../types';
import { eventsApi } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

interface EventTaggerProps {
  fixtureId: number;
  homeTeamLineup: TeamLineup | null;
  awayTeamLineup: TeamLineup | null;
  currentMinute: number;
  currentHalf: number;
  fixtureStatus: string;
  onEventCreated?: () => void;
  onLineupUpdated?: (homeLineup: TeamLineup, awayLineup: TeamLineup) => void;
}

interface EventType {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

const eventTypes: EventType[] = [
  {
    key: 'goal',
    label: 'Goal',
    icon: FireIcon,
    color: 'text-green-600',
    bgColor: 'bg-green-100 hover:bg-green-200'
  },
  {
    key: 'assist',
    label: 'Assist',
    icon: UserPlusIcon,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 hover:bg-purple-200'
  },
  {
    key: 'yellow_card',
    label: 'Yellow Card',
    icon: ExclamationTriangleIcon,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100 hover:bg-yellow-200'
  },
  {
    key: 'red_card',
    label: 'Red Card',
    icon: XCircleIcon,
    color: 'text-red-600',
    bgColor: 'bg-red-100 hover:bg-red-200'
  },
  {
    key: 'substitution',
    label: 'Substitution',
    icon: ArrowRightOnRectangleIcon,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 hover:bg-blue-200'
  },
  {
    key: 'penalty_miss',
    label: 'Penalty Miss',
    icon: HandRaisedIcon,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 hover:bg-orange-200'
  },
  {
    key: 'penalty_saved',
    label: 'Penalty Saved',
    icon: ShieldCheckIcon,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100 hover:bg-indigo-200'
  }
];

const EventTagger: React.FC<EventTaggerProps> = ({
  fixtureId,
  homeTeamLineup,
  awayTeamLineup,
  currentMinute,
  currentHalf,
  fixtureStatus,
  onEventCreated,
  onLineupUpdated
}) => {
  const { user } = useAuth();
  const [selectedEventType, setSelectedEventType] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedPlayerOut, setSelectedPlayerOut] = useState<Player | null>(null);
  const [selectedPlayerIn, setSelectedPlayerIn] = useState<Player | null>(null);
  const [customMinute, setCustomMinute] = useState<number | string>(currentMinute);
  const [extraInfo, setExtraInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Track current active lineups (updated after substitutions)
  const [activeHomeLineup, setActiveHomeLineup] = useState(homeTeamLineup);
  const [activeAwayLineup, setActiveAwayLineup] = useState(awayTeamLineup);

  // Track sent-off players
  const [sentOffPlayers, setSentOffPlayers] = useState<Set<number>>(new Set());

  // Track the current fixture ID to detect fixture changes
  const [currentFixtureId, setCurrentFixtureId] = useState<number | null>(null);

  // Check if current user is admin
  const isAdmin = user?.role === 'super_admin';

  // Update minute when timer changes
  React.useEffect(() => {
    setCustomMinute(currentMinute);
  }, [currentMinute]);

  // Handle fixture changes and lineup initialization
  React.useEffect(() => {
    // If fixture changed, reset lineups completely
    if (currentFixtureId !== fixtureId) {
      setCurrentFixtureId(fixtureId);
      setActiveHomeLineup(homeTeamLineup);
      setActiveAwayLineup(awayTeamLineup);
      setSentOffPlayers(new Set()); // Reset sent-off players for new match
      return;
    }

    // If same fixture but lineups not initialized, set them
    if (!activeHomeLineup && homeTeamLineup) {
      setActiveHomeLineup(homeTeamLineup);
    }
    if (!activeAwayLineup && awayTeamLineup) {
      setActiveAwayLineup(awayTeamLineup);
    }
  }, [fixtureId, homeTeamLineup, awayTeamLineup, currentFixtureId, activeHomeLineup, activeAwayLineup]);


  // Fetch match events to track sent-off players
  React.useEffect(() => {
    const fetchMatchEvents = async () => {
      try {
        const events = await eventsApi.getEvents(fixtureId);
        const redCardEvents = events.filter(event => event.event_type === 'red_card');
        const sentOffPlayerIds = new Set(redCardEvents.map(event => event.player_id));
        setSentOffPlayers(sentOffPlayerIds);
      } catch (error) {
        console.error('Error fetching match events:', error);
      }
    };

    if (fixtureId) {
      fetchMatchEvents();
    }
  }, [fixtureId]);

  // Update sent-off players when events are created
  const updateSentOffPlayers = (eventType: string, playerId: number) => {
    if (eventType === 'red_card') {
      setSentOffPlayers(prev => new Set(prev).add(playerId));
    }
  };

  const handleEventTypeSelect = (eventType: string) => {
    setSelectedEventType(eventType);
    setSelectedPlayer(null);
    setSelectedPlayerOut(null);
    setSelectedPlayerIn(null);
    setCustomMinute(currentMinute);
  };

  const handlePlayerSelect = (player: Player) => {
    setSelectedPlayer(player);
  };

  const handlePlayerOutSelect = (player: Player) => {
    setSelectedPlayerOut(player);
  };

  const handlePlayerInSelect = (player: Player) => {
    setSelectedPlayerIn(player);
  };

  const updateLineupAfterSubstitution = (playerOut: Player, playerIn: Player) => {
    // Determine which team the substitution affects
    const isHomeTeam = activeHomeLineup?.starters.some(lineup => lineup.player.id === playerOut.id) ||
                       activeHomeLineup?.substitutes.some(lineup => lineup.player.id === playerOut.id);

    if (isHomeTeam && activeHomeLineup) {
      // Find the outgoing player's lineup entry to preserve position
      const outgoingLineup = activeHomeLineup.starters.find(lineup => lineup.player.id === playerOut.id);
      const incomingSubLineup = activeHomeLineup.substitutes.find(lineup => lineup.player.id === playerIn.id);

      if (outgoingLineup && incomingSubLineup) {
        // Remove the outgoing player from starters and add incoming player with same position
        const newStarters = activeHomeLineup.starters
          .filter(lineup => lineup.player.id !== playerOut.id)
          .concat([{
            ...incomingSubLineup,
            player: playerIn,
            position_played: outgoingLineup.position_played, // Keep the position
            is_starter: true
          }]);

        // Remove the incoming player from substitutes and add outgoing player
        const newSubstitutes = activeHomeLineup.substitutes
          .filter(lineup => lineup.player.id !== playerIn.id)
          .concat([{
            ...outgoingLineup,
            player: playerOut,
            is_starter: false
          }]);

        setActiveHomeLineup(prevLineup => {
          if (!prevLineup) {
            return prevLineup;
          }

          // Create completely new objects to ensure React detects the change
          const updatedLineup = {
            ...prevLineup,
            starters: newStarters.map(starter => ({ ...starter })),
            substitutes: newSubstitutes.map(sub => ({ ...sub }))
          };

          // Notify parent of lineup change if callback provided
          if (onLineupUpdated && updatedLineup && activeAwayLineup) {
            setTimeout(() => {
              onLineupUpdated(updatedLineup, activeAwayLineup);
            }, 0);
          }

          return updatedLineup;
        });
      }
    } else if (activeAwayLineup) {
      // Find the outgoing player's lineup entry to preserve position
      const outgoingLineup = activeAwayLineup.starters.find(lineup => lineup.player.id === playerOut.id);
      const incomingSubLineup = activeAwayLineup.substitutes.find(lineup => lineup.player.id === playerIn.id);

      if (outgoingLineup && incomingSubLineup) {
        // Remove the outgoing player from starters and add incoming player with same position
        const newStarters = activeAwayLineup.starters
          .filter(lineup => lineup.player.id !== playerOut.id)
          .concat([{
            ...incomingSubLineup,
            player: playerIn,
            position_played: outgoingLineup.position_played, // Keep the position
            is_starter: true
          }]);

        // Remove the incoming player from substitutes and add outgoing player
        const newSubstitutes = activeAwayLineup.substitutes
          .filter(lineup => lineup.player.id !== playerIn.id)
          .concat([{
            ...outgoingLineup,
            player: playerOut,
            is_starter: false
          }]);

        setActiveAwayLineup(prevLineup => {
          if (!prevLineup) {
            return prevLineup;
          }

          // Create completely new objects to ensure React detects the change
          const updatedLineup = {
            ...prevLineup,
            starters: newStarters.map(starter => ({ ...starter })),
            substitutes: newSubstitutes.map(sub => ({ ...sub }))
          };

          // Notify parent of lineup change if callback provided
          if (onLineupUpdated && updatedLineup && activeHomeLineup) {
            setTimeout(() => {
              onLineupUpdated(activeHomeLineup, updatedLineup);
            }, 0);
          }

          return updatedLineup;
        });
      }
    }
  };

  const createEvent = async () => {
    if (selectedEventType === 'substitution') {
      if (!selectedPlayerOut || !selectedPlayerIn || currentHalf === 0) {
        alert('Please select both players (out and in) for substitution, and ensure match has started');
        return;
      }
    } else {
      if (!selectedEventType || !selectedPlayer || currentHalf === 0) {
        alert('Please select event type and player, and ensure match has started');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (selectedEventType === 'substitution') {
        // Create both substitution events
        await eventsApi.createEvent(fixtureId, {
          player_id: selectedPlayerOut!.id,
          event_type: 'substitution_out',
          minute: typeof customMinute === 'number' ? customMinute : currentMinute,
          half: currentHalf,
          extra_info: `Substituted by ${selectedPlayerIn!.name}`
        });

        await eventsApi.createEvent(fixtureId, {
          player_id: selectedPlayerIn!.id,
          event_type: 'substitution_in',
          minute: typeof customMinute === 'number' ? customMinute : currentMinute,
          half: currentHalf,
          extra_info: `Substitutes ${selectedPlayerOut!.name}`
        });

        // Update lineup state after successful substitution
        updateLineupAfterSubstitution(selectedPlayerOut!, selectedPlayerIn!);

      } else {
        // Create regular event
        await eventsApi.createEvent(fixtureId, {
          player_id: selectedPlayer!.id,
          event_type: selectedEventType,
          minute: typeof customMinute === 'number' ? customMinute : currentMinute,
          half: currentHalf,
          extra_info: extraInfo || null
        });

        // Update sent-off players list if it's a red card
        updateSentOffPlayers(selectedEventType, selectedPlayer!.id);
      }

      // Reset form
      setSelectedEventType(null);
      setSelectedPlayer(null);
      setSelectedPlayerOut(null);
      setSelectedPlayerIn(null);
      setExtraInfo('');
      setCustomMinute(currentMinute);

      if (onEventCreated) {
        onEventCreated();
      }
    } catch (error: any) {
      console.error('Error creating event:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to create event';
      alert(`Error creating event: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  const cancelSelection = () => {
    setSelectedEventType(null);
    setSelectedPlayer(null);
    setSelectedPlayerOut(null);
    setSelectedPlayerIn(null);
    setExtraInfo('');
    setCustomMinute(currentMinute);
  };

  // Block tagger access if match is completed
  if (fixtureStatus === 'completed' && user?.role === 'tagger') {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="text-center text-gray-500 py-8">
          <TrophyIcon className="h-12 w-12 mx-auto mb-3 text-green-500" />
          <p className="font-semibold text-gray-700">Match Completed</p>
          <p className="text-sm mt-1">This match has ended and is no longer available for tagging</p>
        </div>
      </div>
    );
  }

  if (currentHalf === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <p className="text-gray-600">Start the match to begin event tagging</p>
      </div>
    );
  }

  if (!activeHomeLineup || !activeAwayLineup) {
    return (
      <div className="bg-yellow-50 rounded-lg p-6 text-center">
        <p className="text-yellow-700">Lineups must be set before tagging events</p>
        <p className="text-sm text-yellow-600 mt-1">Please set lineups for both teams first</p>
      </div>
    );
  }

  // Get filtered players based on event type
  const getFilteredPlayers = (isHomeTeam: boolean) => {
    const lineup = isHomeTeam ? activeHomeLineup : activeAwayLineup;
    const teamName = isHomeTeam ? 'Home' : 'Away';

    if (!lineup) return { starters: [], substitutes: [], sentOff: [] };


    if (selectedEventType === 'substitution') {
      // For substitution, show both starters and substitutes (but not sent-off players)
      const filtered = {
        starters: lineup.starters.filter(l => !sentOffPlayers.has(l.player.id)),
        substitutes: lineup.substitutes,
        sentOff: []
      };
      return filtered;
    } else {
      // For all other events (goals, cards, penalties)
      const activeStarters = lineup.starters.filter(l => !sentOffPlayers.has(l.player.id));
      const sentOffStarters = lineup.starters.filter(l => sentOffPlayers.has(l.player.id));

      const filtered = {
        starters: activeStarters, // Only show active players on field
        substitutes: [],
        sentOff: isAdmin ? sentOffStarters : [] // Only show sent-off players to admins
      };

      return filtered;
    }
  };

  if (!selectedEventType) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tag Event</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {eventTypes.map((eventType) => {
            const IconComponent = eventType.icon;
            return (
              <button
                key={eventType.key}
                onClick={() => handleEventTypeSelect(eventType.key)}
                className={`p-3 rounded-lg border border-gray-200 transition-colors duration-200 ${eventType.bgColor}`}
              >
                <div className="flex flex-col items-center space-y-2">
                  <IconComponent className={`h-6 w-6 ${eventType.color}`} />
                  <span className="text-sm font-medium text-gray-700">
                    {eventType.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const selectedEventData = eventTypes.find(e => e.key === selectedEventType)!;
  const IconComponent = selectedEventData.icon;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <IconComponent className={`h-6 w-6 ${selectedEventData.color}`} />
          <h3 className="text-lg font-semibold text-gray-900">
            Tag {selectedEventData.label}
          </h3>
        </div>
        <button
          onClick={cancelSelection}
          className="text-gray-500 hover:text-gray-700"
        >
          <XCircleIcon className="h-6 w-6" />
        </button>
      </div>

      {(selectedEventType === 'substitution' ? (!selectedPlayerOut || !selectedPlayerIn) : !selectedPlayer) ? (
        <div>
          <p className="text-sm text-gray-600 mb-3">
            {selectedEventType === 'substitution' ? 'Select players for substitution:' : 'Select player:'}
          </p>

          {/* Home Team Players */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              {activeHomeLineup?.team.name}
            </h4>

            {(() => {
              const filteredHome = getFilteredPlayers(true);
              return (
                <>
                  {/* Starters */}
                  {filteredHome.starters.length > 0 && (
                    <div className="mb-2">
                      <h5 className="text-xs font-medium text-gray-600 mb-1">
                        {selectedEventType === 'substitution' ? 'Players on Field (to sub out)' : 'Players on Field'}
                      </h5>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {filteredHome.starters.map((lineup) => (
                          <button
                            key={lineup.player.id}
                            onClick={() => selectedEventType === 'substitution' ? handlePlayerOutSelect(lineup.player) : handlePlayerSelect(lineup.player)}
                            className={`p-2 text-left rounded border transition-colors ${
                              selectedEventType === 'substitution' && selectedPlayerOut?.id === lineup.player.id
                                ? 'border-red-300 bg-red-100'
                                : 'border-green-200 bg-green-50 hover:bg-green-100'
                            }`}
                          >
                            <div className="text-sm font-medium">{lineup.player.name}</div>
                            <div className="text-xs text-gray-500">
                              #{lineup.player.jersey_number} - {lineup.position_played || lineup.player.position}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Substitutes */}
                  {filteredHome.substitutes.length > 0 && (
                    <div>
                      <h5 className="text-xs font-medium text-gray-600 mb-1">
                        {selectedEventType === 'substitution' ? 'Substitutes (to sub in)' : 'Substitutes'}
                      </h5>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {filteredHome.substitutes.map((lineup) => (
                          <button
                            key={lineup.player.id}
                            onClick={() => selectedEventType === 'substitution' ? handlePlayerInSelect(lineup.player) : handlePlayerSelect(lineup.player)}
                            className={`p-2 text-left rounded border transition-colors ${
                              selectedEventType === 'substitution' && selectedPlayerIn?.id === lineup.player.id
                                ? 'border-blue-300 bg-blue-100'
                                : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                            }`}
                          >
                            <div className="text-sm font-medium">{lineup.player.name}</div>
                            <div className="text-xs text-gray-500">
                              #{lineup.player.jersey_number} - {lineup.player.position}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sent-off Players (Admin Only) */}
                  {(() => {
                    const filteredHome = getFilteredPlayers(true);
                    return filteredHome.sentOff.length > 0 && (
                      <div className="mt-3 p-2 bg-red-50 rounded border border-red-200">
                        <h5 className="text-xs font-medium text-red-700 mb-1 flex items-center">
                          <XCircleIcon className="h-3 w-3 mr-1" />
                          Sent Off Players (Admin Override)
                        </h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {filteredHome.sentOff.map((lineup) => (
                            <button
                              key={lineup.player.id}
                              onClick={() => handlePlayerSelect(lineup.player)}
                              className="p-2 text-left rounded border border-red-300 bg-red-100 hover:bg-red-200 transition-colors opacity-75 relative"
                            >
                              {/* Prominent SENT OFF Banner */}
                              <div className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md border-2 border-white">
                                SENT OFF
                              </div>
                              <div className="text-sm font-medium text-red-800 flex items-center">
                                <XCircleIcon className="h-3 w-3 mr-1" />
                                {lineup.player.name}
                              </div>
                              <div className="text-xs text-red-600">
                                #{lineup.player.jersey_number} - {lineup.position_played || lineup.player.position}
                              </div>
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-red-600 mt-1 italic">
                          ⚠️ Admin only: Select sent-off players to correct tagger mistakes
                        </p>
                      </div>
                    );
                  })()}
                </>
              );
            })()}
          </div>

          {/* Away Team Players */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              {activeAwayLineup?.team.name}
            </h4>

            {(() => {
              const filteredAway = getFilteredPlayers(false);
              return (
                <>
                  {/* Starters */}
                  {filteredAway.starters.length > 0 && (
                    <div className="mb-2">
                      <h5 className="text-xs font-medium text-gray-600 mb-1">
                        {selectedEventType === 'substitution' ? 'Players on Field (to sub out)' : 'Players on Field'}
                      </h5>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {filteredAway.starters.map((lineup) => (
                          <button
                            key={lineup.player.id}
                            onClick={() => selectedEventType === 'substitution' ? handlePlayerOutSelect(lineup.player) : handlePlayerSelect(lineup.player)}
                            className={`p-2 text-left rounded border transition-colors ${
                              selectedEventType === 'substitution' && selectedPlayerOut?.id === lineup.player.id
                                ? 'border-red-300 bg-red-100'
                                : 'border-blue-200 bg-blue-50 hover:bg-blue-100'
                            }`}
                          >
                            <div className="text-sm font-medium">{lineup.player.name}</div>
                            <div className="text-xs text-gray-500">
                              #{lineup.player.jersey_number} - {lineup.position_played || lineup.player.position}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Substitutes */}
                  {filteredAway.substitutes.length > 0 && (
                    <div>
                      <h5 className="text-xs font-medium text-gray-600 mb-1">
                        {selectedEventType === 'substitution' ? 'Substitutes (to sub in)' : 'Substitutes'}
                      </h5>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {filteredAway.substitutes.map((lineup) => (
                          <button
                            key={lineup.player.id}
                            onClick={() => selectedEventType === 'substitution' ? handlePlayerInSelect(lineup.player) : handlePlayerSelect(lineup.player)}
                            className={`p-2 text-left rounded border transition-colors ${
                              selectedEventType === 'substitution' && selectedPlayerIn?.id === lineup.player.id
                                ? 'border-blue-300 bg-blue-100'
                                : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                            }`}
                          >
                            <div className="text-sm font-medium">{lineup.player.name}</div>
                            <div className="text-xs text-gray-500">
                              #{lineup.player.jersey_number} - {lineup.player.position}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sent-off Players (Admin Only) */}
                  {(() => {
                    const filteredAway = getFilteredPlayers(false);
                    return filteredAway.sentOff.length > 0 && (
                      <div className="mt-3 p-2 bg-red-50 rounded border border-red-200">
                        <h5 className="text-xs font-medium text-red-700 mb-1 flex items-center">
                          <XCircleIcon className="h-3 w-3 mr-1" />
                          Sent Off Players (Admin Override)
                        </h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {filteredAway.sentOff.map((lineup) => (
                            <button
                              key={lineup.player.id}
                              onClick={() => handlePlayerSelect(lineup.player)}
                              className="p-2 text-left rounded border border-red-300 bg-red-100 hover:bg-red-200 transition-colors opacity-75 relative"
                            >
                              {/* Prominent SENT OFF Banner */}
                              <div className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md border-2 border-white">
                                SENT OFF
                              </div>
                              <div className="text-sm font-medium text-red-800 flex items-center">
                                <XCircleIcon className="h-3 w-3 mr-1" />
                                {lineup.player.name}
                              </div>
                              <div className="text-xs text-red-600">
                                #{lineup.player.jersey_number} - {lineup.position_played || lineup.player.position}
                              </div>
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-red-600 mt-1 italic">
                          ⚠️ Admin only: Select sent-off players to correct tagger mistakes
                        </p>
                      </div>
                    );
                  })()}
                </>
              );
            })()}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {selectedEventType === 'substitution' ? (
            /* Substitution summary */
            <div className="space-y-3">
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-red-800">Player Out</div>
                    <div className="font-medium">{selectedPlayerOut?.name}</div>
                    <div className="text-sm text-gray-600">
                      #{selectedPlayerOut?.jersey_number} - {selectedPlayerOut?.position}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedPlayerOut(null)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <XCircleIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-blue-800">Player In</div>
                    <div className="font-medium">{selectedPlayerIn?.name}</div>
                    <div className="text-sm text-gray-600">
                      #{selectedPlayerIn?.jersey_number} - {selectedPlayerIn?.position}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedPlayerIn(null)}
                    className="text-blue-400 hover:text-blue-600"
                  >
                    <XCircleIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Regular event summary */
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{selectedPlayer?.name}</div>
                  <div className="text-sm text-gray-600">
                    #{selectedPlayer?.jersey_number} - {selectedPlayer?.position}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPlayer(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minute
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={customMinute}
                onChange={(e) => {
                  const value = e.target.value;
                  setCustomMinute(value === '' ? '' : parseInt(value) || currentMinute);
                }}
                className="field-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Half
              </label>
              <input
                type="text"
                value={currentHalf === 1 ? '1st Half' : '2nd Half'}
                disabled
                className="field-input bg-gray-50"
              />
            </div>
          </div>

          {selectedEventType !== 'substitution' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Extra Info (Optional)
              </label>
              <input
                type="text"
                value={extraInfo}
                onChange={(e) => setExtraInfo(e.target.value)}
                placeholder="e.g., assisted by, reason for card..."
                className="field-input"
              />
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={createEvent}
              disabled={submitting}
              className="btn-primary flex-1"
            >
              {submitting ? 'Creating...' : selectedEventType === 'substitution' ? 'Make Substitution' : `Tag ${selectedEventData.label}`}
            </button>
            <button
              onClick={cancelSelection}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventTagger;