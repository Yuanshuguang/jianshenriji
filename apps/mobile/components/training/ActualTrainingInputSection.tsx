import { TextInput, View } from "react-native";
import { Badge, LabeledInput, SelectChip, Text as BentoText, useBentoTheme } from "../../components/bento";

export type ParsedTrainingText = {
  matched: Array<{ exercise: { name: string; met: number }; minutes: number; calories: number; intensityMultiplier: number }>;
  unmatched: string[];
  totalMinutes: number;
  totalCalories: number;
};

export function ActualTrainingInputSection({
  text,
  parsed,
  actualCalories,
  minutes,
  weightLevel,
  inputStyle,
  onTextChange,
  onMinutesChange,
  onWeightLevelChange
}: {
  text: string;
  parsed: ParsedTrainingText;
  actualCalories: number;
  minutes: number;
  weightLevel: number;
  inputStyle: any;
  onTextChange: (text: string) => void;
  onMinutesChange: (minutes: number) => void;
  onWeightLevelChange: (weightLevel: number) => void;
}) {
  const c = useBentoTheme().colors;
  const displayMinutes = parsed.totalMinutes || minutes;
  const weightOptions = [
    { value: 1, label: "轻重量" },
    { value: 2, label: "中等重量" },
    { value: 3, label: "大重量" },
  ] as const;

  return (
    <View style={{ gap: 10 }}>
      <TextInput
        value={text}
        onChangeText={onTextChange}
        placeholder="例如：练胸 45 分钟，卧推、俯卧撑；或 跑步 30 分钟"
        placeholderTextColor={c.inkFaint}
        style={[inputStyle, { minHeight: 74, textAlignVertical: "top", paddingVertical: 12 }]}
        multiline
      />

      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        <Badge color="accent" size="sm">{`实际 ${Math.round(actualCalories)} kcal`}</Badge>
        <Badge color="accent2" size="sm">{`识别 ${parsed.matched.length} 个动作`}</Badge>
        <Badge color="positive" size="sm">{`时长 ${displayMinutes || 0} 分钟`}</Badge>
      </View>

      {parsed.matched.length > 0 ? (
        <View style={{ gap: 6 }}>
          {parsed.matched.map((item, index) => (
            <View
              key={`${item.exercise.name}-${index}`}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                paddingVertical: 7,
                paddingHorizontal: 9,
                borderRadius: 12,
                backgroundColor: `${c.accent}12`,
                borderWidth: 1,
                borderColor: `${c.accent}33`,
              }}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <BentoText weight="semibold" variant="caption" color={c.ink} numberOfLines={1}>
                  {item.exercise.name}
                </BentoText>
                <BentoText variant="micro" color={c.inkMute}>
                  {item.minutes} 分钟，作为动作消耗估算
                </BentoText>
              </View>
              <BentoText mono weight="bold" color={c.accent} style={{ fontSize: 12 }}>
                {item.calories} kcal
              </BentoText>
            </View>
          ))}
        </View>
      ) : text.trim() ? (
        <BentoText variant="caption" color={c.warn}>
          暂未识别到具体动作，会按填写的总时长估算动作消耗。建议写“动作 + 分钟”，不需要写组数。
        </BentoText>
      ) : null}

      {parsed.unmatched.length > 0 && parsed.matched.length > 0 ? (
        <BentoText variant="micro" color={c.inkMute}>
          未识别：{parsed.unmatched.join("、")}
        </BentoText>
      ) : null}

      <View style={{ flexDirection: "row", gap: 8 }}>
        <View style={{ flex: 1 }}>
          <LabeledInput
            label="实际分钟"
            keyboardType="numeric"
            value={String(minutes)}
            onChangeText={(value: string) => onMinutesChange(Number(value) || 0)}
          />
        </View>
      </View>

      <View style={{ gap: 6 }}>
        <BentoText variant="micro" color={c.inkMute}>重量</BentoText>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {weightOptions.map((option) => (
            <SelectChip
              key={option.value}
              label={option.label}
              active={weightLevel === option.value}
              color={weightLevel === option.value ? "accent" : "accent2"}
              size="sm"
              block
              onPress={() => onWeightLevelChange(option.value)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}
