import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/src/theme/useTheme";
import { Txt } from "@/src/components/ui";

type ToastTone = "success" | "error" | "info";
interface ToastState {
  message: string;
  tone: ToastTone;
}

const ToastContext = createContext<{ show: (m: string, tone?: ToastTone) => void } | undefined>(undefined);

// Toasts are mounted at the very top of the tree so they always sit above the
// tab bar, modals and sheets.
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (message: string, tone: ToastTone = "success") => {
      setToast({ message, tone });
      opacity.value = withTiming(1, { duration: 220 });
      translateY.value = withTiming(0, { duration: 220 });
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 220 });
        translateY.value = withTiming(20, { duration: 220 });
        setTimeout(() => setToast(null), 240);
      }, 2400);
    },
    [opacity, translateY],
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast && <ToastView toast={toast} opacity={opacity} translateY={translateY} />}
    </ToastContext.Provider>
  );
}

function ToastView({
  toast,
  opacity,
  translateY,
}: {
  toast: ToastState;
  opacity: Animated.SharedValue<number>;
  translateY: Animated.SharedValue<number>;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
  const tone = {
    success: { bg: t.colors.brandPrimary, icon: "check-circle" as const, fg: t.colors.onBrandPrimary },
    error: { bg: t.colors.error, icon: "alert-circle" as const, fg: "#FFFFFF" },
    info: { bg: t.colors.surfaceInverse, icon: "info" as const, fg: t.colors.onSurfaceInverse },
  }[toast.tone];
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.wrap, { bottom: insets.bottom + 96 }, animStyle]}
    >
      <View style={[styles.toast, { backgroundColor: tone.bg }]}>
        <Feather name={tone.icon} size={18} color={tone.fg} />
        <Txt size={14} weight="600" color={tone.fg} style={{ flex: 1 }}>
          {toast.message}
        </Txt>
      </View>
    </Animated.View>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 16,
    right: 16,
    alignItems: "center",
    zIndex: 9999,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 16,
    maxWidth: 420,
    width: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
