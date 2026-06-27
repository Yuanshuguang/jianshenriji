type ExerciseLocalizationInput = {
  name: string;
  equipment?: string | null;
  category?: string | null;
  bodyPart?: string | null;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  source?: string;
};

const equipmentWordMap: Array<[RegExp, string]> = [
  [/\bsmith machine\b/, "史密斯机"],
  [/\bmedicine ball\b/, "药球"],
  [/\bstability ball\b|\bexercise ball\b/, "健身球"],
  [/\bbosu ball\b/, "波速球"],
  [/\btrap bar\b/, "六角杠"],
  [/\bdumbbell\b/, "哑铃"],
  [/\bez barbell\b|\bez curl bar\b/, "曲杆杠铃"],
  [/\bbarbell\b/, "杠铃"],
  [/\bkettlebell\b/, "壶铃"],
  [/\bcable\b/, "绳索"],
  [/\bmachine\b/, "器械"],
  [/\bleverage machine\b/, "器械"],
  [/\bbody weight\b|\bbodyweight\b/, "徒手"],
  [/\bweighted\b/, "负重"],
  [/\bband\b|\bresistance band\b/, "弹力带"],
  [/\bassisted\b/, "辅助"]
];

const modifierWordMap: Array<[RegExp, string]> = [
  [/\bincline\b/, "上斜"],
  [/\bdecline\b/, "下斜"],
  [/\bseated\b/, "坐姿"],
  [/\bstanding\b/, "站姿"],
  [/\blying\b|\bsupine\b/, "仰卧"],
  [/\bone arm\b|\bsingle arm\b/, "单臂"],
  [/\bone leg\b|\bsingle leg\b/, "单腿"],
  [/\bwide grip\b/, "宽握"],
  [/\bclose grip\b/, "窄握"],
  [/\breverse\b/, "反向"],
  [/\bbent over\b/, "俯身"],
  [/\bneutral grip\b/, "中立握"]
];

