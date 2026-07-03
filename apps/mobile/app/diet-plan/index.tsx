import { useRouter } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";
import { dietPlansByCategory, type DietDayType } from "../../features/diet-plans";
import { useFitnessStore } from "../../store/fitness-store";
import {
  Badge,
  BentoTabBar,
  Screen,
  ScreenHeader,
  Text as BentoText,
  type TabItem,
  bento,
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

const tabItems: TabItem[] = [
  { key: "index", label: "饮食", icon: "food" },
  { key: "train", label: "训练", icon: "train" },
  { key: "plan", label: "计划", icon: "plan" },
  { key: "more", label: "更多", icon: "more" },
];

const tabRoutes = ["/", "/train", "/plan", "/more"] as const;

export default function DietPlanScreen() {
  const router = useRouter();
  const c = useBentoTheme().colors;
  const selectedDietPlanId = useFitnessStore((state) => state.selectedDietPlanId);

  return (
    <Screen scroll={false}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingBottom: 128 }}>
        <ScreenHeader
          kicker="计划"
          title="饮食方案"
          subtitle="选择方案后进入详情页配置周期、日型目标和执行方式"
          badge={{ text: selectedDietPlanId ? "已选择" : "未选择", color: selectedDietPlanId ? "accent" : "warn" }}
        />

        {dietPlansByCategory.map((group, groupIndex) => (
          <View key={group.category} style={{ gap: 8, marginTop: groupIndex === 0 ? 0 : 2 }}>
            <BentoText weight="bold" variant="micro" color={c.inkFaint} style={{ paddingHorizontal: 4 }}>
              {group.label}
            </BentoText>
            <View style={{ borderRadius: bento.tileRadius, overflow: "hidden", borderWidth: 1, borderColor: c.glassBorder }}>
              {group.plans.map((plan, index) => {
                const isCurrent = plan.id === selectedDietPlanId;
                return (
                  <Pressable
                    key={plan.id}
                    onPress={() => router.push(`/diet-plan/${plan.id}`)}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      backgroundColor: isCurrent ? `${c.accent}12` : c.glass,
                      borderBottomWidth: index < group.plans.length - 1 ? 1 : 0,
                      borderBottomColor: c.glassBorder,
                      opacity: pressed ? 0.72 : 1,
                    })}
                  >
                    <View
                      style={{
                        width: 23,
                        height: 23,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: isCurrent ? c.accent : c.inkFaint,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {isCurrent ? <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: c.accent }} /> : null}
                    </View>

                    <View style={{ flex: 1, gap: 4 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <BentoText weight="semibold" color={isCurrent ? c.accent : c.ink} style={{ fontSize: 16 }}>
                          {plan.name}
                        </BentoText>
                        {isCurrent ? <Badge color="positive" size="sm">当前</Badge> : null}
                      </View>
                      <BentoText variant="micro" color={c.inkMute} numberOfLines={1} style={{ lineHeight: 16 }}>
                        {plan.cycleVariants?.length
                          ? `${plan.cycleVariants.length} 种细分方式 · ${plan.tagline}`
                          : `${dayTypeLabels[plan.defaultDayType]} · ${plan.tagline}`}
                      </BentoText>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, paddingTop: 4 }}>
                        <InfoPill label="适合" value={summarizeSuitableFor(plan.suitableFor)} />
                        <InfoPill label="难度" value={getPlanDifficulty(plan)} tone={getPlanDifficulty(plan) === "高" ? "warn" : "accent"} />
                        <InfoPill label="联动" value={plan.cycleVariants?.length ? "按日型调训练" : "按目标控热量"} tone="positive" />
                      </View>
                      {isHighRiskPlan(plan.defaultDayType, plan.name) ? (
                        <BentoText variant="micro" color={c.warn} numberOfLines={2} style={{ lineHeight: 16 }}>
                          提醒：不建议多数训练者长期默认使用，建议短期执行并观察状态。
                        </BentoText>
                      ) : null}
                    </View>

                    <BentoText color={c.inkFaint} style={{ fontSize: 18 }}>
                      {">"}
                    </BentoText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      <BentoTabBar
        items={tabItems}
        activeIndex={2}
        onPress={(index) => {
          const route = tabRoutes[index];
          if (route) router.replace(route);
        }}
      />
    </Screen>
  );
}

function InfoPill({ label, value, tone = "accent2" }: { label: string; value: string; tone?: "accent" | "accent2" | "positive" | "warn" }) {
  const c = useBentoTheme().colors;
  return (
    <View style={{ borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: `${c[tone]}18`, borderWidth: 1, borderColor: `${c[tone]}44` }}>
      <BentoText variant="micro" color={c[tone]}>
        {label}：{value}
      </BentoText>
    </View>
  );
}

function summarizeSuitableFor(value: string): string {
  return value.replace(/[，。].*$/, "").slice(0, 12);
}

function getPlanDifficulty(plan: { defaultDayType: DietDayType; cycleVariants?: unknown[]; name: string }): "低" | "中" | "高" {
  if (isHighRiskPlan(plan.defaultDayType, plan.name)) return "高";
  if (plan.cycleVariants?.length) return "中";
  return "低";
}

function isHighRiskPlan(defaultDayType: DietDayType, name: string): boolean {
  return defaultDayType === "very-low-carb" || defaultDayType === "depletion-carb" || name.includes("生酮") || name.includes("极低碳") || name.includes("断碳");
}
