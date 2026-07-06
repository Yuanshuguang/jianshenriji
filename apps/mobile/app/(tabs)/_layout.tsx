import { Tabs } from "expo-router";
import { BentoTabBar, type TabItem } from "../../components/bento";

type TabBarProps = {
  state: {
    index: number;
    routes: Array<{
      key: string;
      name: string;
    }>;
  };
  navigation: {
    emit: (event: { type: "tabPress"; target?: string; canPreventDefault: true }) => { defaultPrevented?: boolean };
    navigate: (name: string) => void;
  };
};

const tabItems: TabItem[] = [
  { key: "index", label: "饮食", icon: "food" },
  { key: "train", label: "训练", icon: "train" },
  { key: "atonement", label: "赎罪", icon: "bolt" },
  { key: "plan", label: "计划", icon: "plan" },
  { key: "more", label: "我的", icon: "more" },
];

function BottomTabBar({ state, navigation }: TabBarProps) {
  const activeRouteName = state.routes[state.index]?.name;
  const activeIndex = Math.max(0, tabItems.findIndex((item) => item.key === activeRouteName));

  return (
    <BentoTabBar
      items={tabItems}
      activeIndex={activeIndex}
      onPress={(index) => {
        const item = tabItems[index];
        const route = state.routes.find((entry) => entry.name === item?.key);
        if (!route) return;
        const event = navigation.emit({
          type: "tabPress",
          target: route.key,
          canPreventDefault: true,
        });
        if (activeRouteName !== route.name && !event.defaultPrevented) {
          navigation.navigate(route.name);
        }
      }}
    />
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomTabBar state={props.state} navigation={props.navigation} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "饮食" }} />
      <Tabs.Screen name="train" options={{ title: "训练" }} />
      <Tabs.Screen name="atonement" options={{ title: "赎罪" }} />
      <Tabs.Screen name="plan" options={{ title: "计划" }} />
      <Tabs.Screen name="calendar" options={{ title: "日历", href: null }} />
      <Tabs.Screen name="more" options={{ title: "我的" }} />
    </Tabs>
  );
}
