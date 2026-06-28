import { View } from "react-native";
import { useBentoTheme, Text as BentoText } from "../../components/bento";

const equipmentLabels: Record<string, string> = {
  Barbell: "杠铃",
  Dumbbell: "哑铃",
  Kettlebell: "壶铃",
  Cable: "绳索",
  Machine: "器械",
  "Leverage Machine": "器械",
  "Body Weight": "徒手",
  Assisted: "辅助",
  Band: "弹力带"
};

export function LibraryEquipmentRail({ options }: { options: string[] }) {
  const c = useBentoTheme().colors;
  const text = options.slice(0, 9).map((item) => equipmentLabels[item] ?? item).join("");
  if (!text) return null;
  return (
    <View style={{ width: 20, alignItems: "center", paddingTop: 132 }}>
      <BentoText weight="bold" style={{ color: c.positive, fontSize: 12, lineHeight: 22, textAlign: "center" }}>
        {text.split("").join("\n")}
      </BentoText>
    </View>
  );
}
