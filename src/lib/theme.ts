/**
 * Halal Shodai Brand Color Palette
 * Derived directly from the official logo:
 * - Primary: Deep Islamic Green (#1B6B35) from the shopping bag & "হালাল সদাই" wordmark
 * - Secondary / Gold: Crescent Gold (#E0A526) from the crescent, star & "HALAL SHODAI" dashes
 */

export const THEME = {
  // Brand Primary (Deep Islamic Green)
  primary: "#1B6B35",
  primaryHover: "#14552A",
  primaryDark: "#0E3F1F",
  primaryLight: "#EAF4EC",
  primaryBorder: "#BEDCC6",

  // Brand Secondary (Crescent Gold)
  gold: "#E0A526",
  goldHover: "#C48D17",
  goldDark: "#9A6E10",
  goldLight: "#FDF6E3",
  goldBorder: "#F3DDA2",

  // Common UI aliases
  secondary: "#E0A526",
  secondaryHover: "#C48D17",

  // Alerts & Accents
  accentRed: "#D7262E",
  whatsappGreen: "#12C64B",
  successGreen: "#16A34A",

  // Neutrals
  dark: "#111827",
  muted: "#6B7280",
  lightBg: "#FBF8F1",
  border: "#E5E7EB",
} as const;

export const PRIMARY = THEME.primary;
export const SECONDARY = THEME.secondary;
export const GOLD = THEME.gold;
export const ACCENT = THEME.accentRed;

