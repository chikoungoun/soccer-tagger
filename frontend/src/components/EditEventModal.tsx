import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  FireIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftOnRectangleIcon,
  HandRaisedIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { Player, TeamLineup } from '../types';

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

interface EditEventModalProps {
  event: MatchEvent;
  homeTeamLineup: TeamLineup;
  awayTeamLineup: TeamLineup;
  onSave: (eventId: number, eventData: any) => void;
  onClose: () => void;
}

interface EventType {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const eventTypes: EventType[] = [
  {
    key: 'goal',
    label: 'Goal',
    icon: FireIcon,
    color: 'text-green-600'
  },
  {
    key: 'yellow_card',
    label: 'Yellow Card',
    icon: ExclamationTriangleIcon,
    color: 'text-yellow-600'
  },
  {
    key: 'red_card',
    label: 'Red Card',
    icon: XCircleIcon,
    color: 'text-red-600'
  },
  {
    key: 'substitution',
    label: 'Substitution',
    icon: ArrowRightOnRectangleIcon,
    color: 'text-blue-600'
  },
  {
    key: 'substitution_in',
    label: 'Sub In',
    icon: ArrowRightOnRectangleIcon,
    color: 'text-blue-600'
  },
  {
    key: 'substitution_out',
    label: 'Sub Out',
    icon: ArrowLeftOnRectangleIcon,
    color: 'text-purple-600'
  },
  {
    key: 'penalty_miss',
    label: 'Penalty Miss',
    icon: HandRaisedIcon,
    color: 'text-orange-600'
  },
  {
    key: 'penalty_saved',
    label: 'Penalty Saved',
    icon: ShieldCheckIcon,
    color: 'text-indigo-600'
  }
];

const EditEventModal: React.FC<EditEventModalProps> = ({
  event,
  homeTeamLineup,
  awayTeamLineup,
  onSave,
  onClose
}) => {
  const [formData, setFormData] = useState({
    player_id: event.player_id,
    event_type: event.event_type,
    minute: event.minute,
    half: event.half,
    extra_info: event.extra_info || ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Get filtered players based on event type
  const getFilteredPlayers = () => {
    if (formData.event_type === 'substitution_in') {
      // For sub in, only show substitutes (from original lineup since this is historical)
      return {
        homeStarters: [],
        homeSubstitutes: homeTeamLineup.substitutes,
        awayStarters: [],
        awaySubstitutes: awayTeamLineup.substitutes
      };
    } else if (formData.event_type === 'substitution_out') {
      // For sub out, only show starters (from original lineup since this is historical)
      return {
        homeStarters: homeTeamLineup.starters,
        homeSubstitutes: [],
        awayStarters: awayTeamLineup.starters,
        awaySubstitutes: []
      };
    } else if (formData.event_type === 'substitution') {
      // For new substitution event, show all players
      return {
        homeStarters: homeTeamLineup.starters,
        homeSubstitutes: homeTeamLineup.substitutes,
        awayStarters: awayTeamLineup.starters,
        awaySubstitutes: awayTeamLineup.substitutes
      };
    } else {
      // For all other events (goals, cards, penalties), only show starters (players on field)
      return {
        homeStarters: homeTeamLineup.starters,
        homeSubstitutes: [],
        awayStarters: awayTeamLineup.starters,
        awaySubstitutes: []
      };
    }
  };

  const filteredPlayers = getFilteredPlayers();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await onSave(event.id, formData);
      onClose();
    } catch (error) {
      console.error('Error updating event:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'player_id' ? parseInt(value) :
              name === 'minute' ? parseInt(value) :
              name === 'half' ? parseInt(value) : value
    }));
  };

  const selectedEventType = eventTypes.find(et => et.key === formData.event_type);

