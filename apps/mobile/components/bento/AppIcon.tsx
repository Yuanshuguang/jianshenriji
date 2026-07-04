/**
 * AppIcon — Lucide 图标映射层
 * 所有图标来自 lucide-react-native（ISC 许可证），保持原有 props 接口不变
 */
import {
  Utensils,
  Dumbbell,
  CalendarDays,
  MoreHorizontal,
  Calendar,
  BarChart3,
  Moon,
  Type,
  Zap,
  Settings,
  Download,
  RefreshCw,
  Brush,
  X,
  Trash2,
  Pencil,
  TriangleAlert,
  Share2,
  UserRound,
  ChevronRight,
  ChevronDown,
  Inbox,
  Loader,
  Check,
} from "lucide-react-native";
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
  | "share"
  | "body"
  | "chevronRight"
  | "chevronDown"
  | "inbox"
  | "loader"
  | "check";

export type AppIconProps = {
  name: AppIconName;
  size?: number;
  color?: SemanticColor | string;
  strokeWidth?: number;
};

/** 图标名 → Lucide 组件映射 */
const iconMap: Record<AppIconName, React.ComponentType<any>> = {
  food: Utensils,
  train: Dumbbell,
  plan: CalendarDays,
  more: MoreHorizontal,
  calendar: Calendar,
  chart: BarChart3,
  theme: Moon,
  type: Type,
  bolt: Zap,
  settings: Settings,
  download: Download,
  refresh: RefreshCw,
  broom: Brush,
  x: X,
  trash: Trash2,
  pencil: Pencil,
  warn: TriangleAlert,
  share: Share2,
  body: UserRound,
  chevronRight: ChevronRight,
  chevronDown: ChevronDown,
  inbox: Inbox,
  loader: Loader,
  check: Check,
};

export function AppIcon({ name, size = 20, color, strokeWidth = 1.9 }: AppIconProps) {
  const { colors } = useBentoTheme();
  const resolvedColor = color ? (color in colors ? colors[color as SemanticColor] : color) : colors.accent;
  const LucideIcon = iconMap[name] ?? iconMap.more;

  return (
    <LucideIcon
      size={size}
      color={resolvedColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

export default AppIcon;
