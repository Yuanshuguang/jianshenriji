import { Pressable, ScrollView, View, useWindowDimensions } from "react-native";
import { Text as BentoText, useBentoTheme, type SemanticColor } from "../bento";

export type WeekDateRailItem = {
  key: string;
  dateLabel: string;
  weekdayLabel: string;
  title?: string;
  subtitle?: string;
  active?: boolean;
  selected?: boolean;
  tone?: SemanticColor;
  onPress?: () => void;
};

export function WeekDateRail({ items }: { items: WeekDateRailItem[] }) {
  const c = useBentoTheme().colors;
  const { width } = useWindowDimensions();
  const itemWidth = Math.max(52, Math.min(58, Math.floor((width - 32 - 8 * 6) / 7)));

  return (
    <View
      style={{
        borderRadius: 22,
        paddingVertical: 6,
        paddingHorizontal: 8,
        backgroundColor: c.glass,
        borderWidth: 1,
        borderColor: c.glassBorder,
        overflow: "hidden",
      }}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: 2 }}
      >
        <View style={{ flexDirection: "row", gap: 6 }}>
          {items.map((item) => {
            const tone = item.tone ?? "accent";
            const active = Boolean(item.active);
            const selected = Boolean(item.selected);
            const content = (
              <View
                style={{
                  width: itemWidth,
                  height: 88,
                  borderRadius: 18,
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: 6,
                  paddingHorizontal: 4,
                  backgroundColor: active ? `${c[tone]}10` : "transparent",
                  borderWidth: selected ? 2 : 0,
                  borderColor: selected ? c[tone] : "transparent",
                }}
              >
                <BentoText
                  weight={active ? "bold" : "semibold"}
                  color={active ? c[tone] : selected ? c[tone] : c.inkMute}
                  style={{ fontSize: 12, lineHeight: 14, textAlign: "center" }}
                  numberOfLines={1}
                >
                  {item.weekdayLabel}
                </BentoText>

                <View
                  style={{
                    minWidth: active ? 52 : 48,
                    minHeight: active ? 42 : 36,
                    paddingHorizontal: active ? 12 : 10,
                    borderRadius: active ? 16 : 999,
                    backgroundColor: active ? c[tone] : `${c.ink}08`,
                    borderWidth: selected && !active ? 2 : 0,
                    borderColor: selected && !active ? c[tone] : "transparent",
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: active ? c[tone] : "#000",
                    shadowOpacity: active ? 0.2 : 0.06,
                    shadowRadius: active ? 10 : 4,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: active ? 2 : 0,
                  }}
                >
                  <BentoText
                    weight="bold"
                    color={active ? c.bg : c.ink}
                    style={{ fontSize: active ? 18 : 16, lineHeight: active ? 20 : 18 }}
                  >
                    {item.dateLabel}
                  </BentoText>
                </View>

                {item.title || item.subtitle ? (
                  <BentoText
                    weight={active ? "bold" : "semibold"}
                    color={active ? c[tone] : selected ? c[tone] : c.inkMute}
                    numberOfLines={1}
                    style={{ fontSize: active ? 10 : 9, lineHeight: 11, textAlign: "center" }}
                  >
                    {item.title ?? item.subtitle}
                  </BentoText>
                ) : null}
              </View>
            );
            return item.onPress ? (
              <Pressable
                key={item.key}
                onPress={item.onPress}
                style={({ pressed }) => ({
                  width: itemWidth,
                  opacity: pressed ? 0.84 : 1,
                })}
              >
                {content}
              </Pressable>
            ) : (
              <View key={item.key} style={{ width: itemWidth }}>
                {content}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

export default WeekDateRail;
