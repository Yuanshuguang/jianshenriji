import { exercises } from "@fitness-calendar/shared";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, View } from "react-native";
import { EmptyState, LoadingState, SkeletonCard } from "../../components/shared/EmptyState";
import {
  Badge,
  GlassTile,
  Label,
  Screen,
  ScreenHeader,
  Text as BentoText,
  useBentoTheme,
} from "../../components/bento";
import { LibraryBodyPartTab } from "../../components/training/LibraryBodyPartTab";
import { LibraryEquipmentChip } from "../../components/training/LibraryEquipmentChip";
import { LibraryExerciseCard } from "../../components/training/LibraryExerciseCard";
import {
  normalizeWorkoutXExercises,
  loadSupplementalExerciseDataset,
  normalizeSupplementalExercises,
  mergeExerciseLibraries,
  buildLocalExerciseFallback,
  buildCustomTrainingExercise,
  equipmentRank,
} from "../../components/training/training-utils";
import { useFitnessStore, type ExerciseLibraryPreferences } from "../../store/fitness-store";
import type { LibraryExercise, WorkoutXListResponse } from "../../types/training";

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";
const exerciseLibraryProxyUrl = apiBaseUrl ? `${apiBaseUrl.replace(/\/$/, "")}/api/exercises` : "";
const exerciseLibraryBaseUrl = exerciseLibraryProxyUrl;

const bodyPartOrder = ["Chest", "Back", "Upper Arms", "Lower Arms", "Shoulders", "Waist", "Upper Legs", "Lower Legs", "Cardio", "Neck"] as const;
const favoriteBodyPartKey = "favorites";
const bodyPartLabels: Record<string, string> = {
  Chest: "胸",
  Back: "背",
  Shoulders: "肩",
  "Upper Arms": "上臂",
  "Lower Arms": "前臂",
  Waist: "核心",
  "Upper Legs": "大腿",
  "Lower Legs": "小腿",
  Cardio: "有氧",
  Neck: "颈部"
};

const equipmentPriority = ["Barbell", "Dumbbell", "Kettlebell", "Cable", "Machine", "Leverage Machine", "Body Weight", "Assisted", "Band"] as const;
const equipmentLabels: Record<string, string> = {
  Barbell: "杠铃",
  Dumbbell: "哑铃",
  Kettlebell: "壶铃",
  Cable: "绳索",
  Machine: "器械",
  "Leverage Machine": "器械",
  "Body Weight": "徒手",
  Assisted: "辅助",
  Band: "弹力带"
};

const extendedEquipmentLabels: Record<string, string> = {
  "medicine ball": "药球",
  "stability ball": "健身球",
  rope: "绳索",
  "ez barbell": "曲杆杠铃",
  "sled machine": "雪橇机",
  "upper body ergometer": "上肢功率车",
  "olympic barbell": "奥杆",
  weighted: "负重",
  "bosu ball": "半圆平衡球",
  roller: "滚轴",
  "skierg machine": "滑雪机",
  hammer: "锤",
  "smith machine": "史密斯机",
  "wheel roller": "健腹轮",
  "stationary bike": "动感单车",
  tire: "轮胎",
  "trap bar": "六角杠",
  "elliptical machine": "椭圆机",
  "stepmill machine": "登阶机"
};

function getEquipmentLabel(equipment: string | null | undefined) {
  if (!equipment) return null;
  return equipmentLabels[equipment] ?? extendedEquipmentLabels[equipment.toLowerCase()] ?? equipment;
}

