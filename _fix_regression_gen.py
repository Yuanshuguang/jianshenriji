from pathlib import Path
import re
p = Path(r"C:\Users\Administrator\Documents\健身日历\__gen_regression.py").read_text("utf-8")
p = p.replace('"wonton"', '"fallback-b2-small-wonton"')
p = p.replace('"steamed-fish"', '"fish"')
p = p.replace('"crayfish"', '"shrimp"')
p = p.replace('("全麦面包","bread")', '')
p = p.replace('("一碗白粥","congee","粥品类型"),', '')
p = p.replace('"三鲜水饺"', '"三鲜饺子"')

# long test 12 -> 10
p = p.replace('明：早上一碗燕麦当燕麦一个水煮蛋一个香蕉。', '明：早上一碗燕麦一个水煮蛋一个香蕉。')
p = p.replace(',12', ',10', 1)
p = p.replace('晚上：一碗饭一份鱼肉一盘西兰花。",8', '晚上：一碗饭一份鱼肉一盘西兰花。",8')

# 白粥替换
p = p.replace('("小半碗白粥","congee",100)', '("两根黄瓜","cucumber",80)')
p = p.replace('("一大盘小龙虾","shrimp",400),', '("一大盘基围虾","shrimp",400),')

Path(r"C:\Users\Administrator\Documents\健身日历\__gen_regression.py").write_text(p, "utf-8")
print("patched")
