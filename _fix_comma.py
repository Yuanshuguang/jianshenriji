from pathlib import Path
p = Path(r'C:\Users\Administrator\Documents\健身日历\shared\index.ts')
t = p.read_text('utf-8')
# 移除注释掉的 soy-milk 行和孤立的逗号
t = t.replace('// food("soy-milk", "豆浆", ["豆奶", "无糖豆浆", "甜豆浆", "原味豆浆", "黄豆浆"], "drink", 32, 1.8, 0.7, 1.1, 250, [["杯", 250], ["碗", 250], ["袋", 200], ["盒", 250]]),\n,', '')
p.write_text(t, 'utf-8')
print('fixed')
