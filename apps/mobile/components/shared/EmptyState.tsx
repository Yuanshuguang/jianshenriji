import { View, type DimensionValue } from "react-native";
import { Text as BentoText, useBentoTheme } from "../bento";

export function EmptyState({
  icon = "📭",
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  icon?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const c = useBentoTheme().colors;
  return (
    <View style={{ alignItems: "center", gap: 8, paddingVertical: 32, paddingHorizontal: 20 }}>
      <BentoText style={{ fontSize: 36, lineHeight: 40 }}>{icon}</BentoText>
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
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          borderWidth: 2.5,
          borderColor: c.glassBorderBright,
          borderTopColor: c.accent,
        }}
      />
      <BentoText variant="caption" color={c.inkMute}>{label}</BentoText>
    </View>
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
