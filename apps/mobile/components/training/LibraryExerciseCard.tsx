import { Image, Pressable, View } from "react-native";
import { useRef } from "react";
import { Text as BentoText, useBentoTheme } from "../../components/bento";
import { exerciseCardActionA11yLabel } from "../../features/exercise-library-actions";
import type { LibraryExercise } from "./LibraryBodyPartTab";

export function LibraryExerciseCard({
  item,
  active,
  favorite = false,
  pinned = false,
  bottom = false,
  thumbUri,
  onPress,
  onLongPress,
  onActionPress,
}: {
  item: LibraryExercise;
  active: boolean;
  favorite?: boolean;
  pinned?: boolean;
  bottom?: boolean;
  thumbUri?: string;
  onPress: () => void;
  onLongPress: (anchor: { x: number; y: number; width: number; height: number }) => void;
  onActionPress?: (anchor: { x: number; y: number; width: number; height: number }) => void;
}) {
  const c = useBentoTheme().colors;
  const actionButtonRef = useRef<any>(null);

  const emitActionAnchor = () => {
    if (!onActionPress) return;
    const node = actionButtonRef.current;
    if (!node) return;
    const report = (x: number, y: number, width: number, height: number) => onActionPress({ x, y, width, height });
    if (typeof node.measureInWindow === "function") {
      node.measureInWindow(report);
      return;
    }
    if (typeof node.measure === "function") {
      node.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
        report(pageX ?? x, pageY ?? y, width, height);
      });
    }
  };

  const emitLongPressAnchor = () => {
    if (!onLongPress) return;
    const node = actionButtonRef.current;
    if (!node) return;
    const report = (x: number, y: number, width: number, height: number) => onLongPress({ x, y, width, height });
    if (typeof node.measureInWindow === "function") {
      node.measureInWindow(report);
      return;
    }
    if (typeof node.measure === "function") {
      node.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
        report(pageX ?? x, pageY ?? y, width, height);
      });
    }
  };
  return (
    <Pressable
      onPress={onPress}
      onLongPress={emitLongPressAnchor}
      delayLongPress={360}
      style={({ pressed }) => ({
        width: "47%",
        minHeight: 166,
        borderRadius: 16,
        padding: 10,
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: active ? c.glassRaised : c.glass,
        borderWidth: active ? 1 : 0,
        borderColor: c.positive,
        opacity: pressed ? 0.78 : 1
      })}
    >
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          minWidth: 40,
          height: 28,
          paddingHorizontal: 8,
          borderTopLeftRadius: 16,
          borderBottomRightRadius: 8,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: active ? c.accent2 : c.positive
        }}
      >
        <BentoText weight="bold" variant="micro" style={{ color: c.bg }}>
          {active ? "已加" : "动作"}
        </BentoText>
      </View>
      {(favorite || pinned || bottom) ? (
        <View style={{ position: "absolute", top: 8, right: onActionPress ? 36 : 8, flexDirection: "row", gap: 4 }}>
          {favorite ? <StatusDot label="藏" color={c.amber} /> : null}
          {pinned ? <StatusDot label="顶" color={c.positive} /> : null}
          {bottom ? <StatusDot label="底" color={c.inkMute} /> : null}
        </View>
      ) : null}
      {onActionPress ? (
        <Pressable
          ref={actionButtonRef}
          accessibilityRole="button"
          accessibilityLabel={exerciseCardActionA11yLabel}
          onPress={(event) => {
            event.stopPropagation();
            emitActionAnchor();
          }}
          hitSlop={8}
          style={({ pressed }) => ({
            position: "absolute",
            top: 7,
            right: 7,
            minWidth: 40,
            height: 26,
            paddingHorizontal: 8,
            borderRadius: 999,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: c.bg,
            borderWidth: 1,
            borderColor: c.glassBorderBright,
            opacity: pressed ? 0.72 : 1,
          })}
        >
          <BentoText weight="bold" color={c.ink} style={{ fontSize: 11, lineHeight: 13 }}>操作</BentoText>
        </Pressable>
      ) : null}
      <View
        style={{
          width: 76,
          height: 76,
          marginTop: 12,
          borderRadius: 38,
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: `${c.ink}E8`
        }}
      >
        {thumbUri ? (
          <Image source={{ uri: thumbUri }} resizeMode="cover" style={{ width: 76, height: 76 }} />
        ) : (
          <BentoText variant="micro" color={c.inkFaint}>GIF</BentoText>
        )}
      </View>
      <BentoText weight="medium" style={{ color: c.ink, fontSize: 14, textAlign: "center", lineHeight: 19 }} numberOfLines={2}>
        {item.displayName}
      </BentoText>
    </Pressable>
  );
}

function StatusDot({ label, color }: { label: string; color: string }) {
  const c = useBentoTheme().colors;
  return (
    <View
      style={{
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: color
      }}
    >
      <BentoText weight="bold" color={c.bg} style={{ fontSize: 11, lineHeight: 13 }}>
        {label}
      </BentoText>
    </View>
  );
}
