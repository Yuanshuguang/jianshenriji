/**
 * Shared UI components — 微信风格分组列表组件
 * 统一 plan.tsx / more.tsx / diet-plan 的 SettingsRow / SectionHeader / SettingsGroup
 */
import { Children, type ReactNode } from "react";
import { Pressable, View } from "react-native";
import { AppIcon, type AppIconName, Text as BentoText, radius, useBentoTheme } from "../bento";

/* ── SectionHeader ─────────────────────────────────────────── */

export function SectionHeader({ title }: { title: string }) {
  const c = useBentoTheme().colors;
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 6 }}>
      <BentoText weight="semibold" variant="micro" color={c.inkMute} style={{ textTransform: "uppercase", letterSpacing: 0.8 }}>
        {title}
      </BentoText>
    </View>
  );
}

/* ── SettingsGroup ─────────────────────────────────────────── */

export function SettingsGroup({ children }: { children: ReactNode }) {
  const c = useBentoTheme().colors;
  const items = Children.toArray(children).filter(Boolean);
  return (
    <View
      style={{
        backgroundColor: c.glass,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: c.glassBorder,
        overflow: "hidden",
      }}
    >
      {items.map((item, index) => (
        <View key={index}>
          {index > 0 ? (
            <View style={{ height: 0.5, backgroundColor: c.glassBorder, marginHorizontal: 16 }} />
          ) : null}
          {item}
        </View>
      ))}
    </View>
  );
}

/* ── SettingsRow ───────────────────────────────────────────── */

export function SettingsRow({
  iconName,
  iconNode,
  label,
  subtitle,
  trailing,
  onPress,
  showArrow = true,
  dangerous = false,
}: {
  /** Lucide 图标名 — 唯一合法的图标传入方式 */
  iconName?: AppIconName;
  /** 自定义图标 ReactNode — 如带颜色的 AppIcon 组合 */
  iconNode?: ReactNode;
  label: string;
  subtitle?: string;
  trailing?: ReactNode;
  onPress?: () => void;
  showArrow?: boolean;
  dangerous?: boolean;
}) {
  const c = useBentoTheme().colors;
  const isPressable = !!onPress;
  const iconColor = dangerous ? c.warn : c.accent;

  const resolvedIcon = iconNode ?? (iconName ? <AppIcon name={iconName} size={18} color={iconColor} /> : null);

  const content = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 13,
        paddingHorizontal: 16,
        gap: 12,
        minHeight: 52,
      }}
    >
      {resolvedIcon ? (
        <View style={{ width: 28, alignItems: "center", justifyContent: "center" }}>{resolvedIcon}</View>
      ) : null}
      <View style={{ flex: 1, gap: 2 }}>
        <BentoText weight="medium" variant="body" color={dangerous ? c.warn : "#F7FAFF"}>
          {label}
        </BentoText>
        {subtitle ? (
          <BentoText variant="micro" color={dangerous ? c.warn : c.inkMute} numberOfLines={1}>
            {subtitle}
          </BentoText>
        ) : null}
      </View>
      {trailing}
      {showArrow && onPress ? (
        <AppIcon name="chevronRight" size={16} color={c.inkFaint} />
      ) : null}
    </View>
  );

  if (!isPressable) {
    return <View style={{ backgroundColor: c.glass, borderBottomWidth: 1, borderBottomColor: c.glassBorder }}>{content}</View>;
  }

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.72 : 1, backgroundColor: c.glass })}>
      <View style={{ borderBottomWidth: 1, borderBottomColor: c.glassBorder }}>{content}</View>
    </Pressable>
  );
}

/* ── ExpandableRow ─────────────────────────────────────────── */

export function ExpandableRow({
  icon,
  label,
  value,
  expanded,
  onToggle,
  children,
}: {
  icon: ReactNode;
  label: string;
  value?: string;
  expanded: boolean;
  onToggle: () => void;
  children?: ReactNode;
}) {
  const c = useBentoTheme().colors;
  return (
    <View>
      <Pressable
        onPress={onToggle}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: 50,
          paddingHorizontal: 16,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          {icon}
          <BentoText variant="body" weight="semibold" color="#F7FAFF">{label}</BentoText>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          {value ? <BentoText variant="caption" color={c.inkMute}>{value}</BentoText> : null}
          <AppIcon name={expanded ? "chevronDown" : "chevronRight"} size={16} color={c.inkFaint} strokeWidth={2} />
        </View>
      </Pressable>
      {expanded && children ? (
        <View style={{ paddingHorizontal: 16, paddingBottom: 14, paddingTop: 6 }}>
          {children}
        </View>
      ) : null}
    </View>
  );
}

export { WeekDateRail, type WeekDateRailItem } from "./WeekDateRail";
