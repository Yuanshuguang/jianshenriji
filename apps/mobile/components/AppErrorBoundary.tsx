import { Component, type ErrorInfo, type ReactNode } from "react";
import { Pressable, View } from "react-native";
import { colors, Text as BentoText } from "./bento";

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  error: Error | null;
};

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[app-error-boundary]", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <View style={{ flex: 1, justifyContent: "center", padding: 24, backgroundColor: colors.bg, gap: 12 }}>
        <BentoText weight="bold" color={colors.ink} style={{ fontSize: 20 }}>
          页面暂时无法显示
        </BentoText>
        <BentoText color={colors.inkMute} style={{ lineHeight: 20 }}>
          已捕获到渲染异常。你可以先重试，若问题持续出现，再把当前操作步骤记录下来排查。
        </BentoText>
        <Pressable
          onPress={() => this.setState({ error: null })}
          style={({ pressed }) => ({
            height: 44,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.accent,
            opacity: pressed ? 0.82 : 1
          })}
        >
          <BentoText weight="bold" color="#FFFFFF">重试</BentoText>
        </Pressable>
      </View>
    );
  }
}
