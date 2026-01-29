#!/bin/bash

# Define a sed command that works regardless of platform
SED_CMD="sed -i"
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS uses a different sed syntax
  SED_CMD="sed -i ''"
fi

# Modify all createGameLogEvent calls with the new format
$SED_CMD 's/createGameLogEvent({[^}]*type: \([^,]*\)[^,]*,[^}]*player: \([^,]*\)[^,]*,[^}]*text: `\([^`]*\)`[^}]*\(,[^}]*cardId: \([^,]*\)[^,]*\)\?[^}]*\(,[^}]*targetId: \([^,]*\)[^,]*\)\?[^}]*\(,[^}]*value: \([^,]*\)[^,]*\)\?[^}]*})/createGameLogEvent(\n      newState,\n      \1 as GameLogEventType,\n      \2,\n      `\3`,\n      { \4 \6 \8 }\n    )/g' client/src/game/utils/highlanderUtils.ts

# Clean up the options object (fix trailing commas, missing entries, etc.)
$SED_CMD 's/{ , , }/{ }/g' client/src/game/utils/highlanderUtils.ts
$SED_CMD 's/{\s*cardId: \([^,]*\),\s*,\s*}/{ cardId: \1 }/g' client/src/game/utils/highlanderUtils.ts
$SED_CMD 's/{\s*,\s*targetId: \([^,]*\),\s*}/{ targetId: \1 }/g' client/src/game/utils/highlanderUtils.ts
$SED_CMD 's/{\s*,\s*,\s*value: \([^,]*\)\s*}/{ value: \1 }/g' client/src/game/utils/highlanderUtils.ts
$SED_CMD 's/{\s*cardId: \([^,]*\),\s*targetId: \([^,]*\),\s*}/{ cardId: \1, targetId: \2 }/g' client/src/game/utils/highlanderUtils.ts
$SED_CMD 's/{\s*cardId: \([^,]*\),\s*,\s*value: \([^,]*\)\s*}/{ cardId: \1, value: \2 }/g' client/src/game/utils/highlanderUtils.ts
$SED_CMD 's/{\s*,\s*targetId: \([^,]*\),\s*value: \([^,]*\)\s*}/{ targetId: \1, value: \2 }/g' client/src/game/utils/highlanderUtils.ts

echo "Fixes applied to highlanderUtils.ts"
