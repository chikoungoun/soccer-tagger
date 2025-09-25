import axios from 'axios';
import { Team, Player, Fixture, FixtureWithTeams, TeamWithPlayers, CreateTeamData, CreatePlayerData, CreateFixtureData, Gameweek, GameweekWithFixtures, CreateGameweekData, FixtureWithLineups, Lineup, CreateLineupData, User, CreateUserData } from '../types';

const API_BASE_URL = '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // This enables sending cookies with requests
});

// Teams API
export const teamsApi = {
  getAll: (): Promise<Team[]> => api.get('/teams/').then(res => res.data),
  getById: (id: number): Promise<TeamWithPlayers> => api.get(`/teams/${id}`).then(res => res.data),
  create: (data: CreateTeamData): Promise<Team> => api.post('/teams/', data).then(res => res.data),
  update: (id: number, data: Partial<CreateTeamData>): Promise<Team> =>
    api.put(`/teams/${id}`, data).then(res => res.data),
  delete: (id: number): Promise<void> => api.delete(`/teams/${id}`).then(res => res.data),
  importCsv: (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/teams/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then(res => res.data);
  },
};

// Players API
export const playersApi = {
  getAll: (teamId?: number): Promise<Player[]> => {
    const params: any = teamId ? { team_id: teamId } : {};
    // Set a high limit to get all players (default API limit is 100)
    params.limit = 1000;
    return api.get('/players/', { params }).then(res => res.data);
  },
  getById: (id: number): Promise<Player> => api.get(`/players/${id}`).then(res => res.data),
  create: (data: CreatePlayerData): Promise<Player> => api.post('/players/', data).then(res => res.data),
  update: (id: number, data: Partial<CreatePlayerData>): Promise<Player> =>
    api.put(`/players/${id}`, data).then(res => res.data),
  delete: (id: number): Promise<void> => api.delete(`/players/${id}`).then(res => res.data),
  importCsv: (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/players/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then(res => res.data);
  },
};

// Fixtures API
export const fixturesApi = {
  getAll: (teamId?: number, status?: string, page: number = 1, per_page: number = 20, gameweekId?: number): Promise<{
    fixtures: FixtureWithTeams[];
    total: number;
    page: number;
    per_page: number;
    pages: number;
    has_next: boolean;
    has_prev: boolean;
  }> => {
    const params: any = { page, per_page };
    if (teamId) params.team_id = teamId;
    if (status) params.status = status;
    if (gameweekId) params.gameweek_id = gameweekId;
    return api.get('/fixtures/', { params }).then(res => res.data);
  },
  getById: (id: number): Promise<FixtureWithTeams> => api.get(`/fixtures/${id}`).then(res => res.data),
  create: (data: CreateFixtureData): Promise<Fixture> => api.post('/fixtures/', data).then(res => res.data),
  update: (id: number, data: Partial<CreateFixtureData>): Promise<Fixture> =>
    api.put(`/fixtures/${id}`, data).then(res => res.data),
  updateScore: (id: number, homeScore: number, awayScore: number): Promise<any> =>
    api.patch(`/fixtures/${id}/score?home_score=${homeScore}&away_score=${awayScore}`).then(res => res.data),
  complete: (id: number): Promise<any> => api.patch(`/fixtures/${id}/complete`).then(res => res.data),
  assignTagger: (id: number, taggerId?: number): Promise<any> => {
    const params = taggerId ? `?tagger_id=${taggerId}` : '';
    return api.patch(`/fixtures/${id}/assign${params}`).then(res => res.data);
  },
  delete: (id: number): Promise<void> => api.delete(`/fixtures/${id}`).then(res => res.data),
};

// Gameweeks API
export const gameweeksApi = {
  getAll: (): Promise<Gameweek[]> => api.get('/gameweeks/').then(res => res.data),
  getById: (id: number): Promise<GameweekWithFixtures> => api.get(`/gameweeks/${id}`).then(res => res.data),
  create: (data: CreateGameweekData): Promise<Gameweek> => api.post('/gameweeks/', data).then(res => res.data),
  update: (id: number, data: Partial<CreateGameweekData>): Promise<Gameweek> =>
    api.put(`/gameweeks/${id}`, data).then(res => res.data),
  delete: (id: number): Promise<void> => api.delete(`/gameweeks/${id}`).then(res => res.data),
  generateFixtures: (id: number): Promise<any> => api.post(`/gameweeks/${id}/generate-fixtures`).then(res => res.data),
  activate: (id: number): Promise<any> => api.patch(`/gameweeks/${id}/activate`).then(res => res.data),
};

// Lineups API
export const lineupsApi = {
  getFixtureLineups: (fixtureId: number): Promise<FixtureWithLineups> =>
    api.get(`/lineups/fixture/${fixtureId}`).then(res => res.data),
  create: (data: CreateLineupData): Promise<Lineup> =>
    api.post('/lineups/', data).then(res => res.data),
  update: (id: number, data: { is_starter?: boolean; position_played?: string }): Promise<Lineup> =>
    api.put(`/lineups/${id}`, data).then(res => res.data),
  delete: (id: number): Promise<void> =>
    api.delete(`/lineups/${id}`).then(res => res.data),
  clearTeamLineup: (fixtureId: number, teamId: number): Promise<any> =>
    api.delete(`/lineups/fixture/${fixtureId}/team/${teamId}`).then(res => res.data),
  setTeamLineup: (fixtureId: number, teamId: number, lineups: CreateLineupData[]): Promise<Lineup[]> =>
    api.post(`/lineups/fixture/${fixtureId}/team/${teamId}/bulk`, lineups).then(res => res.data),
};

