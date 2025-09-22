import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { FixtureWithTeams, Team, CreateFixtureData, Gameweek } from '../types';

interface FixtureModalProps {
  fixture?: FixtureWithTeams | null;
  teams: Team[];
  gameweeks?: Gameweek[];
  onSave: (data: CreateFixtureData | Partial<CreateFixtureData>) => void;
  onClose: () => void;
}

const FixtureModal: React.FC<FixtureModalProps> = ({ fixture, teams, gameweeks = [], onSave, onClose }) => {
  const [formData, setFormData] = useState<CreateFixtureData>({
    home_team_id: 0,
    away_team_id: 0,
    match_date: '',
    venue: '',
    gameweek_id: undefined
  });

  useEffect(() => {
    if (fixture) {
      // Convert UTC date to local datetime-local format
      const localDate = new Date(fixture.match_date);
      const localDateString = new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);

      setFormData({
        home_team_id: fixture.home_team_id,
        away_team_id: fixture.away_team_id,
        match_date: localDateString,
        venue: fixture.venue || '',
        gameweek_id: fixture.gameweek_id
      });
    } else if (teams.length >= 2) {
      // Set default values for new fixture
      setFormData(prev => ({
        ...prev,
        home_team_id: teams[0].id,
        away_team_id: teams[1].id
      }));
    }
  }, [fixture, teams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.home_team_id === formData.away_team_id) {
      alert('A team cannot play against itself!');
      return;
    }

    const dataToSave = {
      ...formData,
      venue: formData.venue || undefined
    };
    onSave(dataToSave);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('team_id') || name === 'gameweek_id'
        ? (value === '' ? undefined : parseInt(value))
        : value
    }));
  };

  const availableAwayTeams = teams.filter(team => team.id !== formData.home_team_id);
  const availableHomeTeams = teams.filter(team => team.id !== formData.away_team_id);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {fixture ? 'Edit Fixture' : 'Schedule New Match'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="home_team_id" className="block text-sm font-medium text-gray-700 mb-1">
              Home Team *
            </label>
            <select
              id="home_team_id"
              name="home_team_id"
              required
              value={formData.home_team_id}
              onChange={handleChange}
              className="field-input"
            >
              <option value={0}>Select home team</option>
              {availableHomeTeams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="away_team_id" className="block text-sm font-medium text-gray-700 mb-1">
              Away Team *
            </label>
            <select
              id="away_team_id"
              name="away_team_id"
              required
              value={formData.away_team_id}
              onChange={handleChange}
              className="field-input"
            >
              <option value={0}>Select away team</option>
              {availableAwayTeams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          {gameweeks.length > 0 && (
            <div>
              <label htmlFor="gameweek_id" className="block text-sm font-medium text-gray-700 mb-1">
                Gameweek (Optional)
              </label>
              <select
                id="gameweek_id"
                name="gameweek_id"
                value={formData.gameweek_id || ''}
                onChange={handleChange}
                className="field-input"
              >
                <option value="">No gameweek assigned</option>
                {gameweeks.map(gameweek => (
                  <option key={gameweek.id} value={gameweek.id}>
                    {gameweek.name} (Week {gameweek.week_number})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="match_date" className="block text-sm font-medium text-gray-700 mb-1">
              Match Date & Time *
            </label>
            <input
              type="datetime-local"
              id="match_date"
              name="match_date"
              required
              value={formData.match_date}
              onChange={handleChange}
              className="field-input"
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>

          <div>
            <label htmlFor="venue" className="block text-sm font-medium text-gray-700 mb-1">
              Venue
            </label>
            <input
              type="text"
              id="venue"
              name="venue"
              value={formData.venue}
              onChange={handleChange}
              className="field-input"
              placeholder="Enter stadium or venue name"
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
              className="btn-primary"
              disabled={formData.home_team_id === 0 || formData.away_team_id === 0}
            >
              {fixture ? 'Update' : 'Schedule'} Match
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FixtureModal;