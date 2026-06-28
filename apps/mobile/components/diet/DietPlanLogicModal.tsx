import { Modal, Pressable, ScrollView, View } from "react-native";
import {
  Badge,
  Button,
  Label,
  Text as BentoText,
  useBentoTheme,
} from "../bento";
import type { DietPlanSummary } from "./types";

export function DietPlanLogicModal({
  visible,
  summary,
  onClose,
}: {
  visible: boolean;
  summary: DietPlanSummary;
  onClose: () => void;
}) {
  const c = useBentoTheme().colors;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: c.scrim, justifyContent: "center", padding: 20 }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            alignSelf: "center",
            width: "100%",
            maxWidth: 420,
            maxHeight: "85%",
            borderRadius: 18,
            backgroundColor: c.bg,
            borderWidth: 1,
            borderColor: c.glassBorderBright,
            overflow: "hidden"
          }}
        >
          <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} style={{ width: "100%" }}>
            <View style={{ gap: 4 }}>
              <BentoText
                weight="bold"
                variant="caption"
                color={c.ink}
                style={{ flexShrink: 1, lineHeight: 18 }}
              >
                {summary.name} / {summary.status}
              </BentoText>
              <BentoText variant="micro" color={c.inkMute} style={{ flexShrink: 1, lineHeight: 16 }}>
                {summary.sourceLabel}
              </BentoText>
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {summary.macroLabel.split("·").map((part) => (
                <Badge key={part.trim()} color="accent" size="sm">{part.trim()}</Badge>
              ))}
            </View>
            <BentoText variant="caption" color={c.inkMute} style={{ lineHeight: 18 }}>
              {summary.logic}
            </BentoText>
            <View style={{ gap: 6 }}>
              <Label color={c.inkFaint} variant="micro">营养数据分配逻辑</Label>
              {summary.allocation.map((item) => (
                <BentoText key={item} variant="caption" color={c.ink} style={{ lineHeight: 18 }}>
                  {item}
                </BentoText>
              ))}
            </View>
            <Button variant="filled" color="accent" block onPress={onClose}>知道了</Button>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
