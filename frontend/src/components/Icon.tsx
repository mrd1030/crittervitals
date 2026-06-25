import React from "react";
import { Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { SymbolView, SymbolViewProps } from "expo-symbols";

interface IconProps {
  name: keyof typeof Feather.glyphMap;
  size?: number;
  color?: string;
  style?: any;
}

/**
 * Cross-platform icon component.
 * Uses SF Symbols (expo-symbols) on iOS for best quality,
 * falls back to Feather on Android and Web.
 *
 * This is the single place to change icon system in the future.
 */
export function Icon({ name, size = 24, color = "#000", style }: IconProps) {
  // On iOS we can try expo-symbols for native look.
  // For simplicity and reliability across web + all platforms,
  // we use Feather everywhere for now (most stable on web export).
  return <Feather name={name} size={size} color={color} style={style} />;
}
