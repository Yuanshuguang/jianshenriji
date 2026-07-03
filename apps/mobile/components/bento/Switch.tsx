import { useEffect, useRef } from "react";
import { Animated, Platform, Pressable, StyleSheet, View } from "react-native";
import { colors as defaultColors } from "./tokens";
import { resolveThemeColor, useBentoTheme } from "./ThemeProvider";

type SwitchProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  /** 开启时的辉光色 */
  activeColor?: string;
  size?: "sm" | "md";
  disabled?: boolean;
  accessibilityLabel?: string;
};

/**
 * Bento Glass 风格的开关。
 * - 关闭：玻璃灰底 + 灰色圆点
 * - 开启：辉光色底 + 辉光色圆点 + 外发光
 */
export function Switch({
  value,
  onValueChange,
  activeColor = defaultColors.accent,
  size = "md",
  disabled = false,
  accessibilityLabel
}: SwitchProps) {
  const theme = useBentoTheme();
  const colors = theme.colors;
  const themedActiveColor = resolveThemeColor(activeColor, theme) ?? colors.accent;
  const isSm = size === "sm";
  const trackWidth = isSm ? 40 : 48;
  const trackHeight = isSm ? 22 : 26;
  const thumbSize = isSm ? 16 : 20;
  const padding = (trackHeight - thumbSize) / 2;
  const maxOffset = trackWidth - thumbSize - padding * 2;

  const translateX = useRef(new Animated.Value(value ? maxOffset : 0)).current;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: value ? maxOffset : 0,
      useNativeDriver: true,
      friction: 7,
      tension: 60
    }).start();
  }, [value, maxOffset, translateX]);

  const trackBackgroundColor = value ? themedActiveColor : colors.glass;
  const trackBorderColor = value ? themedActiveColor : colors.glassBorder;
  const thumbColor = value ? "#FFFFFF" : colors.inkMute;

  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={accessibilityLabel}
      style={[styles.wrapper, { opacity: disabled ? 0.4 : 1 }]}
    >
      <View
        style={{
          width: trackWidth,
          height: trackHeight,
          borderRadius: trackHeight / 2,
          backgroundColor: trackBackgroundColor,
          borderWidth: 1,
          borderColor: trackBorderColor,
          justifyContent: "center",
          paddingHorizontal: padding,
          ...(value
            ? Platform.OS === "web"
              ? { boxShadow: `0px 0px 8px ${themedActiveColor}80` }
              : {
                  shadowColor: themedActiveColor,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.5,
                  shadowRadius: 8,
                  elevation: 4,
                }
            : null)
        }}
      >
        <Animated.View
          style={{
            width: thumbSize,
            height: thumbSize,
            borderRadius: thumbSize / 2,
            backgroundColor: thumbColor,
            transform: [{ translateX }]
          }}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: "flex-start"
  }
});
