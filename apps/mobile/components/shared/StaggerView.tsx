/**
 * StaggerView — 列表项依次入场动画容器
 *
 * 基于 react-native-reanimated entering/exiting 动画。
 * 食谱：FadeInDown + spring + delay(index * staggerMs)
 *
 * 示例（饮食页卡片列表）：
 *   {mealRows.map((row, i) => (
 *     <StaggerView key={row.id} index={i}>
 *       <MealRecordCard ... />
 *     </StaggerView>
 *   ))}
 */
import { type ReactNode } from "react";
import { type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  FadeInDown,
  FadeOutDown,
  FadeInUp,
  FadeOutUp,
  SlideInDown,
  SlideOutDown,
  SlideInRight,
  SlideOutRight,
  ZoomIn,
  ZoomOut,
  type EntryExitAnimationFunction,
} from "react-native-reanimated";

const DEFAULT_STAGGER_MS = 80;
const DEFAULT_SPRING = { damping: 18, stiffness: 120 };

export type EnteringAnimation = "fadeInDown" | "fadeInUp" | "slideInDown" | "slideInRight" | "zoomIn";
export type ExitingAnimation = "fadeOutDown" | "fadeOutUp" | "slideOutDown" | "slideOutRight" | "zoomOut";

export type StaggerViewProps = {
  /** 列表中的序号，用于计算 delay = index * staggerMs */
  index: number;
  /** 入场动画类型，默认 fadeInDown */
  entering?: EnteringAnimation;
  /** 退场动画类型，默认 fadeOutDown */
  exiting?: ExitingAnimation;
  /** stagger 间隔(ms)，默认 80 */
  staggerMs?: number;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  animated?: boolean;
};

// 用函数返回动画实例，避开 TS 类型不兼容问题
function getEnteringAnim(name: EnteringAnimation, delayMs: number) {
  const spring = { damping: DEFAULT_SPRING.damping, stiffness: DEFAULT_SPRING.stiffness };
  switch (name) {
    case "fadeInDown":   return FadeInDown.delay(delayMs).springify().damping(spring.damping).stiffness(spring.stiffness);
    case "fadeInUp":     return FadeInUp.delay(delayMs).springify().damping(spring.damping).stiffness(spring.stiffness);
    case "slideInDown":  return SlideInDown.delay(delayMs).springify().damping(spring.damping).stiffness(spring.stiffness);
    case "slideInRight": return SlideInRight.delay(delayMs).springify().damping(spring.damping).stiffness(spring.stiffness);
    case "zoomIn":       return ZoomIn.delay(delayMs).springify().damping(spring.damping).stiffness(spring.stiffness);
  }
}

function getExitingAnim(name: ExitingAnimation) {
  switch (name) {
    case "fadeOutDown":   return FadeOutDown;
    case "fadeOutUp":     return FadeOutUp;
    case "slideOutDown":  return SlideOutDown;
    case "slideOutRight": return SlideOutRight;
    case "zoomOut":       return ZoomOut;
  }
}

export function StaggerView({
  index,
  entering = "fadeInDown",
  exiting = "fadeOutDown",
  staggerMs = DEFAULT_STAGGER_MS,
  style,
  children,
  animated = true,
}: StaggerViewProps) {
  if (!animated) {
    return <Animated.View style={style}>{children}</Animated.View>;
  }

  const delay = index * staggerMs;
  const enteringAnim = getEnteringAnim(entering, delay);
  const exitingAnim = getExitingAnim(exiting);

  return (
    <Animated.View entering={enteringAnim} exiting={exitingAnim} style={style}>
      {children}
    </Animated.View>
  );
}

export default StaggerView;
