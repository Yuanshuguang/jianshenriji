from pathlib import Path
import re
from collections import Counter
t = Path(r"C:\Users\Administrator\Documents\健身日历\shared\index.ts").read_text("utf-8")
ids = re.findall(r'food\("([^"]+)"', t)
c = Counter(ids)
for k, v in c.items():
    if v > 1:
        print(f"DUPLICATE ID: {k} appears {v} times")
if all(v == 1 for v in c.values()):
    print("no duplicate IDs found")
