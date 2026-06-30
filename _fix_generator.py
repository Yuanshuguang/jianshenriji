import json, re
src = open(r"C:\Users\Administrator\Documents\健身日历\__gen_regression.py","r",encoding="utf-8").read()
src = src.replace('soy-milk','doujiang').replace('oat-bread','bread')
src = src.replace('"braised-beef"','"beef"')
src = src.replace('["beef"],["beef"]','["beef"],[]')
src = src.replace('"popcorn"','"crayfish"')
open(r"C:\Users\Administrator\Documents\健身日历\__gen_regression.py","w",encoding="utf-8").write(src)
print("fixed")
