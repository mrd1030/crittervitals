import React from "react";
import { Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { SymbolView, SymbolViewProps } from "expo-symbols";

interface IconProps {
  name: string; // Feather name or SF Symbol name
  size?: number;
  color?: string;
  style?: any;
  // For SF Symbols specific props
  weight?: SymbolViewProps["weight"];
}

/**
 * Reliable cross-platform icon.
 * - iOS: Uses native SF Symbols via expo-symbols (best quality + performance)
 * - Android + Web: Falls back to Feather icons from @expo/vector-icons
 *
 * This is the single source of truth for icons in the app.
 */
export function Icon({ name, size = 24, color = "#000", style, weight = "regular" }: IconProps) {
  if (Platform.OS === "ios") {
    // Try to use native SF Symbol if possible
    return (
      <SymbolView
        name={name as any}
        size={size}
        tintColor={color}
        weight={weight}
        style={style}
      />
    );
  }

  // Fallback for Android and Web (Feather is reliable here)
  return <Feather name={name as any} size={size} color={color} style={style} />;
}
