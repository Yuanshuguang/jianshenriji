import { Image, Pressable, View } from "react-native";
import { Text as BentoText, useBentoTheme } from "../../components/bento";
import type { LibraryExercise } from "./LibraryBodyPartTab";

export function LibraryExerciseCard({
  item,
  active,
  thumbUri,
  onPress,
  onLongPress
}: {
  item: LibraryExercise;
  active: boolean;
  thumbUri?: string;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const c = useBentoTheme().colors;
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
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
          {active ? "已加" : "讲解"}
        </BentoText>
      </View>
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