export default function ExerciseLibraryScreen() {
  const router = useRouter();
  const c = useBentoTheme().colors;
  const todayTrainingPlan = useFitnessStore((state) => state.todayTrainingPlan);
  const setTodayTrainingPlan = useFitnessStore((state) => state.setTodayTrainingPlan);
  const exerciseLibraryPreferences = useFitnessStore((state) => state.exerciseLibraryPreferences);
  const toggleFavoriteExercise = useFitnessStore((state) => state.toggleFavoriteExercise);
  const pinExerciseToTop = useFitnessStore((state) => state.pinExerciseToTop);
  const pinExerciseToBottom = useFitnessStore((state) => state.pinExerciseToBottom);

  const [libraryItems, setLibraryItems] = useState<LibraryExercise[]>([]);
  const [supplementalLibraryItems, setSupplementalLibraryItems] = useState<LibraryExercise[]>([]);
  const [libraryTotal, setLibraryTotal] = useState(0);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [supplementalLibraryLoading, setSupplementalLibraryLoading] = useState(false);
  const [supplementalLibraryReady, setSupplementalLibraryReady] = useState(false);
  const [libraryError, setLibraryError] = useState("");
  const [selectedLibraryEquipment, setSelectedLibraryEquipment] = useState("all");
  const [selectedLibraryBodyPart, setSelectedLibraryBodyPart] = useState("Chest");
  const [selectedLibraryExercise, setSelectedLibraryExercise] = useState<LibraryExercise | null>(null);
  const [actionExercise, setActionExercise] = useState<LibraryExercise | null>(null);
  const [libraryThumbUris, setLibraryThumbUris] = useState<Record<string, string>>({});
  const [libraryVisibleLimit, setLibraryVisibleLimit] = useState(24);

  const customTrainingExercises = todayTrainingPlan.customExercises ?? [];

  const combinedLibraryItems = useMemo(
    () => mergeExerciseLibraries(libraryItems, supplementalLibraryItems),
    [libraryItems, supplementalLibraryItems]
  );
  const libraryBodyParts = useMemo(() => {
    const dynamicParts = combinedLibraryItems.map((item) => item.bodyPart).filter(Boolean) as string[];
    return Array.from(new Set([favoriteBodyPartKey, ...bodyPartOrder, ...dynamicParts]));
  }, [combinedLibraryItems]);
  const libraryEquipmentOptions = useMemo(() => {
    const dynamicEquipment = combinedLibraryItems.map((item) => item.equipment).filter(Boolean) as string[];
    const ordered = equipmentPriority.filter((item) => dynamicEquipment.includes(item));
    const rest = dynamicEquipment.filter((item) => !ordered.includes(item as typeof equipmentPriority[number]));
    return Array.from(new Set([...ordered, ...rest]));
  }, [combinedLibraryItems]);
  const filteredLibraryItems = useMemo(() => {
    return combinedLibraryItems
      .filter((item) => {
        if (selectedLibraryBodyPart === favoriteBodyPartKey) {
          return exerciseLibraryPreferences.favoriteExerciseIds.includes(item.id);
        }
        return selectedLibraryBodyPart === "all" || item.bodyPart === selectedLibraryBodyPart;
      })
      .filter((item) => selectedLibraryEquipment === "all" || item.equipment === selectedLibraryEquipment)
      .sort((left, right) => getLibrarySortRank(left.id, exerciseLibraryPreferences) - getLibrarySortRank(right.id, exerciseLibraryPreferences));
  }, [combinedLibraryItems, selectedLibraryBodyPart, selectedLibraryEquipment, exerciseLibraryPreferences]);
  const groupedLibraryItems = useMemo(() => {
    const grouped: Array<{ title: string; items: LibraryExercise[] }> = [];
    filteredLibraryItems.slice(0, libraryVisibleLimit).forEach((item) => {
      const title = item.equipment ?? "其他";
      const existing = grouped.find((group) => group.title === title);
      if (existing) existing.items.push(item);
      else grouped.push({ title, items: [item] });
    });
    return grouped.sort((left, right) => equipmentRank(left.title) - equipmentRank(right.title));
  }, [filteredLibraryItems, libraryVisibleLimit]);

  useEffect(() => {
    setLibraryVisibleLimit(24);
  }, [selectedLibraryBodyPart, selectedLibraryEquipment]);

  const loadLibraryPage = useCallback((bodyPart: string, offset: number, append: boolean) => {
    setLibraryLoading(true);
    if (!exerciseLibraryProxyUrl) {
      setLibraryItems(buildLocalExerciseFallback());
      setLibraryTotal(exercises.length);
      setLibraryError("缺少 WorkoutX API key，已显示 APP 本地动作兜底。");
      setLibraryLoading(false);
      return;
    }
    const query = new URLSearchParams({ offset: String(offset) });
    if (bodyPart !== "all") query.set("bodyPart", bodyPart);
    fetch(`${exerciseLibraryBaseUrl}?${query.toString()}`)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<WorkoutXListResponse>;
      })
      .then((payload) => {
        const items = normalizeWorkoutXExercises(payload.data ?? payload.results ?? []);
        setLibraryTotal(payload.total ?? items.length);
        setLibraryItems((current) => append ? [...current, ...items] : items);
        setLibraryError("");
      })
      .catch(() => {
        setLibraryItems(buildLocalExerciseFallback());
        setLibraryTotal(exercises.length);
        setLibraryError("WorkoutX 动作库暂时无法加载，已显示 APP 本地动作兜底。");
      })
      .finally(() => setLibraryLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setSupplementalLibraryLoading(true);
    setSupplementalLibraryReady(false);
    loadSupplementalExerciseDataset()
      .then((payload) => {
        if (cancelled) return;
        setSupplementalLibraryItems(normalizeSupplementalExercises(payload));
      })
      .catch(() => {
        if (!cancelled) setLibraryError((current) => current || "本地补充 GIF 动作库暂时无法加载。");
      })
      .finally(() => {
        if (!cancelled) {
          setSupplementalLibraryLoading(false);
          setSupplementalLibraryReady(true);
        }
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    setSelectedLibraryEquipment("all");
    if (!supplementalLibraryReady) return;
    if (supplementalLibraryItems.length > 0) {
      setLibraryItems([]);
      setLibraryTotal(supplementalLibraryItems.length);
      setLibraryLoading(false);
      return;
    }
    loadLibraryPage(selectedLibraryBodyPart, 0, false);
  }, [loadLibraryPage, selectedLibraryBodyPart, supplementalLibraryItems.length, supplementalLibraryReady]);

  useEffect(() => {
    const previewItems = filteredLibraryItems.slice(0, libraryVisibleLimit).filter((item) => item.gifUrl);
    setLibraryThumbUris(
      previewItems.reduce<Record<string, string>>((result, item) => {
        if (item.gifUrl) result[item.id] = item.gifUrl;
        return result;
      }, {})
    );
  }, [filteredLibraryItems, libraryVisibleLimit]);

  const isExerciseInTodayPlan = (item: LibraryExercise) => {
    const customExerciseId = `custom-${item.source}-${item.sourceId}`;
    return customTrainingExercises.some((exercise) => exercise.id === customExerciseId);
  };

  const toggleLibraryExerciseInPlan = (item: LibraryExercise) => {
    const customExercise = buildCustomTrainingExercise(item);
    if (customTrainingExercises.some((exercise) => exercise.id === customExercise.id)) {
      setTodayTrainingPlan({
        ...todayTrainingPlan,
        customExercises: customTrainingExercises.filter((exercise) => exercise.id !== customExercise.id)
      });
      return;
    }

    setTodayTrainingPlan({
      ...todayTrainingPlan,
      customExercises: [
        ...customTrainingExercises,
        customExercise
      ]
    });
  };

  const openExerciseActions = (item: LibraryExercise) => {
    setActionExercise(item);
    setSelectedLibraryExercise(item);
  };

  const closeExerciseActions = () => setActionExercise(null);

  const isFavoriteExercise = (item: LibraryExercise) => exerciseLibraryPreferences.favoriteExerciseIds.includes(item.id);
  const isPinnedExercise = (item: LibraryExercise) => exerciseLibraryPreferences.pinnedExerciseIds.includes(item.id);
  const isBottomExercise = (item: LibraryExercise) => exerciseLibraryPreferences.bottomExerciseIds.includes(item.id);

  return (
    <Screen>
      <ScreenHeader
        kicker="动作库"
        title="浏览动作"
        subtitle="单击动作看讲解，点卡片右上角或长按可收藏、置顶、加入今日参考。"
        badge={{ text: `${combinedLibraryItems.length} 项`, color: "accent2" }}
      />

      {selectedLibraryExercise ? (
        <GlassTile glow="accent2" style={{ gap: 10 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Label color={c.inkMute} variant="label">动作讲解</Label>
              <BentoText weight="bold" style={{ color: c.ink, fontSize: 16 }} numberOfLines={2}>
                {selectedLibraryExercise.displayName}
              </BentoText>
              <BentoText variant="micro" style={{ color: c.inkMute }} numberOfLines={1}>
                {[
                  getEquipmentLabel(selectedLibraryExercise.equipment),
                  selectedLibraryExercise.bodyPart ? bodyPartLabels[selectedLibraryExercise.bodyPart] ?? selectedLibraryExercise.bodyPart : null
                ].filter(Boolean).join(" / ") || "动作库"}
              </BentoText>
            </View>
            <Badge color={isExerciseInTodayPlan(selectedLibraryExercise) ? "accent2" : "positive"} size="sm">
              {isExerciseInTodayPlan(selectedLibraryExercise) ? "已加入" : "长按加入"}
            </Badge>
          </View>
          {selectedLibraryExercise.gifUrl ? (
            <Image
              source={{ uri: selectedLibraryExercise.gifUrl }}
              resizeMode="contain"
              style={{ width: "100%", height: 180, borderRadius: 14, backgroundColor: `${c.ink}10` }}
            />
          ) : null}
          {selectedLibraryExercise.instructions?.length ? (
            <View style={{ gap: 6 }}>
              {selectedLibraryExercise.instructions.slice(0, 4).map((step, index) => (
                <BentoText key={`${selectedLibraryExercise.id}-step-${index}`} variant="micro" color={c.inkMute} style={{ lineHeight: 18 }}>
                  {index + 1}. {step}
                </BentoText>
              ))}
            </View>
          ) : (
            <BentoText variant="micro" color={c.inkMute}>
              暂无文字步骤，先参考动作 GIF。长按动作卡片可加入或取消今日参考。
            </BentoText>
          )}
          {customTrainingExercises.length > 0 ? (
            <View style={{ paddingTop: 6, borderTopWidth: 1, borderTopColor: c.glassBorder }}>
              <BentoText variant="micro" color={c.inkMute}>
                今日已选 {customTrainingExercises.length} 个：{customTrainingExercises.map((exercise) => exercise.name).join("、")}
              </BentoText>
            </View>
          ) : null}
        </GlassTile>
      ) : null}

      {actionExercise ? (
        <GlassTile glow="positive" style={{ gap: 10 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Label color={c.inkMute} variant="label">动作操作</Label>
              <BentoText weight="bold" color={c.ink} numberOfLines={1}>
                {actionExercise.displayName}
              </BentoText>
            </View>
            <Pressable
              onPress={closeExerciseActions}
              style={({ pressed }) => ({
                width: 34,
                height: 34,
                borderRadius: 17,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: c.bg,
                opacity: pressed ? 0.76 : 1
              })}
            >
              <BentoText weight="bold" color={c.inkMute}>×</BentoText>
            </Pressable>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <ActionPill
              label={isFavoriteExercise(actionExercise) ? "取消收藏" : "收藏"}
              onPress={() => {
                toggleFavoriteExercise(actionExercise.id);
                closeExerciseActions();
              }}
            />
            <ActionPill
              label={isPinnedExercise(actionExercise) ? "已置顶" : "置顶"}
              onPress={() => {
                pinExerciseToTop(actionExercise.id);
                closeExerciseActions();
              }}
            />
            <ActionPill
              label={isBottomExercise(actionExercise) ? "已置底" : "置底"}
              onPress={() => {
                pinExerciseToBottom(actionExercise.id);
                closeExerciseActions();
              }}
            />
            <ActionPill
              label={isExerciseInTodayPlan(actionExercise) ? "取消今日参考" : "加入今日参考"}
              onPress={() => {
                toggleLibraryExerciseInPlan(actionExercise);
                closeExerciseActions();
              }}
            />
          </View>
        </GlassTile>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 8 }}>
        <LibraryEquipmentChip
          label="置顶"
          active={selectedLibraryEquipment === "all"}
          onPress={() => setSelectedLibraryEquipment("all")}
        />
        {libraryEquipmentOptions.map((equipment) => (
          <LibraryEquipmentChip
            key={equipment}
            label={getEquipmentLabel(equipment) ?? equipment}
            active={selectedLibraryEquipment === equipment}
            onPress={() => setSelectedLibraryEquipment(equipment)}
          />
        ))}
      </ScrollView>

      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 6 }}>
        <ScrollView
          style={{ width: 62, maxWidth: 62, flexBasis: 62, flexGrow: 0, flexShrink: 0 }}
          contentContainerStyle={{ paddingTop: 2, paddingBottom: 18, gap: 4 }}
          showsVerticalScrollIndicator={false}
        >
          {libraryBodyParts.map((part) => (
            <LibraryBodyPartTab
              key={part}
              label={getBodyPartLabel(part)}
              active={selectedLibraryBodyPart === part}
              onPress={() => setSelectedLibraryBodyPart(part)}
            />
          ))}
        </ScrollView>

        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <BentoText weight="bold" style={{ color: c.ink, fontSize: 15 }}>
              {selectedLibraryBodyPart === "all" ? "全部动作" : `${getBodyPartLabel(selectedLibraryBodyPart)}动作`}
            </BentoText>
            <BentoText mono variant="micro" color={c.positive}>
              {filteredLibraryItems.length}/{Math.max(libraryTotal, combinedLibraryItems.length)} 项
            </BentoText>
          </View>

          {libraryError ? (
            <BentoText variant="caption" color={c.warn}>{libraryError}</BentoText>
          ) : null}

          {libraryLoading ? (
            <View style={{ gap: 12 }}>
              <LoadingState label="正在加载动作库..." />
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : filteredLibraryItems.length === 0 && !libraryError ? (
            <EmptyState
              icon="空"
              title="暂无动作"
              subtitle={selectedLibraryBodyPart === favoriteBodyPartKey ? "还没有收藏动作，点卡片右上角或长按动作即可收藏。" : "该部位暂无可用动作，试试其他部位。"}
            />
          ) : (
            <View style={{ gap: 18, paddingRight: 6, paddingBottom: 20 }}>
              {supplementalLibraryLoading ? (
                <BentoText variant="micro" color={c.inkMute}>正在补充内部 GIF 动作...</BentoText>
              ) : null}
              {groupedLibraryItems.map((group) => (
                <View key={group.title} style={{ gap: 10 }}>
                  <BentoText weight="bold" style={{ color: c.ink, fontSize: 24 }}>
                    {getEquipmentLabel(group.title) ?? group.title}
                  </BentoText>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                    {group.items.map((item) => (
                      <LibraryExerciseCard
                        key={item.id}
                        item={item}
                        active={isExerciseInTodayPlan(item)}
                        favorite={isFavoriteExercise(item)}
                        pinned={isPinnedExercise(item)}
                        bottom={isBottomExercise(item)}
                        thumbUri={libraryThumbUris[item.id]}
                        onPress={() => setSelectedLibraryExercise(item)}
                        onLongPress={() => openExerciseActions(item)}
                        onActionPress={() => openExerciseActions(item)}
                      />
                    ))}
                  </View>
                </View>
              ))}
              {libraryVisibleLimit < filteredLibraryItems.length ? (
                <Pressable
                  onPress={() => setLibraryVisibleLimit((current) => current + 24)}
                  disabled={libraryLoading}
                  style={({ pressed }) => ({
                    height: 44,
                    borderRadius: 14,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: c.glassRaised,
                    opacity: pressed || libraryLoading ? 0.72 : 1
                  })}
                >
                  <BentoText weight="semibold" variant="caption" color={c.positive}>
                    {libraryLoading ? "加载中..." : "显示更多本地动作"}
                  </BentoText>
                </Pressable>
              ) : null}
            </View>
          )}
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 8 }}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({
            flex: 1,
            height: 44,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: c.glassRaised,
            borderWidth: 1,
            borderColor: c.glassBorderBright,
            opacity: pressed ? 0.76 : 1
          })}
        >
          <BentoText weight="semibold" color={c.inkMute}>返回训练页</BentoText>
        </Pressable>
      </View>
    </Screen>
  );
}

function getBodyPartLabel(part: string): string {
  if (part === favoriteBodyPartKey) return "收藏";
  return bodyPartLabels[part] ?? part;
}

function getLibrarySortRank(exerciseId: string, preferences: ExerciseLibraryPreferences): number {
  const pinnedIndex = preferences.pinnedExerciseIds.indexOf(exerciseId);
  if (pinnedIndex >= 0) return -10000 + pinnedIndex;
  const bottomIndex = preferences.bottomExerciseIds.indexOf(exerciseId);
  if (bottomIndex >= 0) return 10000 + bottomIndex;
  return 0;
}

function ActionPill({ label, onPress }: { label: string; onPress: () => void }) {
  const c = useBentoTheme().colors;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 36,
        paddingHorizontal: 14,
        borderRadius: 999,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: c.bg,
        borderWidth: 1,
        borderColor: c.glassBorder,
        opacity: pressed ? 0.76 : 1
      })}
    >
      <BentoText weight="semibold" color={c.ink} style={{ fontSize: 13 }}>
        {label}
      </BentoText>
    </Pressable>
  );
}
