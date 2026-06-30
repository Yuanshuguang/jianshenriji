import { createElement, useEffect, useRef, useState } from "react";
import { Image, Platform, View } from "react-native";
import { useRouter } from "expo-router";
import { bodyShapeOptions } from "@fitness-calendar/shared";
import {
  Button,
  GlassTile,
  Label,
  LabeledInput,
  Screen,
  ScreenHeader,
  SelectChip,
  Text as BentoText,
  bento,
  colors,
} from "../../components/bento";
import {
  createDefaultBodyComposition,
  type BodyCompositionDraft,
  type BodyCompositionSource,
  type UserGoal,
  type UserProfile,
  useFitnessStore,
} from "../../store/fitness-store";

const bodySourceLabels: Record<BodyCompositionSource, string> = {
  manual: "手动录入",
  report: "报告导入",
  selfie: "自拍估算",
};

const bodySourceHints: Record<BodyCompositionSource, string> = {
  manual: "只填数字，不上传图片。",
  report: "上传体成分报告截图，优先读取仪器结果。",
  selfie: "上传自拍或训练照，后续可接 AI 估算体脂率。",
};

const bodyShapeLabels: Record<string, string> = {
  "flat-belly": "腹部平坦",
  "slight-line": "马甲线隐约可见",
  "clear-line": "马甲线较明显",
  "very-clear-line": "马甲线非常明显",
};

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/heic"]);
const maxImageBytes = 8 * 1024 * 1024;

export default function BodyScreen() {
  const router = useRouter();
  const profile = useFitnessStore((state) => state.profile);
  const goal = useFitnessStore((state) => state.goal);
  const setProfile = useFitnessStore((state) => state.setProfile);
  const setGoal = useFitnessStore((state) => state.setGoal);
  const [draft, setDraft] = useState<UserProfile>(() => ensureBodyComposition(profile));
  const [goalDraft, setGoalDraft] = useState<UserGoal>(goal);
  const [previewUri, setPreviewUri] = useState<string | null>(profile.bodyComposition?.evidenceUri ?? null);
  const [message, setMessage] = useState("");
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const next = ensureBodyComposition(profile);
    setDraft(next);
    setPreviewUri(next.bodyComposition?.evidenceUri ?? null);
  }, [profile]);

  useEffect(() => {
    setGoalDraft(goal);
  }, [goal]);

  const bodyComposition = draft.bodyComposition ?? createDefaultBodyComposition();
  const hasSelectedEvidence = Boolean(previewUri || bodyComposition.evidenceName);
  const uploadButtonLabel =
    bodyComposition.source === "selfie"
      ? "上传自拍图"
      : bodyComposition.source === "report"
        ? "上传报告截图"
        : "上传辅助图片";

  const updateBodyComposition = (patch: Partial<BodyCompositionDraft>) => {
    setDraft((current) => ({
      ...current,
      bodyComposition: {
        ...(current.bodyComposition ?? createDefaultBodyComposition()),
        ...patch,
      },
    }));
  };

  const handleOpenImagePicker = () => {
    if (Platform.OS === "web") {
      imageInputRef.current?.click();
      return;
    }

    setMessage("移动端照片上传入口后续可接系统相册；当前先保留网页上传能力。");
  };

  const handleImageSelected = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!allowedImageTypes.has(file.type)) {
      setMessage("只支持 JPG、PNG、WebP 或 HEIC 图片。");
      input.value = "";
      return;
    }

    if (file.size > maxImageBytes) {
      setMessage("图片不能超过 8MB，请先压缩后再上传。");
      input.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUri(typeof reader.result === "string" ? reader.result : null);
      updateBodyComposition({
        evidenceName: file.name,
        evidenceUri: null,
      });
      setMessage("图片已导入，后续可以把它作为 AI 估算体脂率的依据。");
    };
    reader.readAsDataURL(file);
    input.value = "";
  };

  const handleSave = () => {
    setProfile({
      ...draft,
      bodyComposition: {
        ...bodyComposition,
        evidenceUri: null,
      },
    });
    setGoal(goalDraft);
    router.push("/onboarding/training-preference");
  };

  return (
    <Screen>
      <ScreenHeader
        kicker="Onboarding / 1 / 2"
        title="身体基线"
        subtitle="年龄、体重和身高是必填；目标体重、周期天数和目标体型也一起在这里设置；体脂率、骨骼肌、身体水分和基础代谢是可选；也可以先上传报告或自拍，留给后续 AI 估算。"
      />

      <GlassTile glow="accent" style={{ gap: 12 }}>
        <View style={{ gap: 8 }}>
          <Label color={colors.inkMute} variant="label">
            性别
          </Label>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <SelectChip
              label="男"
              active={draft.gender === "male"}
              color="accent"
              block
              onPress={() => setDraft((current) => ({ ...current, gender: "male" }))}
            />
            <SelectChip
              label="女"
              active={draft.gender === "female"}
              color="accent2"
              block
              onPress={() => setDraft((current) => ({ ...current, gender: "female" }))}
            />
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: bento.tileGap }}>
          <View style={{ flex: 1 }}>
            <LabeledInput
              label="年龄 *"
              keyboardType="numeric"
              value={String(draft.age || "")}
              onChangeText={(text) => setDraft((current) => ({ ...current, age: parseInteger(text) }))}
            />
          </View>
          <View style={{ flex: 1 }}>
            <LabeledInput
              label="体重 *"
              keyboardType="numeric"
              value={String(draft.weightKg || "")}
              suffix={<BentoText variant="micro" color={colors.inkFaint}>kg</BentoText>}
              onChangeText={(text) => setDraft((current) => ({ ...current, weightKg: parseInteger(text) }))}
            />
          </View>
        </View>

        <LabeledInput
          label="身高 *"
          keyboardType="numeric"
          value={String(draft.heightCm || "")}
          suffix={<BentoText variant="micro" color={colors.inkFaint}>cm</BentoText>}
          onChangeText={(text) => setDraft((current) => ({ ...current, heightCm: parseInteger(text) }))}
        />
      </GlassTile>

      <GlassTile glow="positive" style={{ gap: 12 }}>
        <View style={{ gap: 4 }}>
          <Label color={colors.inkMute} variant="label">
            目标体重 / 周期 / 体型
          </Label>
          <BentoText variant="caption" color={colors.inkMute}>
            这三项原来在体重目标页，现在合并到身体基线页，一次填完。
          </BentoText>
        </View>

        <View style={{ flexDirection: "row", gap: bento.tileGap }}>
          <View style={{ flex: 1 }}>
            <LabeledInput
              label="目标体重 kg"
              keyboardType="numeric"
              value={String(goalDraft.targetWeightKg || "")}
              onChangeText={(text) => setGoalDraft((current) => ({ ...current, targetWeightKg: parseInteger(text) }))}
            />
          </View>
          <View style={{ flex: 1 }}>
            <LabeledInput
              label="周期天数"
              keyboardType="numeric"
              value={String(goalDraft.targetDays || "")}
              onChangeText={(text) => setGoalDraft((current) => ({ ...current, targetDays: parseInteger(text) }))}
            />
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <Label color={colors.inkMute} variant="label">
            目标体型
          </Label>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {bodyShapeOptions.map((option) => (
              <SelectChip
                key={option.id}
                label={bodyShapeLabels[option.id] ?? option.id}
                active={goalDraft.targetBodyShapeId === option.id}
                color="positive"
                onPress={() => setGoalDraft((current) => ({ ...current, targetBodyShapeId: option.id }))}
              />
            ))}
          </View>
        </View>
      </GlassTile>

      <GlassTile glow="positive" style={{ gap: 12 }}>
        <View style={{ gap: 4 }}>
          <Label color={colors.inkMute} variant="label">
            身体成分补充
          </Label>
          <BentoText variant="caption" color={colors.inkMute}>
            可先手动补填，也可以直接上传报告或自拍图，让后续 AI 估算更接近真实情况。
          </BentoText>
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {(Object.keys(bodySourceLabels) as BodyCompositionSource[]).map((source) => (
            <SelectChip
              key={source}
              label={bodySourceLabels[source]}
              active={bodyComposition.source === source}
              color={source === "selfie" ? "accent2" : "positive"}
              onPress={() => updateBodyComposition({ source })}
            />
          ))}
        </View>

        <BentoText variant="micro" color={colors.inkFaint}>
          {bodySourceHints[bodyComposition.source]}
        </BentoText>

        <View style={{ flexDirection: "row", gap: bento.tileGap }}>
          <View style={{ flex: 1 }}>
            <LabeledInput
              label="体脂率 %"
              keyboardType="numeric"
              value={formatOptionalNumber(bodyComposition.bodyFatPercent)}
              onChangeText={(text) => updateBodyComposition({ bodyFatPercent: parseOptionalDecimal(text) })}
            />
          </View>
          <View style={{ flex: 1 }}>
            <LabeledInput
              label="骨骼肌 kg"
              keyboardType="numeric"
              value={formatOptionalNumber(bodyComposition.skeletalMuscleKg)}
              onChangeText={(text) => updateBodyComposition({ skeletalMuscleKg: parseOptionalDecimal(text) })}
            />
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: bento.tileGap }}>
          <View style={{ flex: 1 }}>
            <LabeledInput
              label="身体水分 %"
              keyboardType="numeric"
              value={formatOptionalNumber(bodyComposition.waterPercent)}
              onChangeText={(text) => updateBodyComposition({ waterPercent: parseOptionalDecimal(text) })}
            />
          </View>
          <View style={{ flex: 1 }}>
            <LabeledInput
              label="基础代谢 kcal"
              keyboardType="numeric"
              value={formatOptionalNumber(bodyComposition.basalMetabolismKcal)}
              onChangeText={(text) => updateBodyComposition({ basalMetabolismKcal: parseOptionalInteger(text) })}
            />
          </View>
        </View>
      </GlassTile>

      <GlassTile glow="accent2" style={{ gap: 12 }}>
        <View style={{ gap: 4 }}>
          <Label color={colors.inkMute} variant="label">
            图片上传与估算入口
          </Label>
          <BentoText variant="caption" color={colors.inkMute}>
            支持上传体成分报告截图、自拍或训练照。图片只用于当前草稿预览，后续可接入 AI 估算流程。
          </BentoText>
        </View>

        <Button variant="filled" color="accent2" block onPress={handleOpenImagePicker}>
          {uploadButtonLabel}
        </Button>

        {Platform.OS === "web"
          ? createElement("input", {
              ref: imageInputRef,
              type: "file",
              accept: "image/jpeg,image/png,image/webp,image/heic",
              onChange: handleImageSelected,
              style: { display: "none" },
            })
          : null}

        {hasSelectedEvidence ? (
          <View style={{ gap: 8 }}>
            {previewUri ? (
              <Image
                source={{ uri: previewUri }}
                style={{ width: "100%", height: 180, borderRadius: 16 }}
                resizeMode="cover"
              />
            ) : (
              <View
                style={{
                  minHeight: 120,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.glassBorder,
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 16,
                }}
              >
                <BentoText variant="caption" color={colors.inkMute}>
                  已保存图片名称，预览仅保留在当前会话
                </BentoText>
              </View>
            )}
            <BentoText variant="micro" color={colors.inkMute}>
              已选择：{bodyComposition.evidenceName ?? "图片"}
            </BentoText>
          </View>
        ) : (
          <View
            style={{
              minHeight: 120,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.glassBorder,
              borderStyle: "dashed",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
          >
            <BentoText variant="caption" color={colors.inkFaint}>
              还没有上传图片
            </BentoText>
          </View>
        )}

        {message ? (
          <BentoText variant="micro" color={colors.inkMute}>
            {message}
          </BentoText>
        ) : null}
      </GlassTile>

      <Button variant="filled" color="accent" block onPress={handleSave}>
        保存并继续
      </Button>
    </Screen>
  );
}

function ensureBodyComposition(profile: UserProfile): UserProfile {
  const bodyComposition = profile.bodyComposition;
  const defaultBodyComposition = createDefaultBodyComposition();

  return {
    ...profile,
    bodyComposition: {
      ...defaultBodyComposition,
      source: bodyComposition?.source ?? defaultBodyComposition.source,
      evidenceName: bodyComposition?.evidenceName ?? defaultBodyComposition.evidenceName,
      evidenceUri: bodyComposition?.evidenceUri ?? defaultBodyComposition.evidenceUri,
      bodyFatPercent: bodyComposition?.bodyFatPercent ?? defaultBodyComposition.bodyFatPercent,
      skeletalMuscleKg: bodyComposition?.skeletalMuscleKg ?? defaultBodyComposition.skeletalMuscleKg,
      waterPercent: bodyComposition?.waterPercent ?? defaultBodyComposition.waterPercent,
      basalMetabolismKcal: bodyComposition?.basalMetabolismKcal ?? defaultBodyComposition.basalMetabolismKcal,
    },
  };
}

function parseInteger(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0;
}

function parseOptionalInteger(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.round(parsed));
}

function parseOptionalDecimal(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, parsed);
}

function formatOptionalNumber(value: number | null): string {
  return value === null ? "" : String(value);
}
