import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import type { NutritionTotals } from "@fitness-calendar/shared";
import {
  calculateDietPlanMacroTargets,
  getDietPlanById,
  type DietCycleVariant,
  type DietDayType,
  type DietPlan,
} from "../../features/diet-plans";
import { useCurrentEnergyPlan, useFitnessStore } from "../../store/fitness-store";
import {
  Badge,
  Button,
  Screen,
  Switch,
  Text as BentoText,
  type SemanticColor,
  useBentoTheme,
} from "../../components/bento";

const dayTypeLabels: Record<DietDayType, string> = {
  balanced: "均衡执行日",
  "high-carb": "高碳日",
  "medium-carb": "中碳日",
  "low-carb": "低碳日",
  "very-low-carb": "极低碳日",
  "depletion-carb": "断碳日",
  "fasting-low-calorie": "低热量日",
  "normal-eating": "正常饮食日",
};

const dayTypeHints: Partial<Record<DietDayType, string>> = {
  balanced: "稳定执行，适合日常训练饮食和长期塑形。",
  "high-carb": "建议放在腿部、背部或高消耗力量训练日。",
  "medium-carb": "建议放在中等强度训练、有氧或普通工作日。",
  "low-carb": "建议放在休息日、低强度训练日或控脂日。",
  "very-low-carb": "严格控碳，适合短期执行，不建议作为多数训练者默认方案。",
  "depletion-carb": "突破平台用，频率要低，并同步降低训练强度。",
  "fasting-low-calorie": "优先保证蛋白和蔬菜，避免连续安排。",
  "normal-eating": "按基础目标执行，不额外压低热量。",
};

const macroColors: Record<keyof NutritionTotals, SemanticColor> = {
  calories: "positive",
  proteinG: "amber",
  fatG: "warn",
  carbsG: "accent",
};

function uniqueDayTypes(plan: DietPlan): DietDayType[] {
  const fromRules = Object.keys(plan.dayTypeRules) as DietDayType[];
  const fromCycles = plan.cycleVariants?.flatMap((variant) => variant.cycleDays) ?? [];
  return Array.from(new Set([plan.defaultDayType, ...fromRules, ...fromCycles]));
}

function macroCalories(target: NutritionTotals) {
  return target.proteinG * 4 + target.fatG * 9 + target.carbsG * 4;
}

function macroDriftText(target: NutritionTotals) {
  const drift = Math.round(macroCalories(target) - target.calories);
  if (Math.abs(drift) <= 1) return "热量闭合";
  return drift > 0 ? `宏量高出 ${drift} kcal` : `宏量低于 ${Math.abs(drift)} kcal`;
}

