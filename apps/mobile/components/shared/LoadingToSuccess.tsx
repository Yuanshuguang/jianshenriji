/**
 * LoadingToSuccess — 加载→成功对勾动画组件
 *
 * 基于 react-native-reanimated entering/exiting 编排。
 * loading 时显示旋转 spinner，完成后切换为 spring 缩放对勾。
 *
 * 示例：
 *   <LoadingToSuccess loading={saving} onDone={() => setStatus('saved')} />
 *
 * 组件会在 loading=false 时自动播放对勾缩放入场动画，
 * 并在 800ms 后调用 onDone（如果提供了）。
 */
import { type ReactNode, useEffect, useRef } from "react";
import { type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  FadeIn,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { AppIcon, useBentoTheme } from "../bento";

export type LoadingToSuccessProps = {
  /** true=显示加载，false=显示成功对勾 */
  loading: boolean;
  /** 成功动画播放完毕后回调 */
  onDone?: () => void;
  /** 成功后自动消失延迟(ms)，0=不消失，默认 800 */
  autoHideMs?: number;
  /** 自定义 loading 内容 */
  loadingContent?: ReactNode;
  /** 自定义成功内容 */
  successContent?: ReactNode;
  /** 外层样式 */
  style?: StyleProp<ViewStyle>;
  /** 对勾尺寸，默认 32 */
  checkSize?: number;
  /** spinner 尺寸，默认 24 */
  spinnerSize?: number;
};

const SPIN_DURATION = 800; // ms per rotation — 1.25 rev/s，视觉上流畅又不急躁

/** Spinner — FadeIn 入场 + 持续旋转动画 + Lucide Loader 图标 */
function DefaultSpinner({ size = 24, color }: { size?: number; color: string }) {
  const rotation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }), [rotation]);

  // 启动无限旋转：0→360 循环
  rotation.value = withRepeat(
    withTiming(360, { duration: SPIN_DURATION, easing: Easing.linear }),
    -1, // infinite
    false, // don't reverse — smooth clockwise spin
  );

  return (
    <Animated.View entering={FadeIn.duration(300)} style={[animatedStyle, { width: size, height: size, alignItems: "center", justifyContent: "center" }]}>
      <AppIcon name="loader" size={size} color={color} />
    </Animated.View>
  );
}

/** 绿色对勾 — ZoomIn spring 缩放入场 */
function DefaultCheck({ size = 32 }: { size?: number }) {
  const c = useBentoTheme().colors;
  return (
    <Animated.View
      entering={ZoomIn.duration(300).springify().damping(10)}
      style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}
    >
      <AppIcon name="check" size={size} color={c.positive} />
    </Animated.View>
  );
}

export function LoadingToSuccess({
  loading,
  onDone,
  autoHideMs = 800,
  loadingContent,
  successContent,
  style,
  checkSize = 32,
  spinnerSize = 24,
}: LoadingToSuccessProps) {
  const c = useBentoTheme().colors;
  const doneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 当 loading 从 true 变为 false 时，延迟后触发 onDone
  useEffect(() => {
    if (!loading && onDone) {
      doneTimer.current = setTimeout(onDone, 350 + autoHideMs);
    }
    return () => {
      if (doneTimer.current) clearTimeout(doneTimer.current);
    };
  }, [loading, onDone, autoHideMs]);

  return (
    <Animated.View style={[{ alignItems: "center", justifyContent: "center" }, style]}>
      {loading ? (
        loadingContent ?? <DefaultSpinner size={spinnerSize} color={c.accent} />
      ) : (
        successContent ?? <DefaultCheck size={checkSize} />
      )}
    </Animated.View>
  );
}

export default LoadingToSuccess;
