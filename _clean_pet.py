import sys
p = sys.argv[1]
with open(p, 'r', encoding='utf-8-sig') as f:
    lines = f.readlines()
kw = ['from "../../features/pet"', 'cutePets', 'viralPets', 'getPresetPetById', 'petPersonalityLabels', 'petSourceLabels', 'ActivePet', 'CustomPet', 'PetPersonality', 'PresetPet', 'selectedPetId', 'customPet', 'petEnabled', 'setSelectedPet', 'setCustomPet', 'setPetEnabled', 'activePet:', 'petExpanded', 'setPetExpanded', 'setPetTab', 'petTab', 'customPetDraft', 'setCustomPetDraft', 'petMessage', 'setPetMessage', 'petImageInputRef', 'handleSelectPreset', 'handleClearPet', 'openPetImagePicker', 'onPetImageSelected', 'handleSaveCustomPet', 'allowedPetImageTypes', 'maxPetImageBytes', 'petIcon', 'PetChip']
drop = set()
for i, l in enumerate(lines):
    for k in kw:
        if k in l:
            drop.add(i)
            break
out = [l for i, l in enumerate(lines) if i not in drop]
with open(p, 'w', encoding='utf-8') as f:
    f.writelines(out)
print(f'removed {len(lines) - len(out)} lines')
