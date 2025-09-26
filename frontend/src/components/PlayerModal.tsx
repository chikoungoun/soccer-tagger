import React, { useState, useEffect } from 'react';
import { Upload, User, Hash, MapPin, Calendar, Globe, Shield, X, Check, AlertCircle, UserPlus } from 'lucide-react';
import { Player, CreatePlayerData, Team } from '../types';
import { getImageUrl } from '../utils/imageUtils';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface PlayerModalProps {
  player?: Player | null;
  teamId?: number;
  teams?: Team[];
  onSave: (data: CreatePlayerData | Partial<CreatePlayerData>) => void;
  onClose: () => void;
  isOpen: boolean;
}

const PlayerModal: React.FC<PlayerModalProps> = ({
  player,
  teamId,
  teams,
  onSave,
  onClose,
  isOpen
}) => {
  const [formData, setFormData] = useState<CreatePlayerData>({
    name: '',
    jersey_number: undefined,
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setUploadedImageUrl(getImageUrl(player.photo_url));
    } else {
      // Reset form for new player
      setFormData({
        name: '',
        jersey_number: undefined,
        position: 'MF',
        age: undefined,
        birth_date: '',
        nationality: '',
        photo_url: '',
        team_id: teamId || (teams && teams.length > 0 ? teams[0].id : 0),
        is_active: true
      });
      setUploadedImageUrl('');
    }
    setErrors({});
  }, [player, teamId, teams, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Player name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Player name must be at least 2 characters';
    }

    if (!formData.jersey_number || formData.jersey_number < 1 || formData.jersey_number > 99) {
      newErrors.jersey_number = 'Jersey number must be between 1 and 99';
    }

    if (!formData.team_id || formData.team_id === 0) {
      newErrors.team_id = 'Please select a team';
    }

    if (formData.age && (formData.age < 16 || formData.age > 50)) {
      newErrors.age = 'Age must be between 16 and 50';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const dataToSave = {
        ...formData,
        name: formData.name.trim(),
        age: formData.age || undefined,
        birth_date: formData.birth_date && formData.birth_date.trim() ? formData.birth_date.trim() : undefined,
        nationality: formData.nationality?.trim() || undefined,
        photo_url: formData.photo_url?.trim() || undefined
      };

      await onSave(dataToSave);
    } catch (error) {
      console.error('Error saving player:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [name]: name === 'jersey_number'
        ? (value && value.trim() !== '' ? parseInt(value) : undefined)
        : name === 'age' || name === 'team_id'
        ? (value ? parseInt(value) : undefined)
        : name === 'is_active' ? value : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, photo_url: 'Please select a valid image file' }));
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, photo_url: 'Image size must be less than 5MB' }));
      return;
    }

    setUploading(true);
    setErrors(prev => ({ ...prev, photo_url: '' }));

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
      const relativePath = result.photo_url;
      const fullImageUrl = getImageUrl(relativePath);

      setUploadedImageUrl(fullImageUrl);
      setFormData(prev => ({ ...prev, photo_url: relativePath }));
    } catch (error) {
      setErrors(prev => ({ ...prev, photo_url: 'Failed to upload image. Please try again.' }));
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setUploadedImageUrl('');
    setFormData(prev => ({ ...prev, photo_url: '' }));
    setErrors(prev => ({ ...prev, photo_url: '' }));
  };

  const positions = [
    { value: 'GK', label: 'Goalkeeper', emoji: '🥅' },
    { value: 'DF', label: 'Defender', emoji: '🛡️' },
    { value: 'MF', label: 'Midfielder', emoji: '⚽' },
    { value: 'FW', label: 'Forward', emoji: '🎯' }
  ];

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'GK': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'DF': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'MF': return 'bg-green-100 text-green-800 border-green-200';
      case 'FW': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <UserPlus className="h-5 w-5 text-emerald-600" />
            {player ? 'Edit Player' : 'Add New Player'}
          </DialogTitle>
          <DialogDescription>
            {player ? 'Update player information and details' : 'Add a new player to your team'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-4 w-4" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Player Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Player Name *
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Enter player name"
                  className={errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}
                />
                {errors.name && (
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    {errors.name}
                  </div>
                )}
              </div>

              {/* Team Selection - Mobile Responsive */}
              {teams && teams.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="team_id" className="text-sm font-medium flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Team *
                  </Label>
                  <Select
                    value={formData.team_id?.toString() || ''}
                    onValueChange={(value) => handleChange('team_id', value)}
                  >
                    <SelectTrigger className={errors.team_id ? 'border-red-500 focus:ring-red-500' : ''}>
                      <SelectValue placeholder="Select a team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id.toString()}>
                          <div className="flex items-center gap-2">
                            {team.logo_url && (
                              <img
                                src={getImageUrl(team.logo_url)}
                                alt={team.name}
                                className="w-4 h-4 rounded object-cover"
                              />
                            )}
                            {team.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.team_id && (
                    <div className="flex items-center gap-1 text-sm text-red-600">
                      <AlertCircle className="h-3 w-3" />
                      {errors.team_id}
                    </div>
                  )}
                </div>
              )}

              {/* Jersey Number & Position - Mobile Responsive Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jersey_number" className="text-sm font-medium flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    Jersey Number *
                  </Label>
                  <Input
                    id="jersey_number"
                    name="jersey_number"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Enter jersey number (1-99)"
                    value={formData.jersey_number || ''}
                    onChange={(e) => handleChange('jersey_number', e.target.value)}
                    className={errors.jersey_number ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  />
                  {errors.jersey_number && (
                    <div className="flex items-center gap-1 text-sm text-red-600">
                      <AlertCircle className="h-3 w-3" />
                      {errors.jersey_number}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position" className="text-sm font-medium">
                    Position *
                  </Label>
                  <Select
                    value={formData.position}
                    onValueChange={(value) => handleChange('position', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {positions.map((pos) => (
                        <SelectItem key={pos.value} value={pos.value}>
                          <div className="flex items-center gap-2">
                            <span>{pos.emoji}</span>
                            {pos.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Position Preview */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Position:</span>
                <Badge className={`${getPositionColor(formData.position)} border`}>
                  {positions.find(p => p.value === formData.position)?.emoji} {positions.find(p => p.value === formData.position)?.label}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Personal Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Personal Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Age & Birth Date - Mobile Responsive */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age" className="text-sm font-medium">
                    Age
                  </Label>
                  <Input
                    id="age"
                    name="age"
                    type="number"
                    min="16"
                    max="50"
                    value={formData.age || ''}
                    onChange={(e) => handleChange('age', e.target.value)}
                    placeholder="25"
                    className={errors.age ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  />
                  {errors.age && (
                    <div className="flex items-center gap-1 text-sm text-red-600">
                      <AlertCircle className="h-3 w-3" />
                      {errors.age}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birth_date" className="text-sm font-medium">
                    Birth Date
                  </Label>
                  <Input
                    id="birth_date"
                    name="birth_date"
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => handleChange('birth_date', e.target.value)}
                  />
                </div>
              </div>

              {/* Nationality */}
              <div className="space-y-2">
                <Label htmlFor="nationality" className="text-sm font-medium flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  Nationality
                </Label>
                <Input
                  id="nationality"
                  name="nationality"
                  value={formData.nationality}
                  onChange={(e) => handleChange('nationality', e.target.value)}
                  placeholder="Country"
                />
              </div>
            </CardContent>
          </Card>

          {/* Photo Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Player Photo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Photo Preview */}
              {uploadedImageUrl && (
                <div className="flex items-center gap-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
                  <div className="relative">
                    <img
                      src={uploadedImageUrl}
                      alt="Player photo preview"
                      className="h-16 w-16 object-cover rounded-lg border-2 border-white shadow-md"
                    />
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 bg-emerald-500">
                      <Check className="h-3 w-3" />
                    </Badge>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Photo uploaded</p>
                    <p className="text-xs text-gray-500">Click upload to change</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={removeImage}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Remove
                  </Button>
                </div>
              )}

              {/* Upload Section - Mobile Friendly */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <Label
                    htmlFor="image-upload"
                    className="cursor-pointer w-full sm:w-auto"
                  >
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploading}
                      className="w-full sm:w-auto flex items-center gap-2"
                      asChild
                    >
                      <span>
                        <Upload className="h-4 w-4" />
                        {uploading ? 'Uploading...' : 'Upload Photo'}
                      </span>
                    </Button>
                  </Label>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                  <span className="text-xs text-gray-500">PNG, JPG up to 5MB</span>
                </div>

                {/* Manual URL Input */}
                <div className="space-y-2">
                  <Label htmlFor="photo_url" className="text-xs text-gray-500">Or enter URL manually</Label>
                  <Input
                    id="photo_url"
                    name="photo_url"
                    value={formData.photo_url}
                    onChange={(e) => handleChange('photo_url', e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className={errors.photo_url ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  />
                </div>

                {errors.photo_url && (
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    {errors.photo_url}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => handleChange('is_active', e.target.checked)}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <Label htmlFor="is_active" className="text-sm font-medium">
                  Active player
                </Label>
                <Badge variant={formData.is_active ? "default" : "secondary"}>
                  {formData.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons - Mobile Responsive */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || uploading}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  {player ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  {player ? 'Update Player' : 'Add Player'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PlayerModal;