// Users API
export const usersApi = {
  getAll: (): Promise<User[]> => api.get('/auth/users').then(res => res.data),
  create: (data: CreateUserData): Promise<User> => api.post('/auth/register').then(res => res.data),
  toggleActive: (id: number): Promise<any> => api.put(`/auth/users/${id}/toggle-active`).then(res => res.data),
  delete: (id: number): Promise<void> => api.delete(`/auth/users/${id}`).then(res => res.data),
};

// Events API
export const eventsApi = {
  getTimer: (fixtureId: number): Promise<any> => api.get(`/events/fixtures/${fixtureId}/timer`).then(res => res.data),
  startHalf: (fixtureId: number, half: number): Promise<any> =>
    api.post(`/events/fixtures/${fixtureId}/timer/start-half?half=${half}`).then(res => res.data),
  endHalf: (fixtureId: number): Promise<any> =>
    api.post(`/events/fixtures/${fixtureId}/timer/end-half`).then(res => res.data),
  pauseTimer: (fixtureId: number): Promise<any> =>
    api.post(`/events/fixtures/${fixtureId}/timer/pause`).then(res => res.data),
  resumeTimer: (fixtureId: number): Promise<any> =>
    api.post(`/events/fixtures/${fixtureId}/timer/resume`).then(res => res.data),
  getEvents: (fixtureId: number): Promise<any[]> => api.get(`/events/fixtures/${fixtureId}/events`).then(res => res.data),
  createEvent: (fixtureId: number, eventData: any): Promise<any> =>
    api.post(`/events/fixtures/${fixtureId}/events`, eventData).then(res => res.data),
  updateEvent: (eventId: number, eventData: any): Promise<any> =>
    api.put(`/events/events/${eventId}`, eventData).then(res => res.data),
  deleteEvent: (eventId: number): Promise<void> => api.delete(`/events/events/${eventId}`).then(res => res.data),
  getPlayerMinutes: (fixtureId: number): Promise<any[]> => api.get(`/events/fixtures/${fixtureId}/player-minutes`).then(res => res.data),
};

// Dashboard API
export const dashboardApi = {
  getStats: (): Promise<{
    stats: {
      total_teams: number;
      total_players: number;
      total_fixtures: number;
      live_matches: number;
    };
    recent_fixtures: FixtureWithTeams[];
  }> => api.get('/dashboard/stats').then(res => res.data),
};

// Rewards API
export const rewardsApi = {
  getMatchRewards: (fixtureId: number): Promise<any[]> =>
    api.get(`/rewards/match/${fixtureId}/rewards`).then(res => res.data),

  getTaggerPerformance: (taggerId: number, fixtureId?: number): Promise<{
    tagger_id: number;
    matches_tagged: number;
    total_earnings: number;
    average_accuracy: number;
    total_events_logged: number;
    total_corrections: number;
    matches?: any[];
  }> => {
    const params = fixtureId ? `?fixture_id=${fixtureId}` : '';
    return api.get(`/rewards/tagger/${taggerId}/performance${params}`).then(res => res.data);
  },

  finalizeMatchRewards: (fixtureId: number): Promise<any> =>
    api.post(`/rewards/match/${fixtureId}/finalize`).then(res => res.data),

  getLeaderboard: (limit: number = 10): Promise<{
    tagger_id: number;
    username: string;
    matches_tagged: number;
    total_earnings: number;
    average_accuracy: number;
    total_events_logged: number;
  }[]> => api.get(`/rewards/leaderboard?limit=${limit}`).then(res => res.data),

  getRewardStats: (): Promise<{
    total_rewards_paid: number;
    total_matches_tagged: number;
    average_accuracy: number;
    total_corrections: number;
    active_taggers: number;
    average_reward_per_match: number;
  }> => api.get('/rewards/stats').then(res => res.data),

  getMatchEditLogs: (fixtureId: number): Promise<any[]> =>
    api.get(`/rewards/match/${fixtureId}/edit-logs`).then(res => res.data),

  getTaggerEditLogs: (taggerId: number): Promise<any[]> =>
    api.get(`/rewards/tagger/${taggerId}/edit-logs`).then(res => res.data),

  getTaggerMatchHistory: (taggerId: number): Promise<{
    fixture_id: number;
    fixture_date: string | null;
    home_team: {
      id: number;
      name: string;
      short_name: string;
    };
    away_team: {
      id: number;
      name: string;
      short_name: string;
    };
    score: string;
    status: string;
    gameweek: number;
    events_logged: number;
    admin_corrections: number;
    events_added_by_admin: number;
    events_removed_by_admin: number;
    accuracy_percentage: number;
    base_reward: number;
    price_per_event: number;
    final_reward: number;
    is_finalized: boolean;
    finalized_at: string | null;
    created_at: string | null;
    updated_at: string | null;
  }[]> => api.get(`/rewards/tagger/${taggerId}/match-history`).then(res => res.data),
};