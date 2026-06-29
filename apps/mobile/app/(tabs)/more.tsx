import { createElement, useRef, useState, type ReactNode } from "react";
import { Alert, Platform, Pressable, Share, View } from "react-native";
import { muscleGroupLabels, type DynamicAdjustmentSettings, type MealAdjustmentKey, type MuscleGroup, type NutritionAdjustmentKey, type TrainingAdjustmentKey } from "@fitness-calendar/shared";
import {
  cutePets,
  viralPets,
  getPresetPetById,
  petPersonalityLabels,
  petSourceLabels,
  type ActivePet,
  type CustomPet,
  type PetPersonality,
  type PresetPet
} from "../../features/pet";
import {
  Button,
  LabeledInput,
  Screen,
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
const allowedPetImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxPetImageBytes = 1024 * 1024;

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
  const selectedPetId = useFitnessStore((state) => state.selectedPetId);
  const customPet = useFitnessStore((state) => state.customPet);
  const petEnabled = useFitnessStore((state) => state.petEnabled);
  const setSelectedPet = useFitnessStore((state) => state.setSelectedPet);
  const setCustomPet = useFitnessStore((state) => state.setCustomPet);
  const setPetEnabled = useFitnessStore((state) => state.setPetEnabled);

  const [fontSizeExpanded, setFontSizeExpanded] = useState(false);
  const [dashboardStyleExpanded, setDashboardStyleExpanded] = useState(false);
  const [rulesExpanded, setRulesExpanded] = useState(false);
  const [petExpanded, setPetExpanded] = useState(false);
  const [petTab, setPetTab] = useState<"preset" | "custom">("preset");
  const [customPetDraft, setCustomPetDraft] = useState<{ name: string; emoji: string; personality: PetPersonality; photoUri?: string }>({
    name: "",
    emoji: "🐾",
    personality: "lively"
  });
  const [petMessage, setPetMessage] = useState("");
  const petImageInputRef = useRef<HTMLInputElement | null>(null);

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
      return;
    }

    await Share.share({
      title: "健康数据导出",
      message: json,
    });
  };

  const handleClearHealthData = () => {
    Alert.alert(
      "清除健康数据",
      "这会重置个人档案、目标、饮食记录、训练记录和饮食计划选择。界面设置会保留。",
      [
        { text: "取消", style: "cancel" },
        {
          text: "清除",
          style: "destructive",
          onPress: () => useFitnessStore.getState().resetHealthData(),
        },
      ]
    );
  };

  const activePet: ActivePet = customPet
    ? { kind: "custom", pet: customPet }
    : selectedPetId
      ? { kind: "preset", pet: getPresetPetById(selectedPetId)! }
      : null;

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

  const handleSelectPreset = (petId: string) => {
    if (selectedPetId === petId && !customPet) {
      setSelectedPet(null);
    } else {
      setCustomPet(null);
      setSelectedPet(petId);
    }
  };

  const handleClearPet = () => {
    setSelectedPet(null);
    setCustomPet(null);
    setCustomPetDraft({ name: "", emoji: "🐾", personality: "lively" });
    setPetMessage("已清除宠物，重新选择吧");
  };

  const openPetImagePicker = () => {
    if (Platform.OS === "web") {
      petImageInputRef.current?.click();
      return;
    }
    setPetMessage("移动端拍照入口已预留，当前预览先使用网页上传");
  };

  const onPetImageSelected = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!allowedPetImageTypes.has(file.type)) {
      setPetMessage("只支持 JPG、PNG 或 WebP 图片");
      input.value = "";
      return;
    }
    if (file.size > maxPetImageBytes) {
      setPetMessage("图片不能超过 1MB，请先压缩后再上传");
      input.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCustomPetDraft((d) => ({ ...d, photoUri: reader.result as string }));
      setPetMessage("已选择宠物照片，记得填名字再保存");
    };
    reader.readAsDataURL(file);
    input.value = "";
  };

  const handleSaveCustomPet = () => {
    if (customPetDraft.name.trim().length === 0) {
      setPetMessage("先给宠物起个名字");
      return;
    }
    const pet: CustomPet = {
      name: customPetDraft.name.trim(),
      emoji: customPetDraft.emoji.trim() || "🐾",
      personality: customPetDraft.personality,
      photoUri: customPetDraft.photoUri
    };
    setCustomPet(pet);
    setSelectedPet(null);
    setPetMessage(`已保存：${pet.name}，它将出现在饮食和训练页`);
  };

  const petIcon = activePet?.pet.emoji ?? "🐾";

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
              icon="📊"
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
            <SettingsRow icon="🌓" label="外观模式">
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
              icon="🔤"
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
            <SettingsRow icon="⚡" label="动态调整">
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
                icon="⚙️"
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
            ) : null}
          </SettingsGroup>
        </View>

        {/* ===== 宠物伴侣 ===== */}
        <View style={{ gap: 6 }}>
          <SectionHeader>宠物伴侣</SectionHeader>
          <SettingsGroup>
            {/* 宠物提醒 */}
            <SettingsRow icon="🐾" label="宠物提醒">
              <Switch
                value={petEnabled}
                onValueChange={setPetEnabled}
                activeColor={c.accent2}
                accessibilityLabel="宠物功能开关"
              />
            </SettingsRow>

            {/* 选择宠物 */}
            <SharedExpandableRow
              icon={petIcon}
              label="选择宠物"
              value={activePet?.pet.name ?? "未选择"}
              expanded={petExpanded}
              onToggle={() => setPetExpanded((v) => !v)}
            >
              <View style={{ gap: 12 }}>
                {/* 当前宠物展示 */}
                {activePet ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingBottom: 4 }}>
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: c.accent2 + "18",
                        borderWidth: 1.5,
                        borderColor: c.accent2,
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <BentoText style={{ fontSize: 24, lineHeight: 28 }}>
                        {activePet.pet.emoji}
                      </BentoText>
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <BentoText weight="semibold" variant="caption" color={c.ink}>
                        {activePet.pet.name}
                      </BentoText>
                      <BentoText variant="micro" color={c.inkMute}>
                        {petPersonalityLabels[activePet.pet.personality]} · {activePet.kind === "custom" ? "自定义" : petSourceLabels[activePet.pet.source]}
                      </BentoText>
                    </View>
                    <Pressable
                      onPress={handleClearPet}
                      style={({ pressed }) => ({
                        paddingVertical: 5,
                        paddingHorizontal: 12,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: c.warn + "40",
                        opacity: pressed ? 0.7 : 1,
                      })}
                    >
                      <BentoText variant="micro" color={c.warn}>清除</BentoText>
                    </Pressable>
                  </View>
                ) : null}

                {/* Tab 切换 */}
                <View style={{ flexDirection: "row", gap: 0, borderRadius: radius.md, overflow: "hidden", borderWidth: 1, borderColor: c.glassBorder }}>
                  <Pressable
                    onPress={() => setPetTab("preset")}
                    style={({ pressed }) => ({
                      flex: 1,
                      paddingVertical: 8,
                      alignItems: "center",
                      backgroundColor: petTab === "preset" ? c.accent2 : "transparent",
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <BentoText weight={petTab === "preset" ? "bold" : "medium"} variant="caption" color={petTab === "preset" ? "#FFFFFF" : c.inkMute}>
                      系统预设
                    </BentoText>
                  </Pressable>
                  <Pressable
                    onPress={() => setPetTab("custom")}
                    style={({ pressed }) => ({
                      flex: 1,
                      paddingVertical: 8,
                      alignItems: "center",
                      backgroundColor: petTab === "custom" ? c.accent : "transparent",
                      borderLeftWidth: 1,
                      borderLeftColor: c.glassBorder,
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <BentoText weight={petTab === "custom" ? "bold" : "medium"} variant="caption" color={petTab === "custom" ? "#FFFFFF" : c.inkMute}>
                      自定义
                    </BentoText>
                  </Pressable>
                </View>

                {/* 预设宠物 */}
                {petTab === "preset" ? (
                  <View style={{ gap: 10 }}>
                    <View style={{ gap: 6 }}>
                      <BentoText variant="micro" color={c.inkFaint}>
                        {`${petSourceLabels.cute} · ${cutePets.length} 种`}
                      </BentoText>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                        {cutePets.map((pet) => (
                          <PetChip key={pet.id} pet={pet} selected={selectedPetId === pet.id && !customPet} onPress={() => handleSelectPreset(pet.id)} />
                        ))}
                      </View>
                    </View>
                    <View style={{ gap: 6 }}>
                      <BentoText variant="micro" color={c.inkFaint}>
                        {`${petSourceLabels.viral} · ${viralPets.length} 种`}
                      </BentoText>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                        {viralPets.map((pet) => (
                          <PetChip key={pet.id} pet={pet} selected={selectedPetId === pet.id && !customPet} onPress={() => handleSelectPreset(pet.id)} />
                        ))}
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={{ gap: 10 }}>
                    <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 24,
                          backgroundColor: c.accent + "18",
                          borderWidth: 1.5,
                          borderColor: c.accent,
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        <BentoText style={{ fontSize: 22, lineHeight: 26 }}>
                          {customPetDraft.emoji || "🐾"}
                        </BentoText>
                      </View>
                      <View style={{ flex: 1 }}>
                        <LabeledInput
                          label="宠物名字"
                          value={customPetDraft.name}
                          onChangeText={(v) => setCustomPetDraft((d) => ({ ...d, name: v }))}
                        />
                      </View>
                    </View>
                    <LabeledInput
                      label="Emoji 头像（粘贴一个表情）"
                      value={customPetDraft.emoji}
                      onChangeText={(v) => setCustomPetDraft((d) => ({ ...d, emoji: v }))}
                    />
                    <Pressable
                      onPress={openPetImagePicker}
                      style={({ pressed }) => ({
                        paddingVertical: 10,
                        borderRadius: radius.md,
                        borderWidth: 1,
                        borderColor: c.glassBorder,
                        alignItems: "center",
                        opacity: pressed ? 0.7 : 1,
                      })}
                    >
                      <BentoText variant="caption" color={c.inkMute}>拍照 / 上传宠物照片（可选）</BentoText>
                    </Pressable>
                    {Platform.OS === "web"
                      ? createElement("input", {
                          ref: petImageInputRef,
                          type: "file",
                          accept: "image/jpeg,image/png,image/webp",
                          capture: "environment",
                          onChange: onPetImageSelected,
                          style: { display: "none" }
                        })
                      : null}
                    <View style={{ gap: 6 }}>
                      <BentoText variant="micro" color={c.inkFaint}>性格</BentoText>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                        {(Object.keys(petPersonalityLabels) as Array<keyof typeof petPersonalityLabels>).map((key) => (
                          <Pressable
                            key={key}
                            onPress={() => setCustomPetDraft((d) => ({ ...d, personality: key }))}
                            style={{
                              paddingVertical: 5,
                              paddingHorizontal: 10,
                              borderRadius: 999,
                              borderWidth: 1,
                              borderColor: customPetDraft.personality === key ? c.accent : c.glassBorder,
                              backgroundColor: customPetDraft.personality === key ? c.accent + "18" : "transparent"
                            }}
                          >
                            <BentoText weight="semibold" variant="micro" color={customPetDraft.personality === key ? c.accent : c.inkMute}>
                              {petPersonalityLabels[key]}
                            </BentoText>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                    <Button
                      variant="filled"
                      color="accent"
                      block
                      onPress={handleSaveCustomPet}
                      disabled={customPetDraft.name.trim().length === 0}
                    >
                      保存自定义宠物
                    </Button>
                    {petMessage ? (
                      <BentoText variant="caption" color={c.inkMute}>
                        {petMessage}
                      </BentoText>
                    ) : null}
                  </View>
                )}
              </View>
            </SharedExpandableRow>
          </SettingsGroup>
        </View>

        {/* ===== 健康数据 ===== */}
        <View style={{ gap: 6 }}>
          <SectionHeader>健康数据</SectionHeader>
          <SettingsGroup>
            <SettingsRow
              icon="⇩"
              label="导出健康数据"
              subtitle="导出个人档案、饮食、训练、日志与当前计划"
              onPress={handleExportHealthData}
            />
            <SettingsRow
              icon="✕"
              label="清除健康数据"
              subtitle="重置饮食/训练记录与饮食计划选择"
              dangerous
              onPress={handleClearHealthData}
            />
          </SettingsGroup>
        </View>
      </View>
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
  icon,
  label,
  subtitle,
  children,
  onPress,
  dangerous = false,
}: {
  icon: string;
  label: string;
  subtitle?: string;
  children?: ReactNode;
  onPress?: () => void;
  dangerous?: boolean;
}) {
  const theme = useBentoTheme();
  const c = theme.colors;
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
        <BentoText style={{ fontSize: 18, lineHeight: 22 }}>{icon}</BentoText>
        <View style={{ flex: 1, gap: 2 }}>
          <BentoText variant="body" color={dangerous ? c.warn : c.ink}>{label}</BentoText>
          {subtitle ? (
            <BentoText variant="micro" color={dangerous ? c.warn : c.inkMute} numberOfLines={2}>
              {subtitle}
            </BentoText>
          ) : null}
        </View>
      </View>
      {children}
      {onPress ? <BentoText style={{ fontSize: 16, color: c.inkFaint, marginLeft: 8 }}>{">"}</BentoText> : null}
    </View>
  );

  if (!onPress) {
    return <View style={{ backgroundColor: c.glass, borderBottomWidth: 1, borderBottomColor: c.glassBorder }}>{content}</View>;
  }

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.72 : 1, backgroundColor: c.glass })}>
      <View style={{ borderBottomWidth: 1, borderBottomColor: c.glassBorder }}>{content}</View>
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

function PetChip({ pet, selected, onPress }: { pet: PresetPet; selected: boolean; onPress: () => void }) {
  const theme = useBentoTheme();
  const c = theme.colors;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 999,
        borderWidth: 1.5,
        borderColor: selected ? c.accent2 : c.glassBorder,
        backgroundColor: selected ? c.accent2 + "18" : pressed ? c.glassRaised : "transparent",
      })}
    >
      <BentoText style={{ fontSize: 16, lineHeight: 20 }}>{pet.emoji}</BentoText>
      <BentoText weight="semibold" variant="micro" color={selected ? c.accent2 : c.ink}>
        {pet.name}
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
