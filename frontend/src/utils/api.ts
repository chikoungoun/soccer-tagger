import axios from 'axios';
import { Team, Player, Fixture, FixtureWithTeams, TeamWithPlayers, CreateTeamData, CreatePlayerData, CreateFixtureData, Gameweek, GameweekWithFixtures, CreateGameweekData, FixtureWithLineups, Lineup, CreateLineupData } from '../types';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Teams API
export const teamsApi = {
  getAll: (): Promise<Team[]> => api.get('/teams').then(res => res.data),
  getById: (id: number): Promise<TeamWithPlayers> => api.get(`/teams/${id}`).then(res => res.data),
  create: (data: CreateTeamData): Promise<Team> => api.post('/teams', data).then(res => res.data),
  update: (id: number, data: Partial<CreateTeamData>): Promise<Team> =>
    api.put(`/teams/${id}`, data).then(res => res.data),
  delete: (id: number): Promise<void> => api.delete(`/teams/${id}`).then(res => res.data),
};

// Players API
export const playersApi = {
  getAll: (teamId?: number): Promise<Player[]> => {
    const params: any = teamId ? { team_id: teamId } : {};
    // Set a high limit to get all players (default API limit is 100)
    params.limit = 1000;
    return api.get('/players', { params }).then(res => res.data);
  },
  getById: (id: number): Promise<Player> => api.get(`/players/${id}`).then(res => res.data),
  create: (data: CreatePlayerData): Promise<Player> => api.post('/players', data).then(res => res.data),
  update: (id: number, data: Partial<CreatePlayerData>): Promise<Player> =>
    api.put(`/players/${id}`, data).then(res => res.data),
  delete: (id: number): Promise<void> => api.delete(`/players/${id}`).then(res => res.data),
};

// Fixtures API
export const fixturesApi = {
  getAll: (teamId?: number, status?: string): Promise<FixtureWithTeams[]> => {
    const params: any = {};
    if (teamId) params.team_id = teamId;
    if (status) params.status = status;
    return api.get('/fixtures', { params }).then(res => res.data);
  },
  getById: (id: number): Promise<FixtureWithTeams> => api.get(`/fixtures/${id}`).then(res => res.data),
  create: (data: CreateFixtureData): Promise<Fixture> => api.post('/fixtures', data).then(res => res.data),
  update: (id: number, data: Partial<CreateFixtureData>): Promise<Fixture> =>
    api.put(`/fixtures/${id}`, data).then(res => res.data),
  updateScore: (id: number, homeScore: number, awayScore: number): Promise<any> =>
    api.patch(`/fixtures/${id}/score?home_score=${homeScore}&away_score=${awayScore}`).then(res => res.data),
  complete: (id: number): Promise<any> => api.patch(`/fixtures/${id}/complete`).then(res => res.data),
  delete: (id: number): Promise<void> => api.delete(`/fixtures/${id}`).then(res => res.data),
};

// Gameweeks API
export const gameweeksApi = {
  getAll: (): Promise<Gameweek[]> => api.get('/gameweeks').then(res => res.data),
  getById: (id: number): Promise<GameweekWithFixtures> => api.get(`/gameweeks/${id}`).then(res => res.data),
  create: (data: CreateGameweekData): Promise<Gameweek> => api.post('/gameweeks', data).then(res => res.data),
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
    api.post('/lineups', data).then(res => res.data),
  update: (id: number, data: { is_starter?: boolean; position_played?: string }): Promise<Lineup> =>
    api.put(`/lineups/${id}`, data).then(res => res.data),
  delete: (id: number): Promise<void> =>
    api.delete(`/lineups/${id}`).then(res => res.data),
  clearTeamLineup: (fixtureId: number, teamId: number): Promise<any> =>
    api.delete(`/lineups/fixture/${fixtureId}/team/${teamId}`).then(res => res.data),
  setTeamLineup: (fixtureId: number, teamId: number, lineups: CreateLineupData[]): Promise<Lineup[]> =>
    api.post(`/lineups/fixture/${fixtureId}/team/${teamId}/bulk`, lineups).then(res => res.data),
};