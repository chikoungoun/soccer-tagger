import React, { useState, useEffect } from 'react';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { Player, CreatePlayerData, Team } from '../types';
import { getImageUrl } from '../utils/imageUtils';

interface PlayerModalProps {
  player?: Player | null;
  teamId?: number;
  teams?: Team[];
  onSave: (data: CreatePlayerData | Partial<CreatePlayerData>) => void;
  onClose: () => void;
}

const PlayerModal: React.FC<PlayerModalProps> = ({ player, teamId, teams, onSave, onClose }) => {
  const [formData, setFormData] = useState<CreatePlayerData>({
    name: '',
    jersey_number: 1,
    position: 'MF',
    age: undefined,
    birth_date: '',
    nationality: '',
    photo_url: '',
    team_id: teamId || (teams && teams.length > 0 ? teams[0].id : 0),
    is_active: true
  });
  const [uploading, setUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');

  useEffect(() => {
    if (player) {
      setFormData({
        name: player.name,
        jersey_number: player.jersey_number,
        position: player.position,
        age: player.age,
        birth_date: player.birth_date || '',
        nationality: player.nationality || '',
        photo_url: player.photo_url || '',
        team_id: player.team_id,
        is_active: player.is_active
      });
      // Convert relative paths to full URLs for display
      setUploadedImageUrl(getImageUrl(player.photo_url));
    }
  }, [player]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name.trim()) {
      alert('Player name is required');
      return;
    }

    if (!formData.jersey_number || formData.jersey_number < 1 || formData.jersey_number > 99) {
      alert('Jersey number must be between 1 and 99');
      return;
    }

    if (!formData.team_id || formData.team_id === 0) {
      alert('Please select a team');
      return;
    }

    const dataToSave = {
      ...formData,
      name: formData.name.trim(),
      age: formData.age || undefined,
      birth_date: formData.birth_date && formData.birth_date.trim() ? formData.birth_date.trim() : undefined,
      nationality: formData.nationality?.trim() || undefined,
      photo_url: formData.photo_url?.trim() || undefined
    };
    onSave(dataToSave);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value ? parseInt(value) : (name === 'jersey_number' ? 1 : undefined)) :
              name === 'team_id' ? parseInt(value) :
              type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/uploads/player-photo', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();

      // Store the relative path in form data (for database)
      const relativePath = result.photo_url;
      // Use full URL for preview display
      const fullImageUrl = getImageUrl(relativePath);

      setUploadedImageUrl(fullImageUrl);
      setFormData(prev => ({ ...prev, photo_url: relativePath }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const positions = [
    { value: 'GK', label: 'Goalkeeper' },
    { value: 'DF', label: 'Defender' },
    { value: 'MF', label: 'Midfielder' },
    { value: 'FW', label: 'Forward' }
  ];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {player ? 'Edit Player' : 'Add New Player'}
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
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Player Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="field-input"
              placeholder="Enter player name"
            />
          </div>

          {/* Team Selection - only show when teams array is provided */}
          {teams && teams.length > 0 && (
            <div>
              <label htmlFor="team_id" className="block text-sm font-medium text-gray-700 mb-1">
                Team *
              </label>
              <select
                id="team_id"
                name="team_id"
                required
                value={formData.team_id}
                onChange={handleChange}
                className="field-input"
              >
                <option value={0}>Select a team</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="jersey_number" className="block text-sm font-medium text-gray-700 mb-1">
                Jersey Number *
              </label>
              <input
                type="number"
                id="jersey_number"
                name="jersey_number"
                required
                min="1"
                max="99"
                value={formData.jersey_number}
                onChange={handleChange}
                className="field-input"
              />
            </div>

            <div>
              <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
                Position *
              </label>
              <select
                id="position"
                name="position"
                required
                value={formData.position}
                onChange={handleChange}
                className="field-input"
              >
                {positions.map((pos) => (
                  <option key={pos.value} value={pos.value}>
                    {pos.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
                Age
              </label>
              <input
                type="number"
                id="age"
                name="age"
                min="16"
                max="50"
                value={formData.age || ''}
                onChange={handleChange}
                className="field-input"
                placeholder="25"
              />
            </div>

            <div>
              <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700 mb-1">
                Birth Date
              </label>
              <input
                type="date"
                id="birth_date"
                name="birth_date"
                value={formData.birth_date}
                onChange={handleChange}
                className="field-input"
              />
            </div>
          </div>

          <div>
            <label htmlFor="nationality" className="block text-sm font-medium text-gray-700 mb-1">
              Nationality
            </label>
            <input
              type="text"
              id="nationality"
              name="nationality"
              value={formData.nationality}
              onChange={handleChange}
              className="field-input"
              placeholder="Country"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Player Photo
            </label>
            <div className="space-y-3">
              {/* Image Preview */}
              {uploadedImageUrl && (
                <div className="flex items-center space-x-3">
                  <img
                    src={uploadedImageUrl}
                    alt="Player photo preview"
                    className="h-16 w-16 object-cover rounded-lg border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setUploadedImageUrl('');
                      setFormData(prev => ({ ...prev, photo_url: '' }));
                    }}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              )}

              {/* Upload Button */}
              <div className="flex items-center space-x-3">
                <label className="btn-secondary cursor-pointer flex items-center">
                  <PhotoIcon className="h-5 w-5 mr-2" />
                  {uploading ? 'Uploading...' : 'Upload Photo'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Manual URL Input */}
              <div>
                <input
                  type="text"
                  id="photo_url"
                  name="photo_url"
                  value={formData.photo_url}
                  onChange={handleChange}
                  className="field-input"
                  placeholder="Or enter photo URL manually"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="h-4 w-4 text-soccer-green focus:ring-soccer-green border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
              Active player
            </label>
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
              {player ? 'Update' : 'Add'} Player
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlayerModal;