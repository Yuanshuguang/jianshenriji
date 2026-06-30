from pathlib import Path
p = Path(r'C:\Users\Administrator\Documents\健身日历\shared\index.ts')
t = p.read_text('utf-8')
# 替换重复
t = t.replace('  food("soy-milk"', '// food("soy-milk"')  # comment out duplicate soy-milk
lines = t.split('\n')
first_lemon = True
result = []
for l in lines:
    if 'food("lemon-water"' in l:
        if first_lemon:
            result.append(l)
            first_lemon = False
        else:
            continue  # skip duplicate
    else:
        result.append(l)
# 去掉重复的京酱肉丝
result = [l for l in result if '京酱肉丝盖饭2' not in l]
p.write_text('\n'.join(result), 'utf-8')
print('fixed')
