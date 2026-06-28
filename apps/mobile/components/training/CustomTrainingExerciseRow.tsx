import { View } from "react-native";
import { Text as BentoText, useBentoTheme } from "../../components/bento";

type TodayTrainingCustomExerciseLocal = {
  id: string;
  name: string;
  equipment: string | null;
  bodyPart: string | null;
  minutes: number;
  source: string;
};

export function CustomTrainingExerciseRow({ item }: { item: TodayTrainingCustomExerciseLocal }) {
  const c = useBentoTheme().colors;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 7,
        paddingHorizontal: 8,
        borderRadius: 12,
        backgroundColor: `${c.accent2}10`,
        borderWidth: 1,
        borderColor: `${c.accent2}33`
      }}
    >
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: `${c.accent2}22`,
          borderWidth: 1,
          borderColor: c.accent2,
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <BentoText weight="bold" color={c.accent2} style={{ fontSize: 12 }}>
          参
        </BentoText>
      </View>
      <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
        <BentoText weight="semibold" variant="caption" color={c.ink} numberOfLines={1}>
          {item.name}
        </BentoText>
        <BentoText color={c.inkMute} style={{ fontSize: 11 }} numberOfLines={1}>
          参考动作 · {[item.equipment, item.bodyPart].filter(Boolean).join(" / ") || item.source}
        </BentoText>
      </View>
    </View>
  );
}