const baseExerciseNameMap: Array<[RegExp, string]> = [
  [/\bmedicine ball chest pass\b/, "药球胸前传球"],
  [/\bmedicine ball chest push\b/, "药球胸前推"],
  [/\bchest pass\b/, "胸前传球"],
  [/\bchest push\b/, "胸前推"],
  [/\bankle circles\b/, "踝关节绕环"],
  [/\bastride jumps?\b|\bjack jump\b/, "开合跳"],
  [/\bbackward jump\b/, "后跳"],
  [/\bforward jump\b/, "前跳"],
  [/\bbox jump\b/, "跳箱"],
  [/\bbear crawl\b/, "熊爬"],
  [/\bburpee\b/, "波比跳"],
  [/\bjack burpee\b/, "开合波比跳"],
  [/\bhigh knee\b/, "高抬腿"],
  [/\bcycle cross trainer\b/, "椭圆机"],
  [/\bstationary bike\b/, "固定自行车"],
  [/\bback and forth step\b/, "前后踏步"],
  [/\bbalance board\b/, "平衡板平衡"],
  [/\bprone hamstring\b/, "俯卧腿后侧抬腿"],
  [/\blying lifting\b/, "仰卧臀桥"],
  [/\bside bent\b|\bside bend\b/, "侧屈"],
  [/\bjudo flip\b/, "柔道式转体"],
  [/\blateral bent over\b|\blateral bent-over\b|\bbent over lateral\b/, "俯身侧平举"],
  [/\bstanding lift\b/, "站姿绳索上提"],
  [/\b(incline )?breeding\b/, "飞鸟"],
  [/\btwisted flyes?\b/, "旋转飞鸟"],
  [/\bfemoral\b/, "腿弯举"],
  [/\bkickbacks?\b/, "臂后伸"],
  [/\bdeltoid rear\b/, "后三角飞鸟"],
  [/\bseated one arm rotate\b/, "坐姿单臂旋转"],
  [/\boverhead carry\b/, "过顶行走"],
  [/\belevator\b/, "肩胛上提"],
  [/\bbutterfly yoga pose\b/, "蝴蝶式拉伸"],
  [/\bback pec stretch\b/, "背胸拉伸"],
  [/\bchair leg extended stretch\b/, "椅上直腿拉伸"],
  [/\bchest and front of shoulder stretch\b/, "胸肩前侧拉伸"],
  [/\bdynamic chest stretch\b/, "动态胸部拉伸"],
  [/\bone leg prone lower body rotation\b/, "单腿俯卧下肢旋转"],
  [/\bone legged diagonal kick hamstring curl\b/, "单腿斜踢腿弯举"],
  [/\bdiagonal kick hamstring curl\b/, "斜踢腿弯举"],
  [/\bseated hamstring stretch\b/, "坐姿腘绳肌拉伸"],
  [/\bhamstring stretch\b/, "腘绳肌拉伸"],
  [/\bsumo high pull\b/, "相扑高拉"],
  [/\bgripper hands\b/, "握力器握持"],
  [/\botis up\b/, "负重仰卧起坐"],
  [/\bback lever\b/, "后水平"],
  [/\bfront lever(?: reps)?\b/, "前水平"],
  [/\bseated wide angle pose sequence\b/, "坐姿广角式拉伸"],
  [/\bseated lower back stretch\b/, "坐姿下背部拉伸"],
  [/\bspine stretch\b/, "脊柱拉伸"],
  [/\bsingle leg platform slide\b/, "单腿滑盘腿弯举"],
  [/\breclining big toe pose with rope\b/, "仰卧拉绳腿后侧拉伸"],
  [/\broller hip lat stretch\b|\broller hip stretch\b/, "泡沫轴髋部拉伸"],
  [/\broller side lat stretch\b/, "泡沫轴侧背拉伸"],
  [/\bskin (?:the )?cat\b/, "翻转下杠"],
  [/\bstanding archer\b/, "站姿弓箭手转体"],
  [/\bside to side chin\b|\bside-to-side chin\b/, "左右移动反手引体"],
  [/\bone arm against wall\b/, "单臂靠墙背部拉伸"],
  [/\bmonster walk\b/, "怪兽走"],
  [/\bmarch sit\b/, "靠墙坐姿抬腿"],
  [/\bkick out sit\b/, "坐姿踢腿"],
  [/\boblique crunches floor\b/, "地面斜腹卷腹"],
  [/\belbow to knee\b|\belbow-to-knee\b/, "肘碰膝"],
  [/\blying elbow to knee\b/, "仰卧肘碰膝"],
  [/\bposterior step to overhead reach\b/, "后撤步过顶伸展"],
  [/\bpull in\b|\bpull-in\b/, "健身球收腹"],
  [/\bquick feet\b/, "快速碎步"],
  [/\bhip thrusts? on knees\b/, "跪姿臀推"],
  [/\breverse hyper\b/, "反向背伸展"],
  [/\bski ergometer\b/, "滑雪机"],
  [/\bsledge hammer\b/, "锤击"],
  [/\bspell caster\b/, "哑铃旋转摆举"],
  [/\bswimmer kicks?\b/, "俯卧打水踢"],
  [/\bwalk elliptical cross trainer\b/, "椭圆机步行"],
  [/\bthree bench dips?\b/, "三凳臂屈伸"],
  [/\btricep dips?\b/, "三头臂屈伸"],
  [/\bimpossible dips?\b/, "高难度臂屈伸"],
  [/\bkorean dips?\b/, "韩式臂屈伸"],
  [/\bring dips?\b/, "吊环臂屈伸"],
  [/\bisometric wipers\b/, "等长雨刷转体"],
  [/\bisometric chest squeeze\b/, "等长夹胸"],
  [/\bhanging straight twisting leg hip raise\b/, "悬垂直腿转体提髋"],
  [/\bhanging straight leg hip raise\b/, "悬垂直腿提髋"],
  [/\bhanging leg hip raise\b/, "悬垂举腿提髋"],
  [/\bincline leg hip raise\b/, "上斜举腿提髋"],
  [/\blying leg hip raise\b|\blying leg-hip raise\b/, "仰卧举腿提髋"],
  [/\bstraight leg outer hip abductor\b/, "直腿髋外展"],
  [/\blandmine 180\b/, "地雷管180度转体"],
  [/\blean planche\b/, "前倾俄挺支撑"],
  [/\bstraddle maltese\b/, "分腿马耳他支撑"],
  [/\bstraddle planche\b/, "分腿俄挺"],
  [/\bsuspended abdominal fallout\b/, "悬吊健腹轮"],
  [/\bleft hook\b/, "左勾拳"],
  [/\bgripper hands\b/, "握力器训练"],
  [/\brotary calf\b/, "旋转提踵"],
  [/\bone arm slam\b/, "单臂药球砸地"],
  [/\boverhead slam\b/, "过顶砸球"],
  [/\bcatch and overhead throw\b/, "接球过顶投掷"],
  [/\bchest stretch\b/, "胸部拉伸"],
  [/\blower back stretch\b/, "下背部拉伸"],
  [/\bupper back stretch\b/, "上背部拉伸"],
  [/\bcalf stretch\b/, "小腿拉伸"],
  [/\bquad(?:s)? stretch\b|\bsquad stretch\b/, "股四头肌拉伸"],
  [/\bhip flexor stretch\b/, "髋屈肌拉伸"],
  [/\brectus femoris stretch\b/, "股直肌拉伸"],
  [/\bhamstring\b/, "腿后侧发力"],
  [/\bperoneals stretch\b/, "腓骨肌拉伸"],
  [/\bposterior tibialis stretch\b/, "胫骨后肌拉伸"],
  [/\brope climb\b/, "爬绳"],
  [/\bbattling ropes?\b/, "战绳"],
  [/\bexercise ball alternating arm ups\b/, "健身球交替抬臂"],
  [/\balternating arm ups\b/, "交替抬臂"],
  [/\bexercise ball hug\b/, "健身球抱球背伸展"],
  [/\bhug\b/, "抱球背伸展"],
  [/\bexercise ball prone leg raise\b/, "健身球俯卧举腿"],
  [/\bprone leg raise\b/, "俯卧举腿"],
  [/\bone legged diagonal kick hamstring curl\b/, "单腿斜踢腿弯举"],
  [/\bdiagonal kick hamstring curl\b/, "斜踢腿弯举"],
  [/\bgood morning\b/, "早安式"],
  [/\bhip internal rotation\b/, "髋内旋"],
  [/\bhip adduction\b/, "髋内收"],
  [/\bhip lift\b/, "提髋"],
  [/\bpull through\b/, "臀部拉伸"],
  [/\bstep up\b/, "登阶"],
  [/\bshrug\b/, "耸肩"],
  [/\bpullover\b/, "屈臂上拉"],
  [/\bsnatch\b/, "抓举"],
  [/\bpin press(?:es)?\b/, "架上推举"],
  [/\brack pull\b/, "架上硬拉"],
  [/\bskullcrusher\b/, "仰卧臂屈伸"],
  [/\bskier\b/, "滑雪式划船"],
  [/\bthruster\b/, "深蹲推举"],
  [/\btoe touch\b/, "触足"],
  [/\bcross-over variation\b|\bcrossover\b|\bcrossovers\b|\bcross over\b/, "夹胸"],
  [/\bpushdown\b/, "下压"],
  [/\btricep pushdown\b/, "三头下压"],
  [/\bkickback\b/, "臂后伸"],
  [/\brear drive\b/, "后拉"],
  [/\btwisting pull\b/, "旋转拉"],
  [/\bchin ups?\b|\bchin-up\b/, "反手引体向上"],
  [/\bpull ups?\b/, "引体向上"],
  [/\bmuscle up\b/, "双力臂"],
  [/\bdead bug\b/, "死虫式"],
  [/\bfinger curls?\b/, "手指弯举"],
  [/\biron cross\b/, "十字平举"],
  [/\bpronation\b/, "前臂旋前"],
  [/\bsupination\b/, "前臂旋后"],
  [/\baround world\b/, "环绕举"],
  [/\bfarmers walk\b/, "农夫行走"],
  [/\belbow dips?\b/, "肘撑臂屈伸"],
  [/\belbow to knee\b/, "肘碰膝"],
  [/\bbody up\b/, "自重臂屈伸"],
  [/\bbottoms up\b/, "臀部上抬"],
  [/\bbutt ups\b/, "臀部上抬"],
  [/\bflag\b/, "人体旗帜"],
  [/\bflutter kicks?\b/, "打水踢"],
  [/\bfrog planche\b/, "蛙式俄挺"],
  [/\bfull maltese\b/, "马耳他支撑"],
  [/\bfull planche\b/, "俄挺"],
  [/\bgironda sternum chin\b/, "胸骨引体"],
  [/\bgorilla chin\b/, "卷腹引体"],
  [/\bhandstand\b/, "倒立"],
  [/\bhanging pike\b/, "悬垂折刀"],
  [/\binchworm\b/, "毛毛虫爬行"],
  [/\bl sit\b/, "L支撑"],
  [/\bv sit\b/, "Ⅴ字坐"],
  [/\bpelvic tilt\b/, "骨盆后倾"],
  [/\bpull in\b/, "健身球收腹"],
  [/\bbody saw\b/, "平板锯式"],
  [/\bwindmill\b/, "风车"],
  [/\bclean and jerk\b/, "挺举"],
  [/\bclean\b/, "高翻"],
  [/\bjerk\b/, "挺举"],
  [/\bswing\b/, "摆荡"],
  [/\bhang clean\b/, "悬垂高翻"],
  [/\bfigure 8\b/, "8字绕环"],
  [/\bside hip abduction\b/, "侧卧髋外展"],
  [/\bhip abduction\b/, "髋外展"],
  [/\bside hip\b/, "侧髋支撑"],
  [/\bscapula dips?\b/, "肩胛下沉"],
  [/\bsphinx\b/, "眼镜蛇伸展"],
  [/\bupward facing dog\b/, "上犬式"],
  [/\bcossack squats?\b/, "哥萨克深蹲"],
  [/\bsplit squats?\b/, "分腿蹲"],
  [/\btire flip\b/, "翻轮胎"],
  [/\bwrist circles?\b/, "手腕绕环"],
  [/\bwrist roller(?:er)?\b/, "腕力卷轴"],
  [/\bhand squeeze\b/, "握力挤压"],
  [/\bhalf knee bends?\b/, "半蹲"],
  [/\bscissor jumps?\b/, "剪刀跳"],
  [/\bstar jump\b/, "星跳"],
  [/\bskater hops?\b/, "滑冰跳"],
  [/\bski step\b/, "滑雪步"],
  [/\bshort stride run\b/, "小步跑"],
  [/\bwind sprints?\b/, "冲刺跑"],
  [/\brun\b/, "跑步"],
  [/\bdonkey calf raise\b/, "驴式提踵"],
  [/\bsissy squat\b/, "西西深蹲"],
  [/\bsvend press\b/, "斯万推胸"],
  [/\bround arm\b/, "绕臂"],
  [/\bback extension\b|\bhyperextension\b/, "背伸展"],
  [/\bpull-ups?\b/, "引体向上"],
  [/\bbench press\b/, "卧推"],
  [/\boverhead press\b|\bshoulder press\b/, "推举"],
  [/\blateral raise\b/, "侧平举"],
  [/\bfront raise\b/, "前平举"],
  [/\brear delt fly\b|\breverse fly\b/, "反向飞鸟"],
  [/\bpull up\b|\bpull-up\b/, "引体向上"],
  [/\bpush up\b|\bpush-up\b/, "俯卧撑"],
  [/\bdeadlift\b/, "硬拉"],
  [/\bsquat\b/, "深蹲"],
  [/\blunge\b/, "弓步蹲"],
  [/\brow\b/, "划船"],
  [/\bcurl\b/, "弯举"],
  [/\bcurls?\b/, "弯举"],
  [/\btriceps extension\b/, "臂屈伸"],
  [/\bdip\b/, "双杠臂屈伸"],
  [/\bplank\b/, "平板支撑"],
  [/\bcrunch\b/, "卷腹"],
  [/\bsit up\b|\bsit-up\b/, "仰卧起坐"],
  [/\bside bend\b/, "侧屈"],
  [/\bheel touchers\b/, "触踵"],
  [/\btwist\b/, "转体"],
  [/\bknee raise\b/, "举膝"],
  [/\bleg raise\b/, "举腿"],
  [/\balternating v[\s-]?up\b/, "交替Ⅴ字收腹"],
  [/\bband alternating v[\s-]?up\b/, "交替Ⅴ字收腹"],
  [/\bband v[\s-]?up\b/, "Ⅴ字收腹"],
  [/\bv[\s-]?up\b/, "Ⅴ字收腹"],
  [/\bpallof press\b/, "帕洛夫推"],
  [/\brollerout\b|\bwheel rollerout\b/, "健腹轮"],
  [/\brussian twist(?:s)?\b/, "俄罗斯转体"],
  [/\bjack knife sit-up\b/, "折刀式仰卧起坐"],
  [/\bmountain climber\b/, "登山跑"],
  [/\bmountain climber \(cross body\)\b/, "交叉登山跑"],
  [/\bcaptains chair straight leg raise\b/, "罗马椅直腿抬举"],
  [/\bcocoons\b/, "抱膝卷腹"],
  [/\bbutt-ups?\b/, "臀部上抬"],
  [/\bcross body crunch\b/, "交叉卷腹"],
  [/\bcrab twist toe touch\b/, "蟹式转体触足"],
  [/\bbottoms-up\b/, "臀部上抬"],
  [/\bair bike\b/, "空中单车"],
  [/\barm slingers hanging bent knee legs\b/, "悬垂屈膝摆动"],
  [/\barm slingers hanging straight legs\b/, "悬垂直腿摆动"],
  [/\barms overhead full sit-up\b/, "举臂仰卧起坐"],
  [/\bhip thrust\b/, "臀推"],
  [/\bglute bridge\b/, "臀桥"],
  [/\bleg press\b/, "腿举"],
  [/\bleg curl\b/, "腿弯举"],
  [/\bleg extension\b/, "腿伸展"],
  [/\bcalf raises?\b/, "提踵"],
  [/\bface pull\b/, "面拉"],
  [/\bpulldown\b/, "下拉"],
  [/\brunning\b|\bjogging\b/, "跑步"],
  [/\bcycling\b|\bbike\b/, "动感单车"],
  [/\bwalking\b/, "步行"],
  [/\bjump rope\b/, "跳绳"],
  [/\bbattle rope\b/, "战绳"]
];

