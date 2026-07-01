import re, sys

for fn in ['more.tsx', 'train.tsx']:
    p = f'C:\\Users\\Administrator\\Documents\\健身日历\\apps\\mobile\\app\\(tabs)\\{fn}'
    with open(p, 'r', encoding='utf-8-sig') as f:
        text = f.read()
    
    text = re.sub(r'^import \{[\s\S]*?cutePets[\s\S]*?\} from "../../features/pet";\n', '', text, count=1, flags=re.MULTILINE)
    text = text.replace('  PetReminderCard,', '')
    for old, new in [
        ('PetReminderCard', 'null'),
        ('ActivePet', 'any'),
        ('CustomPet', 'any'),
        ('PetPersonality', 'string'),
        ('PresetPet', 'any'),
        ('getPresetPetById', '(()=>null)'),
        ('generateTrainingReminder', '(()=>null)'),
        ('cutePets', '[]'),
        ('viralPets', '[]'),
        ('petPersonalityLabels', '{}'),
        ('petSourceLabels', '{}'),
        ('PetReminder', 'any'),
    ]:
        text = text.replace(old, new)
    
    text = re.sub(r'const (selectedPetId|customPet|petEnabled|setSelectedPet|setCustomPet|setPetEnabled) = useFitnessStore\(\(state\) => state\.\1\);', 
        lambda m: {"selectedPetId": 'const selectedPetId = null as string | null;', "customPet": 'const customPet = null;', "petEnabled": 'const petEnabled = false;', "setSelectedPet": 'const setSelectedPet = (_: any) => {};', "setCustomPet": 'const setCustomPet = (_: any) => {};', "setPetEnabled": 'const setPetEnabled = (_: any) => {};'}[m.group(1)], text)
    
    text = re.sub(r'const activePet: any = .*?\n  : null;\n  const trainingReminder = .*?\n    : null;', 'const activePet = null;\nconst trainingReminder = null;', text, flags=re.DOTALL)
    text = text.replace('<PetReminderCard reminder={trainingReminder} />', '')
    text = text.replace('petIcon', 'null')
    
    with open(p, 'w', encoding='utf-8') as f:
        f.write(text)
print('done')
