import React, { useState, useEffect } from 'react';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { Team, CreateTeamData } from '../types';

interface TeamModalProps {
  team?: Team | null;
  onSave: (data: CreateTeamData | Partial<CreateTeamData>) => void;
  onClose: () => void;
}

const TeamModal: React.FC<TeamModalProps> = ({ team, onSave, onClose }) => {
  const [formData, setFormData] = useState<CreateTeamData>({
    name: '',
    logo_url: '',
    founded_year: undefined,
    stadium: '',
    description: ''
  });
  const [uploading, setUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');

  useEffect(() => {
    if (team) {
      setFormData({
        name: team.name,
        logo_url: team.logo_url || '',
        founded_year: team.founded_year,
        stadium: team.stadium || '',
        description: team.description || ''
      });
      setUploadedImageUrl(team.logo_url || '');
    }
  }, [team]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = {
      ...formData,
      logo_url: formData.logo_url || undefined,
      founded_year: formData.founded_year || undefined,
      stadium: formData.stadium || undefined,
      description: formData.description || undefined
    };
    onSave(dataToSave);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'founded_year' ? (value ? parseInt(value) : undefined) : value
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:8000/api/uploads/team-logo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      const imageUrl = `http://localhost:8000${result.logo_url}`;

      setUploadedImageUrl(imageUrl);
      setFormData(prev => ({ ...prev, logo_url: imageUrl }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {team ? 'Edit Team' : 'Create New Team'}
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
              Team Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="field-input"
              placeholder="Enter team name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Team Logo
            </label>
            <div className="space-y-3">
              {/* Image Preview */}
              {uploadedImageUrl && (
                <div className="flex items-center space-x-3">
                  <img
                    src={uploadedImageUrl}
                    alt="Team logo preview"
                    className="h-16 w-16 object-cover rounded-lg border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setUploadedImageUrl('');
                      setFormData(prev => ({ ...prev, logo_url: '' }));
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
                  {uploading ? 'Uploading...' : 'Upload Logo'}
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
                  type="url"
                  id="logo_url"
                  name="logo_url"
                  value={formData.logo_url}
                  onChange={handleChange}
                  className="field-input"
                  placeholder="Or enter logo URL manually"
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="founded_year" className="block text-sm font-medium text-gray-700 mb-1">
              Founded Year
            </label>
            <input
              type="number"
              id="founded_year"
              name="founded_year"
              min="1800"
              max={new Date().getFullYear()}
              value={formData.founded_year || ''}
              onChange={handleChange}
              className="field-input"
              placeholder="1900"
            />
          </div>

          <div>
            <label htmlFor="stadium" className="block text-sm font-medium text-gray-700 mb-1">
              Stadium
            </label>
            <input
              type="text"
              id="stadium"
              name="stadium"
              value={formData.stadium}
              onChange={handleChange}
              className="field-input"
              placeholder="Enter stadium name"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="field-input"
              placeholder="Enter team description"
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
            >
              {team ? 'Update' : 'Create'} Team
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeamModal;