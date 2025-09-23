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

/**
 * Adjusts team colors for better dark mode visibility
 */
export const getDarkModeTeamColor = (color: string, isDark: boolean): string => {
  if (!isDark) return color;

  // Convert hex to HSL and lighten for dark mode
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
      default: h = 0;
    }
    h /= 6;
  }

  // Lighten for dark mode if too dark
  if (l < 0.6) {
    l = Math.min(0.8, l + 0.3);
  }

  // Convert back to hex
  const hsl2rgb = (h: number, s: number, l: number) => {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h * 6) % 2 - 1));
    const m = l - c / 2;
    let r, g, b;

    if (0 <= h && h < 1/6) { r = c; g = x; b = 0; }
    else if (1/6 <= h && h < 2/6) { r = x; g = c; b = 0; }
    else if (2/6 <= h && h < 3/6) { r = 0; g = c; b = x; }
    else if (3/6 <= h && h < 4/6) { r = 0; g = x; b = c; }
    else if (4/6 <= h && h < 5/6) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }

    return [
      Math.round((r + m) * 255),
      Math.round((g + m) * 255),
      Math.round((b + m) * 255)
    ];
  };

  const [newR, newG, newB] = hsl2rgb(h, s, l);
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
};