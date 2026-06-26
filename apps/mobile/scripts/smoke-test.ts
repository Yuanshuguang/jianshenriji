import { parseFoodIntelligence } from "../../apps/mobile/features/food-intelligence-engine";
const tests = ['排骨','鸡腿','茄子','豆角','冬瓜','柚子','柠檬','珍珠奶茶','美式咖啡','回锅肉','鱼香肉丝','凉拌黄瓜','皮蛋豆腐','辣条','果冻','牛肉干','小米粥','花卷','过桥米线','酸辣粉','螺蛳粉','猪蹄','牛腩','三文鱼','紫菜蛋花汤','排骨汤','绿豆汤','冰糖葫芦','蛋黄酥','冰红茶','椰汁','自热火锅','速冻水饺','叉烧包','流沙包','葱油饼','韭菜盒子','豆浆','油条'];
let ok=0,m=0;for(const t of tests){const r=parseFoodIntelligence(t);if(r.items.length>0){ok++;console.log('OK: '+t+' -> '+r.items[0].food.name)}else{m++;console.log('MISS: '+t)}}console.log('\n'+ok+'/'+tests.length+' OK, '+m+' MISS');
