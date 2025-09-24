import React, { useState, useEffect } from 'react';
import { Upload, Palette, Trophy, MapPin, Calendar, FileText, X, Check, AlertCircle } from 'lucide-react';
import { Team, CreateTeamData } from '../types';
import { getImageUrl } from '../utils/imageUtils';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface TeamModalProps {
  team?: Team | null;
  onSave: (data: CreateTeamData | Partial<CreateTeamData>) => void;
  onClose: () => void;
  isOpen: boolean;
}

const TeamModal: React.FC<TeamModalProps> = ({ team, onSave, onClose, isOpen }) => {
  const [formData, setFormData] = useState<CreateTeamData>({
    name: '',
    team_code_name: '',
    logo_url: '',
    primary_color: '#1e40af',
    secondary_color: '#ffffff',
    founded_year: undefined,
    stadium: '',
    description: ''
  });

  const [uploading, setUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (team) {
      setFormData({
        name: team.name,
        team_code_name: team.team_code_name || '',
        logo_url: team.logo_url || '',
        primary_color: team.primary_color || '#1e40af',
        secondary_color: team.secondary_color || '#ffffff',
        founded_year: team.founded_year,
        stadium: team.stadium || '',
        description: team.description || ''
      });
      setUploadedImageUrl(getImageUrl(team.logo_url));
    } else {
      // Reset form for new team
      setFormData({
        name: '',
        team_code_name: '',
        logo_url: '',
        primary_color: '#1e40af',
        secondary_color: '#ffffff',
        founded_year: undefined,
        stadium: '',
        description: ''
      });
      setUploadedImageUrl('');
    }
    setErrors({});
  }, [team, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Team name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Team name must be at least 2 characters';
    }

    if (!formData.team_code_name.trim()) {
      newErrors.team_code_name = 'Team code is required';
    } else if (formData.team_code_name.length < 2 || formData.team_code_name.length > 10) {
      newErrors.team_code_name = 'Team code must be between 2-10 characters';
    }

    if (formData.founded_year && (formData.founded_year < 1800 || formData.founded_year > new Date().getFullYear())) {
      newErrors.founded_year = `Founded year must be between 1800 and ${new Date().getFullYear()}`;
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
        logo_url: formData.logo_url || undefined,
        primary_color: formData.primary_color || undefined,
        secondary_color: formData.secondary_color || undefined,
        founded_year: formData.founded_year || undefined,
        stadium: formData.stadium || undefined,
        description: formData.description || undefined
      };

      await onSave(dataToSave);
    } catch (error) {
      console.error('Error saving team:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'founded_year' ? (value ? parseInt(value) : undefined) : value
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
      setErrors(prev => ({ ...prev, logo_url: 'Please select a valid image file' }));
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, logo_url: 'Image size must be less than 5MB' }));
      return;
    }

    setUploading(true);
    setErrors(prev => ({ ...prev, logo_url: '' }));

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/uploads/team-logo', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      const relativePath = result.logo_url;
      const fullImageUrl = getImageUrl(relativePath);

      setUploadedImageUrl(fullImageUrl);
      setFormData(prev => ({ ...prev, logo_url: relativePath }));
    } catch (error) {
      setErrors(prev => ({ ...prev, logo_url: 'Failed to upload image. Please try again.' }));
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setUploadedImageUrl('');
    setFormData(prev => ({ ...prev, logo_url: '' }));
    setErrors(prev => ({ ...prev, logo_url: '' }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Trophy className="h-5 w-5 text-emerald-600" />
            {team ? 'Edit Team' : 'Create New Team'}
          </DialogTitle>
          <DialogDescription>
            {team ? 'Update team information and settings' : 'Add a new team to your league'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Team Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Team Name *
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter team name"
                  className={errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}
                />
                {errors.name && (
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    {errors.name}
                  </div>
                )}
              </div>

              {/* Team Code Name */}
              <div className="space-y-2">
                <Label htmlFor="team_code_name" className="text-sm font-medium">
                  Team Code *
                </Label>
                <Input
                  id="team_code_name"
                  name="team_code_name"
                  value={formData.team_code_name}
                  onChange={handleChange}
                  placeholder="e.g., MUN, LIV, ARS"
                  className={errors.team_code_name ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  maxLength={10}
                />
                {errors.team_code_name && (
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    {errors.team_code_name}
                  </div>
                )}
                <p className="text-xs text-gray-500">Short code for the team (2-10 characters)</p>
              </div>

              {/* Founded Year */}
              <div className="space-y-2">
                <Label htmlFor="founded_year" className="text-sm font-medium flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Founded Year
                </Label>
                <Input
                  id="founded_year"
                  name="founded_year"
                  type="number"
                  min="1800"
                  max={new Date().getFullYear()}
                  value={formData.founded_year || ''}
                  onChange={handleChange}
                  placeholder="e.g., 1900"
                  className={errors.founded_year ? 'border-red-500 focus-visible:ring-red-500' : ''}
                />
                {errors.founded_year && (
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    {errors.founded_year}
                  </div>
                )}
              </div>

              {/* Stadium */}
              <div className="space-y-2">
                <Label htmlFor="stadium" className="text-sm font-medium flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Stadium
                </Label>
                <Input
                  id="stadium"
                  name="stadium"
                  value={formData.stadium}
                  onChange={handleChange}
                  placeholder="Enter stadium name"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter team description (optional)"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Visual Identity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Visual Identity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Team Logo */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Team Logo</Label>

                {/* Logo Preview */}
                {uploadedImageUrl && (
                  <div className="flex items-center gap-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
                    <div className="relative">
                      <img
                        src={uploadedImageUrl}
                        alt="Team logo preview"
                        className="h-16 w-16 object-cover rounded-lg border-2 border-white shadow-md"
                      />
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 bg-emerald-500">
                        <Check className="h-3 w-3" />
                      </Badge>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Logo uploaded</p>
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

                {/* Upload Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Label
                      htmlFor="image-upload"
                      className="cursor-pointer"
                    >
                      <Button
                        type="button"
                        variant="outline"
                        disabled={uploading}
                        className="flex items-center gap-2"
                        asChild
                      >
                        <span>
                          <Upload className="h-4 w-4" />
                          {uploading ? 'Uploading...' : 'Upload Logo'}
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
                    <Label htmlFor="logo_url" className="text-xs text-gray-500">Or enter URL manually</Label>
                    <Input
                      id="logo_url"
                      name="logo_url"
                      value={formData.logo_url}
                      onChange={handleChange}
                      placeholder="https://example.com/logo.png"
                      className={errors.logo_url ? 'border-red-500 focus-visible:ring-red-500' : ''}
                    />
                  </div>

                  {errors.logo_url && (
                    <div className="flex items-center gap-1 text-sm text-red-600">
                      <AlertCircle className="h-3 w-3" />
                      {errors.logo_url}
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Team Colors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Primary Color */}
                <div className="space-y-2">
                  <Label htmlFor="primary_color" className="text-sm font-medium">
                    Primary Color
                  </Label>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <input
                        type="color"
                        id="primary_color"
                        name="primary_color"
                        value={formData.primary_color || '#1e40af'}
                        onChange={handleChange}
                        className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                      />
                      <div
                        className="absolute inset-1 rounded border-2 border-white shadow-sm pointer-events-none"
                        style={{ backgroundColor: formData.primary_color || '#1e40af' }}
                      />
                    </div>
                    <Input
                      type="text"
                      value={formData.primary_color || ''}
                      onChange={handleChange}
                      name="primary_color"
                      placeholder="#1e40af"
                      className="flex-1 font-mono text-sm"
                    />
                  </div>
                </div>

                {/* Secondary Color */}
                <div className="space-y-2">
                  <Label htmlFor="secondary_color" className="text-sm font-medium">
                    Secondary Color
                  </Label>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <input
                        type="color"
                        id="secondary_color"
                        name="secondary_color"
                        value={formData.secondary_color || '#ffffff'}
                        onChange={handleChange}
                        className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                      />
                      <div
                        className="absolute inset-1 rounded border-2 border-white shadow-sm pointer-events-none"
                        style={{ backgroundColor: formData.secondary_color || '#ffffff' }}
                      />
                    </div>
                    <Input
                      type="text"
                      value={formData.secondary_color || ''}
                      onChange={handleChange}
                      name="secondary_color"
                      placeholder="#ffffff"
                      className="flex-1 font-mono text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Color Preview */}
              <div className="mt-4 p-4 border rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                <p className="text-sm font-medium mb-2">Color Preview</p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full border-2 border-white shadow-md"
                    style={{ backgroundColor: formData.primary_color || '#1e40af' }}
                  />
                  <div
                    className="w-8 h-8 rounded-full border-2 border-gray-300 shadow-md"
                    style={{ backgroundColor: formData.secondary_color || '#ffffff' }}
                  />
                  <div
                    className="px-3 py-1 rounded-md text-sm font-medium border"
                    style={{
                      backgroundColor: formData.primary_color || '#1e40af',
                      color: formData.secondary_color || '#ffffff',
                      borderColor: formData.secondary_color || '#ffffff'
                    }}
                  >
                    {formData.name || 'Team Name'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || uploading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  {team ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  {team ? 'Update Team' : 'Create Team'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TeamModal;