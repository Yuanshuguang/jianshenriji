from pathlib import Path
import json

d = Path(r'C:\Users\Administrator\Documents\健身日历')
enc = 'utf-8-sig'

def load(n):
    return json.loads((d / f'__data_{n}.json').read_text(encoding=enc))

meal = load('meal')
generic = load('generic')
specific = load('specific')
intact = load('intact')
noisy = load('noisy')
portion = load('portion')
abstract = load('abstract')
long = load('long')
unknown = load('unknown')
user = load('user')

blocks = [
    ('01-meal', meal, 'meal'),
    ('02-generic', generic, 'generic'),
    ('03-specific', specific, 'specific'),
    ('04-intact', intact, 'intact'),
    ('05-noisy', noisy, 'noisy'),
    ('06-portion', portion, 'portion'),
    ('07-abstract', abstract, 'portion'),
    ('08-long', long, 'long'),
    ('09-unknown', unknown, 'unknown'),
    ('10-user', user, 'user'),
]

all_lines = []
all_lines.append('import test from "node:test";')
all_lines.append('import assert from "node:assert/strict";')
all_lines.append('import { parseFoodIntelligence } from "../food-intelligence-engine";')
all_lines.append('')
total = sum(len(c) for _,c,_ in blocks)
all_lines.append(f'// regression: {total} cases')

def j(v):
    return json.dumps(v, ensure_ascii=False)

for name, cases, t in blocks:
    all_lines.append(f'// {name}: {len(cases)} cases')
    all_lines.append(f'test("{name}", () => {{')
    all_lines.append(f'  const c = {j(cases)};')
    if t == 'meal':
        all_lines.append('  for (const [input, expected] of c) {')
        all_lines.append('    const r = parseFoodIntelligence(input);')
        all_lines.append('    const m = new Map(r.items.map(x => [x.food.id, x.meal]));')
        all_lines.append('    let ok = true; let msg = "";')
        all_lines.append('    for (const [id, meal] of Object.entries(expected)) {')
        all_lines.append('      const a = m.get(id);')
        all_lines.append('      if (!a) { ok = false; msg = "missing " + id; break; }')
        all_lines.append('      if (a !== meal) { ok = false; msg = id + "=" + a + " exp " + meal; break; }')
        all_lines.append('    }')
        all_lines.append('    if (!ok) {')
        all_lines.append('      const got = [...m.entries()].map(([k, v]) => k + "=" + v).join(",");')
        all_lines.append('      assert.equal(ok, true, input + ": " + msg + " [" + got + "]");')
        all_lines.append('    }')
        all_lines.append('  }')
    elif t == 'generic':
        all_lines.append('  for (const [input, fid, grp] of c) {')
        all_lines.append('    const r = parseFoodIntelligence(input);')
        all_lines.append('    const m = r.items.find(x => x.food.id === fid);')
        all_lines.append('    assert.ok(m, input + ": expected " + fid);')
        all_lines.append('    assert.equal(m.needsDetails, true, input + ": generic needs details");')
        all_lines.append('    if (grp) assert.match(m.detailHint ?? "", new RegExp(grp), input + ": hint");')
        all_lines.append('  }')
    elif t == 'specific':
        all_lines.append('  for (const [input, fid] of c) {')
        all_lines.append('    const r = parseFoodIntelligence(input);')
        all_lines.append('    const m = r.items.find(x => x.food.id === fid);')
        all_lines.append('    assert.ok(m, input + ": expected " + fid);')
        all_lines.append('    assert.equal(m.needsDetails, false, input + ": specific NOT need details");')
        all_lines.append('  }')
    elif t == 'intact':
        all_lines.append('  for (const [input, exp, forbid] of c) {')
        all_lines.append('    const r = parseFoodIntelligence(input);')
        all_lines.append('    const ids = r.items.map(x => x.food.id);')
        all_lines.append('    for (const id of exp) assert.ok(ids.includes(id), input + ": missing " + id);')
        all_lines.append('    for (const id of forbid) assert.equal(ids.includes(id), false, input + ": forbid " + id);')
        all_lines.append('  }')
    elif t == 'noisy':
        all_lines.append('  for (const [input, exp] of c) {')
        all_lines.append('    const r = parseFoodIntelligence(input);')
        all_lines.append('    const ids = r.items.map(x => x.food.id);')
        all_lines.append('    for (const id of exp) assert.ok(ids.includes(id), input + ": missing " + id);')
        all_lines.append('  }')
    elif t == 'portion':
        all_lines.append('  for (const [input, fid, mn] of c) {')
        all_lines.append('    const r = parseFoodIntelligence(input);')
        all_lines.append('    const m = r.items.find(x => x.food.id === fid);')
        all_lines.append('    assert.ok(m, input + ": expected " + fid);')
        all_lines.append('    assert.ok(m.grams >= mn, input + ": grams=" + m.grams + " less than " + mn);')
        all_lines.append('  }')
    elif t == 'long':
        all_lines.append('  for (const [input, mn] of c) {')
        all_lines.append('    const r = parseFoodIntelligence(input);')
        all_lines.append('    assert.ok(r.items.length >= mn, input + ": items=" + r.items.length + " less than " + mn);')
        all_lines.append('  }')
    elif t == 'unknown':
        all_lines.append('  for (const [input, um] of c) {')
        all_lines.append('    const r = parseFoodIntelligence(input);')
        all_lines.append('    if (um > 0) assert.ok(r.unmatched.length >= um, input + ": unmatched=" + r.unmatched.length + " less than " + um);')
        all_lines.append('  }')
    elif t == 'user':
        all_lines.append('  for (const [input, exp, forbid] of c) {')
        all_lines.append('    const r = parseFoodIntelligence(input);')
        all_lines.append('    const ids = r.items.map(x => x.food.id);')
        all_lines.append('    for (const id of exp) assert.ok(ids.includes(id), input + ": missing " + id);')
        all_lines.append('    for (const id of forbid) assert.equal(ids.includes(id), false, input + ": forbid " + id);')
        all_lines.append('  }')
    all_lines.append('});')
    all_lines.append('')

dst = d / 'apps' / 'mobile' / 'features' / '__tests__' / 'food-regression-200.test.ts'
dst.write_text('\n'.join(all_lines), encoding='utf-8')
print(f'Done: {total} cases, {len(all_lines)} lines, {dst.stat().st_size} bytes')