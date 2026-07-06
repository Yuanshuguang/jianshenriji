import { useEffect, useState, type ReactNode } from "react";
import { Alert, Modal, Platform, Pressable, Share, View } from "react-native";
import { muscleGroupLabels, type DynamicAdjustmentSettings, type MealAdjustmentKey, type MuscleGroup, type NutritionAdjustmentKey, type TrainingAdjustmentKey } from "@fitness-calendar/shared";
import {
  Button,
  Screen,
  LabeledInput,
  AppIcon,
  type AppIconName,
  type SemanticColor,
  Switch,
  Text as BentoText,
  radius,
  useBentoTheme,
} from "../../components/bento";
import { SettingsGroup, ExpandableRow as SharedExpandableRow } from "../../components/shared";
import {
  dashboardStyleDescriptions,
  dashboardStyleLabels,
  useFitnessStore,
  type DashboardStyle,
  type FontScaleLevel,
  fontScaleLabels,
  fontScaleValues,
} from "../../store/fitness-store";
import { buildHealthDataSnapshot } from "../../features/health-data";

const nutritionAdjustmentOptions: Array<{ key: NutritionAdjustmentKey; label: string }> = [
  { key: "calories", label: "热量" },
  { key: "proteinG", label: "蛋白质" },
  { key: "fatG", label: "脂肪" },
  { key: "carbsG", label: "碳水" }
];
const mealAdjustmentOptions: Array<{ key: MealAdjustmentKey; label: string }> = [
  { key: "breakfast", label: "早餐" },
  { key: "lunch", label: "午餐" },
  { key: "dinner", label: "晚餐" },
  { key: "snack", label: "加餐" }
];
const trainingAdjustmentOptions: Array<{ key: TrainingAdjustmentKey; label: string }> = [
  { key: "calories", label: "训练消耗" },
  { key: "schedule", label: "训练顺延" },
  { key: "fatigue", label: "疲劳恢复" }
];
const muscleAdjustmentOptions: MuscleGroup[] = ["chest", "back", "legs", "shoulders", "arms", "core", "cardio"];

