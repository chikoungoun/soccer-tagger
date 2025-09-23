import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Trophy, Users, Shield, AlertCircle, Check } from 'lucide-react';
import { FixtureWithTeams, Team, CreateFixtureData, Gameweek } from '../types';
import { getImageUrl } from '../utils/imageUtils';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FixtureModalProps {
  fixture?: FixtureWithTeams | null;
  teams: Team[];
  gameweeks?: Gameweek[];
  onSave: (data: CreateFixtureData | Partial<CreateFixtureData>) => void;
  onClose: () => void;
  isOpen: boolean;
}

const FixtureModal: React.FC<FixtureModalProps> = ({ fixture, teams, gameweeks = [], onSave, onClose, isOpen }) => {
  const [formData, setFormData] = useState<CreateFixtureData>({
    home_team_id: 0,
    away_team_id: 0,
    match_date: '',
    venue: '',
    gameweek_id: undefined
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    } else {
      // Reset form for new fixture
      setFormData({
        home_team_id: 0,
        away_team_id: 0,
        match_date: '',
        venue: '',
        gameweek_id: undefined
      });
    }
    setErrors({});
  }, [fixture, teams, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.home_team_id || formData.home_team_id === 0) {
      newErrors.home_team_id = 'Please select a home team';
    }

    if (!formData.away_team_id || formData.away_team_id === 0) {
      newErrors.away_team_id = 'Please select an away team';
    }

    if (formData.home_team_id === formData.away_team_id && formData.home_team_id !== 0) {
      newErrors.away_team_id = 'A team cannot play against itself';
    }

    if (!formData.match_date) {
      newErrors.match_date = 'Match date and time is required';
    } else {
      const matchDate = new Date(formData.match_date);
      const now = new Date();
      if (matchDate <= now) {
        newErrors.match_date = 'Match date must be in the future';
      }
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
        venue: formData.venue || undefined
      };
      await onSave(dataToSave);
    } catch (error) {
      console.error('Error saving fixture:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('team_id') || name === 'gameweek_id'
        ? (value === '' || value === 'none' ? undefined : parseInt(value))
        : value
    }));

    // Clear error when user makes selection
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const availableAwayTeams = teams.filter(team => team.id !== formData.home_team_id);
  const availableHomeTeams = teams.filter(team => team.id !== formData.away_team_id);

  const getTeamWithLogo = (teamId: number) => {
    return teams.find(team => team.id === teamId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Trophy className="h-5 w-5 text-blue-600" />
            {fixture ? 'Edit Fixture' : 'Schedule New Match'}
          </DialogTitle>
          <DialogDescription>
            {fixture ? 'Update match information and details' : 'Create a new fixture between two teams'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Match Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-4 w-4" />
                Match Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Team Selection Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Home Team */}
                <div className="space-y-2">
                  <Label htmlFor="home_team_id" className="text-sm font-medium flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Home Team *
                  </Label>
                  <Select
                    value={formData.home_team_id?.toString() || ''}
                    onValueChange={(value) => handleSelectChange('home_team_id', value)}
                  >
                    <SelectTrigger className={errors.home_team_id ? 'border-red-500 focus-visible:ring-red-500' : ''}>
                      <SelectValue placeholder="Select home team">
                        {formData.home_team_id && formData.home_team_id !== 0 && (
                          <div className="flex items-center gap-2">
                            {getTeamWithLogo(formData.home_team_id)?.logo_url && (
                              <img
                                src={getImageUrl(getTeamWithLogo(formData.home_team_id)?.logo_url)}
                                alt="Team logo"
                                className="h-4 w-4 object-cover rounded-full"
                              />
                            )}
                            <span>{getTeamWithLogo(formData.home_team_id)?.name}</span>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {availableHomeTeams.map(team => (
                        <SelectItem key={team.id} value={team.id.toString()}>
                          <div className="flex items-center gap-2">
                            {team.logo_url && (
                              <img
                                src={getImageUrl(team.logo_url)}
                                alt={`${team.name} logo`}
                                className="h-4 w-4 object-cover rounded-full"
                              />
                            )}
                            <span>{team.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.home_team_id && (
                    <div className="flex items-center gap-1 text-sm text-red-600">
                      <AlertCircle className="h-3 w-3" />
                      {errors.home_team_id}
                    </div>
                  )}
                </div>

                {/* Away Team */}
                <div className="space-y-2">
                  <Label htmlFor="away_team_id" className="text-sm font-medium flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Away Team *
                  </Label>
                  <Select
                    value={formData.away_team_id?.toString() || ''}
                    onValueChange={(value) => handleSelectChange('away_team_id', value)}
                  >
                    <SelectTrigger className={errors.away_team_id ? 'border-red-500 focus-visible:ring-red-500' : ''}>
                      <SelectValue placeholder="Select away team">
                        {formData.away_team_id && formData.away_team_id !== 0 && (
                          <div className="flex items-center gap-2">
                            {getTeamWithLogo(formData.away_team_id)?.logo_url && (
                              <img
                                src={getImageUrl(getTeamWithLogo(formData.away_team_id)?.logo_url)}
                                alt="Team logo"
                                className="h-4 w-4 object-cover rounded-full"
                              />
                            )}
                            <span>{getTeamWithLogo(formData.away_team_id)?.name}</span>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {availableAwayTeams.map(team => (
                        <SelectItem key={team.id} value={team.id.toString()}>
                          <div className="flex items-center gap-2">
                            {team.logo_url && (
                              <img
                                src={getImageUrl(team.logo_url)}
                                alt={`${team.name} logo`}
                                className="h-4 w-4 object-cover rounded-full"
                              />
                            )}
                            <span>{team.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.away_team_id && (
                    <div className="flex items-center gap-1 text-sm text-red-600">
                      <AlertCircle className="h-3 w-3" />
                      {errors.away_team_id}
                    </div>
                  )}
                </div>
              </div>

              {/* Match Preview */}
              {formData.home_team_id !== 0 && formData.away_team_id !== 0 && formData.home_team_id !== formData.away_team_id && (
                <div className="mt-4 p-4 border rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                  <p className="text-sm font-medium mb-2">Match Preview</p>
                  <div className="flex items-center justify-center gap-4">
                    <div className="flex items-center gap-2">
                      {getTeamWithLogo(formData.home_team_id)?.logo_url && (
                        <img
                          src={getImageUrl(getTeamWithLogo(formData.home_team_id)?.logo_url)}
                          alt="Home team logo"
                          className="h-8 w-8 object-cover rounded-full border-2 border-green-500"
                        />
                      )}
                      <Badge variant="outline" className="bg-green-50 border-green-200 text-green-800">
                        {getTeamWithLogo(formData.home_team_id)?.name} (H)
                      </Badge>
                    </div>
                    <span className="text-2xl font-bold text-gray-400">VS</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-800">
                        {getTeamWithLogo(formData.away_team_id)?.name} (A)
                      </Badge>
                      {getTeamWithLogo(formData.away_team_id)?.logo_url && (
                        <img
                          src={getImageUrl(getTeamWithLogo(formData.away_team_id)?.logo_url)}
                          alt="Away team logo"
                          className="h-8 w-8 object-cover rounded-full border-2 border-blue-500"
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Schedule & Venue */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Schedule & Venue
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Match Date */}
                <div className="space-y-2">
                  <Label htmlFor="match_date" className="text-sm font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Match Date & Time *
                  </Label>
                  <Input
                    type="datetime-local"
                    id="match_date"
                    name="match_date"
                    value={formData.match_date}
                    onChange={handleChange}
                    min={new Date().toISOString().slice(0, 16)}
                    className={errors.match_date ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  />
                  {errors.match_date && (
                    <div className="flex items-center gap-1 text-sm text-red-600">
                      <AlertCircle className="h-3 w-3" />
                      {errors.match_date}
                    </div>
                  )}
                </div>

                {/* Venue */}
                <div className="space-y-2">
                  <Label htmlFor="venue" className="text-sm font-medium flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Venue
                  </Label>
                  <Input
                    id="venue"
                    name="venue"
                    value={formData.venue}
                    onChange={handleChange}
                    placeholder="Enter stadium or venue name"
                  />
                </div>
              </div>

              {/* Gameweek Selection */}
              {gameweeks.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="gameweek_id" className="text-sm font-medium flex items-center gap-1">
                      <Trophy className="h-3 w-3" />
                      Gameweek (Optional)
                    </Label>
                    <Select
                      value={formData.gameweek_id?.toString() || 'none'}
                      onValueChange={(value) => handleSelectChange('gameweek_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="No gameweek assigned" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No gameweek assigned</SelectItem>
                        {gameweeks.map(gameweek => (
                          <SelectItem key={gameweek.id} value={gameweek.id.toString()}>
                            {gameweek.name} (Week {gameweek.week_number})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
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
              disabled={isSubmitting || formData.home_team_id === 0 || formData.away_team_id === 0}
              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  {fixture ? 'Updating...' : 'Scheduling...'}
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  {fixture ? 'Update' : 'Schedule'} Match
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FixtureModal;