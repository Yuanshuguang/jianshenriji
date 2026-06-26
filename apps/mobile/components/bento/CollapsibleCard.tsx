/**
 * Bento Glass · CollapsibleCard
 * 可折叠卡片：标题 + 展开按钮，展开时显示子内容
 */
import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, View, type ViewProps, type ViewStyle } from "react-native";
import { bento, radius, type SemanticColor } from "./tokens";
import { useBentoTheme } from "./ThemeProvider";
import { GlassTile } from "./GlassTile";
import { Label } from "./Label";
import { Text } from "./Text";
import type { ReactNode } from "react";

export type CollapsibleCardProps = ViewProps & {
  title: string;
  subtitle?: string;
  glow?: SemanticColor;
  defaultOpen?: boolean;
  children?: ReactNode;
};

export function CollapsibleCard({
  title,
  subtitle,
  glow,
  defaultOpen = false,
  children,
  style,
  ...rest
}: CollapsibleCardProps) {
  const { colors } = useBentoTheme();
  const [open, setOpen] = useState(defaultOpen);
  const heightAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      if (defaultOpen) {
        heightAnim.setValue(1);
        opacityAnim.setValue(1);
      }
      return;
    }
    const duration = 320;
    Animated.parallel([
      Animated.timing(heightAnim, {
        toValue: open ? 1 : 0,
        duration,
        useNativeDriver: false,
      }),
      Animated.timing(opacityAnim, {
        toValue: open ? 1 : 0,
        duration: open ? duration : duration * 0.6,
        useNativeDriver: false,
      }),
    ]).start();
  }, [open, defaultOpen, heightAnim, opacityAnim]);

  const arrowStyle: ViewStyle = {
    transform: [{ rotate: heightAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ["0deg", "180deg"],
    }) }],
  };

  return (
    <GlassTile glow={glow} style={[{ gap: 0 }, style]} {...rest}>
      {/* 头部：标题 + 按钮 */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Label color={colors.inkMute} variant="label">
            {title}
          </Label>
          {subtitle ? (
            <Text variant="micro" color={colors.inkFaint}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <Pressable
          onPress={() => setOpen((v) => !v)}
          style={({ pressed }) => [
            {
              height: 32,
              paddingHorizontal: 14,
              borderRadius: radius.pill,
              backgroundColor: colors.glass,
              borderWidth: 1,
              borderColor: colors.glassBorderBright,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 4,
              opacity: pressed ? 0.84 : 1,
            },
          ]}
        >
          <Text weight="semibold" color={glow ? colors[glow] : colors.accent} style={{ fontSize: 12 }}>
            {open ? "收起详情" : "查看详情"}
          </Text>
          <Animated.Text style={[{ color: glow ? colors[glow] : colors.accent, fontSize: 12 }, arrowStyle]}>
            ▾
          </Animated.Text>
        </Pressable>
      </View>

      {/* 折叠体 */}
      <Animated.View
        style={{
          maxHeight: heightAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 2000],
          }),
          opacity: opacityAnim,
          overflow: "hidden",
        }}
      >
        <View style={{ gap: bento.tileGap, marginTop: bento.tileGap, paddingTop: bento.tileGap, borderTopWidth: 1, borderTopColor: colors.glassBorder }}>
          {children}
        </View>
      </Animated.View>
    </GlassTile>
  );
}

export default CollapsibleCard;
