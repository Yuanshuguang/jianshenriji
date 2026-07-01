import re, sys
p = sys.argv[1]
with open(p, 'r', encoding='utf-8-sig') as f:
    text = f.read()
# Remove pet import lines
text = re.sub(r'^import \{[^}]*(?:cutePets|viralPets|getPresetPetById|petPersonalityLabels|petSourceLabels|ActivePet|CustomPet|PetPersonality|PresetPet)[^}]*\} from "../../features/pet";\n', '', text, count=1, flags=re.MULTILINE)
# Remove the entire 宠物伴侣 section (from comment to just before 健康数据)
text = re.sub(r'/\* ===== 宠物伴侣 ===== \*/.*?(?=/\* ===== 健康数据 ===== \*/)', '', text, count=1, flags=re.DOTALL)
# Remove PetChip function 
text = re.sub(r'\ndef PetChip\(.*?(?=\nfunction |\Z)', '', text, count=1, flags=re.DOTALL)
with open(p, 'w', encoding='utf-8') as f:
    f.write(text)
print('done')
