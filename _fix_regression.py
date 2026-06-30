from pathlib import Path
p = Path(r"C:\Users\Administrator\Documents\健身日历\__gen_regression.py").read_text("utf-8")
p = p.replace(',\n    ,("菠萝包","bread-bun")', ',\n    ("菠萝包","bread-bun")')
p = p.replace(',\n    ,"', ',\n    "')
Path(r"C:\Users\Administrator\Documents\健身日历\__gen_regression.py").write_text(p, "utf-8")
print("fixed comma")
