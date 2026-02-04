/**
 * Script to fix specific broken string literals in neutralMinions.ts
 */
const fs = require('fs');

const filePath = './client/src/game/data/neutralMinions.ts';

if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

console.log(`Processing ${filePath}...`);

// Create backup
const backupPath = `${filePath}.backup.${Date.now()}`;
const content = fs.readFileSync(filePath, 'utf8');
fs.writeFileSync(backupPath, content);

// Create replacement pairs for specific broken strings
const replacements = [
  // Primordial Drake
  {
    from: 'description: "Taunt. Battlecr,\n\n    y: Deal 2 damage to all other minions."',
    to: 'description: "Taunt. Battlecry: Deal 2 damage to all other minions."'
  },
  // Charged Devilsaur
  {
    from: 'description: "Charge. Battlecr,\n\n    y: Can\'t attack heroes this turn."',
    to: 'description: "Charge. Battlecry: Can\'t attack heroes this turn."'
  },
  // Stonehill Defender
  {
    from: 'description: "Taunt. Battlecr,\n\n    y: Discover a Taunt minion."',
    to: 'description: "Taunt. Battlecry: Discover a Taunt minion."'
  },
  // Earthen Ring Farseer
  {
    from: 'description: "Battlecr,\n\n    y: Restore 3 Health."',
    to: 'description: "Battlecry: Restore 3 Health."'
  },
  // Coldlight Oracle
  {
    from: 'description: "Battlecr,\n\n    y: Each player draws 2 cards."',
    to: 'description: "Battlecry: Each player draws 2 cards."'
  },
  // Faceless Manipulator
  {
    from: 'description: "Battlecr,\n\n    y: Choose a minion and become a copy of it."',
    to: 'description: "Battlecry: Choose a minion and become a copy of it."'
  },
  // Twilight Drake
  {
    from: 'description: "Battlecr,\n\n    y: Gain +1 Health for each card in your hand."',
    to: 'description: "Battlecry: Gain +1 Health for each card in your hand."'
  },
  // Gentle Megasaur
  {
    from: 'description: "Battlecr,\n\n    y: Adapt your Murlocs."',
    to: 'description: "Battlecry: Adapt your Murlocs."'
  },
  // Spiteful Summoner
  {
    from: 'description: "Battlecr,\n\n    y: Reveal a spell from your deck. Summon a random minion with the same Cost."',
    to: 'description: "Battlecry: Reveal a spell from your deck. Summon a random minion with the same Cost."'
  },
  // Carnivorous Cube
  {
    from: 'description: "Battlecry: Destroy a friendly minion. Deathrattl,\n\n    e: Summon 2 copies of it."',
    to: 'description: "Battlecry: Destroy a friendly minion. Deathrattle: Summon 2 copies of it."'
  },
  // Void Ripper
  {
    from: 'description: "Battlecr,\n\n    y: Swap the Attack and Health of all other minions."',
    to: 'description: "Battlecry: Swap the Attack and Health of all other minions."'
  },
  // Skulking Geist
  {
    from: 'description: "Battlecr,\n\n    y: Destroy all 1-Cost spells in both hands and decks."',
    to: 'description: "Battlecry: Destroy all 1-Cost spells in both hands and decks."'
  },
  // Gluttonous Ooze
  {
    from: 'description: "Battlecr,\n\n    y: Destroy your opponent\'s weapon and gain Armor equal to its Attack."',
    to: 'description: "Battlecry: Destroy your opponent\'s weapon and gain Armor equal to its Attack."'
  },
  // Blood Knight
  {
    from: 'description: "Battlecr,\n\n    y: All minions lose Divine Shield. Gain +3/+3 for each Shield lost."',
    to: 'description: "Battlecry: All minions lose Divine Shield. Gain +3/+3 for each Shield lost."'
  },
  // Ancient Shade
  {
    from: 'description: "Battlecr,\n\n    y: Shuffle an \'Ancient Curse\' into your deck that deals 7 damage to you when drawn."',
    to: 'description: "Battlecry: Shuffle an \'Ancient Curse\' into your deck that deals 7 damage to you when drawn."'
  },
  // Blazecaller
  {
    from: 'description: "Battlecr,\n\n    y: If you played an Elemental last turn, deal 5 damage."',
    to: 'description: "Battlecry: If you played an Elemental last turn, deal 5 damage."'
  },
  // Servant of Kalimos
  {
    from: 'description: "Battlecr,\n\n    y: If you played an Elemental last turn, Discover an Elemental."',
    to: 'description: "Battlecry: If you played an Elemental last turn, Discover an Elemental."'
  },
  // Fight Promoter
  {
    from: 'description: "Battlecr,\n\n    y: If you control a minion with 6 or more Health, draw 2 cards."',
    to: 'description: "Battlecry: If you control a minion with 6 or more Health, draw 2 cards."'
  },
  // Darkspeaker
  {
    from: 'description: "Battlecr,\n\n    y: Swap stats with a friendly minion."',
    to: 'description: "Battlecry: Swap stats with a friendly minion."'
  },
  // Scrapyard Colossus
  {
    from: 'description: "Taunt. Deathrattl,\n\n    e: Summon a 7/7 Felcracked Colossus with Taunt."',
    to: 'description: "Taunt. Deathrattle: Summon a 7/7 Felcracked Colossus with Taunt."'
  },
  // Omega Devastator
  {
    from: 'description: "Battlecr,\n\n    y: If you have 10 Mana Crystals, deal 10 damage to a minion."',
    to: 'description: "Battlecry: If you have 10 Mana Crystals, deal 10 damage to a minion."'
  },
  // Muckmorpher
  {
    from: 'description: "Battlecr,\n\n    y: Transform into a 4/4 copy of a different minion in your deck."',
    to: 'description: "Battlecry: Transform into a 4/4 copy of a different minion in your deck."'
  },
  // Hench-Clan Hag
  {
    from: 'description: "Battlecr,\n\n    y: Summon two 1/1 Amalgams with all minion types."',
    to: 'description: "Battlecry: Summon two 1/1 Amalgams with all minion types."'
  }
];

// Apply all replacements
let fixedContent = content;
for (const { from, to } of replacements) {
  fixedContent = fixedContent.replace(from, to);
}

// Write the fixed content back to the file
fs.writeFileSync(filePath, fixedContent);
console.log(`Successfully fixed ${filePath}`);