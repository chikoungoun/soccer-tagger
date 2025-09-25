import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChartBarIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
  PlayIcon,
  StopIcon,
  FlagIcon,
  SparklesIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { fixturesApi, eventsApi, gameweeksApi } from '../utils/api';
import { FixtureWithTeams, Gameweek } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Event {
  id: number;
  fixture_id: number;
  event_type: string;
  minute: number;
  player_id?: number;
  team_id: number;
  description?: string;
  created_by?: number;
  tagger_name?: string;
  created_at: string;
  fixture: FixtureWithTeams;
  player_name?: string;
  team_name: string;
  gameweek_code: string;
}

const Events: React.FC = () => {
  const { t } = useTranslation();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [gameweeks, setGameweeks] = useState<Gameweek[]>([]);

  useEffect(() => {
    fetchAllEvents();
  }, []);

  const fetchAllEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      // First get gameweeks
      const gameweeksData = await gameweeksApi.getAll();
      setGameweeks(gameweeksData);

      // Try to get fixtures, handling authentication and pagination
      let completedFixtures: FixtureWithTeams[] = [];
      try {
        const fixturesResponse = await fixturesApi.getAll(undefined, 'completed', 1, 1000); // Get all completed fixtures
        completedFixtures = fixturesResponse.fixtures;
      } catch (fixturesError) {
        console.error('Could not fetch fixtures (authentication may be required):', fixturesError);
        setError('Failed to load fixtures data. Please ensure you are logged in.');
        return;
      }

      // Get events for each completed fixture
      const allEvents: Event[] = [];

      for (const fixture of completedFixtures) {
        try {
          const fixtureEvents = await eventsApi.getEvents(fixture.id);

          // Find the gameweek for this fixture
          const gameweek = gameweeksData.find(gw => gw.id === fixture.gameweek_id);

          // Add fixture, team, and gameweek info to each event
          const enrichedEvents = fixtureEvents.map(event => ({
            ...event,
            fixture,
            // For now, we'll use the home team as default since we don't have direct team info from events API
            // TODO: Enhance backend API to include team_id in event response
            team_name: fixture.home_team.team_code_name,
            team_id: fixture.home_team.id,
            gameweek_code: gameweek?.gameweek_code || 'N/A'
          }));

          allEvents.push(...enrichedEvents);
        } catch (error) {
          console.warn(`Could not fetch events for fixture ${fixture.id}:`, error);
        }
      }

      // Sort by event created_at timestamp (most recent recordings first)
      allEvents.sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setEvents(allEvents);

      // Debug: Log all unique event types and fixture structure
      const uniqueEventTypes = [...new Set(allEvents.map(e => e.event_type))];
      console.log('All event types found:', uniqueEventTypes);
      console.log('Total substitution events:', allEvents.filter(e => e.event_type.toLowerCase().includes('sub')).length);

      // Debug fixture date fields
      if (allEvents.length > 0) {
        console.log('Sample fixture object:', allEvents[0].fixture);
        console.log('Available date fields:', Object.keys(allEvents[0].fixture).filter(key => key.includes('date') || key.includes('time')));
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to load events data');
    } finally {
      setLoading(false);
    }
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType.toLowerCase()) {
      case 'goal':
        return 'bg-green-100 text-green-800';
      case 'yellow_card':
        return 'bg-yellow-100 text-yellow-800';
      case 'red_card':
        return 'bg-red-100 text-red-800';
      case 'substitution':
      case 'sub_in':
      case 'sub_out':
        return 'bg-blue-100 text-blue-800';
      case 'assist':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType.toLowerCase()) {
      case 'goal':
        return '⚽';
      case 'yellow_card':
        return '🟨';
      case 'red_card':
        return '🟥';
      case 'substitution':
      case 'sub_in':
      case 'sub_out':
        return '🔄';
      case 'assist':
        return '👟';
      default:
        return '📝';
    }
  };

  const formatDateTime = (fixture: any) => {
    try {
      // Try different possible date field names
      const possibleDateFields = ['datetime', 'date', 'kickoff_time', 'match_date', 'created_at'];
      let dateValue = null;

      for (const field of possibleDateFields) {
        if (fixture[field]) {
          dateValue = fixture[field];
          break;
        }
      }

      if (!dateValue) {
        console.warn('No date field found in fixture:', fixture);
        return 'No Date';
      }

      // Handle different datetime formats
      const date = new Date(dateValue);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date value:', dateValue);
        return 'Invalid Date';
      }

      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');

      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date Error';
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(events.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEvents = events.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToPrevious = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const goToNext = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="relative">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-soccer-green"></div>
          <ChartBarIcon className="h-12 w-12 text-soccer-green absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-800 rounded-2xl p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10"></div>
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <ChartBarIcon className="h-10 w-10 text-yellow-300" />
                <h1 className="text-4xl font-bold">Match Events</h1>
              </div>
              <p className="text-purple-100 text-lg mb-4">Complete event history from all completed matches</p>
              <div className="flex flex-wrap gap-3">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                  <CalendarDaysIcon className="h-4 w-4 mr-1" />
                  {events.length} Total Events
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                  <PlayIcon className="h-4 w-4 mr-1" />
                  From Completed Matches
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Events Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-gray-900 flex items-center space-x-2">
            <SparklesIcon className="h-6 w-6 text-soccer-green" />
            <span>Event History</span>
          </CardTitle>
          <CardDescription>
            All events from completed matches, sorted by most recently recorded events first
          </CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-16">
              <div className="relative">
                <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-2xl flex items-center justify-center shadow-lg">
                  <ChartBarIcon className="h-16 w-16 text-gray-400 dark:text-gray-500" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center transform rotate-12">
                  <span className="text-yellow-800 text-xs">⚽</span>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No Events Found</h3>
              <p className="text-gray-500 dark:text-gray-400">No events found in completed matches yet</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stats Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-xl border border-green-200 dark:border-green-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-lg">⚽</span>
                    </div>
                    <div>
                      <p className="text-green-800 dark:text-green-300 text-sm font-medium">Goals</p>
                      <p className="text-green-900 dark:text-green-200 text-xl font-bold">
                        {events.filter(e => e.event_type.toLowerCase() === 'goal').length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 p-4 rounded-xl border border-yellow-200 dark:border-yellow-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-lg">🟨</span>
                    </div>
                    <div>
                      <p className="text-yellow-800 dark:text-yellow-300 text-sm font-medium">Yellow Cards</p>
                      <p className="text-yellow-900 dark:text-yellow-200 text-xl font-bold">
                        {events.filter(e => e.event_type.toLowerCase() === 'yellow_card').length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-4 rounded-xl border border-red-200 dark:border-red-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-lg">🟥</span>
                    </div>
                    <div>
                      <p className="text-red-800 dark:text-red-300 text-sm font-medium">Red Cards</p>
                      <p className="text-red-900 dark:text-red-200 text-xl font-bold">
                        {events.filter(e => e.event_type.toLowerCase() === 'red_card').length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-xl border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-lg">🔄</span>
                    </div>
                    <div>
                      <p className="text-blue-800 dark:text-blue-300 text-sm font-medium">Substitutions</p>
                      <p className="text-blue-900 dark:text-blue-200 text-xl font-bold">
                        {(() => {
                          const subEvents = events.filter(e =>
                            e.event_type.toLowerCase().includes('sub') ||
                            e.event_type.toLowerCase() === 'substitution'
                          );
                          // If we have sub_in/sub_out pairs, divide by 2, otherwise show count as is
                          const hasSubInOut = subEvents.some(e =>
                            e.event_type.toLowerCase().includes('sub_in') ||
                            e.event_type.toLowerCase().includes('sub_out')
                          );
                          return hasSubInOut ? Math.floor(subEvents.length / 2) : subEvents.length;
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced DataTable */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-b border-gray-200 dark:border-gray-600">
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          <div className="flex items-center space-x-2">
                            <CalendarDaysIcon className="h-4 w-4" />
                            <span>Match</span>
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          <div className="flex items-center space-x-2">
                            <ClockIcon className="h-4 w-4" />
                            <span>Event Time</span>
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          <div className="flex items-center space-x-2">
                            <FlagIcon className="h-4 w-4" />
                            <span>GW</span>
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          <div className="flex items-center space-x-2">
                            <ClockIcon className="h-4 w-4" />
                            <span>Match Date</span>
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          <div className="flex items-center space-x-2">
                            <PlayIcon className="h-4 w-4" />
                            <span>Minute</span>
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          <div className="flex items-center space-x-2">
                            <FlagIcon className="h-4 w-4" />
                            <span>Event</span>
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          <div className="flex items-center space-x-2">
                            <UserIcon className="h-4 w-4" />
                            <span>Team</span>
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          <div className="flex items-center space-x-2">
                            <UserIcon className="h-4 w-4" />
                            <span>Player</span>
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          <div className="flex items-center space-x-2">
                            <UserIcon className="h-4 w-4" />
                            <span>Tagger</span>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {currentEvents.map((event, index) => (
                        <tr
                          key={`${event.id}-${index}`}
                          className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 transition-all duration-200 group"
                        >
                          <td className="px-3 py-2">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 bg-gradient-to-br from-soccer-green to-emerald-600 rounded flex items-center justify-center">
                                <span className="text-white text-xs font-bold">VS</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {event.fixture.home_team.team_code_name} vs {event.fixture.away_team.team_code_name}
                                </div>
                                {event.fixture.home_score !== null && event.fixture.away_score !== null && (
                                  <div className="text-xs text-green-600 dark:text-green-400 font-bold">
                                    {event.fixture.home_score} - {event.fixture.away_score}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <div className="text-xs text-gray-700 dark:text-gray-300">
                              {formatDateTime(event)}
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
                              {event.gameweek_code}
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <div className="text-xs text-gray-700 dark:text-gray-300">
                              {formatDateTime(event.fixture)}
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                              <span className="font-bold">{event.minute}'</span>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <div className="inline-flex items-center space-x-1">
                              <div className="w-6 h-6 rounded flex items-center justify-center text-sm"
                                   style={{backgroundColor: getEventTypeColor(event.event_type).includes('green') ? '#dcfce7' :
                                                            getEventTypeColor(event.event_type).includes('yellow') ? '#fef3c7' :
                                                            getEventTypeColor(event.event_type).includes('red') ? '#fee2e2' :
                                                            getEventTypeColor(event.event_type).includes('blue') ? '#dbeafe' : '#f3f4f6'}}>
                                <span>{getEventIcon(event.event_type)}</span>
                              </div>
                              <Badge className={`${getEventTypeColor(event.event_type)} border-0 text-xs px-1 py-0`}>
                                {event.event_type.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center space-x-2">
                              <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center">
                                <span className="text-white text-xs font-bold">
                                  {event.team_name.substring(0, 1).toUpperCase()}
                                </span>
                              </div>
                              <span className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                                {event.team_name}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            {event.player_name ? (
                              <div className="flex items-center space-x-1">
                                <div className="w-4 h-4 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                                  <UserIcon className="h-2 w-2 text-orange-600 dark:text-orange-400" />
                                </div>
                                <span className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {event.player_name}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 dark:text-gray-500">-</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {event.tagger_name ? (
                              <div className="flex items-center space-x-2">
                                <div className="w-5 h-5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">
                                    {event.tagger_name.substring(0, 1).toUpperCase()}
                                  </span>
                                </div>
                                <span className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {event.tagger_name}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <div className="w-5 h-5 bg-gray-400 rounded-full flex items-center justify-center">
                                  <UserIcon className="h-3 w-3 text-white" />
                                </div>
                                <span className="text-xs text-gray-400 dark:text-gray-500">Unknown</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6 rounded-b-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={goToPrevious}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={goToNext}
                        disabled={currentPage === totalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                          <span className="font-medium">{Math.min(endIndex, events.length)}</span> of{' '}
                          <span className="font-medium">{events.length}</span> events
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                          <button
                            onClick={goToPrevious}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span className="sr-only">Previous</span>
                            <ChevronDownIcon className="h-5 w-5 rotate-90" aria-hidden="true" />
                          </button>

                          {/* Page numbers */}
                          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            let pageNumber;
                            if (totalPages <= 5) {
                              pageNumber = i + 1;
                            } else if (currentPage <= 3) {
                              pageNumber = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNumber = totalPages - 4 + i;
                            } else {
                              pageNumber = currentPage - 2 + i;
                            }

                            return (
                              <button
                                key={pageNumber}
                                onClick={() => goToPage(pageNumber)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  currentPage === pageNumber
                                    ? 'z-10 bg-soccer-green border-soccer-green text-white'
                                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                              >
                                {pageNumber}
                              </button>
                            );
                          })}

                          <button
                            onClick={goToNext}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span className="sr-only">Next</span>
                            <ChevronDownIcon className="h-5 w-5 -rotate-90" aria-hidden="true" />
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Events;