const fallbackWordMap: Array<[RegExp, string]> = [
  [/\bshoulders\b|\bshoulder\b/, "肩部"],
  [/\bchest\b/, "胸部"],
  [/\bback\b/, "背部"],
  [/\barms\b|\barm\b/, "手臂"],
  [/\bcore\b|\babs\b/, "核心"],
  [/\blegs\b|\bleg\b/, "腿部"],
  [/\bcardio\b/, "有氧"],
  [/\bpectorals\b/, "胸肌"],
  [/\blats\b/, "背阔肌"],
  [/\bspine\b|\blower back\b/, "下背部"],
  [/\bupper back\b/, "上背部"],
  [/\bcalves\b/, "小腿"],
  [/\bquads\b|\bquadriceps\b/, "股四头肌"],
  [/\bhamstrings\b/, "腘绳肌"],
  [/\bdelts\b|\bdeltoids\b/, "三角肌"],
  [/\bglutes\b|\bglute\b/, "臀部"],
  [/\btriceps\b/, "三头"],
  [/\bbiceps\b/, "二头"],
  [/\brear delt\b/, "后束"],
  [/\bfront delt\b/, "前束"],
  [/\bpress\b/, "推举"],
  [/\bpass\b/, "传球"],
  [/\bpush\b/, "推"],
  [/\brow\b/, "划船"],
  [/\braise\b/, "平举"],
  [/\bside bend\b/, "侧屈"],
  [/\bheel touchers\b/, "触踵"],
  [/\bfly\b/, "飞鸟"],
  [/\bpull down\b|\bpulldown\b/, "下拉"],
  [/\bpull up\b|\bpull-up\b/, "引体向上"],
  [/\bpush up\b|\bpush-up\b/, "俯卧撑"],
  [/\bdeadlift\b/, "硬拉"],
  [/\bsquat\b/, "深蹲"],
  [/\blunge\b/, "弓步蹲"],
  [/\bcurl\b/, "弯举"],
  [/\bextension\b/, "伸展"],
  [/\bstretch\b/, "拉伸"],
  [/\bclimb\b/, "攀爬"],
  [/\bknee raise\b/, "举膝"],
  [/\bleg raise\b/, "举腿"],
  [/\bv[\s-]?up\b/, "Ⅴ字收腹"],
  [/\bpallof\b/, "帕洛夫"],
  [/\brollerout\b|\bwheel\b/, "健腹轮"],
  [/\brussian twist(?:s)?\b/, "俄罗斯转体"],
  [/\bjack knife\b/, "折刀式"],
  [/\bmountain climber\b/, "登山跑"],
  [/\bcaptains chair\b/, "罗马椅"],
  [/\bcocoon(?:s)?\b/, "抱膝"],
  [/\bbutt-ups?\b/, "臀部上抬"],
  [/\bcrab twist\b/, "蟹式转体"],
  [/\bbottoms-up\b/, "臀部上抬"],
  [/\bair bike\b/, "空中单车"],
  [/\barm slingers\b/, "悬垂摆动"],
  [/\bbridge\b/, "臀桥"],
  [/\bthrust\b/, "臀推"],
  [/\bplank\b/, "平板支撑"],
  [/\bcrunch\b/, "卷腹"],
  [/\bsit up\b|\bsit-up\b/, "仰卧起坐"],
  [/\btwist\b/, "转体"],
  [/\brunning\b|\bjogging\b/, "跑步"],
  [/\bcycling\b|\bbike\b/, "动感单车"],
  [/\bwalking\b/, "步行"],
  [/\bjump rope\b/, "跳绳"],
  [/\bbattle rope\b/, "战绳"],
  [/\brope\b/, "绳"],
  [/\bmedicine ball\b/, "药球"],
  [/\bstability ball\b|\bexercise ball\b/, "健身球"],
  [/\bbosu ball\b/, "波速球"],
  [/\btrap bar\b/, "六角杠"],
  [/\bmachine\b/, "器械"],
  [/\bcable\b/, "绳索"],
  [/\bdumbbell\b/, "哑铃"],
  [/\bbarbell\b/, "杠铃"],
  [/\bkettlebell\b/, "壶铃"],
  [/\bsmith machine\b/, "史密斯机"],
  [/\bbody weight\b|\bbodyweight\b/, "徒手"],
  [/\bleverage machine\b/, "器械"],
  [/\bweighted\b/, "负重"],
  [/\bresistance band\b|\bband\b/, "弹力带"],
  [/\bincline\b/, "上斜"],
  [/\bdecline\b/, "下斜"],
  [/\bseated\b/, "坐姿"],
  [/\bstanding\b/, "站姿"],
  [/\blying\b|\bsupine\b/, "仰卧"],
  [/\bone arm\b|\bsingle arm\b/, "单臂"],
  [/\bone leg\b|\bsingle leg\b/, "单腿"],
  [/\bwide grip\b/, "宽握"],
  [/\bclose grip\b/, "窄握"],
  [/\breverse\b/, "反向"],
  [/\bbent over\b/, "俯身"],
  [/\bneutral grip\b/, "中立握"],
  [/\bface pull\b/, "面拉"]
];

