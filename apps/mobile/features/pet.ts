/**
 * 宠物系统
 * - 20 个预设宠物（10 全球最萌动物 + 10 短视频热门宠物）
 * - 自定义宠物（拍照 + 命名）
 * - 提醒生成：基于饮食/训练数据分析，根据宠物性格输出不同语气的提醒
 */

export type PetPersonality = "gentle" | "lively" | "strict" | "cute";

export type PetSource = "cute" | "viral" | "custom";

export type PresetPet = {
  id: string;
  name: string;
  emoji: string;
  source: PetSource;
  personality: PetPersonality;
  /** 招牌口头禅 */
  catchphrase: string;
  /** 一句话介绍 */
  bio: string;
};

export type CustomPet = {
  name: string;
  emoji: string;
  /** 自定义宠物的性格，默认活泼 */
  personality: PetPersonality;
  /** 拍照来源（图片 uri 或 base64），可选 */
  photoUri?: string;
};

export type ActivePet =
  | { kind: "preset"; pet: PresetPet }
  | { kind: "custom"; pet: CustomPet }
  | null;

export const petPersonalityLabels: Record<PetPersonality, string> = {
  gentle: "温柔型",
  lively: "活泼型",
  strict: "严厉型",
  cute: "卖萌型"
};

export const petSourceLabels: Record<PetSource, string> = {
  cute: "全球最萌",
  viral: "短视频热门",
  custom: "自定义"
};

/** 全球最萌动物排行榜 Top 10 */
export const cutePets: PresetPet[] = [
  { id: "panda", name: "大熊猫", emoji: "🐼", source: "cute", personality: "cute", catchphrase: "竹子管够，但你也得管够蛋白质哦～", bio: "国宝级萌物，圆滚滚的国宝代言人" },
  { id: "koala", name: "考拉", emoji: "🐨", source: "cute", personality: "gentle", catchphrase: "慢慢吃，不着急，我陪你～", bio: "澳洲慵懒代表，每天睡 20 小时" },
  { id: "red-panda", name: "小熊猫", emoji: "🐾", source: "cute", personality: "lively", catchphrase: "蹦蹦跳跳才可爱，你今天动了吗？", bio: "竹林里的小精灵，尾巴毛茸茸" },
  { id: "arctic-fox", name: "北极狐", emoji: "🦊", source: "cute", personality: "gentle", catchphrase: "雪地里也能闪闪发光，你也可以～", bio: "极地白雪公主，冬天换雪白冬装" },
  { id: "sea-otter", name: "海獭", emoji: "🦦", source: "cute", personality: "cute", catchphrase: "牵手手睡觉最安心，记得好好休息呀～", bio: "海面漂浮的小可爱，爱牵手睡觉" },
  { id: "hamster", name: "仓鼠", emoji: "🐹", source: "cute", personality: "lively", catchphrase: "腮帮子塞满才安心，但别学我吃太多！", bio: "圆滚滚的口袋精灵，腮帮子能塞一周口粮" },
  { id: "rabbit", name: "兔子", emoji: "🐰", source: "cute", personality: "gentle", catchphrase: "胡萝卜要吃，蔬菜也要多样哦～", bio: "长耳朵蹦蹦跳，温柔的代表" },
  { id: "quokka", name: "短尾矮袋鼠", emoji: "🦘", source: "cute", personality: "cute", catchphrase: "全网最爱笑的我，陪你一起开心吃～", bio: "世界上最快乐的动物，永远在微笑" },
  { id: "penguin", name: "帝企鹅", emoji: "🐧", source: "cute", personality: "strict", catchphrase: "直立行走也能到南极，纪律是关键！", bio: "冰天雪地的绅士，挺胸走路" },
  { id: "fennec-fox", name: "耳廓狐", emoji: "🦊", source: "cute", personality: "lively", catchphrase: "大耳朵听得见你偷吃零食！", bio: "沙漠里的小精灵，耳朵比脸还大" }
];

