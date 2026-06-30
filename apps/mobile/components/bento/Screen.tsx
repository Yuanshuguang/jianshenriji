import { useRouter, useSegments } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, ScrollView, View, type ViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { bento, screenContainer, scrollViewContent } from "./tokens";
import { useBentoTheme } from "./ThemeProvider";
import { Text } from "./Text";
import { Label } from "./Label";
import { Badge, type BadgeProps } from "./Badge";

export type ScreenProps = {
  children?: ReactNode;
  scroll?: boolean;
};

export function Screen({ children, scroll = true }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const theme = useBentoTheme();
  const bottomSafeSpace = Math.max(112, insets.bottom + 96);
  const containerStyle = [screenContainer, { backgroundColor: theme.colors.bg }];
  const content = <View style={{ flex: 1, paddingTop: insets.top + 8, paddingBottom: bottomSafeSpace }}>{children}</View>;

  if (!scroll) {
    return <View style={[containerStyle, { flex: 1 }]}>{content}</View>;
  }

  return (
    <ScrollView
      style={[containerStyle, { flex: 1 }]}
      contentContainerStyle={[scrollViewContent, { paddingTop: insets.top + 8, paddingBottom: bottomSafeSpace }]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

export type ScreenHeaderProps = ViewProps & {
  kicker?: string;
  onKickerPress?: () => void;
  title: string;
  subtitle?: string;
  badge?: { text: string; color: BadgeProps["color"] };
  showBackButton?: boolean;
};

export function ScreenHeader({
  kicker,
  onKickerPress,
  title,
  subtitle,
  badge,
  showBackButton,
  style,
}: ScreenHeaderProps) {
  const router = useRouter();
  const segments = useSegments();
  const theme = useBentoTheme();
  const c = theme.colors;
  const isTabRoute = segments.includes("(tabs)");
  const canGoBack = showBackButton ?? (!isTabRoute && (router.canGoBack?.() ?? false));

  return (
    <View style={[{ gap: 5, marginBottom: bento.tileGap }, style]}>
      {kicker ? (
        onKickerPress ? (
          <Pressable onPress={onKickerPress} style={{ alignSelf: "flex-start" }}>
            <Label color={c.inkMute} variant="label">
              {kicker}
            </Label>
          </Pressable>
        ) : (
          <Label color={c.inkMute} variant="label">
            {kicker}
          </Label>
        )
      ) : null}
      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, flex: 1, minWidth: 0 }}>
          {canGoBack ? (
            <Pressable
              onPress={() => router.back()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="返回上一页"
              style={({ pressed }) => ({
                width: 32,
                height: 32,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: c.glass,
                borderWidth: 1,
                borderColor: c.glassBorderBright,
                opacity: pressed ? 0.76 : 1,
                flexShrink: 0,
              })}
            >
              <Text weight="bold" color={c.ink} style={{ fontSize: 22, lineHeight: 22 }}>
                {"<"}
              </Text>
            </Pressable>
          ) : null}
          <View style={{ flex: 1, gap: 3, minWidth: 0 }}>
            <Text variant="h2" weight="bold">
              {title}
            </Text>
            {subtitle ? (
              <Text variant="caption" color={c.inkMute}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>
        {badge ? (
          <Badge color={badge.color} size="sm">
            {badge.text}
          </Badge>
        ) : null}
      </View>
    </View>
  );
}

export default Screen;