export default function MoreScreen() {
  const theme = useBentoTheme();
  const c = theme.colors;

  const dynamicAdjustmentEnabled = useFitnessStore((state) => state.dynamicAdjustmentEnabled);
  const setDynamicAdjustmentEnabled = useFitnessStore((state) => state.setDynamicAdjustmentEnabled);
  const dynamicAdjustmentSettings = useFitnessStore((state) => state.dynamicAdjustmentSettings);
  const setDynamicAdjustmentSettings = useFitnessStore((state) => state.setDynamicAdjustmentSettings);
  const appearanceMode = useFitnessStore((state) => state.appearanceMode);
  const setAppearanceMode = useFitnessStore((state) => state.setAppearanceMode);
  const fontScale = useFitnessStore((state) => state.fontScale);
  const setFontScale = useFitnessStore((state) => state.setFontScale);
  const dashboardStyle = useFitnessStore((state) => state.dashboardStyle);
  const setDashboardStyle = useFitnessStore((state) => state.setDashboardStyle);

  const [fontSizeExpanded, setFontSizeExpanded] = useState(false);
  const [dashboardStyleExpanded, setDashboardStyleExpanded] = useState(false);
  const [rulesExpanded, setRulesExpanded] = useState(false);

  const handleExportHealthData = async () => {
    const payload = buildHealthDataSnapshot(useFitnessStore.getState());
    const json = JSON.stringify(payload, null, 2);

    if (Platform.OS === "web") {
      const blob = new Blob([json], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `fitness-calendar-health-${payload.exportedAt.slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      Alert.alert("导出完成", "健康数据 JSON 已开始下载，请在浏览器下载列表中查看。");
      return;
    }

    await Share.share({
      title: "健康数据导出",
      message: json,
    });
    Alert.alert("导出完成", "已调用系统分享面板导出健康数据。");
  };

  // 危险操作二次确认状态：用一个通用 sheet 取代系统 Alert.alert，按风险等级要求文本确认
  type DangerAction = {
    title: string;
    impact: string;
    confirmPhrase: string;
    actionLabel: string;
    onConfirm: () => void;
  };
  const [dangerAction, setDangerAction] = useState<DangerAction | null>(null);

  const handleClearHealthData = () => {
    setDangerAction({
      title: "清除健康数据",
      impact: "重置个人档案、目标、饮食记录、训练记录和饮食计划选择。界面设置会保留。",
      confirmPhrase: "确认清除",
      actionLabel: "清除",
      onConfirm: () => useFitnessStore.getState().resetHealthData(),
    });
  };

  const handleResetTodayRecords = () => {
    setDangerAction({
      title: "清空今日记录",
      impact: "清空今天的饮食记录、餐次输入和训练记录。身体数据、目标和方案设置不会修改。",
      confirmPhrase: "",
      actionLabel: "清空",
      onConfirm: () => useFitnessStore.getState().resetTodayRecords(),
    });
  };

  const handleResetDevelopmentData = () => {
    setDangerAction({
      title: "清理开发测试数据",
      impact: "清空示例输入、历史日志、我的菜单和动作库收藏/置顶等缓存，用于恢复干净体验。身体数据和当前方案会保留。",
      confirmPhrase: "",
      actionLabel: "清理",
      onConfirm: () => useFitnessStore.getState().resetDevelopmentData(),
    });
  };

  const toggleDynamicRule = <Section extends keyof DynamicAdjustmentSettings, Key extends keyof DynamicAdjustmentSettings[Section]>(
    section: Section,
    key: Key,
    value: boolean
  ) => {
    setDynamicAdjustmentSettings({
      ...dynamicAdjustmentSettings,
      [section]: {
        ...dynamicAdjustmentSettings[section],
        [key]: value
      }
    });
  };

  return (
    <Screen>
      <View style={{ gap: 20 }}>
        {/* Title */}
        <BentoText variant="h2" weight="bold">
          设置
        </BentoText>

        {/* ===== 外观与显示 ===== */}
        <View style={{ gap: 6 }}>
          <SectionHeader>外观与显示</SectionHeader>
          <SettingsGroup>
            {/* 仪表盘可视化 */}
            <SharedExpandableRow
              icon={<AppIcon name="chart" size={18} color="accent" />}
              label="仪表盘可视化"
              value={dashboardStyleLabels[dashboardStyle]}
              expanded={dashboardStyleExpanded}
              onToggle={() => setDashboardStyleExpanded((value) => !value)}
            >
              <View style={{ gap: 8 }}>
                {(Object.keys(dashboardStyleLabels) as DashboardStyle[]).map((style) => (
                  <Pressable
                    key={style}
                    onPress={() => setDashboardStyle(style)}
                    style={({ pressed }) => ({
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      borderRadius: 12,
                      borderWidth: 1.5,
                      borderColor: dashboardStyle === style ? c.accent : c.glassBorder,
                      backgroundColor: dashboardStyle === style ? c.accent + "14" : "transparent",
                      opacity: pressed ? 0.78 : 1
                    })}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                      <BentoText weight="semibold" color={dashboardStyle === style ? c.accent : c.ink} style={{ fontSize: 14 }}>
                        {dashboardStyleLabels[style]}
                      </BentoText>
                      {dashboardStyle === style ? (
                        <BentoText variant="micro" color={c.accent}>当前</BentoText>
                      ) : null}
                    </View>
                    <BentoText variant="micro" color={c.inkMute} style={{ marginTop: 4, lineHeight: 16 }}>
                      {dashboardStyleDescriptions[style]}
                    </BentoText>
                  </Pressable>
                ))}
              </View>
            </SharedExpandableRow>

            {/* 外观模式 */}
            <SettingsRow iconName="theme" label="外观模式">
              <View style={{ flexDirection: "row", gap: 4 }}>
                <SegmentedPill
                  label="日间"
                  active={appearanceMode === "light"}
                  activeColor={c.accent}
                  onPress={() => setAppearanceMode("light")}
                />
                <SegmentedPill
                  label="夜间"
                  active={appearanceMode === "dark"}
                  activeColor={c.accent2}
                  onPress={() => setAppearanceMode("dark")}
                />
              </View>
            </SettingsRow>

            {/* 字体大小 */}
            <SharedExpandableRow
              icon={<AppIcon name="type" size={18} color="accent" />}
              label="字体大小"
              value={fontScaleLabels[fontScale]}
              expanded={fontSizeExpanded}
              onToggle={() => setFontSizeExpanded((v) => !v)}
            >
              <View style={{ flexDirection: "row", gap: 0, borderRadius: radius.md, overflow: "hidden", borderWidth: 1, borderColor: c.glassBorder }}>
                {(["small", "normal", "large", "xlarge"] as FontScaleLevel[]).map((level, i) => (
                  <Pressable
                    key={level}
                    onPress={() => setFontScale(level)}
                    style={({ pressed }) => ({
                      flex: 1,
                      paddingVertical: 10,
                      alignItems: "center",
                      backgroundColor: fontScale === level ? c.accent : "transparent",
                      borderLeftWidth: i > 0 ? 1 : 0,
                      borderLeftColor: c.glassBorder,
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <BentoText
                      weight={fontScale === level ? "bold" : "medium"}
                      variant="caption"
                      color={fontScale === level ? "#FFFFFF" : c.inkMute}
                    >
                      {fontScaleLabels[level]}
                    </BentoText>
                  </Pressable>
                ))}
              </View>
            </SharedExpandableRow>
          </SettingsGroup>
        </View>

        {/* ===== 计划引擎 ===== */}
        <View style={{ gap: 6 }}>
          <SectionHeader>计划引擎</SectionHeader>
          <SettingsGroup>
            {/* 动态调整 */}
            <SettingsRow iconName="bolt" label="动态调整">
              <Switch
                value={dynamicAdjustmentEnabled}
                onValueChange={setDynamicAdjustmentEnabled}
                activeColor={c.amber}
                accessibilityLabel="动态调整开关"
              />
            </SettingsRow>

            {/* 高级规则 */}
            {dynamicAdjustmentEnabled ? (
              <SharedExpandableRow
                icon={<AppIcon name="settings" size={18} color="accent" />}
                label="高级规则"
                expanded={rulesExpanded}
                onToggle={() => setRulesExpanded((v) => !v)}
              >
      <View style={{ gap: 12, backgroundColor: c.bg, borderRadius: radius.md, padding: 12, marginHorizontal: -4 }}>
                <AdjustmentRuleGroup title="饮食数据">
                    {nutritionAdjustmentOptions.map((item) => (
                      <AdjustmentSwitchRow
                        key={item.key}
                        label={item.label}
                        value={dynamicAdjustmentSettings.nutrition[item.key]}
                        onValueChange={(value) => toggleDynamicRule("nutrition", item.key, value)}
                      />
                    ))}
                  </AdjustmentRuleGroup>
                  <AdjustmentRuleGroup title="餐次范围">
                    {mealAdjustmentOptions.map((item) => (
                      <AdjustmentSwitchRow
                        key={item.key}
                        label={item.label}
                        value={dynamicAdjustmentSettings.meals[item.key]}
                        onValueChange={(value) => toggleDynamicRule("meals", item.key, value)}
                      />
                    ))}
                  </AdjustmentRuleGroup>
                  <AdjustmentRuleGroup title="训练数据">
                    {trainingAdjustmentOptions.map((item) => (
                      <AdjustmentSwitchRow
                        key={item.key}
                        label={item.label}
                        value={dynamicAdjustmentSettings.training[item.key]}
                        onValueChange={(value) => toggleDynamicRule("training", item.key, value)}
                      />
                    ))}
                  </AdjustmentRuleGroup>
                  <AdjustmentRuleGroup title="训练部位">
                    {muscleAdjustmentOptions.map((item) => (
                      <AdjustmentSwitchRow
                        key={item}
                        label={muscleGroupLabels[item]}
                        value={dynamicAdjustmentSettings.muscles[item]}
                        onValueChange={(value) => toggleDynamicRule("muscles", item, value)}
                      />
                    ))}
                  </AdjustmentRuleGroup>
                </View>
              </SharedExpandableRow>
            ) : (
              <SettingsRow
                iconName="settings"
                label="高级规则"
                subtitle="开启动态调整后可设置饮食、训练和部位联动规则"
              />
            )}
          </SettingsGroup>
        </View>

        {/* ===== 健康数据 ===== */}
        <View style={{ gap: 6 }}>
          <SectionHeader>健康数据</SectionHeader>
          <SettingsGroup>
            <SettingsRow
              iconName="download"
              label="导出健康数据"
              subtitle="导出个人档案、饮食、训练、日志与当前计划"
              onPress={handleExportHealthData}
            />
          </SettingsGroup>
        </View>

        {/* ===== 危险操作 ===== */}
        <View style={{ gap: 8 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              paddingHorizontal: 4,
            }}
          >
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: c.warn,
              }}
            />
            <BentoText weight="bold" variant="micro" color={c.warn} style={{ letterSpacing: 0.08 }}>
              危险操作
            </BentoText>
            <BentoText variant="micro" color={c.inkMute}>
              · 无法撤销,请确认影响范围
            </BentoText>
          </View>
          <SettingsGroup>
            <View
              style={{
                borderWidth: 1.2,
                borderColor: `${c.warn}55`,
                borderRadius: radius.md,
                backgroundColor: `${c.warn}08`,
              }}
            >
            <SettingsRow
              iconName="refresh"
              label="清空今日记录"
              subtitle="只清空今天饮食、餐次和训练记录"
              dangerous
              onPress={handleResetTodayRecords}
            />
            <SettingsRow
              iconName="broom"
              label="清理开发测试数据"
              subtitle="清空示例输入、历史日志、我的菜单和动作库缓存"
              dangerous
              onPress={handleResetDevelopmentData}
            />
            <SettingsRow
              iconName="x"
              label="清除健康数据"
              subtitle="重置饮食/训练记录与饮食计划选择"
              dangerous
              onPress={handleClearHealthData}
            />
            </View>
          </SettingsGroup>
        </View>
      </View>
        <DangerConfirmSheet
          action={dangerAction}
          onClose={() => setDangerAction(null)}
        />
    </Screen>
  );
}

/* ===== Helper Components ===== */

function SectionHeader({ children }: { children: ReactNode }) {
  const theme = useBentoTheme();
  const c = theme.colors;
  return (
    <BentoText weight="semibold" variant="micro" color={c.inkMute} style={{ paddingLeft: 4, letterSpacing: 0.08 }}>
      {children}
    </BentoText>
  );
}

function SettingsRow({
  iconName,
  iconColor,
  label,
  subtitle,
  children,
  onPress,
  dangerous = false,
}: {
  iconName?: AppIconName;
  iconColor?: SemanticColor;
  label: string;
  subtitle?: string;
  children?: ReactNode;
  onPress?: () => void;
  dangerous?: boolean;
}) {
  const theme = useBentoTheme();
  const c = theme.colors;
  const iconNode = iconName ? (
    <AppIcon name={iconName} size={18} color={iconColor ?? (dangerous ? "warn" : "accent")} />
  ) : null;
  const content = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        minHeight: 50,
        paddingHorizontal: 16,
        paddingVertical: 12,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
        {iconNode ?? null}
        <View style={{ flex: 1, gap: 2 }}>
          <BentoText variant="body" weight="semibold" color={dangerous ? c.warn : "#F7FAFF"}>{label}</BentoText>
          {subtitle ? (
            <BentoText variant="micro" color={dangerous ? c.warn : c.inkMute} numberOfLines={2}>
              {subtitle}
            </BentoText>
          ) : null}
        </View>
      </View>
      {children}
      {onPress ? <AppIcon name="chevronRight" size={16} color={c.inkFaint} /> : null}
    </View>
  );

  if (!onPress) {
    return <View style={{ backgroundColor: c.glassRaised, borderBottomWidth: 1, borderBottomColor: c.glassBorder }}>{content}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.72 : 1,
        backgroundColor: dangerous ? `${c.warn}10` : c.glassRaised,
      })}
    >
      <View
        style={{
          borderBottomWidth: 1,
          borderBottomColor: dangerous ? `${c.warn}55` : c.glassBorder,
        }}
      >
        {content}
      </View>
    </Pressable>
  );
}

function SegmentedPill({
  label,
  active,
  activeColor,
  onPress,
}: {
  label: string;
  active: boolean;
  activeColor: string;
  onPress: () => void;
}) {
  const theme = useBentoTheme();
  const c = theme.colors;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingVertical: 5,
        paddingHorizontal: 12,
        borderRadius: 999,
        backgroundColor: active ? activeColor : "transparent",
        borderWidth: active ? 0 : 1,
        borderColor: c.glassBorder,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <BentoText
        weight={active ? "bold" : "medium"}
        variant="caption"
        color={active ? "#FFFFFF" : c.inkMute}
      >
        {label}
      </BentoText>
    </Pressable>
  );
}

function AdjustmentRuleGroup({ title, children }: { title: string; children: ReactNode | Array<ReactNode> }) {
  const theme = useBentoTheme();
  const c = theme.colors;
  return (
    <View style={{ gap: 6 }}>
      <BentoText weight="bold" variant="micro" color={c.ink} style={{ letterSpacing: 0.06 }}>
        {title}
      </BentoText>
      <View style={{ gap: 4 }}>
        {children}
      </View>
    </View>
  );
}

/* ===== 危险操作二次确认 Sheet ===== */

type DangerAction = {
  title: string;
  impact: string;
  /** 需要用户输入的确认短语；为空表示只要点确认按钮 */
  confirmPhrase: string;
  actionLabel: string;
  onConfirm: () => void;
};

type DangerConfirmSheetProps = {
  action: DangerAction | null;
  onClose: () => void;
};

function DangerConfirmSheet({ action, onClose }: DangerConfirmSheetProps) {
  const theme = useBentoTheme();
  const c = theme.colors;
  const [input, setInput] = useState("");

  // 打开新的 action 时清空输入
  useEffect(() => {
    setInput("");
  }, [action]);

  if (!action) return null;

  const needsInput = action.confirmPhrase.length > 0;
  const inputMatches = !needsInput || input.trim() === action.confirmPhrase;

  const handleConfirm = () => {
    if (!inputMatches) return;
    action.onConfirm();
    setInput("");
    onClose();
  };

  const handleCancel = () => {
    setInput("");
    onClose();
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={handleCancel}>
      <Pressable
        onPress={handleCancel}
        style={{ flex: 1, backgroundColor: c.scrim, justifyContent: "flex-end" }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: c.glass,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 28,
            gap: 16,
            borderTopWidth: 1,
            borderColor: `${c.warn}66`,
          }}
        >
          <View
            style={{
              alignSelf: "center",
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: c.inkFaint,
              opacity: 0.5,
              marginBottom: 4,
            }}
          />

          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: `${c.warn}1A`,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AppIcon name="warn" size={16} color="warn" strokeWidth={2} />
            </View>
            <BentoText variant="h3" weight="bold" color={c.warn}>
              {action.title}
            </BentoText>
          </View>

          <View
            style={{
              backgroundColor: `${c.warn}0A`,
              borderRadius: radius.md,
              padding: 12,
              gap: 4,
            }}
          >
            <BentoText weight="semibold" variant="caption" color={c.warn}>
              影响范围
            </BentoText>
            <BentoText variant="caption" color={c.ink} style={{ lineHeight: 18 }}>
              {action.impact}
            </BentoText>
          </View>

          {needsInput ? (
            <LabeledInput
              label={`请输入 "${action.confirmPhrase}" 以确认`}
              value={input}
              onChangeText={setInput}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={action.confirmPhrase}
            />
          ) : null}

          <View style={{ flexDirection: "row", gap: 10 }}>
            <Pressable
              onPress={handleCancel}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: 12,
                borderRadius: radius.md,
                backgroundColor: c.glassRaised,
                borderWidth: 1,
                borderColor: c.glassBorder,
                alignItems: "center",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <BentoText weight="semibold" color={c.ink}>
                取消
              </BentoText>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              disabled={!inputMatches}
              style={({ pressed }) => ({
                flex: 1.2,
                paddingVertical: 12,
                borderRadius: radius.md,
                backgroundColor: inputMatches ? c.warn : `${c.warn}33`,
                alignItems: "center",
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <BentoText weight="bold" color="#FFFFFF">
                {action.actionLabel}
              </BentoText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function AdjustmentSwitchRow({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (value: boolean) => void }) {
  const theme = useBentoTheme();
  const c = theme.colors;
  return (
    <View
      style={{
        minHeight: 36,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: radius.md,
        backgroundColor: c.glass,
      }}
    >
      <BentoText weight="medium" variant="caption" color={value ? c.ink : c.inkMute}>
        {label}
      </BentoText>
      <Switch value={value} onValueChange={onValueChange} activeColor={c.amber} size="sm" accessibilityLabel={`${label}动态调整`} />
    </View>
  );
}
