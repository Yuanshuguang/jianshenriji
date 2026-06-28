import { type ReactNode, useRef } from "react";
import { Animated, Pressable, View, TextInput } from "react-native";
import {
  Label,
  Text as BentoText,
  radius,
  useBentoTheme,
  type BentoThemeColors,
  type SemanticColor,
} from "../bento";

export function getInputStyle(c: BentoThemeColors) {
  return {
    minHeight: 56,
    backgroundColor: c.glass,
    borderWidth: 1,
    borderColor: c.glassBorder,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: c.ink,
    fontSize: 14,
  } as const;
}

export function getRecordInputStyle(c: BentoThemeColors) {
  return {
    minHeight: 28,
    backgroundColor: "transparent",
    borderWidth: 0,
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    color: c.ink,
    fontSize: 15,
  } as const;
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
  const rotateAnim = useRef(new Animated.Value(collapsed ? 0 : 1)).current;
  const chevronRef = useRef<Animated.Value>(rotateAnim);

  Animated.timing(rotateAnim, {
    toValue: collapsed ? 0 : 1,
    duration: 200,
    useNativeDriver: true,
  }).start();

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
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      useNativeDriver: true,
      speed: 50,
      bounciness: 8,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 8,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      hitSlop={{ top: 9, bottom: 9, left: 4, right: 4 }}
    >
      <Animated.View
        style={{
          height: 26,
          paddingHorizontal: 10,
          borderRadius: 999,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: c.glass,
          borderWidth: 1,
          borderColor: c.glassBorderBright,
          transform: [{ scale: scaleAnim }],
        }}
      >
        <BentoText weight="semibold" color={c[color]} style={{ fontSize: 11 }}>{label}</BentoText>
      </Animated.View>
    </Pressable>
  );
}

export function SmallInput({ label, value, onChangeText }: { label: string; value: string; onChangeText: (text: string) => void }) {
  const c = useBentoTheme().colors;
  return (
    <View style={{ flex: 1, minWidth: 86, gap: 4 }}>
      <BentoText variant="micro" color={c.inkMute}>{label}</BentoText>
      <TextInput keyboardType="numeric" value={value} onChangeText={onChangeText} placeholder="0" placeholderTextColor={c.inkFaint} style={[getInputStyle(c), { minHeight: 42, paddingVertical: 8 }]} />
    </View>
  );
}
