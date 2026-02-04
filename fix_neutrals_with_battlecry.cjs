/**
 * Comprehensive fix for neutralSpellsAndTech.ts battlecry indentation issues
 */
const fs = require('fs');

// Log function
function log(message, level = 'info') {
  const prefix = level === 'error' ? '❌ ERROR: ' : 
                 level === 'warning' ? '⚠️ WARNING: ' : 
                 '✅ INFO: ';
  console.log(prefix + message);
}

// Path to file
const filePath = 'client/src/game/data/neutralSpellsAndTech.ts';

async function fixFile() {
  try {
    log('Reading file...');
    const content = await fs.promises.readFile(filePath, 'utf8');
    
    // Create backup
    const backupPath = `${filePath}.backup-${Date.now()}`;
    await fs.promises.writeFile(backupPath, content, 'utf8');
    log(`Created backup at ${backupPath}`);
    
    // Fix the Hungry Crab battlecry section
    let fixedContent = content.replace(
      /race: "beast",\s*\n\s*battlecry: {\s*type: "destroy_tribe",\s*\n\s*tribe: "murloc",\s*buffs: {\s*attack: 2,\s*health: 2\s*},\s*requiresTarget: true,\s*\n\s*targetType: "murloc"\s*},\s*collectible: true/g,
      `race: "beast",
      battlecry: {
        type: "destroy_tribe",
        tribe: "murloc",
        buffs: {
          attack: 2,
          health: 2
        },
        requiresTarget: true,
        targetType: "murloc"
      },
      collectible: true`
    );
    
    // Fix the Golakka Crawler battlecry section
    fixedContent = fixedContent.replace(
      /race: "beast",\s*\n\s*battlecry: {\s*type: "destroy_tribe",\s*\n\s*tribe: "pirate",\s*buffs: {\s*attack: 1,\s*health: 1\s*},\s*requiresTarget: true,\s*\n\s*targetType: "pirate"\s*},\s*collectible: true/g,
      `race: "beast",
      battlecry: {
        type: "destroy_tribe",
        tribe: "pirate",
        buffs: {
          attack: 1,
          health: 1
        },
        requiresTarget: true,
        targetType: "pirate"
      },
      collectible: true`
    );
    
    // Write the fixed content back
    await fs.promises.writeFile(filePath, fixedContent, 'utf8');
    
    log('Fixed indentation issues in neutralSpellsAndTech.ts battlecry sections');
    return { success: true };
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

// Execute the fix
fixFile()
  .then(result => {
    if (result.success) {
      log('Successfully fixed issues');
    } else {
      log(`Failed: ${result.error}`, 'error');
      process.exit(1);
    }
  })
  .catch(error => {
    log(`Unexpected error: ${error.message}`, 'error');
    process.exit(1);
  });