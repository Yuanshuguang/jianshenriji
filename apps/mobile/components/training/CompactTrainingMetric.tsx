import { View, Text, Pressable } from "react-native";
import { useBentoTheme, Text as BentoText, radius } from "../../components/bento";

type SemanticColor = "positive" | "warn" | "accent" | "accent2" | "inkMute" | "glass" | "accent1" | "amber";

export function CompactTrainingMetric({ label, value, unit, color }: {
  label: string;
  value: number | string;
  unit: string;
  color: string;
}) {
  const c = useBentoTheme().colors;
  return (
    <View
      style={{
        flex: 1,
        minHeight: 38,
        justifyContent: "center",
        gap: 1,
        paddingHorizontal: 7,
        borderRadius: 8,
        backgroundColor: c.glass,
        borderWidth: 1,
        borderColor: c.glassBorder
      }}
    >
      <BentoText variant="micro" color={c.inkMute} numberOfLines={1}>
        {label}
      </BentoText>
      <BentoText mono weight="bold" color={color} style={{ fontSize: 13 }} numberOfLines={1}>
        {value}{unit ? <BentoText mono color={color} variant="micro"> {unit}</BentoText> : null}
      </BentoText>
    </View>
  );
}

export function DashboardSelectMetric({
  label,
  value,
  color,
  onPress,
  compact = false
}: {
  label: string;
  value: string;
  color: SemanticColor | "ink";
  onPress: () => void;
  compact?: boolean;
}) {
  const c = useBentoTheme().colors;
  const textColor = color === "ink" ? c.ink : (c as any)[color] ?? c.ink;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 44,
        justifyContent: "center",
        alignItems: "center",
        gap: compact ? 1 : 2,
        paddingHorizontal: compact ? 4 : 0,
        borderRadius: 8,
        backgroundColor: c.glass,
        borderWidth: 1,
        borderColor: c.glassBorder,
        opacity: pressed ? 0.76 : 1
      })}
    >
      <BentoText variant="micro" color={c.inkMute}>
        {label}
      </BentoText>
      <BentoText mono weight="bold" color={textColor} style={{ fontSize: compact ? 12 : 14 }} numberOfLines={1}>
        {value}
      </BentoText>
    </Pressable>
  );
}
