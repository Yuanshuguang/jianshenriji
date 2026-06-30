from pathlib import Path,os
import json,subprocess
d = Path(r'C:\Users\Administrator\Documents\健身日历')
t = (d / '__data_specific.json').read_text(encoding='utf-8-sig')
data = json.loads(t)
data = [c for c in data if c[0] != '麻辣火锅']
(data / '__data_specific.json') if False else None  # just remove
(d / '__data_specific.json').write_text(json.dumps(data, ensure_ascii=False), encoding='utf-8')
r = subprocess.run(['py','-X','utf8',str(d/'_assemble.py')], capture_output=True, text=True)
print(r.stdout.strip())
