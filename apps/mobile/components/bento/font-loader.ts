/**
 * Font Loading · 字体加载框架
 *
 * 策略 3：系统回退 + Barlow
 * - 拉丁/数字 → Barlow + Barlow Condensed（打包，品牌辨识度）
 * - 中文 → 系统字体回退（iOS=PingFang SC / Android=厂商字体），零包体积
 *
 * 注意：CJK 字体不打包，使用平台系统字体（零体积）。
 * 中国用户每天在微信/支付宝/抖音看到的正是这些系统字体。
 *
 * 优雅降级：如果 Barlow 字体文件不存在，APP 直接使用系统字体，
 * 所有功能不受影响，只是拉丁字符使用系统默认 sans-serif。
 */
import { useFonts } from "expo-font";
import { Platform } from "react-native";

/**
 * 构建字体映射表。
 * Web 平台跳过 require() —— Metro 在 Web 模式下无法解析 .ttf 资源的 require。
 * Native 平台如果有字体文件则加载，否则返回空表让 useFonts 跳过。
 */
function buildFontMap(): Record<string, string> {
  // Web 平台：不加载本地字体文件，使用 CSS @import 或系统字体
  if (Platform.OS === "web") {
    return {};
  }

  try {
    return {
      Barlow: require("../../assets/fonts/Barlow-Regular.ttf"),
      "Barlow-Medium": require("../../assets/fonts/Barlow-Medium.ttf"),
      "Barlow-SemiBold": require("../../assets/fonts/Barlow-SemiBold.ttf"),
      "Barlow-Bold": require("../../assets/fonts/Barlow-Bold.ttf"),
      "Barlow Condensed": require("../../assets/fonts/BarlowCondensed-Regular.ttf"),
      "Barlow Condensed-Medium": require("../../assets/fonts/BarlowCondensed-Medium.ttf"),
      "Barlow Condensed-Bold": require("../../assets/fonts/BarlowCondensed-Bold.ttf"),
    };
  } catch {
    // 字体文件尚未下载，使用系统回退字体
    return {};
  }
}

/**
 * 在 RootLayout 中调用此 hook，APP 启动时加载所有字体。
 * 返回 [fontsLoaded, fontError] —— fontsLoaded=true 时可渲染 UI。
 *
 * 如果字体文件不存在，hook 仍返回 [true, null]，APP 正常启动。
 */
export function useAppFonts() {
  return useFonts(buildFontMap());
}
