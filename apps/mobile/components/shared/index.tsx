/**
 * Shared UI components — 微信风格分组列表组件
 * 统一 plan.tsx / more.tsx / diet-plan 的 SettingsRow / SectionHeader / SettingsGroup
 */
import { Children, type ReactNode } from "react";
import { Pressable, View } from "react-native";
import { Text as BentoText, radius, useBentoTheme } from "../bento";

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
  icon,
  label,
  subtitle,
  trailing,
  onPress,
  showArrow = true,
  dangerous = false,
}: {
  icon?: string;
  label: string;
  subtitle?: string;
  trailing?: ReactNode;
  onPress?: () => void;
  showArrow?: boolean;
  dangerous?: boolean;
}) {
  const c = useBentoTheme().colors;
  const isPressable = !!onPress;

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
      {icon ? (
        typeof icon === "string" ? (
          <BentoText style={{ fontSize: 22, width: 28, textAlign: "center" }}>{icon}</BentoText>
        ) : (
          <View style={{ width: 28, alignItems: "center", justifyContent: "center" }}>{icon}</View>
        )
      ) : null}
      <View style={{ flex: 1, gap: 2 }}>
        <BentoText weight="medium" variant="body" color={dangerous ? c.warn : "#F7FAFF"} style={{ fontSize: 15 }}>
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
        <BentoText style={{ fontSize: 16, color: c.inkFaint, width: 16, textAlign: "center" }}>
          {">"}
        </BentoText>
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
          <BentoText style={{ fontSize: 18, lineHeight: 22 }}>{icon}</BentoText>
          <BentoText variant="body" weight="semibold" color="#F7FAFF">{label}</BentoText>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          {value ? <BentoText variant="caption" color={c.inkMute}>{value}</BentoText> : null}
          <BentoText variant="caption" color={c.inkFaint} style={{ fontSize: 16 }}>
            {expanded ? "⌄" : "›"}
          </BentoText>
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
