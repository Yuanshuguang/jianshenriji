import { View } from "react-native";
import { type SemanticColor } from "./tokens";
import { useBentoTheme } from "./ThemeProvider";
import { Badge } from "./Badge";
import { GlassTile } from "./GlassTile";
import { Text as BentoText } from "./Text";
import type { PetReminder } from "../../features/pet";

type PetReminderCardProps = {
  reminder: PetReminder | null;
  /** 紧凑模式：放在页面顶部时用 */
  compact?: boolean;
};

const toneColorKeys: Record<PetReminder["tone"], SemanticColor> = {
  info: "accent",
  warn: "warn",
  praise: "positive",
  cheer: "accent2"
};

const toneLabels: Record<PetReminder["tone"], string> = {
  info: "提示",
  warn: "提醒",
  praise: "表扬",
  cheer: "加油"
};

/**
 * 宠物提醒气泡卡
 * 在饮食页和训练页顶部展示宠物的提醒
 */
export function PetReminderCard({ reminder, compact = true }: PetReminderCardProps) {
  const { colors } = useBentoTheme();
  if (!reminder) return null;

  const accent = colors[toneColorKeys[reminder.tone]];

  return (
    <GlassTile glow={reminder.tone === "warn" ? "amber" : undefined} padding={compact ? 12 : 14} style={{ gap: 6 }}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
        {/* 宠物头像 */}
        <View
          style={{
            width: compact ? 44 : 52,
            height: compact ? 44 : 52,
            borderRadius: compact ? 22 : 26,
            backgroundColor: `${accent}1a`,
            borderWidth: 1.5,
            borderColor: accent,
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }}
        >
          <BentoText style={{ fontSize: compact ? 22 : 26, lineHeight: compact ? 26 : 30 }}>
            {reminder.emoji}
          </BentoText>
        </View>
        <View style={{ flex: 1, gap: 4, minWidth: 0 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <BentoText weight="bold" variant="caption" color={accent}>
              {reminder.title}
            </BentoText>
            <Badge color={reminder.tone === "warn" ? "warn" : reminder.tone === "praise" ? "positive" : "accent"} size="sm">
              {toneLabels[reminder.tone]}
            </Badge>
          </View>
          <BentoText variant="micro" color={colors.inkMute} style={{ lineHeight: 1.6 }}>
            {reminder.body}
          </BentoText>
        </View>
      </View>
    </GlassTile>
  );
}
