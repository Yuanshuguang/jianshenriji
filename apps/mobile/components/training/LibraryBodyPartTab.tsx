import { View, Pressable } from "react-native";
import { useBentoTheme, Text as BentoText } from "../../components/bento";
import type { LibraryExercise } from "../../types/training";

export type { LibraryExercise };

export function LibraryBodyPartTab({ label, active, onPress }: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const c = useBentoTheme().colors;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 44,
        paddingHorizontal: 6,
        justifyContent: "center",
        borderLeftWidth: 5,
        borderLeftColor: active ? c.positive : "transparent",
        backgroundColor: "transparent",
        opacity: pressed ? 0.72 : 1
      })}
    >
      <BentoText
        weight={active ? "bold" : "medium"}
        style={{ color: active ? c.ink : c.inkMute, fontSize: 15 }}
        numberOfLines={1}
      >
        {label}
      </BentoText>
    </Pressable>
  );
}
