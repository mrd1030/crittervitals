import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useData } from "@/src/store/DataContext";
import { palettes } from "@/src/theme/theme";

// Routing gate: seed + load happen in DataProvider. Send users to onboarding
// on first launch, otherwise straight into the app.
export default function Index() {
  const { loading, onboarded, resolvedMode } = useData();
  const colors = palettes[resolvedMode];

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface }}>
        <ActivityIndicator color={colors.brandPrimary} size="large" />
      </View>
    );
  }
  return <Redirect href={onboarded ? "/(tabs)" : "/onboarding"} />;
}
