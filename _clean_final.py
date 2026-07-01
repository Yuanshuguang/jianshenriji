import re, sys

def apply_replacements(filepath):
    with open(filepath, 'r', encoding='utf-8-sig') as f:
        lines = f.readlines()
    
    # Remove import line for pet
    new_lines = []
    for l in lines:
        if 'from "../../features/pet"' in l:
            continue
        new_lines.append(l)
    lines = new_lines
    
    # Process each line
    for i, l in enumerate(lines):
        # Remove PetReminderCard from imports
        if 'PetReminderCard,' in l and 'bento' not in l:
            lines[i] = l.replace('PetReminderCard,', '')
        
        # Replace type references - use string replace carefully
        pass
    
    # Do global replacements
    text = '\n'.join(lines)
    text = text.replace('PetReminderCard,', '')
    text = text.replace('ActivePet', 'any')
    text = text.replace('PetPersonality', 'string')
    text = text.replace('CustomPet', 'any')
    text = text.replace('PresetPet', 'any')
    text = text.replace('getPresetPetById', '(() => null)')
    text = text.replace('cutePets', '[]')
    text = text.replace('viralPets', '[]')
    text = text.replace('petPersonalityLabels', '{}')
    text = text.replace('petSourceLabels', '{}')
    text = text.replace('generateTrainingReminder', '(() => null)')
    
    # Re-split for line-level store hooks
    lines2 = text.split('\n')
    for i, l in enumerate(lines2):
        stripped = l.strip()
        if 'useFitnessStore' in l:
            if 'selectedPetId' in l:
                lines2[i] = '  const selectedPetId = null as string | null;'
            elif 'customPet' in l:
                lines2[i] = '  const customPet = null;'
            elif 'petEnabled' in l:
                lines2[i] = '  const petEnabled = false;'
            elif 'setSelectedPet' in l:
                lines2[i] = '  const setSelectedPet = (_: any) => {};'
            elif 'setCustomPet' in l:
                lines2[i] = '  const setCustomPet = (_: any) => {};'
            elif 'setPetEnabled' in l:
                lines2[i] = '  const setPetEnabled = (_: any) => {};'
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines2))

apply_replacements(sys.argv[1])
print('done')
