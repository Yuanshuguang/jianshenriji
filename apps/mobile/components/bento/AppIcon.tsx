import Svg, { Circle, Path, Rect, Line } from "react-native-svg";
import type { SemanticColor } from "./tokens";
import { useBentoTheme } from "./ThemeProvider";

export type AppIconName =
  | "food"
  | "train"
  | "plan"
  | "more"
  | "calendar"
  | "chart"
  | "theme"
  | "type"
  | "bolt"
  | "settings"
  | "download"
  | "refresh"
  | "broom"
  | "x"
  | "trash"
  | "pencil"
  | "warn"
  | "share";

export type AppIconProps = {
  name: AppIconName;
  size?: number;
  color?: SemanticColor | string;
  strokeWidth?: number;
};

export function AppIcon({ name, size = 20, color, strokeWidth = 1.9 }: AppIconProps) {
  const { colors } = useBentoTheme();
  const resolvedColor = color ? (color in colors ? colors[color as SemanticColor] : color) : colors.accent;
  const common = {
    fill: "none",
    stroke: resolvedColor,
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (name === "calendar") {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Rect x="3" y="5" width="18" height="16" rx="4" {...common} />
        <Line x1="8" y1="3.5" x2="8" y2="7" {...common} />
        <Line x1="16" y1="3.5" x2="16" y2="7" {...common} />
        <Line x1="3" y1="9" x2="21" y2="9" {...common} />
        <Circle cx="9" cy="13.5" r="1.1" fill={resolvedColor} stroke="none" />
        <Circle cx="15" cy="13.5" r="1.1" fill={resolvedColor} stroke="none" />
      </Svg>
    );
  }

  if (name === "food") {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M4 6v12" {...common} />
        <Line x1="4" y1="6" x2="4" y2="9" {...common} />
        <Line x1="6" y1="6" x2="6" y2="9" {...common} />
        <Line x1="8" y1="6" x2="8" y2="9" {...common} />
        <Path d="M4 9c0 3 0 4 1.4 5.2 1.1.9 2.6 1.4 4.6 1.4 0 0 .8 0 1 .1V18c0 1.1.9 2 2 2s2-.9 2-2v-7.1c0-1.2.4-2.2 1.2-3.2.7-.9 1.2-1.6 1.2-2.8" {...common} />
      </Svg>
    );
  }

  if (name === "train") {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Rect x="9" y="8" width="6" height="8" rx="2" {...common} />
        <Line x1="6" y1="12" x2="9" y2="12" {...common} />
        <Line x1="15" y1="12" x2="18" y2="12" {...common} />
        <Line x1="5" y1="10" x2="5" y2="14" {...common} />
        <Line x1="19" y1="10" x2="19" y2="14" {...common} />
        <Line x1="9" y1="12" x2="7" y2="12" {...common} />
        <Line x1="15" y1="12" x2="17" y2="12" {...common} />
      </Svg>
    );
  }

  if (name === "plan") {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Rect x="4" y="5" width="16" height="15" rx="4" {...common} />
        <Line x1="4" y1="9" x2="20" y2="9" {...common} />
        <Line x1="9" y1="3.5" x2="9" y2="7" {...common} />
        <Line x1="15" y1="3.5" x2="15" y2="7" {...common} />
        <Line x1="8" y1="13" x2="16" y2="13" {...common} />
      </Svg>
    );
  }

  if (name === "chart") {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Line x1="4" y1="20" x2="20" y2="20" {...common} />
        <Rect x="6" y="12" width="3" height="8" rx="1" {...common} />
        <Rect x="11" y="8" width="3" height="12" rx="1" {...common} />
        <Rect x="16" y="4" width="3" height="16" rx="1" {...common} />
      </Svg>
    );
  }

  if (name === "theme") {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" {...common} />
        <Circle cx="9" cy="9" r="0.9" fill={resolvedColor} stroke="none" />
        <Circle cx="13" cy="6" r="0.9" fill={resolvedColor} stroke="none" />
        <Circle cx="6" cy="13" r="0.9" fill={resolvedColor} stroke="none" />
      </Svg>
    );
  }

  if (name === "type") {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M5 6h14" {...common} />
        <Path d="M12 6v14" {...common} />
        <Path d="M9 20h6" {...common} />
      </Svg>
    );
  }

  if (name === "bolt") {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" {...common} />
      </Svg>
    );
  }

  if (name === "settings") {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Circle cx="12" cy="12" r="3" {...common} />
        <Path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" {...common} />
      </Svg>
    );
  }

  if (name === "download") {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M12 3v12" {...common} />
        <Path d="m7 10 5 5 5-5" {...common} />
        <Path d="M5 21h14" {...common} />
      </Svg>
    );
  }

  if (name === "refresh") {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M21 12a9 9 0 1 1-3-6.7" {...common} />
        <Path d="M21 4v5h-5" {...common} />
      </Svg>
    );
  }

  if (name === "broom") {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M14 4 4 14l3 3L17 7Z" {...common} />
        <Path d="M5 21c2-2 4-2 6 0s4 2 6 0" {...common} />
      </Svg>
    );
  }

  if (name === "x") {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M6 6 18 18" {...common} />
        <Path d="M18 6 6 18" {...common} />
      </Svg>
    );
  }

  if (name === "trash") {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M4 7h16" {...common} />
        <Path d="M9 7V4h6v3" {...common} />
        <Path d="M6 7v13a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7" {...common} />
        <Path d="M10 11v6" {...common} />
        <Path d="M14 11v6" {...common} />
      </Svg>
    );
  }

  if (name === "pencil") {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M4 20h4l10-10-4-4L4 16Z" {...common} />
        <Path d="m13 6 4 4" {...common} />
      </Svg>
    );
  }

  if (name === "warn") {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M12 3 2 21h20L12 3Z" {...common} />
        <Line x1="12" y1="10" x2="12" y2="14" {...common} />
        <Circle cx="12" cy="17.5" r="0.9" fill={resolvedColor} stroke="none" />
      </Svg>
    );
  }

  if (name === "share") {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Circle cx="6" cy="12" r="2.5" {...common} />
        <Circle cx="18" cy="6" r="2.5" {...common} />
        <Circle cx="18" cy="18" r="2.5" {...common} />
        <Path d="m8 11 8-4" {...common} />
        <Path d="m8 13 8 4" {...common} />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="8" r="3.2" {...common} />
      <Path d="M5 20c.8-3.3 3.4-5.5 7-5.5s6.2 2.2 7 5.5" {...common} />
      <Circle cx="7" cy="12" r="1" fill={resolvedColor} stroke="none" />
      <Circle cx="12" cy="12" r="1" fill={resolvedColor} stroke="none" />
      <Circle cx="17" cy="12" r="1" fill={resolvedColor} stroke="none" />
    </Svg>
  );
}

export default AppIcon;
