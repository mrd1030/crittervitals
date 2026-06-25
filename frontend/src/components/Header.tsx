import React from "react";
import { View, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/theme/useTheme";
import { Display, Txt } from "@/src/components/ui";

// Sticky, SafeArea-aware screen header. Stays pinned above scrolling content.
export function Header({
  title,
  subtitle,
  showBack,
  rightIcon,
  onRightPress,
  rightLabel,
  large,
}: {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightIcon?: keyof typeof Feather.glyphMap;
  onRightPress?: () => void;
  rightLabel?: string;
  large?: boolean;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <View
      style={{
        paddingTop: insets.top + 8,
        paddingHorizontal: t.spacing.lg,
        paddingBottom: t.spacing.md,
        backgroundColor: t.colors.surface,
        borderBottomWidth: large ? 0 : 1,
        borderBottomColor: t.colors.divider,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", minHeight: 44 }}>
        {showBack && (
          <Pressable
            testID="header-back-button"
            onPress={() => router.back()}
            hitSlop={10}
            style={{ width: 40, height: 40, justifyContent: "center" }}
          >
            <Feather name="chevron-left" size={28} color={t.colors.onSurface} />
          </Pressable>
        )}
        <View style={{ flex: 1 }}>
          <Display size={large ? 30 : 22}>{title}</Display>
          {subtitle && (
            <Txt size={13} color={t.colors.onSurfaceSecondary} style={{ marginTop: 2 }}>
              {subtitle}
            </Txt>
          )}
        </View>
        {(rightIcon || rightLabel) && onRightPress && (
          <Pressable
            testID="header-right-action"
            onPress={onRightPress}
            hitSlop={10}
            style={{
              minWidth: 44,
              height: 44,
              borderRadius: 22,
              paddingHorizontal: rightLabel ? 14 : 0,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 6,
              backgroundColor: t.colors.surfaceSecondary,
            }}
          >
            {rightIcon && <Feather name={rightIcon} size={20} color={t.colors.onSurface} />}
            {rightLabel && <Txt size={13} weight="700">{rightLabel}</Txt>}
          </Pressable>
        )}
      </View>
    </View>
  );
}
