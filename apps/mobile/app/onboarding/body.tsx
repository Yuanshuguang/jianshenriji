import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import {
  Button,
  colors,
  GlassTile,
  Label,
  LabeledInput,
  Screen,
  ScreenHeader,
  SelectChip,
  Text as BentoText,
  bento,
  type SemanticColor
} from "../../components/bento";
import { type UserProfile, useFitnessStore } from "../../store/fitness-store";

export default function BodyScreen() {
  const router = useRouter();
  const profile = useFitnessStore((state) => state.profile);
  const setProfile = useFitnessStore((state) => state.setProfile);
  const [draft, setDraft] = useState(profile);

  return (
    <Screen>
      <ScreenHeader
        kicker="Onboarding · 1 / 3"
        title="身体基线"
        subtitle="年龄、身高、体重和训练水平会直接影响热量目标和训练强度"
      />

      {/* 性别 */}
      <GlassTile glow="accent" style={{ gap: 10 }}>
        <Label color={colors.inkMute} variant="label">
          GENDER / 性别
        </Label>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <SelectChip
            label="男"
            active={draft.gender === "male"}
            color="accent"
            block
            onPress={() => setDraft({ ...draft, gender: "male" })}
          />
          <SelectChip
            label="女"
            active={draft.gender === "female"}
            color="accent2"
            block
            onPress={() => setDraft({ ...draft, gender: "female" })}
          />
        </View>
      </GlassTile>

      {/* 年龄 + 体重 */}
      <View style={{ flexDirection: "row", gap: bento.tileGap }}>
        <View style={{ flex: 1 }}>
          <LabeledInput
            label="年龄"
            keyboardType="numeric"
            value={String(draft.age)}
            onChangeText={(text) => setDraft({ ...draft, age: Number(text) || 0 })}
          />
        </View>
        <View style={{ flex: 1 }}>
          <LabeledInput
            label="体重 kg"
            keyboardType="numeric"
            value={String(draft.weightKg)}
            onChangeText={(text) => setDraft({ ...draft, weightKg: Number(text) || 0 })}
          />
        </View>
      </View>

      {/* 身高 */}
      <LabeledInput
        label="身高 cm"
        keyboardType="numeric"
        value={String(draft.heightCm)}
        onChangeText={(text) => setDraft({ ...draft, heightCm: Number(text) || 0 })}
      />

      {/* 训练水平 */}
      <GlassTile glow="accent2" style={{ gap: 10 }}>
        <Label color={colors.inkMute} variant="label">
          TRAINING LEVEL / 训练水平
        </Label>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {([
            ["beginner", "新手"],
            ["intermediate", "有基础"],
            ["regular", "规律训练"]
          ] as const).map(([value, label]) => (
            <SelectChip
              key={value}
              label={label}
              active={draft.trainingLevel === value}
              color="accent2"
              block
              onPress={() => setDraft({ ...draft, trainingLevel: value as UserProfile["trainingLevel"] })}
            />
          ))}
        </View>
      </GlassTile>

      <Button
        variant="filled"
        color="accent"
        block
        onPress={() => {
          setProfile(draft);
          router.push("/onboarding/goal");
        }}
      >
        保存并继续
      </Button>
    </Screen>
  );
}
