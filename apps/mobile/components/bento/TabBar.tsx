/**
 * Bento Glass · TabBar
 * 底部浮玻璃 Tab Bar
 */
import { Pressable, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { bento, radius } from "./tokens";
import { useBentoTheme } from "./ThemeProvider";
import { Text } from "./Text";
import { GlassTile } from "./GlassTile";
import AppIcon, { type AppIconName } from "./AppIcon";

export type TabItem = {
  key: string;
  label: string;
  icon: AppIconName;
};

export type BentoTabBarProps = {
  items: TabItem[];
  activeIndex: number;
  onPress: (index: number) => void;
};

export function BentoTabBar({ items, activeIndex, onPress }: BentoTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useBentoTheme();
  const marginBottom = Math.max(12, insets.bottom + 8);

  const shell: ViewStyle = {
    position: "absolute",
    left: bento.pagePadding,
    right: bento.pagePadding,
    bottom: marginBottom,
  };

  return (
    <View style={[shell, { pointerEvents: "box-none" }]}>
      <GlassTile raised glow="accent" radius={radius.xl} padding={0} style={{ borderColor: colors.glassBorderBright }}>
        <View style={{ flexDirection: "row", height: 70, paddingTop: 7, paddingBottom: 4 }}>
          {items.map((item, i) => {
            const focused = i === activeIndex;
            return (
              <Pressable
                key={item.key}
                onPress={() => onPress(i)}
                style={{ flex: 1, alignItems: "center", justifyContent: "center", minHeight: 52, gap: 3 }}
              >
                <AppIcon name={item.icon} size={20} color={focused ? "accent" : "inkMute"} strokeWidth={2} />
                <Text weight="semibold" color={focused ? colors.accent : colors.inkMute} style={{ fontSize: 12 }}>
                  {item.label}
                </Text>
                {focused ? (
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 999,
                      backgroundColor: colors.accent,
                      marginTop: 1,
                    }}
                  />
                ) : (
                  <View style={{ height: 7 }} />
                )}
              </Pressable>
            );
          })}
        </View>
      </GlassTile>
    </View>
  );
}

export default BentoTabBar;
