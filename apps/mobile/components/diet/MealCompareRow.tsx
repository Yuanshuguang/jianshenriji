import { Pressable, View } from "react-native";
import Svg, { Circle, Path, Line } from "react-native-svg";
import type { Food, MealAdjustmentKey } from "@fitness-calendar/shared";
import { Badge, GlassTile, Text as BentoText, bento, useBentoTheme, type SemanticColor } from "../bento";
import type { MealPlan } from "../../features/today-plan";

type MealDisplayMode = "planned" | "actual";

type FoodTagMatch = {
  input: string;
  food: Food;
  grams: number;
  quantity?: number;
  unit?: string;
  displayAmount?: string;
};

export type MealFoodTag = {
  key: string;
  label: string;
  calories: number;
  needsDetails?: boolean;
  match?: FoodTagMatch;
};

type MealChipItem = {
  key: string;
  label: string;
  amountLabel?: string;
  calories: number;
  match?: FoodTagMatch;
  needsDetails?: boolean;
};

export type MealRecordCardProps = {
  slotId: MealAdjustmentKey;
  name: string;
  tone: SemanticColor;
  mode: MealDisplayMode;
  planned?: MealPlan;
  actual?: MealPlan;
  actualTags: MealFoodTag[];
  onPressArrow: () => void;
  onEditTag: (key: string, item: FoodTagMatch, label: string, calories: string) => void;
};

export function MealRecordCard({
  slotId,
  name,
  tone,
  mode,
  planned,
  actual,
  actualTags,
  onPressArrow,
  onEditTag,
}: MealRecordCardProps) {
  const c = useBentoTheme().colors;
  const currentMeal = mode === "planned" ? planned : actual;
  const currentFoods = currentMeal?.foods ?? [];
  const foodChips: MealChipItem[] = mode === "actual"
    ? actualTags.map((item, index) => ({
        key: item.key ?? `${item.label}-${index}`,
        label: item.label,
        amountLabel: item.match?.displayAmount ?? formatGrams(item.match?.grams),
        calories: item.calories,
        match: item.match,
        needsDetails: item.needsDetails,
      }))
    : currentFoods.map((food, index) => ({
        key: `${food.name}-${food.grams}-${index}`,
        label: food.name,
        amountLabel: food.displayAmount ?? formatGrams(food.grams),
        calories: food.calories,
        match: undefined,
        needsDetails: false,
      }));

  return (
    <GlassTile radius={bento.tileRadiusSmall} padding={12}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 16,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: `${c[tone]}18`,
            borderWidth: 1,
            borderColor: `${c[tone]}28`,
          }}
        >
          <MealGlyph slotId={slotId} color={c[tone]} />
        </View>

        <View style={{ width: 86, gap: 4 }}>
          <BentoText weight="medium" color={c.ink} style={{ fontSize: 15, lineHeight: 18 }}>
            {name}
          </BentoText>
        </View>

        <View style={{ flex: 1, alignItems: "flex-end", gap: 8 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-end", gap: 8 }}>
            {foodChips.length > 0 ? (
              <>
                {foodChips.slice(0, 3).map((item) => (
                  mode === "actual" ? (
                  <MealFoodChip
                      key={item.key}
                      label={item.label}
                      amountLabel={item.amountLabel}
                      tone={tone}
                      onPress={item.match ? () => onEditTag(item.key, item.match!, item.label, String(Math.round(item.calories))) : undefined}
                    />
                  ) : (
                    <MealFoodChip
                      key={item.key}
                      label={item.label}
                      amountLabel={item.amountLabel}
                      tone={tone}
                    />
                  )
                ))}
                {foodChips.length > 3 ? (
                  <View
                    style={{
                      height: 30,
                      paddingHorizontal: 10,
                      borderRadius: 999,
                      backgroundColor: c.glass,
                      borderWidth: 1,
                      borderColor: c.glassBorder,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <BentoText variant="micro" color={c.inkMute}>
                      +{foodChips.length - 3}
                    </BentoText>
                  </View>
                ) : null}
              </>
            ) : (
              <BentoText variant="micro" color={c.inkFaint}>
                暂无记录
              </BentoText>
            )}
          </View>
        </View>

        <Pressable
          onPress={onPressArrow}
          hitSlop={10}
          style={({ pressed }) => ({
            width: 32,
            height: 32,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.72 : 1,
          })}
        >
          <ChevronRight color={c.inkMute} />
        </Pressable>
      </View>
    </GlassTile>
  );
}

function MealFoodChip({
  label,
  amountLabel,
  tone,
  onPress,
}: {
  label: string;
  amountLabel?: string;
  tone: SemanticColor;
  onPress?: () => void;
}) {
  const c = useBentoTheme().colors;
  const content = (
    <View
      style={{
        minHeight: 30,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
        backgroundColor: `${c[tone]}14`,
        borderWidth: 1,
        borderColor: `${c[tone]}24`,
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 1,
        maxWidth: 168,
      }}
    >
      <BentoText weight="medium" color={c.ink} variant="caption" numberOfLines={1}>
        {label}
      </BentoText>
      {amountLabel ? (
        <BentoText variant="micro" color={c.inkMute} numberOfLines={1}>
          {amountLabel}
        </BentoText>
      ) : null}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
      {content}
    </Pressable>
  );
}

function formatGrams(grams?: number) {
  if (!grams || grams <= 0) return undefined;
  return `${Math.round(grams)}g`;
}

function MealGlyph({ slotId, color }: { slotId: MealAdjustmentKey; color: string }) {
  if (slotId === "dinner" || slotId === "snack") {
    return (
      <Svg width={22} height={22} viewBox="0 0 24 24">
        <Path
          d="M14.7 4.5a8 8 0 1 0 4.8 14.2A7 7 0 0 1 14.7 4.5Z"
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="4.5" fill="none" stroke={color} strokeWidth={2} />
      <Line x1="12" y1="2.8" x2="12" y2="5.5" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1="12" y1="18.5" x2="12" y2="21.2" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1="2.8" y1="12" x2="5.5" y2="12" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1="18.5" y1="12" x2="21.2" y2="12" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function ChevronRight({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path d="M9 5.5 15.5 12 9 18.5" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default MealRecordCard;
export { MealRecordCard as MealCompareRow };
