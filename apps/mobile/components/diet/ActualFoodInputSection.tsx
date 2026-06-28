import { useEffect, useState } from "react";
import { Modal, Pressable, TextInput, View } from "react-native";
import {
  Badge,
  Button,
  Label,
  Text as BentoText,
  useBentoTheme,
} from "../bento";
import type { Food, NutritionTotals } from "@fitness-calendar/shared";
import { getInputStyle, getRecordInputStyle } from "./CommonComponents";
import type { FoodTagEdit } from "./types";

export function ActualFoodInputSection({
  text,
  onTextChange,
  matched,
  unmatched,
  actualIntakeCalories,
  intakeDiff,
  intakeDiffLabel,
  actualGap,
  foodTagEdits,
  onEditTag,
}: {
  text: string;
  onTextChange: (text: string) => void;
  matched: Array<{ food: Food; grams: number; quantity?: number; unit?: string; displayAmount?: string; confidence?: number; needsDetails?: boolean; detailHint?: string }>;
  unmatched: string[];
  actualIntakeCalories: number;
  intakeDiff: number;
  intakeDiffLabel: string;
  actualGap: NutritionTotals;
  foodTagEdits: Record<string, { hidden?: boolean; label?: string; calories?: number }>;
  onEditTag: (key: string, label: string, calories: string) => void;
}) {
  const c = useBentoTheme().colors;
  return (
    <View style={{ gap: 8 }}>
      <TextInput
        multiline
        value={text}
        onChangeText={onTextChange}
        placeholder="一碗面 两棵拳头大的西红柿"
        placeholderTextColor={c.inkFaint}
        style={getRecordInputStyle(c)}
      />
      {matched.length > 0 ? (
        <View style={{ gap: 6, paddingTop: 4, borderTopWidth: 1, borderTopColor: c.glassBorder }}>
          <Label color={c.inkMute} variant="label">
            {`识别结果 ${matched.length} 项${unmatched.length > 0 ? " · " + unmatched.length + " 项待补充" : ""}`}
          </Label>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {matched.map((item, index) => {
              const key = `${item.food.id}-${index}`;
              const edit = foodTagEdits[key];
              if (edit?.hidden) return null;
              const label = edit?.label ?? `${item.food.name} ${item.displayAmount ?? (item.quantity ? `${item.quantity}${item.unit ?? ""}` : `${Math.round(item.grams)}g`)}`;
              const calories = edit?.calories ?? Math.round((item.grams * item.food.caloriesPer100g) / 100);
              const needsDetails = item.needsDetails && !edit;
              return (
                <Pressable key={key} onPress={() => onEditTag(key, label, String(calories))}>
                  <Badge color="accent" size="sm">
                    {`${label} ${calories} kcal`}
                    {needsDetails ? (
                      <BentoText weight="bold" color={c.warn} style={{ fontSize: 10 }}>
                        {" ?"}
                      </BentoText>
                    ) : null}
                  </Badge>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : unmatched.length > 0 ? (
        <BentoText variant="caption" color={c.warn}>未识别：{unmatched.join("、")}</BentoText>
      ) : null}
    </View>
  );
}

export function FoodTagEditorModal({
  edit,
  onClose,
  onSave,
  onDelete,
}: {
  edit: FoodTagEdit | null;
  onClose: () => void;
  onSave: (next: FoodTagEdit) => void;
  onDelete: (key: string) => void;
}) {
  const c = useBentoTheme().colors;
  const [label, setLabel] = useState(edit?.label ?? "");
  const [calories, setCalories] = useState(edit?.calories ?? "");

  useEffect(() => {
    if (!edit) return;
    setLabel(edit.label);
    setCalories(edit.calories);
  }, [edit]);

  if (!edit) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: c.scrim, justifyContent: "center", padding: 20 }}>
        <Pressable onPress={(e) => e.stopPropagation()} style={{ borderRadius: 18, backgroundColor: c.bg, borderWidth: 1, borderColor: c.glassBorderBright, padding: 16, gap: 10 }}>
          <BentoText weight="bold" variant="caption" color={c.ink}>编辑识别标签</BentoText>
          <TextInput value={label} onChangeText={setLabel} placeholder="标签文本" placeholderTextColor={c.inkFaint} style={getInputStyle(c)} />
          <TextInput value={calories} onChangeText={setCalories} keyboardType="numeric" placeholder="热量 kcal" placeholderTextColor={c.inkFaint} style={getInputStyle(c)} />
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button variant="glass" color="warn" block onPress={() => onDelete(edit.key)}>删除标签</Button>
            <Button variant="filled" color="accent" block onPress={() => onSave({ key: edit.key, label, calories })}>保存更正</Button>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
