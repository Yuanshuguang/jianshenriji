/**
 * Bento Glass · SelectChip
 * 可选中的胶囊标签，用于性别/训练水平/器材/部位等多选场景
 */
import { Pressable, type PressableProps, type PressableStateCallbackType, type StyleProp, type ViewStyle } from "react-native";
import { radius, type SemanticColor } from "./tokens";
import { useBentoTheme } from "./ThemeProvider";
import { Text } from "./Text";

export type SelectChipProps = Omit<PressableProps, "children"> & {
  label: string;
  active?: boolean;
  color?: SemanticColor;
  size?: "sm" | "md";
  block?: boolean;
};

export function SelectChip({
  label,
  active = false,
  color = "accent",
  size = "md",
  block = false,
  disabled,
  style,
  ...rest
}: SelectChipProps) {
  const { colors } = useBentoTheme();
  const accentColor = colors[color];
  const heights = { sm: 32, md: 38 };
  const fontSizes = { sm: 12, md: 13 } as const;

  const base: ViewStyle = {
    height: heights[size],
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    opacity: disabled ? 0.5 : 1,
  };

  if (block) {
    base.flex = 1;
  }

  if (active) {
    base.backgroundColor = `${accentColor}22`;
    base.borderColor = accentColor;
  } else {
    base.backgroundColor = colors.glass;
    base.borderColor = colors.glassBorder;
  }

  const textColor = active ? accentColor : colors.inkMute;

  return (
    <Pressable
      disabled={disabled}
      style={(state: PressableStateCallbackType): StyleProp<ViewStyle> => {
        const extraStyle = typeof style === "function" ? style(state) : style;
        return [base, state.pressed && { opacity: 0.84 }, extraStyle];
      }}
      {...rest}
    >
      <Text weight="semibold" color={textColor} style={{ fontSize: fontSizes[size] }}>
        {label}
      </Text>
    </Pressable>
  );
}

export default SelectChip;
