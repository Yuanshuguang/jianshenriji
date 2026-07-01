import re, sys
for fn in ['train.tsx', 'more.tsx']:
    p = f'C:\\Users\\Administrator\\Documents\\健身日历\\apps\\mobile\\app\\(tabs)\\{fn}'
    with open(p, 'r', encoding='utf-8-sig') as f:
        text = f.read()
    text = re.sub(r'  const activePet: ActivePet = customPet\n    \? \{ kind: \"custom\", pet: customPet \}\n    : selectedPetId\n      \? \{ kind: \"preset\", pet: getPresetPetById\(selectedPetId\)! \}\n      : null;', '', text)
    text = re.sub(r'  const trainingReminder = activePet\n    \? generateTrainingReminder.*?\n    : null;', '', text, flags=re.DOTALL)
    text = re.sub(r'      <PetReminderCard reminder=\{trainingReminder\} />\n', '', text)
    text = re.sub(r'  const petIcon = activePet\?.*?;\n', '', text)
    with open(p, 'w', encoding='utf-8') as f:
        f.write(text)
print('done')
