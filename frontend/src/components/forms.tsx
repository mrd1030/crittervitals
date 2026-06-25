import React from "react";
import { View, TextInput, ViewStyle, TextStyle, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/src/theme/useTheme";
import { Txt } from "@/src/components/ui";

export function FormField({
  label,
  children,
  hint,
  style,
}: {
  label?: string;
  children: React.ReactNode;
  hint?: string;
  style?: ViewStyle;
}) {
  const t = useTheme();
  return (
    <View style={[{ marginBottom: t.spacing.lg }, style]}>
      {label && (
        <Txt size={13} weight="700" color={t.colors.onSurfaceSecondary} style={{ marginBottom: 8 }}>
          {label}
        </Txt>
      )}
      {children}
      {hint && (
        <Txt size={11} color={t.colors.onSurfaceTertiary} style={{ marginTop: 6 }}>
          {hint}
        </Txt>
      )}
    </View>
  );
}

export function AppTextInput({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  testID,
  suffix,
  autoFocus,
  style,
  returnKeyType,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "decimal-pad" | "number-pad";
  multiline?: boolean;
  testID?: string;
  suffix?: string;
  autoFocus?: boolean;
  style?: TextStyle;
  returnKeyType?: "done" | "next";
}) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: t.mode === "dark" ? t.colors.surfaceSecondary : "#FFFFFF",
        borderRadius: t.radius.md,
        borderWidth: 1,
        borderColor: t.colors.border,
        paddingHorizontal: 14,
        minHeight: multiline ? 96 : 52,
      }}
    >
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={t.colors.onSurfaceTertiary}
        keyboardType={keyboardType}
        multiline={multiline}
        autoFocus={autoFocus}
        returnKeyType={returnKeyType}
        style={[
          {
            flex: 1,
            fontFamily: t.fonts.text,
            fontSize: 16,
            color: t.colors.onSurface,
            paddingVertical: multiline ? 14 : 0,
            textAlignVertical: multiline ? "top" : "center",
          },
          style,
        ]}
      />
      {suffix && (
        <Txt size={15} weight="700" color={t.colors.onSurfaceTertiary} style={{ marginLeft: 8 }}>
          {suffix}
        </Txt>
      )}
    </View>
  );
}

// Stepper for discrete numeric values (e.g. frequency per day).
export function Stepper({
  value,
  onChange,
  min = 1,
  max = 12,
  testID,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  testID?: string;
}) {
  const t = useTheme();
  const btn = (icon: keyof typeof Feather.glyphMap, onPress: () => void, disabled: boolean) => (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: t.colors.surfaceSecondary,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <Feather name={icon} size={20} color={t.colors.onSurface} />
    </Pressable>
  );
  return (
    <View testID={testID} style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
      {btn("minus", () => onChange(Math.max(min, value - 1)), value <= min)}
      <Txt size={20} weight="800" style={{ minWidth: 28, textAlign: "center" }}>
        {value}
      </Txt>
      {btn("plus", () => onChange(Math.min(max, value + 1)), value >= max)}
    </View>
  );
}
