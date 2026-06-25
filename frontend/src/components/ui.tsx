import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  PressableProps,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useTheme } from "@/src/theme/useTheme";

// ---------- Typography ----------
export function Display({
  children,
  size = 28,
  style,
  numberOfLines,
  color,
}: {
  children: React.ReactNode;
  size?: number;
  style?: TextStyle;
  numberOfLines?: number;
  color?: string;
}) {
  const t = useTheme();
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        { fontFamily: t.fonts.display, fontSize: size, color: color ?? t.colors.onSurface, letterSpacing: 0.2 },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Txt({
  children,
  size = 14,
  weight = "400",
  color,
  style,
  numberOfLines,
}: {
  children: React.ReactNode;
  size?: number;
  weight?: TextStyle["fontWeight"];
  color?: string;
  style?: TextStyle;
  numberOfLines?: number;
}) {
  const t = useTheme();
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        { fontFamily: t.fonts.text, fontSize: size, fontWeight: weight, color: color ?? t.colors.onSurface },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

// ---------- Card ----------
export function Card({
  children,
  style,
  onPress,
  testID,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  testID?: string;
}) {
  const t = useTheme();
  const body = (
    <View
      style={[
        {
          backgroundColor: t.mode === "dark" ? t.colors.surfaceSecondary : "#FFFFFF",
          borderRadius: t.radius.lg,
          borderWidth: 1,
          borderColor: t.colors.border,
          padding: t.spacing.lg,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
  if (onPress) {
    return (
      <Pressable
        testID={testID}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          onPress();
        }}
        style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1, transform: [{ scale: pressed ? 0.995 : 1 }] })}
      >
        {body}
      </Pressable>
    );
  }
  return body;
}

// ---------- Button ----------
type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
export function AppButton({
  title,
  onPress,
  variant = "primary",
  icon,
  loading,
  disabled,
  style,
  fullWidth = true,
  testID,
  size = "lg",
}: {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: keyof typeof Feather.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
  testID?: string;
  size?: "lg" | "md" | "sm";
}) {
  const t = useTheme();
  const heights = { lg: 54, md: 46, sm: 38 };
  const bg =
    variant === "primary"
      ? t.colors.brandPrimary
      : variant === "secondary"
        ? t.colors.brandSecondary
        : "transparent";
  const fg =
    variant === "primary"
      ? t.colors.onBrandPrimary
      : variant === "secondary"
        ? t.colors.onBrandSecondary
        : variant === "outline"
          ? t.colors.onSurface
          : t.colors.brandPrimary;
  const border = variant === "outline" ? t.colors.borderStrong : "transparent";
  return (
    <Pressable
      testID={testID}
      disabled={disabled || loading}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [
        {
          height: heights[size],
          backgroundColor: bg,
          borderColor: border,
          borderWidth: variant === "outline" ? 1.5 : 0,
          borderRadius: t.radius.pill,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          paddingHorizontal: t.spacing.xl,
          opacity: disabled ? 0.5 : pressed ? 0.9 : 1,
          alignSelf: fullWidth ? "stretch" : "flex-start",
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon && <Feather name={icon} size={size === "sm" ? 16 : 19} color={fg} />}
          <Text style={{ fontFamily: t.fonts.text, fontSize: size === "sm" ? 14 : 16, fontWeight: "700", color: fg }}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

// ---------- Icon button ----------
export function IconButton({
  icon,
  onPress,
  color,
  bg,
  size = 44,
  testID,
}: {
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
  color?: string;
  bg?: string;
  size?: number;
  testID?: string;
}) {
  const t = useTheme();
  return (
    <Pressable
      testID={testID}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress();
      }}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg ?? t.colors.surfaceSecondary,
        alignItems: "center",
        justifyContent: "center",
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Feather name={icon} size={size * 0.45} color={color ?? t.colors.onSurface} />
    </Pressable>
  );
}

// ---------- Chip ----------
export function Chip({
  label,
  selected,
  onPress,
  icon,
  testID,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: keyof typeof Feather.glyphMap;
  testID?: string;
}) {
  const t = useTheme();
  return (
    <Pressable
      testID={testID}
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress?.();
      }}
      // Chips never resize on selection — color/border only. flexShrink:0 keeps
      // them from squashing inside a horizontal row.
      style={{
        height: 36,
        flexShrink: 0,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 14,
        borderRadius: t.radius.pill,
        backgroundColor: selected ? t.colors.brandPrimary : t.colors.surfaceSecondary,
        borderWidth: 1,
        borderColor: selected ? t.colors.brandPrimary : t.colors.border,
      }}
    >
      {icon && (
        <Feather name={icon} size={14} color={selected ? t.colors.onBrandPrimary : t.colors.onSurfaceSecondary} />
      )}
      <Text
        style={{
          fontFamily: t.fonts.text,
          fontSize: 13,
          fontWeight: "600",
          color: selected ? t.colors.onBrandPrimary : t.colors.onSurfaceSecondary,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ---------- Badge / Pill ----------
export function Badge({
  label,
  tone = "brand",
}: {
  label: string;
  tone?: "brand" | "warning" | "error" | "success" | "neutral";
}) {
  const t = useTheme();
  const map = {
    brand: { bg: t.colors.brandTertiary, fg: t.colors.onBrandTertiary },
    warning: { bg: "#F5E6CE", fg: t.colors.onWarning },
    error: { bg: "#F3D9D6", fg: t.colors.error },
    success: { bg: t.colors.brandTertiary, fg: t.colors.success },
    neutral: { bg: t.colors.surfaceSecondary, fg: t.colors.onSurfaceSecondary },
  }[tone];
  return (
    <View style={{ backgroundColor: map.bg, borderRadius: t.radius.pill, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start" }}>
      <Text style={{ fontFamily: t.fonts.text, fontSize: 11, fontWeight: "700", color: map.fg }}>{label}</Text>
    </View>
  );
}

// ---------- Section header ----------
export function SectionHeader({
  title,
  actionLabel,
  onAction,
  style,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}) {
  const t = useTheme();
  return (
    <View style={[{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: t.spacing.md }, style]}>
      <Display size={20}>{title}</Display>
      {actionLabel && onAction && (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={{ fontFamily: t.fonts.text, fontSize: 13, fontWeight: "700", color: t.colors.brandPrimary }}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

// ---------- Divider ----------
export function Divider({ style }: { style?: ViewStyle }) {
  const t = useTheme();
  return <View style={[{ height: 1, backgroundColor: t.colors.divider }, style]} />;
}

// ---------- Empty state ----------
export function EmptyState({
  icon = "inbox",
  title,
  subtitle,
  actionLabel,
  onAction,
  imageUri,
  testID,
}: {
  icon?: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  imageUri?: string;
  testID?: string;
}) {
  const t = useTheme();
  return (
    <View testID={testID} style={{ alignItems: "center", paddingVertical: t.spacing.xxl, paddingHorizontal: t.spacing.xl }}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={{ width: 120, height: 120, borderRadius: 60, marginBottom: t.spacing.lg }} contentFit="cover" />
      ) : (
        <View
          style={{
            width: 76,
            height: 76,
            borderRadius: 38,
            backgroundColor: t.colors.brandTertiary,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: t.spacing.lg,
          }}
        >
          <Feather name={icon} size={32} color={t.colors.brandPrimary} />
        </View>
      )}
      <Display size={20} style={{ textAlign: "center" }}>{title}</Display>
      {subtitle && (
        <Txt size={14} color={t.colors.onSurfaceSecondary} style={{ textAlign: "center", marginTop: 8, lineHeight: 21, maxWidth: 300 }}>
          {subtitle}
        </Txt>
      )}
      {actionLabel && onAction && (
        <AppButton title={actionLabel} onPress={onAction} fullWidth={false} style={{ marginTop: t.spacing.lg }} icon="plus" />
      )}
    </View>
  );
}

// ---------- Stat tile ----------
export function StatTile({
  label,
  value,
  sub,
  tone,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: string;
  icon?: keyof typeof Feather.glyphMap;
}) {
  const t = useTheme();
  return (
    <View style={{ flex: 1 }}>
      {icon && <Feather name={icon} size={16} color={t.colors.onSurfaceTertiary} style={{ marginBottom: 6 }} />}
      <Text style={{ fontFamily: t.fonts.display, fontSize: 26, color: tone ?? t.colors.onSurface }}>{value}</Text>
      <Txt size={12} color={t.colors.onSurfaceSecondary} style={{ marginTop: 2 }}>{label}</Txt>
      {sub && <Txt size={11} color={t.colors.onSurfaceTertiary} style={{ marginTop: 1 }}>{sub}</Txt>}
    </View>
  );
}

export const styles = StyleSheet.create({});
