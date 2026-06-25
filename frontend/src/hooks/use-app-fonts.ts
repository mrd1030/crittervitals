import { useFonts } from "expo-font";

// Loads the editorial display serif + clean sans used across the app.
// Variable TTFs are registered under one family name each; weight is applied
// via fontWeight in styles (supported on iOS + modern Android).
export function useAppFonts(): readonly [boolean, Error | null] {
  return useFonts({
    PlayfairDisplay: require("../../assets/fonts/PlayfairDisplay-Regular.ttf"),
    Manrope: require("../../assets/fonts/Manrope-Regular.ttf"),
  });
}
