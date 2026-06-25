import { useData } from "@/src/store/DataContext";
import {
  palettes,
  spacing,
  radius,
  fonts,
  fontSize,
  softShadow,
  ThemeColors,
  ThemeMode,
} from "@/src/theme/theme";

export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  fonts: typeof fonts;
  fontSize: typeof fontSize;
  softShadow: typeof softShadow;
}

export function useTheme(): Theme {
  const { resolvedMode } = useData();
  return {
    mode: resolvedMode,
    colors: palettes[resolvedMode],
    spacing,
    radius,
    fonts,
    fontSize,
    softShadow,
  };
}
