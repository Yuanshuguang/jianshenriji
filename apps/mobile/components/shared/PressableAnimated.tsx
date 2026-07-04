/**
 * PressableAnimated — 按钮点击缩放回弹通用组件
 *
 * 基于 react-native-reanimated withSpring 实现原生级60fps回弹效果。
 * 用法：替代 <Pressable>，自动添加 press 缩放→回弹动画。
 *
 * 示例：
 *   <PressableAnimated onPress={handleSave}>
 *     <Text>保存</Text>
 *   </PressableAnimated>
 */
import { type ReactNode } from "react";
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

const SPRING_CONFIG = { damping: 12, stiffness: 150, mass: 0.5 };
const PRESS_SCALE = 0.94;

export type PressableAnimatedProps = PressableProps & {
  /** 按下缩放比，默认 0.94 */
  pressScale?: number;
  /** 是否启用动画，默认 true */
  animated?: boolean;
  children?: ReactNode;
};

export function PressableAnimated({
  onPress,
  onPressIn,
  onPressOut,
  onLongPress,
  disabled = false,
  style,
  children,
  pressScale = PRESS_SCALE,
  animated = true,
}: PressableAnimatedProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }), [scale]);

  const handlePressIn = () => {
    if (animated && !disabled) {
      scale.value = withSpring(pressScale, SPRING_CONFIG);
    }
    onPressIn?.({} as any);
  };

  const handlePressOut = () => {
    if (animated && !disabled) {
      scale.value = withSpring(1, SPRING_CONFIG);
    }
    onPressOut?.({} as any);
  };

  return (
    <Animated.View style={animated ? animatedStyle : undefined}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={onLongPress}
        disabled={disabled}
        style={style}
        accessibilityState={{ disabled: !!disabled }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

export default PressableAnimated;
