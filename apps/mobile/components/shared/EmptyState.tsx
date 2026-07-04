import { View, type DimensionValue } from "react-native";
import Animated, { FadeIn, ZoomIn, useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from "react-native-reanimated";
import { AppIcon, Text as BentoText, useBentoTheme } from "../bento";

const SPIN_DURATION = 800; // 1.25 rev/s

/** 旋转动画 Loader 图标 — 在任何位置复用 */
function SpinningLoader({ size = 16, color }: { size?: number; color: string }) {
  const rotation = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }), [rotation]);

  rotation.value = withRepeat(
    withTiming(360, { duration: SPIN_DURATION, easing: Easing.linear }),
    -1,
    false,
  );

  return (
    <Animated.View entering={FadeIn.duration(300)} style={[animatedStyle, { width: size, height: size, alignItems: "center", justifyContent: "center" }]}>
      <AppIcon name="loader" size={size} color={color} />
    </Animated.View>
  );
}

export function EmptyState({
  iconName = "inbox",
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  iconName?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const c = useBentoTheme().colors;
  return (
    <View style={{ alignItems: "center", gap: 8, paddingVertical: 32, paddingHorizontal: 20 }}>
      <AppIcon name={iconName as any} size={36} color={c.inkMute} strokeWidth={1.5} />
      <BentoText weight="semibold" variant="caption" color={c.ink} style={{ textAlign: "center" }}>
        {title}
      </BentoText>
      {subtitle ? (
        <BentoText variant="micro" color={c.inkMute} style={{ textAlign: "center", lineHeight: 18 }}>
          {subtitle}
        </BentoText>
      ) : null}
      {actionLabel && onAction ? (
        <BentoText
          weight="semibold"
          color={c.accent}
          style={{ fontSize: 13, paddingTop: 4 }}
          onPress={onAction}
        >
          {actionLabel}
        </BentoText>
      ) : null}
    </View>
  );
}

export function LoadingState({ label = "加载中..." }: { label?: string }) {
  const c = useBentoTheme().colors;
  return (
    <View style={{ alignItems: "center", gap: 10, paddingVertical: 28 }}>
      <SpinningLoader size={28} color={c.accent} />
      <BentoText variant="caption" color={c.inkMute}>{label}</BentoText>
    </View>
  );
}

/**
 * AsyncStatusBanner — 异步操作状态横条（带动画）
 *
 * loading: 旋转 Loader 图标 + "处理中 · message"
 * success: 对勾 ZoomIn spring 入场 + "已完成 · message"
 * error:   静态文字 + "需要处理 · message"
 * idle:    不渲染
 */
export function AsyncStatusBanner({
  status,
  message,
}: {
  status: "idle" | "loading" | "success" | "error";
  message?: string;
}) {
  const c = useBentoTheme().colors;
  if (status === "idle" || !message) return null;

  const color = status === "error" ? c.warn : status === "success" ? c.positive : c.accent;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      style={{
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: `${color}55`,
        backgroundColor: `${color}12`,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
      }}
    >
      {status === "loading" ? (
        <SpinningLoader size={16} color={color} />
      ) : status === "success" ? (
        <Animated.View
          entering={ZoomIn.duration(300).springify().damping(10)}
          style={{ width: 16, height: 16, alignItems: "center", justifyContent: "center" }}
        >
          <AppIcon name="check" size={16} color={c.positive} />
        </Animated.View>
      ) : null}
      <BentoText variant="micro" color={color} style={{ lineHeight: 16 }}>
        {status === "loading" ? "处理中 · " : status === "success" ? "已完成 · " : "需要处理 · "}
        {message}
      </BentoText>
    </Animated.View>
  );
}

export function SkeletonBlock({ width = "100%", height = 16, radius = 6 }: { width?: DimensionValue; height?: number; radius?: number }) {
  const c = useBentoTheme().colors;
  return (
    <View
      style={{
        width,
        height,
        borderRadius: radius,
        backgroundColor: c.glassRaised,
        opacity: 0.6,
      }}
    />
  );
}

export function SkeletonCard() {
  const c = useBentoTheme().colors;
  return (
    <View style={{ gap: 10, padding: 12, borderRadius: 12, backgroundColor: c.glass }}>
      <SkeletonBlock width="40%" height={14} />
      <SkeletonBlock width="100%" height={20} />
      <SkeletonBlock width="70%" height={20} />
      <View style={{ flexDirection: "row", gap: 8, paddingTop: 4 }}>
        <SkeletonBlock width={60} height={24} radius={12} />
        <SkeletonBlock width={80} height={24} radius={12} />
      </View>
    </View>
  );
}
