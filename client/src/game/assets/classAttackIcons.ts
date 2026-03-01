export const CLASS_ATTACK_ICONS: Record<string, string> = {
  mage: '/icons/class/mage_arcane_orb_attack_icon.png',
  warlock: '/icons/class/warlock_fel_flame_attack_icon.png',
  necromancer: '/icons/class/necromancer_skull_attack_icon.png',
  warrior: '/icons/class/warrior_battle_axe_attack_icon.png',
  deathknight: '/icons/class/death_knight_frost_rune_icon.png',
  death_knight: '/icons/class/death_knight_frost_rune_icon.png',
  paladin: '/icons/class/paladin_divine_shield_attack_icon.png',
  priest: '/icons/class/priest_holy_light_attack_icon.png',
  druid: '/icons/class/druid_nature_claw_attack_icon.png',
  shaman: '/icons/class/shaman_thunder_totem_attack_icon.png',
  rogue: '/icons/class/rogue_shadow_dagger_attack_icon.png',
  hunter: '/icons/class/hunter_beast_fang_attack_icon.png',
  demonhunter: '/icons/class/demon_hunter_fel_glaive_icon.png',
  demon_hunter: '/icons/class/demon_hunter_fel_glaive_icon.png',
};

import { assetPath } from '../utils/assetPath';

export const getClassAttackIcon = (heroClass: string): string | null => {
  const normalizedClass = heroClass.toLowerCase().replace(/[_\s]/g, '');
  const icon = CLASS_ATTACK_ICONS[normalizedClass] || CLASS_ATTACK_ICONS[heroClass.toLowerCase()] || null;
  return icon ? assetPath(icon) : null;
};
