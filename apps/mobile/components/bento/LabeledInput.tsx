/**
 * Bento Glass · LabeledInput
 * 玻璃底输入框 + 上方小标签
 */
import { TextInput, View, type TextInputProps, type ViewStyle } from "react-native";
import { radius } from "./tokens";
import { useBentoTheme } from "./ThemeProvider";
import { Label } from "./Label";
import type { ReactNode } from "react";

export type LabeledInputProps = Omit<TextInputProps, "style"> & {
  label: string;
  containerStyle?: ViewStyle;
  suffix?: ReactNode;
};

export function LabeledInput({
  label,
  containerStyle,
  suffix,
  ...rest
}: LabeledInputProps) {
  const { colors } = useBentoTheme();
  return (
    <View style={[{ gap: 6 }, containerStyle]}>
      <Label color={colors.inkMute} variant="label">
        {label}
      </Label>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.glass,
          borderWidth: 1,
          borderColor: colors.glassBorder,
          borderRadius: radius.md,
          paddingHorizontal: 12,
          height: 44,
        }}
      >
        <TextInput
          placeholderTextColor={colors.inkFaint}
          style={{
            flex: 1,
            color: colors.ink,
            fontSize: 14,
            padding: 0,
          }}
          {...rest}
        />
        {suffix}
      </View>
    </View>
  );
}

export default LabeledInput;