  // Get all players from both teams for finding the selected player
  const allPlayers = [
    ...filteredPlayers.homeStarters.map(lineup => lineup.player),
    ...filteredPlayers.homeSubstitutes.map(lineup => lineup.player),
    ...filteredPlayers.awayStarters.map(lineup => lineup.player),
    ...filteredPlayers.awaySubstitutes.map(lineup => lineup.player)
  ];
  const selectedPlayer = allPlayers.find(p => p.id === formData.player_id);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            {selectedEventType && <selectedEventType.icon className={`h-6 w-6 ${selectedEventType.color}`} />}
            <h3 className="text-lg font-medium text-gray-900">Edit Event</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="event_type" className="block text-sm font-medium text-gray-700 mb-1">
              Event Type
            </label>
            <select
              id="event_type"
              name="event_type"
              required
              value={formData.event_type}
              onChange={handleChange}
              className="field-input"
            >
              {eventTypes.map((eventType) => (
                <option key={eventType.key} value={eventType.key}>
                  {eventType.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="player_id" className="block text-sm font-medium text-gray-700 mb-1">
              Player
            </label>
            <select
              id="player_id"
              name="player_id"
              required
              value={formData.player_id}
              onChange={handleChange}
              className="field-input"
            >
              <option value="">Select a player</option>
              <optgroup label={homeTeamLineup.team.name}>
                {filteredPlayers.homeStarters.length > 0 && (
                  <>
                    <option disabled>
                      --- {
                        formData.event_type === 'substitution_out' ? 'Available to Sub Out' :
                        formData.event_type === 'substitution' ? 'Players on Field (to sub out)' :
                        'Players on Field'
                      } ---
                    </option>
                    {filteredPlayers.homeStarters.map((lineup) => (
                      <option key={lineup.player.id} value={lineup.player.id}>
                        {lineup.player.name} (#{lineup.player.jersey_number})
                      </option>
                    ))}
                  </>
                )}
                {filteredPlayers.homeSubstitutes.length > 0 && (
                  <>
                    <option disabled>
                      --- {
                        formData.event_type === 'substitution_in' ? 'Available to Sub In' :
                        formData.event_type === 'substitution' ? 'Substitutes (to sub in)' :
                        'Substitutes'
                      } ---
                    </option>
                    {filteredPlayers.homeSubstitutes.map((lineup) => (
                      <option key={lineup.player.id} value={lineup.player.id}>
                        {lineup.player.name} (#{lineup.player.jersey_number})
                      </option>
                    ))}
                  </>
                )}
              </optgroup>
              <optgroup label={awayTeamLineup.team.name}>
                {filteredPlayers.awayStarters.length > 0 && (
                  <>
                    <option disabled>
                      --- {
                        formData.event_type === 'substitution_out' ? 'Available to Sub Out' :
                        formData.event_type === 'substitution' ? 'Players on Field (to sub out)' :
                        'Players on Field'
                      } ---
                    </option>
                    {filteredPlayers.awayStarters.map((lineup) => (
                      <option key={lineup.player.id} value={lineup.player.id}>
                        {lineup.player.name} (#{lineup.player.jersey_number})
                      </option>
                    ))}
                  </>
                )}
                {filteredPlayers.awaySubstitutes.length > 0 && (
                  <>
                    <option disabled>
                      --- {
                        formData.event_type === 'substitution_in' ? 'Available to Sub In' :
                        formData.event_type === 'substitution' ? 'Substitutes (to sub in)' :
                        'Substitutes'
                      } ---
                    </option>
                    {filteredPlayers.awaySubstitutes.map((lineup) => (
                      <option key={lineup.player.id} value={lineup.player.id}>
                        {lineup.player.name} (#{lineup.player.jersey_number})
                      </option>
                    ))}
                  </>
                )}
              </optgroup>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="minute" className="block text-sm font-medium text-gray-700 mb-1">
                Minute
              </label>
              <input
                type="number"
                id="minute"
                name="minute"
                required
                min="1"
                max="120"
                value={formData.minute}
                onChange={handleChange}
                className="field-input"
              />
            </div>

            <div>
              <label htmlFor="half" className="block text-sm font-medium text-gray-700 mb-1">
                Half
              </label>
              <select
                id="half"
                name="half"
                required
                value={formData.half}
                onChange={handleChange}
                className="field-input"
              >
                <option value={1}>1st Half</option>
                <option value={2}>2nd Half</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="extra_info" className="block text-sm font-medium text-gray-700 mb-1">
              Extra Info (Optional)
            </label>
            <input
              type="text"
              id="extra_info"
              name="extra_info"
              value={formData.extra_info}
              onChange={handleChange}
              placeholder="e.g., assisted by, reason for card..."
              className="field-input"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEventModal;