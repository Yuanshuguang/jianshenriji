import { createElement, useEffect, useRef, useState } from "react";
import { Image, Platform, Pressable, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
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
  type BodyFatVisualLevel,
  type BodyCompositionDraft,
  type BodyCompositionSource,
  type UserGoal,
  type UserProfile,
  useFitnessStore,
} from "../../store/fitness-store";
import {
  calculateBmi,
  bodyFatVisualLevelLabels,
  bodyFatVisualQualityLabels,
  defaultBodyFatVisualQualitySignals,
  estimateBodyFatFromVisualInput,
  recognizeBodyReportImage,
} from "../../features/body-image-recognition";
import { prepareAiImageUploadFromBase64Asset, prepareAiImageUploadFromFile } from "../../features/ai-image-upload";
import { AsyncStatusBanner } from "../../components/shared/EmptyState";

const bodySourceLabels: Record<BodyCompositionSource, string> = {
  manual: "手动录入",
  report: "报告导入",
  selfie: "自拍估算",
};

const bodySourceHints: Record<BodyCompositionSource, string> = {
  manual: "只填数字，不上传图片。",
  report: "上传体成分报告截图，优先读取仪器结果。",
  selfie: "上传自拍、训练照或短视频，按基础数据和画面特征粗略估算体脂率。",
};

const bodyShapeLabels: Record<string, string> = {
  "flat-belly": "腹部平坦",
  "slight-line": "马甲线隐约可见",
  "clear-line": "马甲线较明显",
  "very-clear-line": "马甲线非常明显",
};

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/heic"]);
const allowedSelfieMediaTypes = new Set([...allowedImageTypes, "video/mp4", "video/quicktime", "video/webm"]);
const maxImageBytes = 8 * 1024 * 1024;
const maxSelfieMediaBytes = 40 * 1024 * 1024;

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
  const [bodyRecognitionBusy, setBodyRecognitionBusy] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
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
      ? "上传自拍/视频"
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

  const handleOpenImagePicker = async () => {
    if (Platform.OS === "web") {
      imageInputRef.current?.click();
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setMessage("需要相册权限，才能选择体成分报告或自拍图。");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: bodyComposition.source === "selfie" ? ["images", "videos"] : ["images"],
      base64: true,
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    if (bodyComposition.source === "report") {
      try {
        const image = prepareAiImageUploadFromBase64Asset(asset);
        await handlePickedImage({
          base64: image.base64,
          name: image.name,
          source: bodyComposition.source,
          mediaType: "image",
        });
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "报告图片读取失败，请重新选择。");
      }
      return;
    }

    await handlePickedImage({
      base64: asset.base64 ? `data:${asset.mimeType ?? "image/jpeg"};base64,${asset.base64}` : asset.uri,
      name: asset.fileName ?? (asset.type === "video" ? "body-video.mp4" : "body-image.jpg"),
      source: bodyComposition.source,
      mediaType: asset.type === "video" ? "video" : "image",
    });
  };

  const handleOpenCamera = async () => {
    if (Platform.OS === "web") {
      imageInputRef.current?.click();
      return;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setMessage("需要相机权限，才能拍摄体成分报告或自拍图。");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: bodyComposition.source === "selfie" ? ["images", "videos"] : ["images"],
      base64: true,
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    if (bodyComposition.source === "report") {
      try {
        const image = prepareAiImageUploadFromBase64Asset(asset);
        await handlePickedImage({
          base64: image.base64,
          name: image.name,
          source: bodyComposition.source,
          mediaType: "image",
        });
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "报告图片读取失败，请重新选择。");
      }
      return;
    }

    await handlePickedImage({
      base64: asset.base64 ? `data:${asset.mimeType ?? "image/jpeg"};base64,${asset.base64}` : asset.uri,
      name: asset.fileName ?? (asset.type === "video" ? "body-camera-video.mp4" : "body-camera.jpg"),
      source: bodyComposition.source,
      mediaType: asset.type === "video" ? "video" : "image",
    });
  };

  const handleImageSelected = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const selectedSource = bodyComposition.source;

    if (selectedSource === "report") {
      try {
        const image = await prepareAiImageUploadFromFile(file);
        await handlePickedImage({
          base64: image.base64,
          name: image.name,
          source: selectedSource,
          mediaType: "image",
        });
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "报告图片读取失败，请重新选择。");
      } finally {
        input.value = "";
      }
      return;
    }

    const isSelfie = selectedSource === "selfie";
    const allowedTypes = isSelfie ? allowedSelfieMediaTypes : allowedImageTypes;
    const maxBytes = isSelfie ? maxSelfieMediaBytes : maxImageBytes;

    if (!allowedTypes.has(file.type)) {
      setMessage(isSelfie ? "只支持常见图片或 MP4、MOV、WebM 视频。" : "只支持 JPG、PNG、WebP 或 HEIC 图片。");
      input.value = "";
      return;
    }

    if (file.size > maxBytes) {
      setMessage(isSelfie ? "自拍视频不能超过 40MB，请先压缩后再上传。" : "图片不能超过 8MB，请先压缩后再上传。");
      input.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const imageBase64 = typeof reader.result === "string" ? reader.result : "";
      void handlePickedImage({
        base64: imageBase64,
        name: file.name,
        source: selectedSource,
        mediaType: file.type.startsWith("video/") ? "video" : "image",
      });
    };
    reader.readAsDataURL(file);
    input.value = "";
  };

  const handlePickedImage = async ({
    base64,
    name,
    source,
    mediaType,
  }: {
    base64: string;
    name: string;
    source: BodyCompositionSource;
    mediaType: "image" | "video";
  }) => {
    if (!base64) {
      setMessage("图片读取失败，请重新选择。");
      return;
    }

    setBodyRecognitionBusy(true);
    setPreviewUri(base64);
    updateBodyComposition({
      evidenceName: name,
      evidenceUri: null,
      evidenceMediaType: mediaType,
    });

    try {
      if (source === "report") {
        const result = await recognizeBodyReportImage(base64, name);
        const bmi = calculateBmi(draft.heightCm, draft.weightKg);
        updateBodyComposition({
          bodyFatPercent: result.metrics.bodyFatPercent ?? bodyComposition.bodyFatPercent,
          skeletalMuscleKg: result.metrics.skeletalMuscleKg ?? bodyComposition.skeletalMuscleKg,
          waterPercent: result.metrics.waterPercent ?? bodyComposition.waterPercent,
          basalMetabolismKcal: result.metrics.basalMetabolismKcal ?? bodyComposition.basalMetabolismKcal,
        });
        setMessage(
          bmi
            ? `报告已识别，BMI 约 ${bmi}，其余体成分字段已尽量自动填入。`
            : "报告已识别，其余体成分字段已尽量自动填入。"
        );
        return;
      }

      if (source === "selfie") {
        const estimated = estimateBodyFatFromVisualInput(draft, bodyComposition.visualLevel, {
          mediaType,
          qualitySignals: bodyComposition.visualQualitySignals,
        });
        updateBodyComposition({
          bodyFatPercent: estimated?.percent ?? bodyComposition.bodyFatPercent,
          bodyFatEstimateMin: estimated?.min ?? bodyComposition.bodyFatEstimateMin,
          bodyFatEstimateMax: estimated?.max ?? bodyComposition.bodyFatEstimateMax,
          bodyFatEstimateReason: estimated?.reason ?? bodyComposition.bodyFatEstimateReason,
        });
        setMessage(
          estimated
            ? `${mediaType === "video" ? "视频" : "自拍"}已给出粗略体脂率：约 ${estimated.percent}%（${estimated.min}% - ${estimated.max}%），可继续按画面特征校准。`
            : `${mediaType === "video" ? "视频" : "自拍"}已导入，当前信息不足，暂时只保留文件名，体脂率可手动补填。`
        );
        return;
      }

      setMessage("图片已导入，后续可以把它作为 AI 估算体脂率的依据。");
    } catch (error) {
      if (source === "report") {
        console.error("[body-screen] report recognition failed", error);
        setMessage("报告识别失败，已保留图片，体成分字段可以手动补填。");
        return;
      }
      setMessage(error instanceof Error ? error.message : "图片处理失败，已保留可手动补填。");
    } finally {
      setBodyRecognitionBusy(false);
    }
  };

  const handleVisualLevelChange = (visualLevel: BodyFatVisualLevel) => {
    const estimated = estimateBodyFatFromVisualInput(draft, visualLevel, {
      mediaType: bodyComposition.evidenceMediaType,
      qualitySignals: bodyComposition.visualQualitySignals,
    });
    updateBodyComposition({
      visualLevel,
      bodyFatPercent: estimated?.percent ?? bodyComposition.bodyFatPercent,
      bodyFatEstimateMin: estimated?.min ?? bodyComposition.bodyFatEstimateMin,
      bodyFatEstimateMax: estimated?.max ?? bodyComposition.bodyFatEstimateMax,
      bodyFatEstimateReason: estimated?.reason ?? bodyComposition.bodyFatEstimateReason,
    });
    if (estimated) {
      setMessage(`已按「${estimated.label}」校准：约 ${estimated.percent}%（${estimated.min}% - ${estimated.max}%）。`);
    }
  };

  const handleQualitySignalToggle = (signal: keyof typeof bodyFatVisualQualityLabels) => {
    const currentSignals = bodyComposition.visualQualitySignals;
    const nextSignals = currentSignals.includes(signal)
      ? currentSignals.filter((item) => item !== signal)
      : [...currentSignals, signal];
    const estimated = estimateBodyFatFromVisualInput(draft, bodyComposition.visualLevel, {
      mediaType: bodyComposition.evidenceMediaType,
      qualitySignals: nextSignals,
    });
    updateBodyComposition({
      visualQualitySignals: nextSignals,
      bodyFatPercent: estimated?.percent ?? bodyComposition.bodyFatPercent,
      bodyFatEstimateMin: estimated?.min ?? bodyComposition.bodyFatEstimateMin,
      bodyFatEstimateMax: estimated?.max ?? bodyComposition.bodyFatEstimateMax,
      bodyFatEstimateReason: estimated?.reason ?? bodyComposition.bodyFatEstimateReason,
    });
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
        subtitle="先填年龄、体重和身高，再补目标体重、周期和体型。体脂、骨骼肌、水分和基础代谢可后补，也能先上传报告或自拍。"
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

      <Pressable
        onPress={() => setAdvancedOpen((value) => !value)}
        style={({ pressed }) => ({
          borderRadius: 18,
          opacity: pressed ? 0.78 : 1,
        })}
      >
        <GlassTile glow="positive" style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <Label color={colors.inkMute} variant="label">
            高级数据（可选）
          </Label>
          <BentoText variant="caption" color={colors.inkMute}>
            体脂率、骨骼肌、水分、基础代谢都可后补；报告 OCR 负责填数，自拍或视频主要粗估体脂率。
          </BentoText>
        </View>
            <BentoText weight="bold" color={colors.accent}>
              {advancedOpen ? "收起" : "展开"}
            </BentoText>
          </View>
        </GlassTile>
      </Pressable>

      {advancedOpen ? (
        <>

      <GlassTile glow="positive" style={{ gap: 12 }}>
        <View style={{ gap: 4 }}>
          <Label color={colors.inkMute} variant="label">
            身体成分补充
          </Label>
          <BentoText variant="caption" color={colors.inkMute}>
            可手动补，也可上传报告 OCR 或自拍/视频做体脂率粗估。
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

        <BentoText variant="micro" color={colors.inkMute}>
          {calculateBmi(draft.heightCm, draft.weightKg)
            ? `当前 BMI 约 ${calculateBmi(draft.heightCm, draft.weightKg)}`
            : "BMI 会根据身高和体重自动计算"}
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

        {bodyComposition.source === "selfie" ? (
          <View style={{ gap: 8 }}>
            <Label color={colors.inkMute} variant="label">
              当前画面特征
            </Label>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {(Object.keys(bodyFatVisualLevelLabels) as BodyFatVisualLevel[]).map((level) => (
                <SelectChip
                  key={level}
                  label={bodyFatVisualLevelLabels[level]}
                  active={bodyComposition.visualLevel === level}
                  color="accent2"
                  onPress={() => handleVisualLevelChange(level)}
                />
              ))}
            </View>
            {bodyComposition.bodyFatEstimateMin !== null && bodyComposition.bodyFatEstimateMax !== null ? (
              <BentoText variant="micro" color={colors.inkMute}>
                估算区间：{bodyComposition.bodyFatEstimateMin}% - {bodyComposition.bodyFatEstimateMax}%
              </BentoText>
            ) : null}
            <Label color={colors.inkMute} variant="label">
              画面质量
            </Label>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {(Object.keys(bodyFatVisualQualityLabels) as Array<keyof typeof bodyFatVisualQualityLabels>).map((signal) => (
                <SelectChip
                  key={signal}
                  label={bodyFatVisualQualityLabels[signal]}
                  active={bodyComposition.visualQualitySignals.includes(signal)}
                  color="accent2"
                  onPress={() => handleQualitySignalToggle(signal)}
                />
              ))}
            </View>
            {bodyComposition.bodyFatEstimateReason ? (
              <BentoText variant="micro" color={colors.inkFaint}>
                {bodyComposition.bodyFatEstimateReason}
              </BentoText>
            ) : null}
          </View>
        ) : null}

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
            支持报告截图、自拍、训练照或短视频；识别结果会回填上方字段，用户可继续手动改。
          </BentoText>
        </View>

        <View style={{ flexDirection: "row", gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Button variant="filled" color="accent2" block onPress={handleOpenImagePicker}>
              {uploadButtonLabel}
            </Button>
          </View>
          <View style={{ flex: 1 }}>
            <Button variant="glass" color="accent2" block onPress={handleOpenCamera}>
              拍照识别
            </Button>
          </View>
        </View>

        {Platform.OS === "web"
          ? createElement("input", {
              ref: imageInputRef,
              type: "file",
              accept: bodyComposition.source === "selfie"
                ? "image/jpeg,image/png,image/webp,image/heic,video/mp4,video/quicktime,video/webm"
                : "image/jpeg,image/png,image/webp,image/heic",
              onChange: handleImageSelected,
              style: { display: "none" },
            })
          : null}

        {hasSelectedEvidence ? (
          <View style={{ gap: 8 }}>
            {previewUri ? (
              previewUri.startsWith("data:video") || /\.(mp4|mov|webm)$/i.test(bodyComposition.evidenceName ?? "") ? (
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
                    已选择视频，当前仅保留文件名并用于估算校准
                  </BentoText>
                </View>
              ) : (
                <Image
                  source={{ uri: previewUri }}
                  style={{ width: "100%", height: 180, borderRadius: 16 }}
                  resizeMode="cover"
                />
              )
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

        <AsyncStatusBanner
          status={bodyRecognitionBusy ? "loading" : getBodyAsyncStatus(message)}
          message={bodyRecognitionBusy ? "正在处理报告或体态图片..." : message}
        />
      </GlassTile>
        </>
      ) : null}

      <Button variant="filled" color="accent" style={{ alignSelf: "stretch" }} onPress={handleSave}>
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
      evidenceMediaType: bodyComposition?.evidenceMediaType ?? defaultBodyComposition.evidenceMediaType,
      bodyFatPercent: bodyComposition?.bodyFatPercent ?? defaultBodyComposition.bodyFatPercent,
      skeletalMuscleKg: bodyComposition?.skeletalMuscleKg ?? defaultBodyComposition.skeletalMuscleKg,
      waterPercent: bodyComposition?.waterPercent ?? defaultBodyComposition.waterPercent,
      basalMetabolismKcal: bodyComposition?.basalMetabolismKcal ?? defaultBodyComposition.basalMetabolismKcal,
      visualLevel: bodyComposition?.visualLevel ?? defaultBodyComposition.visualLevel,
      visualQualitySignals: bodyComposition?.visualQualitySignals ?? defaultBodyFatVisualQualitySignals,
      bodyFatEstimateMin: bodyComposition?.bodyFatEstimateMin ?? defaultBodyComposition.bodyFatEstimateMin,
      bodyFatEstimateMax: bodyComposition?.bodyFatEstimateMax ?? defaultBodyComposition.bodyFatEstimateMax,
      bodyFatEstimateReason: bodyComposition?.bodyFatEstimateReason ?? defaultBodyComposition.bodyFatEstimateReason,
    },
  };
}

function getBodyAsyncStatus(message: string): "idle" | "loading" | "success" | "error" {
  if (!message) return "idle";
  if (message.includes("失败") || message.includes("需要") || message.includes("不能超过") || message.includes("只支持")) return "error";
  return "success";
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
