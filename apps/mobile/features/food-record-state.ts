export type FoodRecordState = "empty" | "recognizing" | "recorded";

export type FoodRecordStateInput = {
  actualFoodText: string;
  actualIntake: number;
  actualMealTexts: Record<string, string>;
  recognizing: boolean;
};

export function resolveFoodRecordState({
  actualFoodText,
  actualIntake,
  actualMealTexts,
  recognizing,
}: FoodRecordStateInput): FoodRecordState {
  if (recognizing) return "recognizing";
  if (actualFoodText.trim().length > 0) return "recorded";
  if (actualIntake > 0) return "recorded";
  if (Object.values(actualMealTexts).some((text) => text.trim().length > 0)) return "recorded";
  return "empty";
}

export function getFoodRecordStateCopy(state: FoodRecordState): { title: string; subtitle: string } {
  if (state === "recognizing") {
    return {
      title: "正在识别",
      subtitle: "识别完成后会自动写入对应餐次，食物标签仍可继续修改类型和重量。",
    };
  }

  if (state === "recorded") {
    return {
      title: "今日已记录",
      subtitle: "下方餐次会同步显示已识别食物，点击标签可继续校准细分类型和重量。",
    };
  }

  return {
    title: "还没有记录实际饮食",
    subtitle: "可以输入一句口语化描述，也可以上传菜品图片；这里不会把示例当成真实记录。",
  };
}
