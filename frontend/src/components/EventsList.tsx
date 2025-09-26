import React, { useState, useEffect } from 'react';
import {
  FireIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftOnRectangleIcon,
  HandRaisedIcon,
  ShieldCheckIcon,
  TrashIcon,
  PencilIcon,
  UserPlusIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { eventsApi, rewardsApi } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

interface MatchEvent {
  id: number;
  fixture_id: number;
  player_id: number;
  player_name: string;
  player_position: string;
  player_birth_date: string | null;
  event_type: string;
  minute: number;
  half: number;
  extra_info: string | null;
  created_by: number | null;
  tagger_name: string;
  created_at: string;
  is_admin_corrected?: boolean;
}

interface TeamLineup {
  team: {
    id: number;
    name: string;
    logo_url?: string;
  };
  starters: Array<{
    player: {
      id: number;
      name: string;
      position: string;
      jersey_number: number;
    };
    position_played: string;
  }>;
  substitutes: Array<{
    player: {
      id: number;
      name: string;
      position: string;
      jersey_number: number;
    };
  }>;
}

interface EventsListProps {
  fixtureId: number;
  homeTeamLineup?: TeamLineup | null;
  awayTeamLineup?: TeamLineup | null;
  refreshTrigger?: number;
  onEventDeleted?: () => void;
  onEventEdit?: (event: MatchEvent) => void;
}

const eventIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  goal: FireIcon,
  assist: UserPlusIcon,
  yellow_card: ExclamationTriangleIcon,
  red_card: XCircleIcon,
  substitution_in: ArrowRightOnRectangleIcon,
  substitution_out: ArrowLeftOnRectangleIcon,
  penalty_miss: HandRaisedIcon,
  penalty_saved: ShieldCheckIcon
};

const eventColors: Record<string, { text: string; bg: string }> = {
  goal: { text: 'text-green-600', bg: 'bg-green-50' },
  assist: { text: 'text-purple-600', bg: 'bg-purple-50' },
  yellow_card: { text: 'text-yellow-600', bg: 'bg-yellow-50' },
  red_card: { text: 'text-red-600', bg: 'bg-red-50' },
  substitution_in: { text: 'text-blue-600', bg: 'bg-blue-50' },
  substitution_out: { text: 'text-purple-600', bg: 'bg-purple-50' },
  penalty_miss: { text: 'text-orange-600', bg: 'bg-orange-50' },
  penalty_saved: { text: 'text-indigo-600', bg: 'bg-indigo-50' }
};

const eventLabels: Record<string, string> = {
  goal: 'Goal',
  assist: 'Assist',
  yellow_card: 'Yellow Card',
  red_card: 'Red Card',
  substitution_in: 'Substitution In',
  substitution_out: 'Substitution Out',
  penalty_miss: 'Penalty Miss',
  penalty_saved: 'Penalty Saved'
};

