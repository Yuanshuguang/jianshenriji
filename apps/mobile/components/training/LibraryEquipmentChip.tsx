import { View, Text, Pressable } from "react-native";
import { useBentoTheme, Text as BentoText } from "../../components/bento";

export function LibraryEquipmentChip({ label, active, onPress }: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const c = useBentoTheme().colors;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        minWidth: 92,
        height: 44,
        paddingHorizontal: 18,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: active ? c.glassRaised : c.glass,
        opacity: pressed ? 0.76 : 1
      })}
    >
      <BentoText weight="bold" variant="caption" style={{ color: active ? c.positive : `${c.positive}CC` }} numberOfLines={1}>
        {label}
      </BentoText>
    </Pressable>
  );
}
