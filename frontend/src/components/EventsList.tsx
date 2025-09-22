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
  PencilIcon
} from '@heroicons/react/24/outline';

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
  created_at: string;
}

interface TeamLineup {
  team: {
    id: number;
    name: string;
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
  yellow_card: ExclamationTriangleIcon,
  red_card: XCircleIcon,
  substitution_in: ArrowRightOnRectangleIcon,
  substitution_out: ArrowLeftOnRectangleIcon,
  penalty_miss: HandRaisedIcon,
  penalty_saved: ShieldCheckIcon
};

const eventColors: Record<string, { text: string; bg: string }> = {
  goal: { text: 'text-green-600', bg: 'bg-green-50' },
  yellow_card: { text: 'text-yellow-600', bg: 'bg-yellow-50' },
  red_card: { text: 'text-red-600', bg: 'bg-red-50' },
  substitution_in: { text: 'text-blue-600', bg: 'bg-blue-50' },
  substitution_out: { text: 'text-purple-600', bg: 'bg-purple-50' },
  penalty_miss: { text: 'text-orange-600', bg: 'bg-orange-50' },
  penalty_saved: { text: 'text-indigo-600', bg: 'bg-indigo-50' }
};

const eventLabels: Record<string, string> = {
  goal: 'Goal',
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

  useEffect(() => {
    fetchEvents();
  }, [fixtureId, refreshTrigger]);

  const fetchEvents = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/events/fixtures/${fixtureId}/events`);
      if (response.ok) {
        const eventsData = await response.json();
        setEvents(eventsData);
      }
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
      const response = await fetch(`http://localhost:8000/api/events/events/${eventId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setEvents(events.filter(e => e.id !== eventId));
        if (onEventDeleted) {
          onEventDeleted();
        }
      } else {
        const error = await response.json();
        alert(`Error deleting event: ${error.detail}`);
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event');
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
      return homeTeamLineup.team.name;
    }

    // Check away team starters and substitutes
    const awayStarter = awayTeamLineup.starters.find(lineup => lineup.player.id === playerId);
    const awaySubstitute = awayTeamLineup.substitutes.find(lineup => lineup.player.id === playerId);

    if (awayStarter || awaySubstitute) {
      return awayTeamLineup.team.name;
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
                className={`p-4 rounded-lg border border-gray-200 ${colors.bg} transition-all duration-200 hover:shadow-md`}
              >
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
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {getPlayerTeam(event.player_id)}
                            </span>
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

                      <div className="mt-2 text-xs text-gray-500">
                        {new Date(event.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onEventEdit && onEventEdit(event)}
                      className="flex-shrink-0 p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Edit event"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteEvent(event.id)}
                      className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600 transition-colors"
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