const EventsList: React.FC<EventsListProps> = ({ fixtureId, homeTeamLineup, awayTeamLineup, refreshTrigger, onEventDeleted, onEventEdit }) => {
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchEvents();
  }, [fixtureId, refreshTrigger]);

  const fetchEvents = async () => {
    try {
      const eventsData = await eventsApi.getEvents(fixtureId);

      // Sort by created_at timestamp (most recent first)
      const sortedEvents = [...eventsData].sort((a, b) => {
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        return timeB - timeA; // Most recent recordings first
      });

      setEvents(sortedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (eventId: number) => {
    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      await eventsApi.deleteEvent(eventId);
      setEvents(events.filter(e => e.id !== eventId));
      if (onEventDeleted) {
        onEventDeleted();
      }
    } catch (error: any) {
      console.error('Error deleting event:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to delete event';
      alert(`Error deleting event: ${errorMessage}`);
    }
  };

  const correctEvent = async (event: MatchEvent) => {
    if (!confirm(`Mark this event as corrected?\n\nThis will apply a penalty to the tagger "${event.tagger_name}" and recalculate their reward for this match.`)) {
      return;
    }

    try {
      // Mark the specific event as corrected
      const result = await rewardsApi.markEventCorrected(event.id);

      // Show detailed success message
      alert(`Event marked as corrected!\n\nPenalty applied to ${event.tagger_name}:\n- New accuracy: ${result.new_accuracy.toFixed(1)}%\n- New reward: $${result.new_reward.toFixed(2)}`);

      // Refresh events to show visual changes
      fetchEvents();
    } catch (error: any) {
      console.error('Error marking event as corrected:', error);
      console.log('Full error response:', error.response);
      console.log('Error response data:', error.response?.data);
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || 'Failed to mark event as corrected';
      alert(`Error: ${errorMessage}\n\nFull response: ${JSON.stringify(error.response?.data)}`);
    }
  };

  const uncorrectEvent = async (event: MatchEvent) => {
    if (!confirm(`Remove correction from this event?\n\nThis will restore the tagger "${event.tagger_name}"'s reward for this match.`)) {
      return;
    }

    try {
      // Remove the correction from the event
      const result = await rewardsApi.uncorrectEvent(event.id);

      // Show detailed success message
      alert(`Correction removed!\n\nReward restored for ${event.tagger_name}:\n- New accuracy: ${result.new_accuracy.toFixed(1)}%\n- New reward: $${result.new_reward.toFixed(2)}`);

      // Refresh events to show visual changes
      fetchEvents();
    } catch (error: any) {
      console.error('Error removing correction:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to remove correction';
      alert(`Error: ${errorMessage}`);
    }
  };

  const formatTime = (minute: number, half: number) => {
    if (half === 1) {
      return `${minute}'`;
    } else {
      return `${45 + minute}'`;
    }
  };

  const getPlayerTeam = (playerId: number) => {
    if (!homeTeamLineup || !awayTeamLineup) return null;

    // Check home team starters and substitutes
    const homeStarter = homeTeamLineup.starters.find(lineup => lineup.player.id === playerId);
    const homeSubstitute = homeTeamLineup.substitutes.find(lineup => lineup.player.id === playerId);

    if (homeStarter || homeSubstitute) {
      return {
        name: homeTeamLineup.team.name,
        logo_url: homeTeamLineup.team.logo_url
      };
    }

    // Check away team starters and substitutes
    const awayStarter = awayTeamLineup.starters.find(lineup => lineup.player.id === playerId);
    const awaySubstitute = awayTeamLineup.substitutes.find(lineup => lineup.player.id === playerId);

    if (awayStarter || awaySubstitute) {
      return {
        name: awayTeamLineup.team.name,
        logo_url: awayTeamLineup.team.logo_url
      };
    }

    return null;
  };

  const formatPeriod = (half: number) => {
    if (half === 1) {
      return "1st Half";
    } else if (half === 2) {
      return "2nd Half";
    }
    return `Half ${half}`;
  };

  const formatBirthDate = (birthDate: string | null) => {
    if (!birthDate) return null;

    const date = new Date(birthDate);
    const today = new Date();

    // Calculate age
    let age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
      age--;
    }

    return `${age} years old`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Match Events</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-soccer-green"></div>
        </div>
      </div>
    );
  }

  // Use events directly since they're already sorted by the backend

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Match Events
        {events.length > 0 && (
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({events.length})
          </span>
        )}
      </h3>

      {events.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <FireIcon className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-gray-600">No events tagged yet</p>
          <p className="text-sm text-gray-500">Start tagging events as they happen during the match</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const IconComponent = eventIcons[event.event_type] || FireIcon;
            const colors = eventColors[event.event_type] || eventColors.goal;
            const label = eventLabels[event.event_type] || event.event_type;

            return (
              <div
                key={event.id}
                className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                  event.is_admin_corrected
                    ? 'border-orange-300 bg-orange-50/30'
                    : `border-gray-200 ${colors.bg}`
                }`}
              >
                {event.is_admin_corrected && (
                  <div className="flex items-center space-x-2 mb-3 px-3 py-2 bg-orange-100 border border-orange-300 rounded-lg">
                    <CheckCircleIcon className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-800">Admin Corrected</span>
                    <span className="text-xs text-orange-600">Penalty applied to {event.tagger_name}</span>
                  </div>
                )}
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <IconComponent className={`h-6 w-6 ${colors.text}`} />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="text-lg font-medium text-gray-900">
                          {formatTime(event.minute, event.half)}
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${colors.text} bg-white`}>
                          {label}
                        </div>
                        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {formatPeriod(event.half)}
                        </div>
                      </div>

                      <div className="mt-1">
                        <div className="font-semibold text-gray-900">
                          {event.player_name}
                        </div>
                        <div className="text-sm text-gray-600 flex items-center space-x-2">
                          <span>{event.player_position}</span>
                          {getPlayerTeam(event.player_id) && (
                            <div className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {getPlayerTeam(event.player_id)?.logo_url && (
                                <img
                                  src={`http://localhost:8000${getPlayerTeam(event.player_id)?.logo_url}`}
                                  alt={`${getPlayerTeam(event.player_id)?.name} logo`}
                                  className="w-4 h-4 object-contain rounded-full bg-white"
                                />
                              )}
                              <span className="text-xs">
                                {getPlayerTeam(event.player_id)?.name}
                              </span>
                            </div>
                          )}
                          {formatBirthDate(event.player_birth_date) && (
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              {formatBirthDate(event.player_birth_date)}
                            </span>
                          )}
                        </div>
                      </div>

                      {event.extra_info && (
                        <div className="mt-2 text-sm text-gray-700 italic">
                          {event.extra_info}
                        </div>
                      )}

                      <div className="mt-2 flex items-center space-x-2 text-xs text-gray-500">
                        <span>{new Date(event.created_at).toLocaleString()}</span>
                        <span>•</span>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Tagged by: {event.tagger_name}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    {user?.role === 'super_admin' && event.created_by && event.created_by !== user.id && (
                      <button
                        onClick={() => event.is_admin_corrected ? uncorrectEvent(event) : correctEvent(event)}
                        className={`flex-shrink-0 p-1 transition-colors rounded-full ${
                          event.is_admin_corrected
                            ? 'text-red-600 bg-red-100 hover:text-red-700 hover:bg-red-200'
                            : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                        }`}
                        title={event.is_admin_corrected ? "Remove correction (restore reward)" : "Mark as corrected (applies penalty)"}
                      >
                        {event.is_admin_corrected ? (
                          <XMarkIcon className="h-4 w-4" />
                        ) : (
                          <CheckCircleIcon className="h-4 w-4" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => onEventEdit && onEventEdit(event)}
                      className="flex-shrink-0 p-1 text-gray-400 hover:text-blue-600 transition-colors rounded"
                      title="Edit event"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteEvent(event.id)}
                      className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600 transition-colors rounded"
                      title="Delete event"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EventsList;