function cyclePatternLabel(cycleDays: DietDayType[]) {
  const counts = cycleDays.reduce<Record<string, number>>((acc, dayType) => {
    acc[dayType] = (acc[dayType] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts)
    .map(([dayType, count]) => `${count} ${dayTypeLabels[dayType as DietDayType] ?? dayType}`)
    .join(" · ");
}

function MetricTile({ label, value, unit, color }: { label: string; value: number; unit: string; color: SemanticColor }) {
  const c = useBentoTheme().colors;
  return (
    <View
      style={{
        minWidth: 74,
        flex: 1,
        borderRadius: 12,
        paddingVertical: 9,
        paddingHorizontal: 8,
        backgroundColor: `${c[color]}1F`,
        borderWidth: 1,
        borderColor: `${c[color]}40`,
        gap: 2,
      }}
    >
      <BentoText variant="micro" color={c.inkMute} numberOfLines={1}>
        {label}
      </BentoText>
      <BentoText weight="bold" color={c.ink} style={{ fontSize: 15 }}>
        {value}
        <BentoText variant="micro" color={c.inkMute}> {unit}</BentoText>
      </BentoText>
    </View>
  );
}

function MacroTargetCard({ title, target }: { title: string; target: NutritionTotals }) {
  const c = useBentoTheme().colors;
  return (
    <View
      style={{
        borderRadius: 14,
        backgroundColor: c.glassRaised,
        borderWidth: 1,
        borderColor: c.glassBorder,
        padding: 12,
        gap: 10,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <BentoText weight="semibold" color={c.ink} style={{ fontSize: 15 }}>
          {title}
        </BentoText>
        <Badge color={Math.abs(macroCalories(target) - target.calories) <= 1 ? "positive" : "warn"} size="sm">
          {macroDriftText(target)}
        </Badge>
      </View>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        <MetricTile label="大卡" value={target.calories} unit="kcal" color={macroColors.calories} />
        <MetricTile label="碳水" value={target.carbsG} unit="g" color={macroColors.carbsG} />
        <MetricTile label="脂肪" value={target.fatG} unit="g" color={macroColors.fatG} />
        <MetricTile label="蛋白" value={target.proteinG} unit="g" color={macroColors.proteinG} />
      </View>
    </View>
  );
}

function VariantCard({
  variant,
  selected,
  expanded,
  onToggleExpand,
  onSelect,
}: {
  variant: DietCycleVariant;
  selected: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onSelect: () => void;
}) {
  const c = useBentoTheme().colors;
  return (
    <View
      style={{
        borderRadius: 14,
        borderWidth: 1,
        borderColor: selected ? c.accent : c.glassBorder,
        backgroundColor: selected ? `${c.accent}18` : c.glassRaised,
        padding: 12,
        gap: expanded ? 10 : 0,
      }}
    >
      <Pressable
        onPress={onToggleExpand}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          opacity: pressed ? 0.82 : 1,
        })}
      >
        <View
          style={{
            width: 18,
            height: 18,
            borderRadius: 9,
            borderWidth: 2,
            borderColor: selected ? c.accent : c.inkFaint,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {selected ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.accent }} /> : null}
        </View>
        <BentoText weight="semibold" color={selected ? c.accent : c.ink} style={{ flex: 1, fontSize: 14 }}>
          {variant.name}
        </BentoText>
        <BentoText color={c.inkFaint} style={{ fontSize: 16 }}>
          {expanded ? "∧" : "∨"}
        </BentoText>
      </Pressable>

      {expanded ? (
        <View style={{ gap: 8, paddingTop: 8 }}>
          <BentoText variant="caption" color={c.inkMute} style={{ lineHeight: 18 }}>
            {variant.description}
          </BentoText>
          <BentoText variant="micro" color={c.inkFaint} style={{ lineHeight: 16 }}>
            {cyclePatternLabel(variant.cycleDays)}
          </BentoText>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {variant.goalFit.map((item) => (
              <Badge key={item} color="accent2" size="sm">
                {item}
              </Badge>
            ))}
          </View>
          <Button variant="glass" color="accent" onPress={onSelect}>
            {selected ? "当前方案" : "选用此方案"}
          </Button>
        </View>
      ) : null}
    </View>
  );
}

function DetailNavHeader({
  title,
  subtitle,
  badge,
  onBack,
}: {
  title: string;
  subtitle?: string;
  badge?: { text: string; color: SemanticColor };
  onBack: () => void;
}) {
  const c = useBentoTheme().colors;
  return (
    <View style={{ gap: 8, marginBottom: 4 }}>
      <View style={{ minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Pressable
          onPress={onBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={({ pressed }) => ({
            width: 48,
            height: 44,
            alignItems: "flex-start",
            justifyContent: "center",
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <BentoText color={c.ink} style={{ fontSize: 26, lineHeight: 28 }}>
            {"<"}
          </BentoText>
        </Pressable>
        <BentoText weight="bold" color={c.ink} numberOfLines={1} style={{ flex: 1, textAlign: "center", fontSize: 18 }}>
          {title}
        </BentoText>
        <View style={{ width: 48, alignItems: "flex-end" }}>
          {badge ? <Badge color={badge.color} size="sm">{badge.text}</Badge> : null}
        </View>
      </View>
      {subtitle ? (
        <BentoText variant="caption" color={c.inkMute} style={{ textAlign: "center", lineHeight: 18 }}>
          {subtitle}
        </BentoText>
      ) : null}
    </View>
  );
}

export default function DietPlanDetailScreen() {
  const router = useRouter();
  const c = useBentoTheme().colors;
  const params = useLocalSearchParams<{ planId?: string }>();
  const plan = getDietPlanById(typeof params.planId === "string" ? params.planId : null);
  const profile = useFitnessStore((state) => state.profile);
  const goal = useFitnessStore((state) => state.goal);
  const selectedDietPlanId = useFitnessStore((state) => state.selectedDietPlanId);
  const selectedDietPlanVariantId = useFitnessStore((state) => state.selectedDietPlanVariantId);
  const setSelectedDietPlan = useFitnessStore((state) => state.setSelectedDietPlan);
  const setSelectedDietPlanVariant = useFitnessStore((state) => state.setSelectedDietPlanVariant);
  const energyPlan = useCurrentEnergyPlan();

  const initialVariantId = plan?.id === selectedDietPlanId
    ? selectedDietPlanVariantId ?? plan?.cycleVariants?.[0]?.id ?? null
    : plan?.cycleVariants?.[0]?.id ?? null;
  const [pendingVariantId, setPendingVariantId] = useState<string | null>(initialVariantId);
  const [expandedVariantId, setExpandedVariantId] = useState<string | null>(initialVariantId);
  const [manualEntry, setManualEntry] = useState(false);
  const [introOpen, setIntroOpen] = useState(false);

  const variants = plan?.cycleVariants ?? [];
  const selectedVariantId = variants.length ? pendingVariantId ?? variants[0]?.id ?? null : null;
  const dayTypes = useMemo(() => (plan ? uniqueDayTypes(plan) : []), [plan]);
  const isCurrent = plan?.id === selectedDietPlanId && selectedVariantId === selectedDietPlanVariantId;

  if (!plan) {
    return (
      <Screen>
        <DetailNavHeader title="Diet plan not found" subtitle="This setting may have been removed." onBack={() => router.back()} />
      </Screen>
    );
  }

  const handleConfirm = () => {
    setSelectedDietPlan(plan.id);
    setSelectedDietPlanVariant(selectedVariantId);
    router.back();
  };

  return (
    <Screen>
      <DetailNavHeader
        title={plan.name}
        subtitle={plan.tagline}
        badge={{ text: isCurrent ? "当前使用" : "可选择", color: isCurrent ? "positive" : "accent" }}
        onBack={() => router.back()}
      />

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1, borderRadius: 14, backgroundColor: c.glassRaised, padding: 12, gap: 3 }}>
          <BentoText variant="micro" color={c.inkMute}>当前体重</BentoText>
          <BentoText weight="bold" color={c.positive} style={{ fontSize: 22 }}>{profile.weightKg} kg</BentoText>
        </View>
        <View style={{ flex: 1, borderRadius: 14, backgroundColor: c.glassRaised, padding: 12, gap: 3 }}>
          <BentoText variant="micro" color={c.inkMute}>目标体重</BentoText>
          <BentoText weight="bold" color={c.positive} style={{ fontSize: 22 }}>{goal.targetWeightKg} kg</BentoText>
        </View>
      </View>

      <View
        style={{
          borderRadius: 14,
          backgroundColor: c.glassRaised,
          borderWidth: 1,
          borderColor: c.glassBorder,
          padding: 12,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <View style={{ flex: 1, gap: 4 }}>
          <BentoText weight="semibold" color={c.ink} style={{ fontSize: 15 }}>
            手动录入每天克数
          </BentoText>
        </View>
        <Switch value={manualEntry} onValueChange={setManualEntry} />
      </View>

      {variants.length ? (
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <BentoText weight="bold" color={c.ink} style={{ fontSize: 15 }}>
              细分执行方式
            </BentoText>
            <Badge color="accent" size="sm">{selectedVariantId ? "已选择" : "默认"}</Badge>
          </View>
          {variants.map((variant) => (
            <VariantCard
              key={variant.id}
              variant={variant}
              selected={selectedVariantId === variant.id}
              expanded={expandedVariantId === variant.id}
              onToggleExpand={() => setExpandedVariantId((current) => (current === variant.id ? null : variant.id))}
              onSelect={() => {
                setPendingVariantId(variant.id);
                setExpandedVariantId(variant.id);
              }}
            />
          ))}
        </View>
      ) : null}

      <View style={{ gap: 8 }}>
        <BentoText weight="bold" color={c.ink} style={{ fontSize: 15 }}>
          日型目标设置
        </BentoText>
        {dayTypes.map((dayType) => {
          const target = calculateDietPlanMacroTargets(plan.id, energyPlan, {
            dayType,
            selection: selectedVariantId ? { variantId: selectedVariantId } : undefined,
          });
          return (
            <View key={dayType} style={{ gap: 6 }}>
              <MacroTargetCard title={dayTypeLabels[dayType]} target={target} />
            </View>
          );
        })}
      </View>

      <Pressable
        onPress={() => setIntroOpen((value) => !value)}
        style={({ pressed }) => ({
          borderRadius: 14,
          backgroundColor: c.glassRaised,
          borderWidth: 1,
          borderColor: c.glassBorder,
          padding: 12,
          gap: 8,
          opacity: pressed ? 0.82 : 1,
        })}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <BentoText weight="semibold" color={c.ink} style={{ fontSize: 15 }}>
            饮食法介绍与适用
          </BentoText>
          <BentoText variant="micro" color={c.accent}>{introOpen ? "收起" : "展开"}</BentoText>
        </View>
        {introOpen ? (
          <View style={{ gap: 8 }}>
            <BentoText variant="caption" color={c.inkMute} style={{ lineHeight: 18 }}>{plan.logic}</BentoText>
            <BentoText variant="caption" color={c.inkMute} style={{ lineHeight: 18 }}>{plan.howToEat}</BentoText>
            <BentoText variant="caption" color={c.inkMute} style={{ lineHeight: 18 }}>适合人群：{plan.suitableFor}</BentoText>
            <BentoText variant="micro" color={c.inkFaint} style={{ lineHeight: 16 }}>公式：{plan.formula}</BentoText>
          </View>
        ) : null}
      </Pressable>

      <View style={{ flexDirection: "row", gap: 10, paddingTop: 4 }}>
        <Button variant="glass" color="accent" block onPress={() => router.back()}>
          返回列表
        </Button>
        <Button variant="filled" color="accent" block onPress={handleConfirm}>
          {isCurrent ? "已在使用" : "确认并使用"}
        </Button>
      </View>
    </Screen>
  );
}
