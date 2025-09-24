export interface Team {
  id: number;
  name: string;
  team_code_name: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  founded_year?: number;
  stadium?: string;
  description?: string;
  created_at: string;
  updated_at?: string;
  player_count?: number;
}

export interface Player {
  id: number;
  name: string;
  jersey_number: number;
  position: 'GK' | 'DF' | 'MF' | 'FW';
  age?: number;
  birth_date?: string;
  nationality?: string;
  photo_url?: string;
  team_id: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Fixture {
  id: number;
  home_team_id: number;
  away_team_id: number;
  gameweek_id?: number;
  match_date: string;
  venue?: string;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  home_score: number;
  away_score: number;
  created_at: string;
  updated_at?: string;
}

export interface FixtureWithTeams extends Fixture {
  home_team: Team;
  away_team: Team;
}

export interface TeamWithPlayers extends Team {
  players: Player[];
}

export interface CreateTeamData {
  name: string;
  team_code_name: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  founded_year?: number;
  stadium?: string;
  description?: string;
}

export interface CreatePlayerData {
  name: string;
  jersey_number: number;
  position: 'GK' | 'DF' | 'MF' | 'FW';
  age?: number;
  birth_date?: string;
  nationality?: string;
  photo_url?: string;
  team_id: number;
  is_active?: boolean;
}

export interface CreateFixtureData {
  home_team_id: number;
  away_team_id: number;
  match_date: string;
  venue?: string;
  gameweek_id?: number;
}

export interface Gameweek {
  id: number;
  week_number: number;
  gameweek_code?: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface GameweekWithFixtures extends Gameweek {
  fixtures: FixtureWithTeams[];
}

export interface CreateGameweekData {
  week_number: number;
  gameweek_code?: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active?: boolean;
}

export interface Lineup {
  id: number;
  fixture_id: number;
  team_id: number;
  player_id: number;
  is_starter: boolean;
  position_played?: string;
  created_at: string;
  updated_at?: string;
}

export interface LineupWithPlayer extends Lineup {
  player: Player;
}

export interface CreateLineupData {
  fixture_id: number;
  team_id: number;
  player_id: number;
  is_starter: boolean;
  position_played?: string;
}

export interface TeamLineup {
  team_id: number;
  team: Team;
  formation?: string;
  starters: LineupWithPlayer[];
  substitutes: LineupWithPlayer[];
}

export interface FixtureWithLineups extends FixtureWithTeams {
  home_lineup?: TeamLineup;
  away_lineup?: TeamLineup;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'super_admin' | 'tagger';
  is_active: boolean;
}

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  role: 'super_admin' | 'tagger';
}