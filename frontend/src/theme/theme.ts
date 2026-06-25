// Central design tokens for CritterVitals.
// Personality: "Editorial Mobile LIGHT" — calm, premium pet health journal.
// Nuclear rule: NO blues / purples / indigos. Warm earthy palette only.

export type ThemeMode = "light" | "dark";

export interface ThemeColors {
  surface: string;
  onSurface: string;
  surfaceSecondary: string;
  onSurfaceSecondary: string;
  surfaceTertiary: string;
  onSurfaceTertiary: string;
  surfaceInverse: string;
  onSurfaceInverse: string;
  brand: string;
  brandPrimary: string;
  onBrandPrimary: string;
  brandSecondary: string;
  onBrandSecondary: string;
  brandTertiary: string;
  onBrandTertiary: string;
  success: string;
  onSuccess: string;
  warning: string;
  onWarning: string;
  error: string;
  onError: string;
  info: string;
  onInfo: string;
  border: string;
  borderStrong: string;
  divider: string;
}

const light: ThemeColors = {
  surface: "#FAF9F6",
  onSurface: "#1A1D1A",
  surfaceSecondary: "#F2EFE9",
  onSurfaceSecondary: "#3A3F3A",
  surfaceTertiary: "#E6E0D4",
  onSurfaceTertiary: "#4A504A",
  surfaceInverse: "#1A1D1A",
  onSurfaceInverse: "#FAF9F6",
  brand: "#2E5A3C",
  brandPrimary: "#2E5A3C",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#D87B5B",
  onBrandSecondary: "#FFFFFF",
  brandTertiary: "#EBF0EC",
  onBrandTertiary: "#1D3A26",
  success: "#3C6E47",
  onSuccess: "#FFFFFF",
  warning: "#D4A373",
  onWarning: "#3A2A18",
  error: "#B84A43",
  onError: "#FFFFFF",
  info: "#4A6B7C",
  onInfo: "#FFFFFF",
  border: "#E6E0D4",
  borderStrong: "#C2B8A3",
  divider: "#EAE4D9",
};

const dark: ThemeColors = {
  surface: "#141611",
  onSurface: "#ECEAE2",
  surfaceSecondary: "#1E211A",
  onSurfaceSecondary: "#C7C4B8",
  surfaceTertiary: "#2A2E24",
  onSurfaceTertiary: "#A8A89A",
  surfaceInverse: "#FAF9F6",
  onSurfaceInverse: "#1A1D1A",
  brand: "#6FB585",
  brandPrimary: "#6FB585",
  onBrandPrimary: "#0B130C",
  brandSecondary: "#E0936F",
  onBrandSecondary: "#2A1810",
  brandTertiary: "#22301F",
  onBrandTertiary: "#CFE6D4",
  success: "#6FB585",
  onSuccess: "#0B130C",
  warning: "#D4A373",
  onWarning: "#2A1E10",
  error: "#E07A72",
  onError: "#2A100E",
  info: "#7FA3B3",
  onInfo: "#0E1A20",
  border: "#2E322A",
  borderStrong: "#454A3D",
  divider: "#262A20",
};

export const palettes: Record<ThemeMode, ThemeColors> = { light, dark };

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
  pill: 999,
} as const;

export const fonts = {
  display: "PlayfairDisplay",
  text: "Manrope",
} as const;

export const fontSize = {
  sm: 12,
  base: 14,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 38,
} as const;

// Soft, paper-like elevation. The personality uses shadow tier 0 — keep shadows
// extremely subtle so cards read as layered paper, never floating glass.
export const softShadow = {
  shadowColor: "#1A1D1A",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
};