/** 短视频平台热度最高的 10 类宠物 */
export const viralPets: PresetPet[] = [
  { id: "shiba", name: "柴犬", emoji: "🐕", source: "viral", personality: "lively", catchphrase: "柴柴笑一个！今天也要元气满满！", bio: "狗中戏精，笑容治愈全网" },
  { id: "british-shorthair", name: "英短蓝猫", emoji: "🐈", source: "viral", personality: "gentle", catchphrase: "蓝胖子盯着你吃饭，记得吃够蛋白～", bio: "圆脸蓝毛，猫界小胖子" },
  { id: "ragdoll", name: "布偶猫", emoji: "🐱", source: "viral", personality: "gentle", catchphrase: "抱抱就软成一团，记得温柔对待自己～", bio: "猫中仙女，脾气超好" },
  { id: "corgi", name: "柯基", emoji: "🐕", source: "viral", personality: "lively", catchphrase: "小短腿跑得快！你也动起来呀～", bio: "屁股圆滚滚的女王犬" },
  { id: "husky", name: "哈士奇", emoji: "🐺", source: "viral", personality: "lively", catchphrase: "拆家小能手警告：别拆自己的身体！", bio: "二哈本哈，精力旺盛的拆家专家" },
  { id: "teacup-dog", name: "茶杯犬", emoji: "🐶", source: "viral", personality: "cute", catchphrase: "我这么小都能按时吃饭，你也可以～", bio: "掌心上的小可爱" },
  { id: "guinea-pig", name: "荷兰猪", emoji: "🐹", source: "viral", personality: "cute", catchphrase: "吱吱！蔬菜不能少呀～", bio: "圆滚滚的小仓鼠亲戚，爱叫" },
  { id: "chinchilla", name: "龙猫", emoji: "🐭", source: "viral", personality: "gentle", catchphrase: "毛茸茸的我提醒你：少油少糖才清爽～", bio: "绒毛球本球，毛比兔还软" },
  { id: "parrot", name: "鹦鹉", emoji: "🦜", source: "viral", personality: "strict", catchphrase: "重复一遍！蛋白质！蔬菜！水！", bio: "会说话的彩色小喇叭" },
  { id: "hedgehog", name: "刺猬", emoji: "🦔", source: "viral", personality: "cute", catchphrase: "卷起来是保护自己，吃好才是真本领～", bio: "带刺的小圆球，夜行性" }
];

export const allPresetPets: PresetPet[] = [...cutePets, ...viralPets];

export function getPresetPetById(id: string | null): PresetPet | undefined {
  if (!id) return undefined;
  return allPresetPets.find((p) => p.id === id);
}

// ============ 提醒生成 ============

export type DietReminderContext = {
  /** 实际摄入 kcal */
  intakeCalories: number;
  /** 目标 kcal */
  targetCalories: number;
  /** 实际蛋白 g */
  proteinG: number;
  /** 目标蛋白 g */
  targetProteinG: number;
  /** 实际脂肪 g */
  fatG: number;
  /** 目标脂肪 g */
  targetFatG: number;
  /** 实际碳水 g */
  carbsG: number;
  /** 目标碳水 g */
  targetCarbsG: number;
  /** 已记录的食物名列表 */
  foodNames: string[];
};

export type TrainingReminderContext = {
  /** 计划训练标题 */
  plannedTitle: string | null;
  /** 计划消耗 kcal */
  plannedCalories: number;
  /** 实际训练状态 */
  status: "pending" | "done" | "missed" | "changed";
  /** 实际消耗 kcal */
  actualCalories: number;
};

export type PetReminder = {
  /** 提醒图标 */
  emoji: string;
  /** 提醒标题 */
  title: string;
  /** 提醒正文 */
  body: string;
  /** 提醒类型 */
  tone: "info" | "warn" | "praise" | "cheer";
};

/** 根据宠物性格包装语气 */
function withPersonality(personality: PetPersonality, base: string): string {
  switch (personality) {
    case "gentle":
      return base;
    case "lively":
      return `${base}！`;
    case "strict":
      return `听好——${base}。`;
    case "cute":
      return `${base}～`;
  }
}