function normalizeExerciseText(value: string) {
  return value
    .toLowerCase()
    .replace(/[_/()\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasChinese(value: string) {
  return /[\u4e00-\u9fff]/.test(value);
}

function collectMatches(value: string, patterns: Array<[RegExp, string]>) {
  return patterns
    .filter(([pattern]) => pattern.test(value))
    .map(([, replacement]) => replacement);
}

function stripMatches(value: string, patterns: Array<[RegExp, string]>) {
  return patterns.reduce((current, [pattern]) => current.replace(pattern, " "), value);
}

function translateEnglishPhrase(value: string) {
  let translated = normalizeExerciseText(value);
  for (const [pattern, replacement] of fallbackWordMap) {
    translated = translated.replace(pattern, replacement);
  }
  translated = translated
    .replace(/[a-z]+/g, "")
    .replace(/\d+/g, "")
    .replace(/\s+/g, "")
    .replace(/[^\u4e00-\u9fff]+/g, "");
  return translated;
}

function compressRepeatedChunks(value: string) {
  let current = value;
  let changed = true;
  while (changed) {
    changed = false;
    for (let size = 2; size <= 4; size++) {
      for (let i = 0; i + size * 2 <= current.length; i++) {
        const chunk = current.slice(i, i + size);
        const next = current.slice(i + size, i + size * 2);
        if (chunk === next) {
          current = current.slice(0, i + size) + current.slice(i + size * 2);
          changed = true;
        }
      }
    }
  }
  return current;
}

function uniqueTerms(values: Array<string | null | undefined>) {
  const seen = new Set<string>();
  return values
    .map((value) => (value ?? "").trim())
    .filter(Boolean)
    .filter((value) => {
      const key = normalizeExerciseText(value);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function translateBodyPart(value?: string | null) {
  if (!value) return "";
  const normalized = normalizeExerciseText(value);
  const map: Array<[RegExp, string]> = [
    [/\bchest\b/, "胸部"],
    [/\bback\b/, "背部"],
    [/\bshoulders\b|\bshoulder\b/, "肩部"],
    [/\bupper arms\b|\barms\b|\barm\b/, "手臂"],
    [/\blower arms\b|\bforearms\b/, "前臂"],
    [/\bwaist\b|\bcore\b|\babs\b/, "核心"],
    [/\bupper legs\b|\blegs\b|\bleg\b/, "腿部"],
    [/\blower legs\b/, "小腿"],
    [/\bcardio\b/, "有氧"],
    [/\bneck\b/, "颈部"]
  ];
  return map.find(([pattern]) => pattern.test(normalized))?.[1] ?? "";
}

function translateTargetMuscle(values: Array<string | null | undefined>) {
  const joined = values.filter(Boolean).map((value) => normalizeExerciseText(value ?? "")).join(" ");
  const map: Array<[RegExp, string]> = [
    [/\bpectorals\b|\bchest\b/, "胸肌"],
    [/\blats\b/, "背阔肌"],
    [/\bupper back\b|\btraps\b/, "上背部"],
    [/\bspine\b|\blower back\b/, "下背部"],
    [/\babs\b|\bobliques\b|\bwaist\b/, "核心"],
    [/\bglutes\b|\bglute\b/, "臀部"],
    [/\bhamstrings\b/, "腘绳肌"],
    [/\bquads\b|\bquadriceps\b/, "股四头肌"],
    [/\badductors\b/, "内收肌"],
    [/\babductors\b/, "外展肌"],
    [/\bcalves\b/, "小腿"],
    [/\bbiceps\b/, "二头肌"],
    [/\btriceps\b/, "三头肌"],
    [/\bforearms\b/, "前臂"],
    [/\bdelts\b|\bdeltoids\b/, "三角肌"],
    [/\bcardiovascular system\b|\bcardio\b/, "有氧"]
  ];
  return map.find(([pattern]) => pattern.test(joined))?.[1] ?? "";
}

export function localizeExerciseName(input: ExerciseLocalizationInput) {
  const rawName = input.name.trim();
  if (!rawName) return "未命名动作";
  if (hasChinese(rawName)) return rawName;

  const normalized = normalizeExerciseText(rawName);
  const stripped = stripMatches(
    normalized,
    [...modifierWordMap, ...equipmentWordMap]
  ).replace(/\b(of|the|and|with|for|to|on|at|in|a|an)\b/g, " ").replace(/\s+/g, " ").trim();
  const baseSource = stripped || normalized;
  const directBase = baseExerciseNameMap.find(([pattern]) => pattern.test(normalized))?.[1];
  const translatedBase = directBase ?? baseExerciseNameMap.find(([pattern]) => pattern.test(baseSource))?.[1] ?? translateEnglishPhrase(baseSource);
  const modifiers = collectMatches(normalized, modifierWordMap);
  const equipment = collectMatches(
    [normalized, input.equipment ?? ""].filter(Boolean).join(" "),
    equipmentWordMap
  );
  const bodyPart = translateBodyPart(input.bodyPart ?? input.category ?? null);
  const targetMuscle = translateTargetMuscle([...(input.primaryMuscles ?? []), ...(input.secondaryMuscles ?? [])]);
  const parts: string[] = [];
  modifiers.forEach((part) => {
    if (!part || translatedBase.includes(part) || parts.includes(part)) return;
    parts.push(part);
  });
  equipment.forEach((part) => {
    if (!part) return;
    if (translatedBase.includes(part) || bodyPart.includes(part)) return;
    if (part === "徒手" && translatedBase.includes("拉伸")) return;
    if (part === "器械" && parts.some((existing) => existing !== "器械")) return;
    if (!parts.includes(part)) parts.push(part);
  });

  const fallbackLabel = targetMuscle
    ? `${targetMuscle}${normalized.includes("stretch") ? "拉伸" : "训练"}`
    : bodyPart
      ? `${bodyPart}${normalized.includes("stretch") ? "拉伸" : "训练"}`
      : "";
  const basePart = translatedBase || fallbackLabel;
  if (basePart) {
    if (!parts.includes(basePart)) parts.push(basePart);
  } else if (bodyPart) {
    parts.push(`${bodyPart}训练`);
  } else if (equipment.length > 0) {
    parts.push(`${equipment[0]}训练`);
  } else {
    parts.push("训练");
  }

  const compacted = compressRepeatedChunks(uniqueTerms(parts).join("")).replace(/训练动作/g, "动作");
  return /[A-Za-z]{2,}/.test(compacted) ? (fallbackLabel || "训练") : compacted;
}

export function buildExerciseSearchTerms(input: ExerciseLocalizationInput) {
  const localizedName = localizeExerciseName(input);
  const terms = [
    input.name,
    localizedName,
    input.equipment,
    input.category,
    input.bodyPart,
    ...(input.primaryMuscles ?? []),
    ...(input.secondaryMuscles ?? [])
  ];
  return uniqueTerms(terms);
}
