import { Platform, TextInput, View } from "react-native";
import {
  GlassTile,
  Text as BentoText,
  bento,
  useBentoTheme,
} from "../bento";
import type { MealPlan } from "../../features/today-plan";

export function MealCompareRow({
  name,
  planned,
  actual,
  actualText,
  onActualTextChange,
}: {
  name: string;
  planned?: MealPlan;
  actual?: MealPlan;
  actualText: string;
  onActualTextChange: (text: string) => void;
}) {
  const c = useBentoTheme().colors;
  return (
    <GlassTile radius={bento.tileRadiusSmall} padding={10}>
      <View style={{ flexDirection: "row", alignItems: "stretch", gap: 10 }}>
        <View style={{ width: 44, justifyContent: "center", paddingRight: 2 }}>
          <BentoText weight="bold" variant="caption" color={c.ink}>{name}</BentoText>
        </View>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <MealColumn meal={planned} />
        </View>
        <View
          style={{
            width: 3,
            alignSelf: "stretch",
            marginVertical: 2,
            borderRadius: 999,
            backgroundColor: c.accent,
            ...(Platform.OS === "web"
              ? { boxShadow: `0px 0px 4px ${c.accent}73` }
              : {
                  shadowColor: c.accent,
                  shadowOpacity: 0.45,
                  shadowRadius: 4,
                  shadowOffset: { width: 0, height: 0 },
                }),
          }}
        />
        <View style={{ flex: 1, paddingLeft: 10 }}>
          <MealActualColumn meal={actual} text={actualText} onChangeText={onActualTextChange} />
        </View>
      </View>
    </GlassTile>
  );
}

function MealColumn({ meal }: { meal?: MealPlan }) {
  const c = useBentoTheme().colors;
  return (
    <View style={{ flex: 1, gap: 6 }}>
      <BentoText variant="caption" color={c.inkMute}>{formatMealFoods(meal)}</BentoText>
    </View>
  );
}

function MealActualColumn({ meal, text, onChangeText }: { meal?: MealPlan; text: string; onChangeText: (text: string) => void }) {
  const c = useBentoTheme().colors;
  return (
    <View style={{ flex: 1, gap: 5 }}>
      <BentoText variant="caption" color={meal?.foods.length ? c.inkMute : c.inkFaint}>
        {formatMealFoods(meal)}
      </BentoText>
      <TextInput
        value={text}
        onChangeText={onChangeText}
        placeholder="本餐实际"
        placeholderTextColor={c.inkFaint}
        style={{
          minHeight: 32,
          borderRadius: 10,
          backgroundColor: c.glass,
          borderWidth: 1,
          borderColor: c.glassBorder,
          paddingHorizontal: 8,
          paddingVertical: 5,
          color: c.ink,
          fontSize: 12
        }}
      />
    </View>
  );
}

function formatMealFoods(meal?: MealPlan): string {
  if (!meal || meal.foods.length === 0) return "-";
  return meal.foods.map((item) => `${item.name} ${(item as any).displayAmount ?? Math.round((item as any).grams) + "g"}`).join(" · ");
}
