import { Team } from '../types';

/**
 * Generates a gradient background style from team colors
 */
export const getTeamGradient = (team: Team, direction: 'to-r' | 'to-l' | 'to-br' = 'to-r'): string => {
  const primary = team.primary_color || '#3B82F6'; // Default blue
  const secondary = team.secondary_color || '#1E40AF'; // Default darker blue

  return `bg-gradient-${direction} from-[${primary}] to-[${secondary}]`;
};

/**
 * Generates inline style for team gradient (for dynamic styles)
 */
export const getTeamGradientStyle = (team: Team, direction: 'to right' | 'to left' | 'to bottom right' = 'to right'): React.CSSProperties => {
  const primary = team.primary_color || '#3B82F6';
  const secondary = team.secondary_color || '#1E40AF';

  return {
    background: `linear-gradient(${direction}, ${primary}, ${secondary})`
  };
};

/**
 * Gets a lighter version of team color for backgrounds
 */
export const getTeamAccentColor = (team: Team, opacity: number = 0.1): string => {
  const primary = team.primary_color || '#3B82F6';
  // Convert hex to rgba with opacity
  const hex = primary.replace('#', '');

  // Handle 3-digit hex codes
  let fullHex = hex;
  if (hex.length === 3) {
    fullHex = hex.split('').map(char => char + char).join('');
  }

  const r = parseInt(fullHex.substring(0, 2), 16);
  const g = parseInt(fullHex.substring(2, 4), 16);
  const b = parseInt(fullHex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/**
 * Gets contrasting text color (white or black) based on background color
 */
export const getContrastTextColor = (backgroundColor: string): string => {
  // Remove # if present
  const hex = backgroundColor.replace('#', '');

  // Handle 3-digit hex codes
  let fullHex = hex;
  if (hex.length === 3) {
    fullHex = hex.split('').map(char => char + char).join('');
  }

  // Convert to RGB
  const r = parseInt(fullHex.substring(0, 2), 16);
  const g = parseInt(fullHex.substring(2, 4), 16);
  const b = parseInt(fullHex.substring(4, 6), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return white text for dark backgrounds, black for light
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

/**
 * Combines both team colors for a fixture card gradient
 */
export const getFixtureGradientStyle = (homeTeam: Team, awayTeam: Team): React.CSSProperties => {
  const homePrimary = homeTeam.primary_color || '#3B82F6';
  const awayPrimary = awayTeam.primary_color || '#EF4444';

  return {
    background: `linear-gradient(135deg, ${homePrimary} 0%, ${homePrimary}88 25%, ${awayPrimary}88 75%, ${awayPrimary} 100%)`
  };
};