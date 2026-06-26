/**
 * Bento Glass · Label
 * 全大写等宽小标签，仪表盘刻度感
 */
import { Text, type BentoTextProps } from "./Text";

export type LabelProps = Omit<BentoTextProps, "uppercase" | "mono"> & {
  children?: string;
};

export function Label({ children, tracking, ...rest }: LabelProps) {
  return (
    <Text mono uppercase tracking={tracking ?? 0.08} {...rest}>
      {children}
    </Text>
  );
}

export default Label;
