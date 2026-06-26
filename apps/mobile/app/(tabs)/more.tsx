import { createElement, useRef, useState } from "react";
import { Platform, Pressable, View } from "react-native";
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
  Badge,
  Button,
  colors,
  GlassTile,
  Label,
  LabeledInput,
  Screen,
  ScreenHeader,
  Switch,
  Text as BentoText,
  radius
} from "../../components/bento";
import { useFitnessStore } from "../../store/fitness-store";

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
  const dynamicAdjustmentEnabled = useFitnessStore((state) => state.dynamicAdjustmentEnabled);
  const setDynamicAdjustmentEnabled = useFitnessStore((state) => state.setDynamicAdjustmentEnabled);
  const dynamicAdjustmentSettings = useFitnessStore((state) => state.dynamicAdjustmentSettings);
  const setDynamicAdjustmentSettings = useFitnessStore((state) => state.setDynamicAdjustmentSettings);
  const appearanceMode = useFitnessStore((state) => state.appearanceMode);
  const setAppearanceMode = useFitnessStore((state) => state.setAppearanceMode);
  const selectedPetId = useFitnessStore((state) => state.selectedPetId);
  const customPet = useFitnessStore((state) => state.customPet);
  const petEnabled = useFitnessStore((state) => state.petEnabled);
  const setSelectedPet = useFitnessStore((state) => state.setSelectedPet);
  const setCustomPet = useFitnessStore((state) => state.setCustomPet);
  const setPetEnabled = useFitnessStore((state) => state.setPetEnabled);
  const [petTab, setPetTab] = useState<"preset" | "custom">("preset");
  const [petCollapsed, setPetCollapsed] = useState(false);
  const [customPetDraft, setCustomPetDraft] = useState<{ name: string; emoji: string; personality: PetPersonality; photoUri?: string }>({
    name: "",
    emoji: "🐾",
    personality: "lively"
  });
  const [petMessage, setPetMessage] = useState("");
  const petImageInputRef = useRef<HTMLInputElement | null>(null);

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

  return (
    <Screen>
      <ScreenHeader
        kicker="更多 · 系统"
        title=""
        subtitle=""
        badge={{ text: "系统", color: "accent" }}
      />

      {/* ===== 外观模式 ===== */}
      <GlassTile glow={appearanceMode === "light" ? "accent" : "accent2"} style={{ gap: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Label color={colors.inkMute} variant="label">
              APPEARANCE / 外观模式
            </Label>
            <BentoText weight="semibold" variant="caption" color={appearanceMode === "light" ? colors.accent : colors.accent2}>
              {appearanceMode === "light" ? "日间液态玻璃" : "夜间液态玻璃"}
            </BentoText>
            <BentoText variant="caption" color={colors.inkMute} style={{ lineHeight: 1.5 }}>
              切换后匹配对应的日间 / 夜间系统外观。
            </BentoText>
          </View>
          <Badge color={appearanceMode === "light" ? "accent" : "accent2"} size="sm">
            {appearanceMode === "light" ? "日间" : "夜间"}
          </Badge>
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Button
            variant={appearanceMode === "light" ? "filled" : "glass"}
            color="accent"
            size="sm"
            block
            onPress={() => setAppearanceMode("light")}
          >
            日间模式
          </Button>
          <Button
            variant={appearanceMode === "dark" ? "filled" : "glass"}
            color="accent2"
            size="sm"
            block
            onPress={() => setAppearanceMode("dark")}
          >
            夜间模式
          </Button>
        </View>
      </GlassTile>

      {/* ===== 我的宠物 ===== */}
      <GlassTile glow="accent2" style={{ gap: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Label color={colors.inkMute} variant="label">
              PET / 我的宠物
            </Label>
            <BentoText weight="semibold" variant="caption" color={petEnabled ? colors.accent2 : colors.inkMute}>
              {petEnabled ? "宠物提醒已开启" : "宠物提醒已关闭"}
            </BentoText>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Switch
              value={petEnabled}
              onValueChange={setPetEnabled}
              activeColor={colors.accent2}
              accessibilityLabel="宠物功能开关"
            />
            <Pressable
              onPress={() => setPetCollapsed((value) => !value)}
              style={({ pressed }) => ({
                height: 30,
                paddingHorizontal: 12,
                borderRadius: 999,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.glass,
                borderWidth: 1,
                borderColor: colors.glassBorderBright,
                opacity: pressed ? 0.82 : 1
              })}
            >
              <BentoText weight="semibold" color={colors.accent2} style={{ fontSize: 12 }}>
                {petCollapsed ? "展开" : "收起"}
              </BentoText>
            </Pressable>
          </View>
        </View>

        {activePet ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 4 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: "rgba(167,139,250,0.12)",
                borderWidth: 1.5,
                borderColor: colors.accent2,
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <BentoText style={{ fontSize: 32, lineHeight: 38 }}>
                {activePet.pet.emoji}
              </BentoText>
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <BentoText weight="bold" variant="caption" color={colors.accent2}>
                {activePet.pet.name}
              </BentoText>
              <BentoText variant="micro" color={colors.inkMute} style={{ lineHeight: 1.5 }}>
                {activePet.kind === "preset" ? activePet.pet.catchphrase : `${activePet.pet.name}会出现在饮食和训练提醒里`}
              </BentoText>
              <BentoText variant="micro" color={colors.inkFaint}>
                {petPersonalityLabels[activePet.pet.personality]} · {activePet.kind === "custom" ? "自定义" : petSourceLabels[activePet.pet.source]}
              </BentoText>
            </View>
            <Button variant="ghost" color="warn" size="sm" onPress={handleClearPet}>
              换
            </Button>
          </View>
        ) : null}

        {!petCollapsed ? (
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Button
                variant={petTab === "preset" ? "filled" : "glass"}
                color="accent2"
                size="sm"
                block
                onPress={() => setPetTab("preset")}
              >
                系统预设
              </Button>
              <Button
                variant={petTab === "custom" ? "filled" : "glass"}
                color="accent"
                size="sm"
                block
                onPress={() => setPetTab("custom")}
              >
                自定义
              </Button>
            </View>

            {petTab === "preset" ? (
              <View style={{ gap: 10 }}>
                <View style={{ gap: 6 }}>
                  <Label color={colors.inkFaint} variant="micro">
                    {`${petSourceLabels.cute} · ${cutePets.length} 种`}
                  </Label>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {cutePets.map((pet) => (
                      <PetChip
                        key={pet.id}
                        pet={pet}
                        selected={selectedPetId === pet.id && !customPet}
                        onPress={() => handleSelectPreset(pet.id)}
                      />
                    ))}
                  </View>
                </View>
                <View style={{ gap: 6 }}>
                  <Label color={colors.inkFaint} variant="micro">
                    {`${petSourceLabels.viral} · ${viralPets.length} 种`}
                  </Label>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {viralPets.map((pet) => (
                      <PetChip
                        key={pet.id}
                        pet={pet}
                        selected={selectedPetId === pet.id && !customPet}
                        onPress={() => handleSelectPreset(pet.id)}
                      />
                    ))}
                  </View>
                </View>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: "rgba(56,189,248,0.12)",
                  borderWidth: 1.5,
                  borderColor: colors.accent,
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <BentoText style={{ fontSize: 26, lineHeight: 30 }}>
                  {customPetDraft.emoji || "🐾"}
                </BentoText>
              </View>
              <View style={{ flex: 1, gap: 6 }}>
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
            <Button variant="glass" color="accent" size="sm" block onPress={openPetImagePicker}>
              拍照/上传宠物照片（可选）
            </Button>
            {Platform.OS === "web"
              ? createElement("input", {
                  ref: petImageInputRef,
                  type: "file",
                  accept: "image/*",
                  capture: "environment",
                  onChange: onPetImageSelected,
                  style: { display: "none" }
                })
              : null}
            <View style={{ gap: 6 }}>
              <Label color={colors.inkFaint} variant="micro">
                性格
              </Label>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {(Object.keys(petPersonalityLabels) as Array<keyof typeof petPersonalityLabels>).map((key) => (
                  <Pressable
                    key={key}
                    onPress={() => setCustomPetDraft((d) => ({ ...d, personality: key }))}
                    style={{
                      paddingVertical: 6,
                      paddingHorizontal: 12,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: customPetDraft.personality === key ? colors.accent : colors.glassBorder,
                      backgroundColor: customPetDraft.personality === key ? "rgba(56,189,248,0.12)" : "transparent"
                    }}
                  >
                    <BentoText weight="semibold" variant="micro" color={customPetDraft.personality === key ? colors.accent : colors.inkMute}>
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
              <BentoText variant="caption" color={colors.inkMute}>
                {petMessage}
              </BentoText>
            ) : null}
              </View>
            )}
          </View>
        ) : null}
      </GlassTile>

      {/* ===== 动态调整开关 ===== */}
      <GlassTile glow={dynamicAdjustmentEnabled ? "amber" : undefined} style={{ gap: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flex: 1, gap: 4, marginRight: 12 }}>
            <Label color={colors.inkMute} variant="label">
              ADJUSTMENT / 动态调整
            </Label>
            <BentoText weight="semibold" variant="caption" color={dynamicAdjustmentEnabled ? colors.amber : colors.ink}>
              {dynamicAdjustmentEnabled ? "已开启" : "已关闭"}
            </BentoText>
            <BentoText variant="caption" color={colors.inkMute} style={{ lineHeight: 1.5 }}>
              {dynamicAdjustmentEnabled
                ? "当你某天没按计划饮食或训练时，系统会自动调整后续计划以弥合偏差。"
                : "后续计划将保持固定，不会因每日偏差而自动调整。"}
            </BentoText>
          </View>
          <Switch
            value={dynamicAdjustmentEnabled}
            onValueChange={setDynamicAdjustmentEnabled}
            activeColor={colors.amber}
            accessibilityLabel="动态调整开关"
          />
        </View>
        {dynamicAdjustmentEnabled ? (
          <View style={{ gap: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.glassBorder }}>
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
        ) : null}
      </GlassTile>
    </Screen>
  );
}

function PetChip({ pet, selected, onPress }: { pet: PresetPet; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 999,
        borderWidth: 1.5,
        borderColor: selected ? colors.accent2 : colors.glassBorder,
        backgroundColor: selected ? "rgba(167,139,250,0.12)" : pressed ? "rgba(255,255,255,0.04)" : "transparent"
      })}
    >
      <BentoText style={{ fontSize: 18, lineHeight: 22 }}>
        {pet.emoji}
      </BentoText>
      <BentoText weight="semibold" variant="micro" color={selected ? colors.accent2 : colors.ink}>
        {pet.name}
      </BentoText>
    </Pressable>
  );
}

function AdjustmentRuleGroup({ title, children }: { title: string; children: ReturnType<typeof createElement> | Array<ReturnType<typeof createElement>> }) {
  return (
    <View style={{ gap: 8 }}>
      <BentoText weight="semibold" variant="micro" color={colors.inkMute}>
        {title}
      </BentoText>
      <View style={{ gap: 8 }}>
        {children}
      </View>
    </View>
  );
}

function AdjustmentSwitchRow({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (value: boolean) => void }) {
  return (
    <View
      style={{
        minHeight: 38,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: radius.md,
        backgroundColor: colors.glass,
        borderWidth: 1,
        borderColor: colors.glassBorder
      }}
    >
      <BentoText weight="semibold" variant="caption" color={value ? colors.ink : colors.inkMute}>
        {label}
      </BentoText>
      <Switch value={value} onValueChange={onValueChange} activeColor={colors.amber} size="sm" accessibilityLabel={`${label}动态调整`} />
    </View>
  );
}
