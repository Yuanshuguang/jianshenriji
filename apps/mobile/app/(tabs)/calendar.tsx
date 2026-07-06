import { ScrollView } from "react-native";
import { CalendarHistoryPanel } from "../../components/CalendarHistoryPanel";
import { Screen, ScreenHeader } from "../../components/bento";

export default function CalendarScreen() {
  return (
    <Screen>
      <ScreenHeader kicker="日历 · 历史回溯" title="" />
      <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 40 }}>
        <CalendarHistoryPanel />
      </ScrollView>
    </Screen>
  );
}
