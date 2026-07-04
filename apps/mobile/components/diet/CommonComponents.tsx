import { type ReactNode } from "react";
import { Pressable, View, TextInput } from "react-native";
import RAnimated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import {
  AppIcon,
  Label,
  Text as BentoText,
  radius,
  useBentoTheme,
  type BentoThemeColors,
  type SemanticColor,
} from "../bento";

const PILL_SPRING = { damping: 12, stiffness: 150, mass: 0.5 };
const PILL_PRESS_SCALE = 0.92;

export function getInputStyle(c: BentoThemeColors, fontScale = 1) {
  return {
    minHeight: 56,
    backgroundColor: c.glass,
    borderWidth: 1,
    borderColor: c.glassBorder,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: c.ink,
    fontSize: Math.round(14 * fontScale),
  };
}

export function getRecordInputStyle(c: BentoThemeColors, fontScale = 1) {
  return {
    minHeight: 56,
    backgroundColor: c.glass,
    borderWidth: 1,
    borderColor: c.glassBorder,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: c.ink,
    fontSize: Math.round(14 * fontScale)
  };
}

export function CardHeader({
  title,
  collapsed,
  onToggle,
  trailing,
}: {
  title: string;
  collapsed: boolean;
  onToggle: () => void;
  trailing?: ReactNode;
}) {
  const c = useBentoTheme().colors;

  return (
    <View style={{ width: "100%", flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Label color={c.inkMute} variant="label">{title}</Label>
      <View style={{ flex: 1 }} />
      {trailing}
      <PillButton label={collapsed ? "展开" : "收起"} onPress={onToggle} color="accent" />
    </View>
  );
}

export function PillButton({ label, color, onPress }: { label: string; color: SemanticColor; onPress: () => void }) {
  const c = useBentoTheme().colors;
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }), [scale]);

  const handlePressIn = () => {
    scale.value = withSpring(PILL_PRESS_SCALE, PILL_SPRING);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, PILL_SPRING);
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      hitSlop={{ top: 9, bottom: 9, left: 4, right: 4 }}
    >
      <RAnimated.View
        style={[animatedStyle, {
          height: 26,
          paddingHorizontal: 10,
          borderRadius: 999,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: c.glass,
          borderWidth: 1,
          borderColor: c.glassBorderBright,
        }]}
      >
        <BentoText weight="semibold" color={c[color]} style={{ fontSize: 11 }}>{label}</BentoText>
      </RAnimated.View>
    </Pressable>
  );
}

export function SmallInput({ label, value, onChangeText }: { label: string; value: string; onChangeText: (text: string) => void }) {
  const theme = useBentoTheme();
  const c = theme.colors;
  return (
    <View style={{ flex: 1, minWidth: 86, gap: 4 }}>
      <BentoText variant="micro" color={c.inkMute}>{label}</BentoText>
      <TextInput keyboardType="numeric" value={value} onChangeText={onChangeText} placeholder="0" placeholderTextColor={c.inkFaint} style={[getInputStyle(c, theme.fontScale), { minHeight: 42, paddingVertical: 8 }]} />
    </View>
  );
}
