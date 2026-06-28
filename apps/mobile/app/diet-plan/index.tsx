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
  { key: "index", label: "饮食" },
  { key: "train", label: "训练" },
  { key: "plan", label: "计划" },
  { key: "more", label: "更多" },
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
