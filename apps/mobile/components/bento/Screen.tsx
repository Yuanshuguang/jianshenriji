/**
 * Bento Glass · Screen
 * 页面容器 + 头部（日期标签 + 标题 + 副标题 + 右上角徽章）
 */
import { Pressable, ScrollView, View, type ViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { bento, colors, screenContainer, scrollViewContent } from "./tokens";
import { useBentoTheme } from "./ThemeProvider";
import { Text } from "./Text";
import { Label } from "./Label";
import { Badge, type BadgeProps } from "./Badge";
import type { ReactNode } from "react";

export type ScreenProps = {
  children?: ReactNode;
  scroll?: boolean;
};

export function Screen({ children, scroll = true }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const theme = useBentoTheme();
  const bottomSafeSpace = Math.max(112, insets.bottom + 96);
  const containerStyle = [screenContainer, { backgroundColor: theme.colors.bg }];
  const content = (
    <View style={{ flex: 1, paddingTop: insets.top + 8, paddingBottom: bottomSafeSpace }}>{children}</View>
  );
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
  kicker?: string; // 全大写小标签
  onKickerPress?: () => void;
  title: string;
  subtitle?: string;
  badge?: { text: string; color: BadgeProps["color"] };
};

export function ScreenHeader({ kicker, onKickerPress, title, subtitle, badge, style }: ScreenHeaderProps) {
  const theme = useBentoTheme();
  const c = theme.colors;
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
        <View style={{ flex: 1, gap: 3 }}>
          <Text variant="h2" weight="bold">
            {title}
          </Text>
          {subtitle ? (
            <Text variant="caption" color={c.inkMute}>
              {subtitle}
            </Text>
          ) : null}
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
