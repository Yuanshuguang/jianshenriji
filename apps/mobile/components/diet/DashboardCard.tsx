import { View } from "react-native";
import Svg, { Polygon } from "react-native-svg";
import {
  Text as BentoText,
  useBentoTheme,
  MetricBarWithCursor,
} from "../bento";


// 顶部小图例：游标含义 + 条颜色含义
export function DashboardLegend() {
  const c = useBentoTheme().colors;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginLeft: "auto" }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <Svg width={8} height={6} viewBox="0 0 8 6">
          <Polygon points="0,0 8,0 4,6" fill={c.accent} />
        </Svg>
        <BentoText variant="micro" color={c.inkMute}>实际</BentoText>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <View style={{ width: 12, height: 4, borderRadius: 2, backgroundColor: c.accent }} />
        <BentoText variant="micro" color={c.inkMute}>未达/已达成</BentoText>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <View style={{ width: 12, height: 4, borderRadius: 2, backgroundColor: c.amber }} />
        <BentoText variant="micro" color={c.inkMute}>超额</BentoText>
      </View>
    </View>
  );
}

