import { View, Text, Pressable } from "react-native";
import { useBentoTheme, Text as BentoText } from "../../components/bento";

export function LibraryPlanButton({ label, onPress }: {
  label: string;
  onPress: () => void;
}) {
  const c = useBentoTheme().colors;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        height: 44,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: c.glassRaised,
        borderWidth: 1,
        borderColor: c.glassBorderBright,
        opacity: pressed ? 0.76 : 1
      })}
    >
      <BentoText weight="bold" variant="micro" style={{ color: c.positive }} numberOfLines={1}>
        {label}
      </BentoText>
    </Pressable>
  );
}
