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
  const bottomSafeSpace = Math.max(116, insets.bottom + 96);
  const containerStyle = [screenContainer, { backgroundColor: theme.colors.bg }];
  const content = <View style={{ flex: 1, paddingTop: insets.top + 4, paddingBottom: bottomSafeSpace }}>{children}</View>;

  if (!scroll) {
    return <View style={[containerStyle, { flex: 1 }]}>{content}</View>;
  }

  return (
    <ScrollView
      style={[containerStyle, { flex: 1 }]}
      contentContainerStyle={[scrollViewContent, { paddingTop: insets.top + 4, paddingBottom: bottomSafeSpace }]}
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
  onTitlePress?: () => void;
  subtitle?: string;
  badge?: { text: string; color: BadgeProps["color"] };
  showBackButton?: boolean;
};

export function ScreenHeader({
  kicker,
  onKickerPress,
  title,
  onTitlePress,
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
    <View style={[{ gap: 4, marginBottom: 6 }, style]}>
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
                width: 34,
                height: 34,
                borderRadius: 17,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: c.bg,
                borderWidth: 1,
                borderColor: c.glassBorder,
                opacity: pressed ? 0.76 : 1,
                flexShrink: 0,
              })}
            >
              <Text weight="bold" color={c.ink} style={{ fontSize: 20, lineHeight: 20 }}>
                {"<"}
              </Text>
            </Pressable>
          ) : null}
          <View style={{ flex: 1, gap: 3, minWidth: 0 }}>
            {title ? (
              onTitlePress ? (
                <Pressable
                  onPress={onTitlePress}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel={`${title}，查看日历记录`}
                  style={{ alignSelf: "flex-start" }}
                >
                  <Text variant="h2" weight="bold" style={{ fontSize: 28, lineHeight: 32 }}>
                    {title}
                  </Text>
                </Pressable>
              ) : (
                <Text variant="h2" weight="bold" style={{ fontSize: 28, lineHeight: 32 }}>
                  {title}
                </Text>
              )
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