/** 生成饮食提醒 */
export function generateDietReminder(pet: NonNullable<ActivePet>, ctx: DietReminderContext): PetReminder {
  const personality = pet.pet.personality;
  const emoji = pet.pet.emoji;
  const name = pet.pet.name;

  const intakeRatio = ctx.intakeCalories / Math.max(1, ctx.targetCalories);
  const proteinRatio = ctx.proteinG / Math.max(1, ctx.targetProteinG);
  const fatRatio = ctx.fatG / Math.max(1, ctx.targetFatG);
  const carbsRatio = ctx.carbsG / Math.max(1, ctx.targetCarbsG);

  // 优先级 1：还没记录
  if (ctx.intakeCalories === 0) {
    return {
      emoji,
      title: `${name}饿啦`,
      body: withPersonality(personality, "你今天还没记录吃过什么，快来告诉我你准备吃什么，我帮你看看营养够不够"),
      tone: "info"
    };
  }

  // 优先级 2：热量严重超标
  if (intakeRatio > 1.15) {
    const over = Math.round(ctx.intakeCalories - ctx.targetCalories);
    return {
      emoji,
      title: "吃多啦",
      body: withPersonality(personality, `今天已经多摄入 ${over} kcal，超目标 ${Math.round((intakeRatio - 1) * 100)}%。建议接下来少吃高热量食物，多喝水`),
      tone: "warn"
    };
  }

  // 优先级 3：蛋白质不足
  if (proteinRatio < 0.7 && ctx.intakeCalories > 0) {
    const gap = Math.round(ctx.targetProteinG - ctx.proteinG);
    const suggest = ctx.foodNames.length > 0 ? "可以加一份鸡胸肉、鸡蛋或希腊酸奶" : "记得安排优质蛋白：鸡胸、鱼、蛋、奶";
    return {
      emoji,
      title: "蛋白质不够",
      body: withPersonality(personality, `还差约 ${gap}g 蛋白质。${suggest}`),
      tone: "warn"
    };
  }

  // 优先级 4：脂肪过多
  if (fatRatio > 1.2 && ctx.intakeCalories > 0) {
    return {
      emoji,
      title: "油脂偏多",
      body: withPersonality(personality, `脂肪已超目标 ${Math.round((fatRatio - 1) * 100)}%，接下来选少油烹饪，避开油炸和坚果过量`),
      tone: "warn"
    };
  }

  // 优先级 5：碳水不足
  if (carbsRatio < 0.6 && ctx.intakeCalories > 0) {
    const gap = Math.round(ctx.targetCarbsG - ctx.carbsG);
    return {
      emoji,
      title: "碳水偏少",
      body: withPersonality(personality, `还差约 ${gap}g 碳水。训练日碳水不足会没力气，可以加些米饭、红薯或燕麦`),
      tone: "info"
    };
  }

  // 优先级 6：接近达标
  if (intakeRatio >= 0.85 && intakeRatio <= 1.05) {
    return {
      emoji,
      title: "吃得刚好",
      body: withPersonality(personality, `热量摄入 ${Math.round(intakeRatio * 100)}%，三大营养素也在合理范围，继续保持`),
      tone: "praise"
    };
  }

  // 默认：进度提示
  return {
    emoji,
    title: "继续加油",
    body: withPersonality(personality, `已摄入 ${Math.round(intakeRatio * 100)}% 目标热量，还剩 ${Math.max(0, Math.round(ctx.targetCalories - ctx.intakeCalories))} kcal，合理安排剩余餐次`),
    tone: "info"
  };
}

/** 生成训练提醒 */
export function generateTrainingReminder(pet: NonNullable<ActivePet>, ctx: TrainingReminderContext): PetReminder {
  const personality = pet.pet.personality;
  const emoji = pet.pet.emoji;
  const name = pet.pet.name;

  if (ctx.status === "pending") {
    if (!ctx.plannedTitle) {
      return {
        emoji,
        title: "今天休息日",
        body: withPersonality(personality, "今天没有安排训练，可以散散步或做做拉伸，保持身体活跃"),
        tone: "info"
      };
    }
    return {
      emoji,
      title: "该动起来啦",
      body: withPersonality(personality, `今天的计划是「${ctx.plannedTitle}」，预计消耗 ${Math.round(ctx.plannedCalories)} kcal。准备好了就开始吧`),
      tone: "cheer"
    };
  }

  if (ctx.status === "done") {
    return {
      emoji,
      title: "太棒了",
      body: withPersonality(personality, `完成训练！实际消耗 ${Math.round(ctx.actualCalories)} kcal，记得补充蛋白质和水分，好好休息`),
      tone: "praise"
    };
  }

  if (ctx.status === "missed") {
    return {
      emoji,
      title: "今天偷懒了",
      body: withPersonality(personality, "没训练没关系，但记得明天补上。长期坚持比一次完美更重要"),
      tone: "warn"
    };
  }

  // changed
  return {
    emoji,
    title: "改练了",
    body: withPersonality(personality, `记录了替代训练，消耗 ${Math.round(ctx.actualCalories)} kcal。灵活调整也是坚持的一种`),
    tone: "info"
  };
}
