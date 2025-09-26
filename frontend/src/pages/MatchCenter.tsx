import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PlayIcon,
  StopIcon,
  ClockIcon,
  TrophyIcon,
  MapPinIcon,
  CalendarDaysIcon,
  SparklesIcon,
  FireIcon,
  BoltIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { fixturesApi, lineupsApi, eventsApi } from '../utils/api';
import { getImageUrl } from '../utils/imageUtils';
import { FixtureWithTeams, FixtureWithLineups, TeamLineup } from '../types';
import MatchTimer from '../components/MatchTimer';
import EventTagger from '../components/EventTagger';
import EventsList from '../components/EventsList';
import EditEventModal from '../components/EditEventModal';
import PlayerMinutes from '../components/PlayerMinutes';
import FormationPitch from '../components/FormationPitch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '../contexts/AuthContext';

const MatchCenter: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [fixture, setFixture] = useState<FixtureWithTeams | null>(null);
  const [fixtureWithLineups, setFixtureWithLineups] = useState<FixtureWithLineups | null>(null);
  const [currentMinute, setCurrentMinute] = useState(0);
  const [currentHalf, setCurrentHalf] = useState(0);
  const [eventsRefreshTrigger, setEventsRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [autoRedirectCountdown, setAutoRedirectCountdown] = useState<number | null>(null);

  // Track dynamically updated lineups after substitutions
  const [currentHomeLineup, setCurrentHomeLineup] = useState<TeamLineup | null>(null);
  const [currentAwayLineup, setCurrentAwayLineup] = useState<TeamLineup | null>(null);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  // Auto-redirect when match becomes completed for non-admin users
  useEffect(() => {
    if (fixture && fixture.status === 'completed' && user?.role === 'tagger') {
      // Check if tagger was assigned to this match
      if (fixture.assigned_tagger_id && fixture.assigned_tagger_id === user.id) {
        // Start countdown
        setAutoRedirectCountdown(3);

        const countdownInterval = setInterval(() => {
          setAutoRedirectCountdown(prev => {
            if (prev && prev > 1) {
              return prev - 1;
            }
            return null;
          });
        }, 1000);

        // Redirect after countdown
        const timer = setTimeout(() => {
          navigate('/fixtures', {
            replace: true,
            state: { message: 'Match completed and closed automatically' }
          });
        }, 3000);

        return () => {
          clearTimeout(timer);
          clearInterval(countdownInterval);
          setAutoRedirectCountdown(null);
        };
      }
    }
  }, [fixture, user, navigate]);

  // Permission checking on page focus/visibility
  useEffect(() => {
    const checkPermissions = async () => {
      if (!fixture || !user || user.role === 'super_admin') return;

      try {
        // Re-fetch fixture to get latest assignment status
        const freshFixture = await fixturesApi.getById(fixture.id);

        // If tagger and match is assigned to someone else or completed, redirect
        if (user.role === 'tagger') {
          if (freshFixture.assigned_tagger_id !== user.id && freshFixture.assigned_tagger_id !== null) {
            navigate('/fixtures', {
              replace: true,
              state: { message: 'This match is no longer assigned to you' }
            });
            return;
          }

          if (freshFixture.status === 'completed') {
            navigate('/fixtures', {
              replace: true,
              state: { message: 'Match has been completed' }
            });
            return;
          }
        }
      } catch (error) {
        console.error('Error checking permissions:', error);
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkPermissions();
      }
    };

    const handleFocus = () => {
      checkPermissions();
    };

    // Check permissions when page becomes visible or gains focus
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Initial permission check
    checkPermissions();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fixture, user, navigate]);

  const fetchData = async () => {
    if (!id) return;

    try {
      const fixtureData = await fixturesApi.getById(parseInt(id));
      setFixture(fixtureData);

      // Reset current lineups when loading a new fixture
      setCurrentHomeLineup(null);
      setCurrentAwayLineup(null);

      // Fetch fixture lineups
      try {
        const fixtureLineupsData = await lineupsApi.getFixtureLineups(parseInt(id));
        setFixtureWithLineups(fixtureLineupsData);

        // Initialize current lineups only if they haven't been set (to avoid overwriting substitutions)
        if (!currentHomeLineup && fixtureLineupsData.home_lineup) {
          setCurrentHomeLineup(fixtureLineupsData.home_lineup);
        }
        if (!currentAwayLineup && fixtureLineupsData.away_lineup) {
          setCurrentAwayLineup(fixtureLineupsData.away_lineup);
        }
      } catch (error) {
        console.error('Error fetching lineups:', error);
        // Don't fail the whole page if lineups aren't set
      }
    } catch (error) {
      console.error('Error fetching match data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTimerUpdate = (minute: number, half: number) => {
    setCurrentMinute(minute);
    setCurrentHalf(half);
  };

  const handleEventCreated = () => {
    setEventsRefreshTrigger(prev => prev + 1);
    fetchData(); // Refetch fixture data to get updated score
  };

  const handleEventDeleted = () => {
    setEventsRefreshTrigger(prev => prev + 1);
    fetchData(); // Refetch fixture data to get updated score
  };

  const handleEventEdit = (event: any) => {
    setEditingEvent(event);
    setShowEditModal(true);
  };

  const handleEventUpdate = async (eventId: number, eventData: any) => {
    try {
      await eventsApi.updateEvent(eventId, eventData);
      setEventsRefreshTrigger(prev => prev + 1);
      fetchData(); // Refetch fixture data to get updated score
      setShowEditModal(false);
      setEditingEvent(null);
    } catch (error: any) {
      console.error('Error updating event:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to update event';
      alert(`Error updating event: ${errorMessage}`);
    }
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingEvent(null);
  };

  const handleLineupUpdated = (homeLineup: TeamLineup, awayLineup: TeamLineup) => {
    setCurrentHomeLineup(homeLineup);
    setCurrentAwayLineup(awayLineup);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="relative">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-soccer-green"></div>
          <PlayIcon className="h-12 w-12 text-soccer-green absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>
    );
  }

  if (!fixture) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="border-0 shadow-2xl bg-gradient-to-br from-gray-50 to-white max-w-md w-full">
          <CardContent className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <TrophyIcon className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Match not found</h2>
            <p className="text-gray-600 mb-8">The match you're looking for doesn't exist or has been removed.</p>
            <Button
              onClick={() => navigate('/fixtures')}
              size="lg"
              className="shadow-lg"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Fixtures
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Remove the page-level block for taggers - let them see the match center with COMPLETED band
  // Restriction will happen at EventTagger component level instead

  const { date, time } = formatDate(fixture.match_date);

  const getStatusIcon = () => {
    switch (fixture.status) {
      case 'live':
        return <PlayIcon className="h-8 w-8 text-red-500 animate-pulse" />;
      case 'completed':
        return <TrophyIcon className="h-8 w-8 text-green-500" />;
      case 'cancelled':
        return <StopIcon className="h-8 w-8 text-gray-500" />;
      default:
        return <ClockIcon className="h-8 w-8 text-blue-500" />;
    }
  };

  const getStatusGradient = () => {
    switch (fixture.status) {
      case 'live':
        return 'from-red-600 via-red-700 to-pink-800';
      case 'completed':
        return 'from-green-600 via-green-700 to-emerald-800';
      case 'cancelled':
        return 'from-gray-600 via-gray-700 to-slate-800';
      default:
        return 'from-blue-600 via-blue-700 to-indigo-800';
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 relative">
      {/* Auto-redirect countdown notification */}
      {autoRedirectCountdown !== null && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-2xl border-2 border-blue-700 animate-pulse">
          <div className="flex items-center space-x-3">
            <ClockIcon className="h-5 w-5" />
            <span className="font-semibold">
              Match completed! Redirecting in {autoRedirectCountdown}s...
            </span>
          </div>
        </div>
      )}

      {/* Diagonal COMPLETED band for all users when match is completed */}
      {fixture.status === 'completed' && (
        <div className="fixed inset-0 pointer-events-none z-40">
          <div className="absolute top-0 right-0 w-64 h-64 overflow-hidden">
            <div className="absolute top-8 -right-8 bg-green-600 text-white font-bold text-lg px-16 py-3 rotate-45 shadow-2xl border-2 border-green-700">
              COMPLETED
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Button
          onClick={() => navigate('/fixtures')}
          variant="outline"
          size="sm"
          className="shadow-md"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
            <SparklesIcon className="h-8 w-8 text-yellow-500" />
            <span>Match Center</span>
          </h1>
          <p className="text-gray-600 flex items-center space-x-2 mt-1">
            <CalendarDaysIcon className="h-4 w-4" />
            <span>{date} at {time}</span>
          </p>
        </div>
      </div>

      {/* Stadium-Style Match Header */}
      <Card className="border-0 shadow-2xl overflow-hidden">
        {/* Stadium Header */}
        <div className={`bg-gradient-to-br ${getStatusGradient()} p-8 text-white relative`}>
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10"></div>
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                {getStatusIcon()}
                <Badge
                  variant="secondary"
                  className={`bg-white/20 text-white border-white/30 text-lg px-4 py-2 ${
                    fixture.status === 'live' ? 'animate-pulse' : ''
                  }`}
                >
                  {fixture.status.charAt(0).toUpperCase() + fixture.status.slice(1)}
                </Badge>
              </div>
              {fixture.venue && (
                <div className="flex items-center space-x-2 text-white/90">
                  <MapPinIcon className="h-5 w-5" />
                  <span className="text-lg font-medium">{fixture.venue}</span>
                </div>
              )}
            </div>

            {/* Teams and Score */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-center">
              {/* Home Team */}
              <div className="lg:col-span-2 text-center lg:text-right">
                <div className="flex items-center justify-center lg:justify-end space-x-4 mb-3">
                  {fixture.home_team.logo_url && (
                    <img
                      src={getImageUrl(fixture.home_team.logo_url)}
                      alt={`${fixture.home_team.name} logo`}
                      className="w-16 h-16 md:w-20 md:h-20 object-contain rounded-full border-2 border-white/30 bg-white shadow-lg"
                    />
                  )}
                  <h2 className="text-4xl font-bold">{fixture.home_team.name}</h2>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-white/20 text-white border-white/30 text-base px-3 py-1"
                >
                  🏠 Home
                </Badge>
              </div>

              {/* Score */}
              <div className="text-center">
                <div className="text-7xl font-bold text-white mb-2 drop-shadow-lg">
                  {fixture.home_score} - {fixture.away_score}
                </div>
                <div className="text-xl text-white/90 font-medium">
                  {fixture.status === 'completed' && (
                    <span className="bg-white/20 px-3 py-1 rounded-full">Full Time</span>
                  )}
                  {currentHalf > 0 && (
                    <div className="space-y-1">
                      <div>{currentMinute > 0 ? `${currentMinute}'` : ''}</div>
                      <div className="text-sm bg-white/20 px-2 py-1 rounded-full inline-block">
                        {currentHalf === 1 ? '1st Half' : currentHalf === 2 ? '2nd Half' : currentHalf === -1 ? 'Half Time' : ''}
                      </div>
                    </div>
                  )}
                  {fixture.status === 'scheduled' && currentHalf === 0 && (
                    <span className="text-white/70">Not Started</span>
                  )}
                </div>
              </div>

              {/* Away Team */}
              <div className="lg:col-span-2 text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start space-x-4 mb-3">
                  <h2 className="text-4xl font-bold">{fixture.away_team.name}</h2>
                  {fixture.away_team.logo_url && (
                    <img
                      src={getImageUrl(fixture.away_team.logo_url)}
                      alt={`${fixture.away_team.name} logo`}
                      className="w-16 h-16 md:w-20 md:h-20 object-contain rounded-full border-2 border-white/30 bg-white shadow-lg"
                    />
                  )}
                </div>
                <Badge
                  variant="secondary"
                  className="bg-white/20 text-white border-white/30 text-base px-3 py-1"
                >
                  ✈️ Away
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Match Timer */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <MatchTimer
            fixtureId={fixture.id}
            hasLineups={!!(fixtureWithLineups?.home_lineup && fixtureWithLineups?.away_lineup)}
            onTimerUpdate={handleTimerUpdate}
          />
        </CardContent>
      </Card>

      {/* Formation Pitch */}
      <FormationPitch
        homeTeamLineup={currentHomeLineup || fixtureWithLineups?.home_lineup || null}
        awayTeamLineup={currentAwayLineup || fixtureWithLineups?.away_lineup || null}
        fixtureId={fixture.id}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Event Tagger */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-gray-900">
              <BoltIcon className="h-5 w-5 text-yellow-500" />
              <span>Live Events</span>
            </CardTitle>
            <CardDescription>
              Tag match events in real-time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EventTagger
              fixtureId={fixture.id}
              homeTeamLineup={currentHomeLineup || fixtureWithLineups?.home_lineup || null}
              awayTeamLineup={currentAwayLineup || fixtureWithLineups?.away_lineup || null}
              currentMinute={currentMinute}
              currentHalf={currentHalf}
              fixtureStatus={fixture.status}
              onEventCreated={handleEventCreated}
              onLineupUpdated={handleLineupUpdated}
            />
          </CardContent>
        </Card>

        {/* Events List */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-gray-900">
              <FireIcon className="h-5 w-5 text-red-500" />
              <span>Match Timeline</span>
            </CardTitle>
            <CardDescription>
              Complete match event history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EventsList
              fixtureId={fixture.id}
              homeTeamLineup={currentHomeLineup || fixtureWithLineups?.home_lineup || null}
              awayTeamLineup={currentAwayLineup || fixtureWithLineups?.away_lineup || null}
              refreshTrigger={eventsRefreshTrigger}
              onEventDeleted={handleEventDeleted}
              onEventEdit={handleEventEdit}
            />
          </CardContent>
        </Card>
      </div>

      {/* Edit Event Modal */}
      {showEditModal && editingEvent && (currentHomeLineup || fixtureWithLineups?.home_lineup) && (currentAwayLineup || fixtureWithLineups?.away_lineup) && (
        <EditEventModal
          event={editingEvent}
          homeTeamLineup={currentHomeLineup || fixtureWithLineups.home_lineup}
          awayTeamLineup={currentAwayLineup || fixtureWithLineups.away_lineup}
          onSave={handleEventUpdate}
          onClose={closeEditModal}
        />
      )}
    </div>
  );
};

export default MatchCenter;