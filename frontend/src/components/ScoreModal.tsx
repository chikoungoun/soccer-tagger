import React, { useState } from 'react';
import { XMarkIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline';
import { FixtureWithTeams } from '../types';

interface ScoreModalProps {
  fixture: FixtureWithTeams;
  onSave: (homeScore: number, awayScore: number) => void;
  onClose: () => void;
}

const ScoreModal: React.FC<ScoreModalProps> = ({ fixture, onSave, onClose }) => {
  const [homeScore, setHomeScore] = useState(fixture.home_score);
  const [awayScore, setAwayScore] = useState(fixture.away_score);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(homeScore, awayScore);
  };

  const adjustScore = (team: 'home' | 'away', delta: number) => {
    if (team === 'home') {
      setHomeScore(Math.max(0, homeScore + delta));
    } else {
      setAwayScore(Math.max(0, awayScore + delta));
    }
  };

  const handleScoreChange = (team: 'home' | 'away', value: string) => {
    const score = parseInt(value) || 0;
    if (score >= 0) {
      if (team === 'home') {
        setHomeScore(score);
      } else {
        setAwayScore(score);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Update Score</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="text-center mb-6">
          <div className="text-sm text-gray-600 mb-2">
            {new Date(fixture.match_date).toLocaleDateString()} at{' '}
            {new Date(fixture.match_date).toLocaleTimeString()}
          </div>
          {fixture.venue && (
            <div className="text-sm text-gray-500">{fixture.venue}</div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Home Team Score */}
          <div className="text-center">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">
              {fixture.home_team.name}
            </h4>
            <div className="flex items-center justify-center space-x-4">
              <button
                type="button"
                onClick={() => adjustScore('home', -1)}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                disabled={homeScore === 0}
              >
                <MinusIcon className="h-4 w-4" />
              </button>

              <input
                type="number"
                min="0"
                max="99"
                value={homeScore}
                onChange={(e) => handleScoreChange('home', e.target.value)}
                className="w-20 text-center text-2xl font-bold border border-gray-300 rounded-md py-2"
              />

              <button
                type="button"
                onClick={() => adjustScore('home', 1)}
                className="p-2 rounded-full bg-soccer-green hover:bg-soccer-dark text-white transition-colors"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* VS Separator */}
          <div className="text-center">
            <span className="text-2xl font-bold text-gray-400">VS</span>
          </div>

          {/* Away Team Score */}
          <div className="text-center">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">
              {fixture.away_team.name}
            </h4>
            <div className="flex items-center justify-center space-x-4">
              <button
                type="button"
                onClick={() => adjustScore('away', -1)}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                disabled={awayScore === 0}
              >
                <MinusIcon className="h-4 w-4" />
              </button>

              <input
                type="number"
                min="0"
                max="99"
                value={awayScore}
                onChange={(e) => handleScoreChange('away', e.target.value)}
                className="w-20 text-center text-2xl font-bold border border-gray-300 rounded-md py-2"
              />

              <button
                type="button"
                onClick={() => adjustScore('away', 1)}
                className="p-2 rounded-full bg-soccer-green hover:bg-soccer-dark text-white transition-colors"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Current Status */}
          <div className="text-center">
            <span className={`status-${fixture.status}`}>
              {fixture.status.charAt(0).toUpperCase() + fixture.status.slice(1)}
            </span>
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
            >
              Update Score
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScoreModal;