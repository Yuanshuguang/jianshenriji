import re
p = r'C:\Users\Administrator\Documents\健身日历\apps\mobile\app\(tabs)\train.tsx'
with open(p, 'r', encoding='utf-8-sig') as f:
    text = f.read()
text = re.sub(r'^import \{ generateTrainingReminder, getPresetPetById, type ActivePet \} from "\.\./\.\./features/pet";\n', '', text, count=1, flags=re.MULTILINE)
text = re.sub(r'  PetReminderCard,', '', text)
text = re.sub(r'  const activePet: ActivePet = .*?\n  : null;\n  const trainingReminder = activePet\n    \? generateTrainingReminder.*?\n    : null;', '', text, flags=re.DOTALL)
text = re.sub(r'      <PetReminderCard reminder=\{trainingReminder\} />\n', '', text)
with open(p, 'w', encoding='utf-8') as f:
    f.write(text)
print('done')
