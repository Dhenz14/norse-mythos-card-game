import re

# Define the file path
file_path = 'client/src/game/data/neutralMinions.ts'

# Read the file content
with open(file_path, 'r', encoding='utf-8') as file:
    content = file.read()

# Define target type replacements
replacements = [
    (r'targetType: "any"', 'targetType: BattlecryTargetType.ANY'),
    (r'targetType: "friendly_minion"', 'targetType: BattlecryTargetType.FRIENDLY_MINION'),
    (r'targetType: "all_friendly"', 'targetType: BattlecryTargetType.ALL'),
    (r'targetType: "friendly_mech"', 'targetType: BattlecryTargetType.MECH'),
    (r'targetType: "any_minion"', 'targetType: BattlecryTargetType.ANY_MINION'),
    (r'targetType: "all_minions"', 'targetType: BattlecryTargetType.ALL_MINIONS'),
    (r'targetType: "all_enemy_minions"', 'targetType: BattlecryTargetType.ALL_ENEMY_MINIONS'),
    (r'targetType: "friendly_hero"', 'targetType: BattlecryTargetType.FRIENDLY_HERO'),
    (r'targetType: "enemy_hero"', 'targetType: BattlecryTargetType.ENEMY_HERO'),
    (r'targetType: "any_hero"', 'targetType: BattlecryTargetType.ANY_HERO'),
]

# Apply replacements
for old, new in replacements:
    content = re.sub(old, new, content)

# Write the updated content back to the file
with open(file_path, 'w', encoding='utf-8') as file:
    file.write(content)

print("Target type replacements completed successfully!")