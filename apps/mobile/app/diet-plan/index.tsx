import { useRouter } from "expo-router";
import { useState } from "react";
import { Platform, Pressable, View } from "react-native";
import { dietPlansByCategory, getDietPlanById, type DietPlan } from "../../features/diet-plans";
import { useFitnessStore } from "../../store/fitness-store";
import {
  Badge,
  Screen,
  ScreenHeader,
  Text as BentoText,
  bento,
  useBentoTheme,
} from "../../components/bento";

/* ── 可展开详情行 ─────────────────────────────────────────── */
function DetailBlock({ label, text, color }: { label: string; text: string; color: string }) {
  const theme = useBentoTheme();
  const c = theme.colors;
  return (
    <View style={{ gap: 4 }}>
      <BentoText weight="semibold" variant="micro" style={{ color, fontSize: 12 }}>{label}</BentoText>
      <BentoText variant="caption" color="inkMute" style={{ lineHeight: 18 }}>{text}</BentoText>
    </View>
  );
}

function DetailList({ label, items, color }: { label: string; items: string[]; color: string }) {
  const theme = useBentoTheme();
  const c = theme.colors;
  return (
    <View style={{ gap: 4 }}>
      <BentoText weight="semibold" variant="micro" style={{ color, fontSize: 12 }}>{label}</BentoText>
      {items.map((item, i) => (
        <BentoText key={i} variant="caption" color="inkMute" style={{ lineHeight: 18 }}>• {item}</BentoText>
      ))}
    </View>
  );
}

/* ── 主页面 ────────────────────────────────────────────────── */
export default function DietPlanScreen() {
  const theme = useBentoTheme();
  const c = theme.colors;
  const router = useRouter();
  const selectedDietPlanId = useFitnessStore((state) => state.selectedDietPlanId);
  const setSelectedDietPlan = useFitnessStore((state) => state.setSelectedDietPlan);
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(selectedDietPlanId);

  const handleSelect = (planId: string) => {
    setSelectedDietPlan(planId);
    router.back();
  };

  return (
    <Screen>
      <ScreenHeader
        kicker="计划"
        title="饮食方案"
        subtitle="选择一个符合你生活习惯的饮食策略"
        badge={{ text: getDietPlanById(selectedDietPlanId)?.name ?? "未选择", color: "accent" }}
      />

      {dietPlansByCategory.map((group, gIdx) => (
        <View key={group.category} style={{ gap: 0, marginTop: gIdx === 0 ? 0 : 24 }}>
          {/* 分类标题 */}
          <View
            style={{
              backgroundColor: c.bg,
              paddingHorizontal: 16,
              paddingVertical: 8,
            }}
          >
            <BentoText weight="bold" variant="micro" color="inkFaint" style={{ textTransform: "uppercase", letterSpacing: 0.8 }}>
              {group.label}
            </BentoText>
          </View>

          {/* 方案列表 */}
          <View style={{ borderRadius: bento.tileRadius, overflow: "hidden" }}>
            {group.plans.map((plan, idx) => {
              const isSelected = plan.id === selectedDietPlanId;
              const isExpanded = plan.id === expandedPlanId;
              return (
                <View
                  key={plan.id}
                  style={{
                    backgroundColor: c.glass,
                    borderBottomWidth: idx < group.plans.length - 1 ? 1 : 0,
                    borderBottomColor: c.glassBorder,
                  }}
                >
                  {/* 主行：点击选择 */}
                  <Pressable
                    onPress={() => handleSelect(plan.id)}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 13,
                      paddingHorizontal: 16,
                      gap: 12,
                      backgroundColor: isSelected
                        ? theme.isDark
                          ? "rgba(77,181,255,0.12)"
                          : "rgba(47,157,255,0.08)"
                        : "transparent",
                      opacity: pressed ? 0.72 : 1,
                    })}
                  >
                    {/* 单选圆点 */}
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        borderWidth: 2,
                        borderColor: isSelected ? c.accent : c.inkFaint,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {isSelected ? (
                        <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: c.accent }} />
                      ) : null}
                    </View>

                    <View style={{ flex: 1, gap: 3 }}>
                      <BentoText
                        weight={isSelected ? "bold" : "medium"}
                        variant="body"
                        color={isSelected ? "accent" : undefined}
                        style={{ fontSize: 15 }}
                      >
                        {plan.name}
                      </BentoText>
                      <BentoText variant="micro" color="inkMute" numberOfLines={isExpanded ? undefined : 2} style={{ lineHeight: 16 }}>
                        {plan.tagline}
                      </BentoText>
                    </View>

                    {/* 展开/收起指示 */}
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        setExpandedPlanId(isExpanded ? null : plan.id);
                      }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={{ paddingHorizontal: 4 }}
                    >
                      <BentoText style={{ fontSize: 12, color: c.inkFaint }}>
                        {isExpanded ? "收起" : "详情"}
                      </BentoText>
                    </Pressable>
                  </Pressable>

                  {/* 展开详情 */}
                  {isExpanded ? (
                    <View
                      style={{
                        paddingHorizontal: 16,
                        paddingBottom: 14,
                        gap: 8,
                        borderTopWidth: 1,
                        borderTopColor: c.glassBorder,
                        marginLeft: 50,
                      }}
                    >
                      <DetailBlock label="核心逻辑" text={plan.logic} color={c.accent} />
                      <DetailBlock label="怎么吃" text={plan.howToEat} color={c.positive} />
                      <DetailList label="优点" items={plan.pros} color={c.positive} />
                      <DetailList label="缺点" items={plan.cons} color={c.warn} />
                      <DetailBlock label="适合人群" text={plan.suitableFor} color={c.accent2} />
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>
      ))}

      {/* 底部提示 */}
      <View style={{ paddingHorizontal: 4, paddingTop: 8, paddingBottom: 24, gap: 4 }}>
        <BentoText variant="micro" color="inkFaint" style={{ lineHeight: 16 }}>
          💡 饮食方案决定每日热量和宏量分配。选定后可在「饮食」页查看具体推荐。
        </BentoText>
      </View>
    </Screen>
  );
}
