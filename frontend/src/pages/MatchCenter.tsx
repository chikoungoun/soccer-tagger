import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { fixturesApi, lineupsApi, eventsApi } from '../utils/api';
import { FixtureWithTeams, FixtureWithLineups, TeamLineup } from '../types';
import MatchTimer from '../components/MatchTimer';
import EventTagger from '../components/EventTagger';
import EventsList from '../components/EventsList';
import EditEventModal from '../components/EditEventModal';
import PlayerMinutes from '../components/PlayerMinutes';

const MatchCenter: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [fixture, setFixture] = useState<FixtureWithTeams | null>(null);
  const [fixtureWithLineups, setFixtureWithLineups] = useState<FixtureWithLineups | null>(null);
  const [currentMinute, setCurrentMinute] = useState(0);
  const [currentHalf, setCurrentHalf] = useState(0);
  const [eventsRefreshTrigger, setEventsRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    if (!id) return;

    try {
      const fixtureData = await fixturesApi.getById(parseInt(id));
      setFixture(fixtureData);

      // Fetch fixture lineups
      try {
        const fixtureLineupsData = await lineupsApi.getFixtureLineups(parseInt(id));
        setFixtureWithLineups(fixtureLineupsData);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-soccer-green"></div>
      </div>
    );
  }

  if (!fixture) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Match not found</h2>
        <button
          onClick={() => navigate('/fixtures')}
          className="mt-4 btn-primary"
        >
          Back to Fixtures
        </button>
      </div>
    );
  }

  const { date, time } = formatDate(fixture.match_date);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/fixtures')}
          className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeftIcon className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Match Center</h1>
          <p className="text-gray-600">{date} at {time}</p>
        </div>
      </div>

      {/* Match Header */}
      <div className="card">
        <div className="flex items-center justify-center space-x-8">
          {/* Home Team */}
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {fixture.home_team.name}
            </div>
            <div className="text-sm text-gray-500">Home</div>
          </div>

          {/* Score */}
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900">
              {fixture.home_score} - {fixture.away_score}
            </div>
            <div className={`status-${fixture.status} text-center`}>
              {fixture.status.charAt(0).toUpperCase() + fixture.status.slice(1)}
            </div>
          </div>

          {/* Away Team */}
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {fixture.away_team.name}
            </div>
            <div className="text-sm text-gray-500">Away</div>
          </div>
        </div>

        {fixture.venue && (
          <div className="mt-4 text-center text-sm text-gray-600">
            {fixture.venue}
          </div>
        )}
      </div>

      {/* Match Timer */}
      <MatchTimer
        fixtureId={fixture.id}
        hasLineups={!!(fixtureWithLineups?.home_lineup && fixtureWithLineups?.away_lineup)}
        onTimerUpdate={handleTimerUpdate}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Event Tagger */}
        <div>
          <EventTagger
            fixtureId={fixture.id}
            homeTeamLineup={fixtureWithLineups?.home_lineup || null}
            awayTeamLineup={fixtureWithLineups?.away_lineup || null}
            currentMinute={currentMinute}
            currentHalf={currentHalf}
            onEventCreated={handleEventCreated}
          />
        </div>

        {/* Events List */}
        <div>
          <EventsList
            fixtureId={fixture.id}
            homeTeamLineup={fixtureWithLineups?.home_lineup || null}
            awayTeamLineup={fixtureWithLineups?.away_lineup || null}
            refreshTrigger={eventsRefreshTrigger}
            onEventDeleted={handleEventDeleted}
            onEventEdit={handleEventEdit}
          />
        </div>

        {/* Player Minutes */}
        <div>
          <PlayerMinutes
            fixtureId={fixture.id}
            homeTeamId={fixture.home_team_id}
            awayTeamId={fixture.away_team_id}
            refreshTrigger={eventsRefreshTrigger}
          />
        </div>
      </div>

      {/* Edit Event Modal */}
      {showEditModal && editingEvent && fixtureWithLineups?.home_lineup && fixtureWithLineups?.away_lineup && (
        <EditEventModal
          event={editingEvent}
          homeTeamLineup={fixtureWithLineups.home_lineup}
          awayTeamLineup={fixtureWithLineups.away_lineup}
          onSave={handleEventUpdate}
          onClose={closeEditModal}
        />
      )}
    </div>
  );
};

export default MatchCenter;