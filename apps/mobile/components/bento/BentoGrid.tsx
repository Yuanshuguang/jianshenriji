/**
 * Bento Glass · BentoGrid
 * Bento 不等格布局助手：行 / 列 / 自适应格子
 */
import { View, type ViewProps, type ViewStyle } from "react-native";
import { bento } from "./tokens";
import type { ReactNode } from "react";

export type BentoRowProps = ViewProps & {
  gap?: number;
  children?: ReactNode;
};

/** 一行格子，水平排列 */
export function BentoRow({ gap = bento.tileGap, style, children, ...rest }: BentoRowProps) {
  return (
    <View style={[{ flexDirection: "row", gap }, style]} {...rest}>
      {children}
    </View>
  );
}

export type BentoColProps = ViewProps & {
  gap?: number;
  children?: ReactNode;
};

/** 一列格子，垂直排列 */
export function BentoCol({ gap = bento.tileGap, style, children, ...rest }: BentoColProps) {
  return (
    <View style={[{ flexDirection: "column", gap }, style]} {...rest}>
      {children}
    </View>
  );
}

export type BentoTileProps = ViewProps & {
  flex?: number;
  children?: ReactNode;
};

/** 单个格子，flex 控制占比 */
export function BentoTile({ flex = 1, style, children, ...rest }: BentoTileProps) {
  return (
    <View style={[{ flex } as ViewStyle, style]} {...rest}>
      {children}
    </View>
  );
}

/** 三连格 */
export function BentoTriple({ children, gap = bento.tileGap, style }: { children: ReactNode[]; gap?: number; style?: ViewStyle }) {
  return (
    <View style={[{ flexDirection: "row", gap }, style]}>
      {children.map((child, i) => (
        <View key={i} style={{ flex: 1 }}>
          {child}
        </View>
      ))}
    </View>
  );
}
