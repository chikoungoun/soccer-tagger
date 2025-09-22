import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Gameweek, CreateGameweekData } from '../types';

interface GameweekModalProps {
  gameweek?: Gameweek | null;
  onSave: (data: CreateGameweekData | Partial<CreateGameweekData>) => void;
  onClose: () => void;
}

const GameweekModal: React.FC<GameweekModalProps> = ({ gameweek, onSave, onClose }) => {
  const [formData, setFormData] = useState<CreateGameweekData>({
    week_number: 1,
    name: '',
    start_date: '',
    end_date: '',
    is_active: false,
  });

  useEffect(() => {
    if (gameweek) {
      setFormData({
        week_number: gameweek.week_number,
        name: gameweek.name,
        start_date: gameweek.start_date.split('T')[0], // Convert to YYYY-MM-DD format
        end_date: gameweek.end_date.split('T')[0],
        is_active: gameweek.is_active,
      });
    } else {
      // Auto-generate name when week number changes
      const weekNum = formData.week_number;
      setFormData(prev => ({
        ...prev,
        name: `Gameweek ${weekNum}`,
      }));
    }
  }, [gameweek]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) || 0 : value,
      };

      // Auto-update name when week number changes
      if (name === 'week_number') {
        newData.name = `Gameweek ${value}`;
      }

      // Auto-calculate end date when start date changes (7 days later)
      if (name === 'start_date' && value) {
        const startDate = new Date(value);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6); // 7-day gameweek
        newData.end_date = endDate.toISOString().split('T')[0];
      }

      return newData;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.start_date || !formData.end_date) {
      alert('Please fill in all required fields');
      return;
    }

    if (new Date(formData.end_date) <= new Date(formData.start_date)) {
      alert('End date must be after start date');
      return;
    }

    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md m-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {gameweek ? 'Edit Gameweek' : 'Create Gameweek'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Week Number *
            </label>
            <input
              type="number"
              name="week_number"
              value={formData.week_number}
              onChange={handleChange}
              min="1"
              max="52"
              className="field-input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="field-input"
              placeholder="e.g., Gameweek 1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date *
            </label>
            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              className="field-input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date *
            </label>
            <input
              type="date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              className="field-input"
              required
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="h-4 w-4 text-soccer-green focus:ring-soccer-green border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">
              Set as active gameweek
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
            >
              {gameweek ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GameweekModal;