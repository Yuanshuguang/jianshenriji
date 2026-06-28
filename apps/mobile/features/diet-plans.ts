/**
 * 饮食计划移动端兼容出口。
 * 真实数据库与公式在 shared/data/diet-plan-database.ts，避免页面层重复维护。
 */
export {
  calculateDietPlanMacroTargets,
  dietDayTypeLabels,
  dietPlanCategoryLabels,
  dietPlans,
  dietPlansByCategory,
  getDietPlanById,
  resolveDietPlanDay,
} from "@fitness-calendar/shared";

export type {
  DietCycleVariant,
  DietDayType,
  DietMacroRule,
  DietPlan,
  DietPlanCategory,
  DietPlanCycleSelection,
  DietPlanResolvedDay,
} from "@fitness-calendar/shared";
