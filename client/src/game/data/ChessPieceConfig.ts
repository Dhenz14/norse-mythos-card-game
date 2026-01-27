/**
 * ChessPieceConfig.ts
 * 
 * Maps chess pieces to hero variants. Deck cards are now user-built via heroDeckStore (30 cards per hero).
 * Each spellcasting piece (Queen, Rook, Bishop, Knight) can have custom decks.
 * Kings and Pawns have NO spells.
 */

import { ChessPieceType, ChessPieceHero, ArmySelection } from '../types/ChessTypes';
import { HeroClass } from '../types';

type LowercaseHeroClass = 'mage' | 'warrior' | 'priest' | 'rogue' | 'paladin' | 
  'hunter' | 'druid' | 'warlock' | 'shaman' | 'demonhunter' | 'deathknight' | 
  'necromancer' | 'neutral';

/**
 * Chess piece to Hearthstone hero class mapping
 */
export const PIECE_HERO_CLASS_MAP: Record<ChessPieceType, HeroClass | null> = {
  queen: 'mage',
  rook: 'warrior',
  bishop: 'priest',
  knight: 'rogue',
  king: 'paladin',
  pawn: null
};

/**
 * Hero variants for each chess piece type
 * Players can choose different heroes for each piece slot
 */
export interface ChessPieceHeroConfig {
  pieceType: ChessPieceType;
  defaultHeroClass: HeroClass;
  variants: ChessPieceHero[];
}

/**
 * Available heroes for each chess piece type
 */
export const CHESS_PIECE_HEROES: Record<ChessPieceType, ChessPieceHero[]> = {
  queen: [
    // ===== NORSE HEROES - QUEEN (Wisdom/Magic) =====
    // Uses Mage, Warlock, and Necromancer spell pools
    {
      id: 'hero-odin',
      name: 'Odin',
      heroClass: 'mage',
      description: 'The Allfather: Reveal enemy cards and draw with ravens wisdom.',
      fixedCardIds: [],
      element: 'light',
      norseHeroId: 'hero-odin',
      portrait: '/portraits/heroes/odin.png'
    },
    {
      id: 'hero-bragi',
      name: 'Bragi',
      heroClass: 'mage',
      description: 'God of Poetry: Buff allies with inspiring verse.',
      fixedCardIds: [],
      element: 'light',
      norseHeroId: 'hero-bragi'
    },
    {
      id: 'hero-kvasir',
      name: 'Kvasir',
      heroClass: 'mage',
      description: 'God of Wisdom: Copy opponent\'s strategies and turn them against them.',
      fixedCardIds: [],
      element: 'light',
      norseHeroId: 'hero-kvasir',
      portrait: '/portraits/heroes/kvasir.png'
    },
    {
      id: 'hero-forseti',
      name: 'Forseti',
      heroClass: 'warlock',
      description: 'God of Justice: Grant divine shield and protect the righteous.',
      fixedCardIds: [],
      element: 'light',
      norseHeroId: 'hero-forseti'
    },
    {
      id: 'hero-mani',
      name: 'Mani',
      heroClass: 'warlock',
      description: 'God of the Moon: Apply stealth and strike from darkness.',
      fixedCardIds: [],
      element: 'dark',
      norseHeroId: 'hero-mani'
    },
    {
      id: 'hero-sol',
      name: 'Sol',
      heroClass: 'necromancer',
      description: 'Goddess of the Sun: Buff allies with radiant light.',
      fixedCardIds: [],
      element: 'fire',
      norseHeroId: 'hero-sol',
      portrait: '/portraits/heroes/sol.png'
    },
    {
      id: 'hero-sinmara',
      name: 'Sinmara',
      heroClass: 'necromancer',
      description: 'Giantess of Muspelheim: Deal fire damage to all enemies.',
      fixedCardIds: [],
      element: 'fire',
      norseHeroId: 'hero-sinmara',
      portrait: '/portraits/heroes/sinmara.png'
    },
    {
      id: 'hero-eldrin',
      name: 'Eldrin',
      heroClass: 'mage',
      description: 'Ember Mage: Burn enemies with escalating fire damage.',
      fixedCardIds: [],
      element: 'fire',
      norseHeroId: 'hero-eldrin'
    },
    {
      id: 'hero-thryma',
      name: 'Thryma',
      heroClass: 'warlock',
      description: 'Storm Caller: Deal damage and bounce surviving enemies.',
      fixedCardIds: [],
      element: 'electric',
      norseHeroId: 'hero-thryma'
    },
    // ===== GREEK HEROES =====
    {
      id: 'hero-zeus',
      name: 'Zeus',
      heroClass: 'mage',
      description: 'King of the Gods: Deal lightning damage to enemies.',
      fixedCardIds: [],
      element: 'electric',
      norseHeroId: 'hero-zeus',
      portrait: '/portraits/heroes/zeus.png'
    },
    {
      id: 'hero-athena',
      name: 'Athena',
      heroClass: 'mage',
      description: 'Goddess of Wisdom: Strategic buffs and divine protection.',
      fixedCardIds: [],
      element: 'light',
      norseHeroId: 'hero-athena',
      portrait: '/portraits/heroes/athena.png'
    },
    {
      id: 'hero-hyperion',
      name: 'Hyperion',
      heroClass: 'mage',
      description: 'Titan of Light: Radiant power and burning brilliance.',
      fixedCardIds: [],
      element: 'light',
      norseHeroId: 'hero-hyperion',
      portrait: '/portraits/heroes/hyperion.png'
    },
    {
      id: 'hero-uranus',
      name: 'Uranus',
      heroClass: 'mage',
      description: 'Primordial Sky: Command the heavens above.',
      fixedCardIds: [],
      element: 'light',
      norseHeroId: 'hero-uranus'
    },
    {
      id: 'hero-chronos',
      name: 'Chronos',
      heroClass: 'mage',
      description: 'Titan of Time: Manipulate time and fate itself.',
      fixedCardIds: [],
      element: 'light',
      norseHeroId: 'hero-chronos',
      portrait: '/portraits/heroes/chronos.png'
    },
    {
      id: 'hero-hades',
      name: 'Hades',
      heroClass: 'warlock',
      description: 'Lord of the Underworld: Command the dead and shadows.',
      fixedCardIds: [],
      element: 'dark',
      norseHeroId: 'hero-hades',
      portrait: '/portraits/heroes/hades.png'
    },
    {
      id: 'hero-dionysus',
      name: 'Dionysus',
      heroClass: 'warlock',
      description: 'God of Wine: Intoxicate enemies and empower allies.',
      fixedCardIds: [],
      element: 'grass',
      norseHeroId: 'hero-dionysus'
    },
    {
      id: 'hero-tartarus',
      name: 'Tartarus',
      heroClass: 'warlock',
      description: 'Primordial Abyss: Imprison enemies in eternal darkness.',
      fixedCardIds: [],
      element: 'dark',
      norseHeroId: 'hero-tartarus',
      portrait: '/portraits/heroes/tartarus.png'
    },
    {
      id: 'hero-persephone',
      name: 'Persephone',
      heroClass: 'warlock',
      description: 'Queen of the Underworld: Balance life and death.',
      fixedCardIds: [],
      element: 'dark',
      norseHeroId: 'hero-persephone'
    },
    {
      id: 'hero-hel',
      name: 'Hel',
      heroClass: 'necromancer',
      description: 'Goddess of the Underworld: Summon Draugr and harvest souls from the dead.',
      fixedCardIds: [],
      element: 'dark',
      norseHeroId: 'hero-hel',
      portrait: '/portraits/heroes/persephone.png'
    },
    {
      id: 'hero-logi',
      name: 'Logi',
      heroClass: 'mage',
      description: 'Fire Giant: The consuming flame incarnate, dealing random fire damage.',
      fixedCardIds: [],
      element: 'fire',
      norseHeroId: 'hero-logi',
      portrait: '/portraits/heroes/logi.png'
    },
    // ===== JAPANESE (SHINTO) HEROES =====
    {
      id: 'hero-izanami',
      name: 'Izanami',
      heroClass: 'warlock',
      description: 'Ruler of Yomi: Sacrifice minions to summon spectral shades.',
      fixedCardIds: [],
      element: 'dark',
      norseHeroId: 'hero-izanami'
    },
    {
      id: 'hero-fujin',
      name: 'Fujin',
      heroClass: 'mage',
      description: 'Wind God: Control the battlefield with gusts and storms.',
      fixedCardIds: [],
      element: 'grass',
      norseHeroId: 'hero-fujin'
    },
    // ===== EGYPTIAN HEROES =====
    {
      id: 'hero-ammit',
      name: 'Ammit',
      heroClass: 'warlock',
      description: 'Devourer of Souls: Destroy weak enemies and consume their essence.',
      fixedCardIds: [],
      element: 'dark',
      norseHeroId: 'hero-ammit'
    },
    {
      id: 'hero-shu',
      name: 'Shu',
      heroClass: 'mage',
      description: 'God of Air: Bounce enemies to their hand with powerful gusts.',
      fixedCardIds: [],
      element: 'light',
      norseHeroId: 'hero-shu'
    }
  ],
  rook: [
    // ===== NORSE HEROES - ROOK (Strength/Power) =====
    // Uses Warrior, Death Knight, and Paladin spell pools
    {
      id: 'hero-thor',
      name: 'Thor',
      heroClass: 'warrior',
      description: 'God of Thunder: Deal massive AoE damage with lightning.',
      fixedCardIds: [],
      element: 'electric',
      norseHeroId: 'hero-thor',
      portrait: '/portraits/heroes/thor.png'
    },
    {
      id: 'hero-thorgrim',
      name: 'Thorgrim',
      heroClass: 'warrior',
      description: 'Thunder Warrior: Strike hard and fast with electric fury.',
      fixedCardIds: [],
      element: 'electric',
      norseHeroId: 'hero-thorgrim'
    },
    {
      id: 'hero-valthrud',
      name: 'Valthrud',
      heroClass: 'warrior',
      description: 'Storm Shaman: Chain lightning between enemies.',
      fixedCardIds: [],
      element: 'electric',
      norseHeroId: 'hero-valthrud'
    },
    {
      id: 'hero-magni',
      name: 'Magni',
      heroClass: 'deathknight',
      description: 'God of Strength: Buff ally attack for devastating blows.',
      fixedCardIds: [],
      element: 'fire',
      norseHeroId: 'hero-magni',
      portrait: '/portraits/heroes/magni.png'
    },
    {
      id: 'hero-brakki',
      name: 'Brakki',
      heroClass: 'deathknight',
      description: 'Forge Master: Buff weapons and armor for your army.',
      fixedCardIds: [],
      element: 'fire',
      norseHeroId: 'hero-brakki',
      portrait: '/portraits/heroes/brakki.png'
    },
    {
      id: 'hero-tyr',
      name: 'Tyr',
      heroClass: 'paladin',
      description: 'God of War: Sacrifice to buff your strongest ally.',
      fixedCardIds: [],
      element: 'light',
      norseHeroId: 'hero-tyr',
      portrait: '/portraits/heroes/tyr.png'
    },
    {
      id: 'hero-vidar',
      name: 'Vidar',
      heroClass: 'paladin',
      description: 'God of Vengeance: Gain power when allies fall.',
      fixedCardIds: [],
      element: 'light',
      norseHeroId: 'hero-vidar',
      portrait: '/portraits/heroes/vidar.png'
    },
    {
      id: 'hero-heimdall',
      name: 'Heimdall',
      heroClass: 'paladin',
      description: 'Guardian of Bifrost: Grant Taunt and protect allies.',
      fixedCardIds: [],
      element: 'light',
      norseHeroId: 'hero-heimdall',
      portrait: '/portraits/heroes/heimdall.png'
    },
    {
      id: 'hero-vili',
      name: 'Vili',
      heroClass: 'warrior',
      description: 'God of Will: Rally allies for focused attacks.',
      fixedCardIds: [],
      element: 'light',
      norseHeroId: 'hero-vili'
    },
    // ===== GREEK HEROES =====
    {
      id: 'hero-ares',
      name: 'Ares',
      heroClass: 'warrior',
      description: 'God of War: Unleash devastating attacks and fuel the flames of battle.',
      fixedCardIds: [],
      element: 'fire',
      norseHeroId: 'hero-ares',
      portrait: '/portraits/heroes/ares.png'
    },
    {
      id: 'hero-hephaestus',
      name: 'Hephaestus',
      heroClass: 'warrior',
      description: 'God of the Forge: Craft powerful weapons and armor.',
      fixedCardIds: [],
      element: 'fire',
      norseHeroId: 'hero-hephaestus',
      portrait: '/portraits/heroes/hephaestus.png'
    },
    {
      id: 'hero-baldur',
      name: 'Baldur',
      heroClass: 'paladin',
      description: 'God of Light and Purity: Grant Divine Shield to protect your forces.',
      fixedCardIds: [],
      element: 'light',
      norseHeroId: 'hero-baldur',
      portrait: '/portraits/heroes/baldur.png'
    },
    {
      id: 'hero-solvi',
      name: 'Solvi',
      heroClass: 'paladin',
      description: 'Dawn Knight: Empower allies with light and Divine Shield.',
      fixedCardIds: [],
      element: 'light',
      norseHeroId: 'hero-solvi'
    },
    // ===== JAPANESE (SHINTO) HEROES =====
    {
      id: 'hero-sarutahiko',
      name: 'Sarutahiko',
      heroClass: 'paladin',
      description: 'Earthly Kami: Divine protection and guiding light for allies.',
      fixedCardIds: [],
      element: 'grass',
      norseHeroId: 'hero-sarutahiko'
    }
  ],
  bishop: [
    // ===== NORSE HEROES - BISHOP (Healing/Support) =====
    // Uses Priest, Druid, and Shaman spell pools
    {
      id: 'hero-freya',
      name: 'Freya',
      heroClass: 'priest',
      description: 'Goddess of Love: Heal allies and grant life deathrattles.',
      fixedCardIds: [],
      element: 'grass',
      norseHeroId: 'hero-freya',
      portrait: '/portraits/heroes/freya.png'
    },
    {
      id: 'hero-eir',
      name: 'Eir',
      heroClass: 'priest',
      description: 'Goddess of Healing: Powerful heals that get stronger.',
      fixedCardIds: [],
      element: 'grass',
      norseHeroId: 'hero-eir',
      portrait: '/portraits/heroes/eir.png'
    },
    {
      id: 'hero-frey',
      name: 'Frey',
      heroClass: 'priest',
      description: 'God of Fertility: Summon nature tokens and grow your army.',
      fixedCardIds: [],
      element: 'grass',
      norseHeroId: 'hero-frey'
    },
    {
      id: 'hero-idunn',
      name: 'Idunn',
      heroClass: 'druid',
      description: 'Goddess of Youth: Restore health and draw cards.',
      fixedCardIds: [],
      element: 'grass',
      norseHeroId: 'hero-idunn',
      portrait: '/portraits/heroes/idunn.png'
    },
    {
      id: 'hero-ve',
      name: 'Ve',
      heroClass: 'druid',
      description: 'God of Holiness: Buff all allies and grant keywords.',
      fixedCardIds: [],
      element: 'grass',
      norseHeroId: 'hero-ve'
    },
    {
      id: 'hero-gerd',
      name: 'Gerd',
      heroClass: 'shaman',
      description: 'Giantess of Fertile Earth: Heal and buff grass minions.',
      fixedCardIds: [],
      element: 'grass',
      norseHeroId: 'hero-gerd',
      portrait: '/portraits/heroes/gerd.png'
    },
    {
      id: 'hero-gefjon',
      name: 'Gefjon',
      heroClass: 'shaman',
      description: 'Goddess of Plowing: Summon tokens that grow each turn.',
      fixedCardIds: [],
      element: 'grass',
      norseHeroId: 'hero-gefjon'
    },
    {
      id: 'hero-fjorgyn',
      name: 'Fjorgyn',
      heroClass: 'druid',
      description: 'Earth Mother: Grant taunt and buff health.',
      fixedCardIds: [],
      element: 'grass',
      norseHeroId: 'hero-fjorgyn'
    },
    {
      id: 'hero-ran',
      name: 'Ran',
      heroClass: 'shaman',
      description: 'Goddess of the Drowned: Freeze enemies and control the board.',
      fixedCardIds: [],
      element: 'water',
      norseHeroId: 'hero-ran',
      portrait: '/portraits/heroes/ran.png'
    },
    // ===== GREEK HEROES =====
    {
      id: 'hero-poseidon',
      name: 'Poseidon',
      heroClass: 'shaman',
      description: 'God of the Sea: Command the tides and summon ocean creatures.',
      fixedCardIds: [],
      element: 'water',
      norseHeroId: 'hero-poseidon',
      portrait: '/portraits/heroes/poseidon.png'
    },
    {
      id: 'hero-aphrodite',
      name: 'Aphrodite',
      heroClass: 'priest',
      description: 'Goddess of Love: Heal and charm enemies to your side.',
      fixedCardIds: [],
      element: 'grass',
      norseHeroId: 'hero-aphrodite',
      portrait: '/portraits/heroes/aphrodite.png'
    },
    {
      id: 'hero-hera',
      name: 'Hera',
      heroClass: 'priest',
      description: 'Queen of the Gods: Protect allies with divine authority.',
      fixedCardIds: [],
      element: 'light',
      norseHeroId: 'hero-hera',
      portrait: '/portraits/heroes/hera.png'
    },
    {
      id: 'hero-eros',
      name: 'Eros',
      heroClass: 'priest',
      description: 'God of Love: Bind enemies with arrows of affection.',
      fixedCardIds: [],
      element: 'grass',
      norseHeroId: 'hero-eros'
    },
    {
      id: 'hero-hestia',
      name: 'Hestia',
      heroClass: 'priest',
      description: 'Goddess of the Hearth: Warm and restore allies with sacred fire.',
      fixedCardIds: [],
      element: 'fire',
      norseHeroId: 'hero-hestia',
      portrait: '/portraits/heroes/hestia.png'
    },
    {
      id: 'hero-demeter',
      name: 'Demeter',
      heroClass: 'druid',
      description: 'Goddess of Harvest: Grow your forces with nature\'s bounty.',
      fixedCardIds: [],
      element: 'grass',
      norseHeroId: 'hero-demeter'
    },
    {
      id: 'hero-gaia',
      name: 'Gaia',
      heroClass: 'druid',
      description: 'Mother Earth: Command the primordial forces of nature.',
      fixedCardIds: [],
      element: 'grass',
      norseHeroId: 'hero-gaia'
    },
    {
      id: 'hero-njord',
      name: 'Njord',
      heroClass: 'shaman',
      description: 'God of Sea and Wind: Summon Elemental Totems to control the battlefield.',
      fixedCardIds: [],
      element: 'water',
      norseHeroId: 'hero-njord'
    },
    {
      id: 'hero-hoenir',
      name: 'Hoenir',
      heroClass: 'priest',
      description: 'God of Silence: Silence enemies and grant understanding to allies.',
      fixedCardIds: [],
      element: 'light',
      norseHeroId: 'hero-hoenir'
    },
    {
      id: 'hero-sigyn',
      name: 'Sigyn',
      heroClass: 'druid',
      description: 'Goddess of Loyalty: Shapeshift and gain protective armor.',
      fixedCardIds: [],
      element: 'grass',
      norseHeroId: 'hero-sigyn',
      portrait: '/portraits/heroes/sigyn.png'
    },
    // ===== JAPANESE (SHINTO) HEROES =====
    {
      id: 'hero-kamimusubi',
      name: 'Kamimusubi',
      heroClass: 'shaman',
      description: 'Divine Creator: Heal allies and restore life to the battlefield.',
      fixedCardIds: [],
      element: 'grass',
      norseHeroId: 'hero-kamimusubi'
    },
    // ===== EGYPTIAN HEROES =====
    {
      id: 'hero-maat',
      name: "Ma'at",
      heroClass: 'priest',
      description: 'Goddess of Balance: Transform stats to bring cosmic equilibrium.',
      fixedCardIds: [],
      element: 'light',
      norseHeroId: 'hero-maat'
    },
    {
      id: 'hero-khepri',
      name: 'Khepri',
      heroClass: 'priest',
      description: 'Scarab of Dawn: Heal allies at the start of each turn.',
      fixedCardIds: [],
      element: 'light',
      norseHeroId: 'hero-khepri'
    }
  ],
  knight: [
    // ===== NORSE HEROES - KNIGHT (Stealth/Agility) =====
    // Uses Rogue, Hunter, and Demon Hunter spell pools
    {
      id: 'hero-loki',
      name: 'Loki',
      heroClass: 'rogue',
      description: 'The Trickster: Stealth strikes and copy enemy minions.',
      fixedCardIds: [],
      element: 'dark',
      norseHeroId: 'hero-loki',
      portrait: '/portraits/heroes/loki.png'
    },
    {
      id: 'hero-hoder',
      name: 'Hoder',
      heroClass: 'rogue',
      description: 'Blind God of Winter: Freeze and shatter frozen enemies.',
      fixedCardIds: [],
      element: 'dark',
      norseHeroId: 'hero-hoder'
    },
    {
      id: 'hero-gormr',
      name: 'Gormr',
      heroClass: 'rogue',
      description: 'Venom Wyrm: Deal poisonous damage to enemies.',
      fixedCardIds: [],
      element: 'dark',
      norseHeroId: 'hero-gormr'
    },
    {
      id: 'hero-skadi',
      name: 'Skadi',
      heroClass: 'hunter',
      description: 'Goddess of Winter: Freeze enemies and deal bonus damage.',
      fixedCardIds: [],
      element: 'ice',
      norseHeroId: 'hero-skadi'
    },
    {
      id: 'hero-aegir',
      name: 'Aegir',
      heroClass: 'hunter',
      description: 'God of the Brewing Sea: Freeze and drown enemies.',
      fixedCardIds: [],
      element: 'water',
      norseHeroId: 'hero-aegir'
    },
    {
      id: 'hero-myrka',
      name: 'Myrka',
      heroClass: 'demonhunter',
      description: 'Bog Witch: Freeze minions and apply debuffs.',
      fixedCardIds: [],
      element: 'water',
      norseHeroId: 'hero-myrka',
      portrait: '/portraits/heroes/myrka.png'
    },
    {
      id: 'hero-ylva',
      name: 'Ylva',
      heroClass: 'demonhunter',
      description: 'Wolf Mother: Summon wolf tokens with rush.',
      fixedCardIds: [],
      element: 'grass',
      norseHeroId: 'hero-ylva'
    },
    {
      id: 'hero-fjora',
      name: 'Fjora',
      heroClass: 'hunter',
      description: 'Nature Oracle: Buff grass minions with lifesteal.',
      fixedCardIds: [],
      element: 'grass',
      norseHeroId: 'hero-fjora'
    },
    {
      id: 'hero-lirien',
      name: 'Lirien',
      heroClass: 'rogue',
      description: 'Wave Priestess: Freeze enemies and heal allies.',
      fixedCardIds: [],
      element: 'water',
      norseHeroId: 'hero-lirien'
    },
    // ===== GREEK HEROES =====
    {
      id: 'hero-hermes',
      name: 'Hermes',
      heroClass: 'rogue',
      description: 'Messenger of the Gods: Swift strikes and cunning tricks.',
      fixedCardIds: [],
      element: 'light',
      norseHeroId: 'hero-hermes'
    },
    {
      id: 'hero-nyx',
      name: 'Nyx',
      heroClass: 'rogue',
      description: 'Goddess of Night: Strike from the shadows unseen.',
      fixedCardIds: [],
      element: 'dark',
      norseHeroId: 'hero-nyx',
      portrait: '/portraits/heroes/nyx.png'
    },
    {
      id: 'hero-apollo',
      name: 'Apollo',
      heroClass: 'hunter',
      description: 'God of the Sun: Precise shots and burning arrows.',
      fixedCardIds: [],
      element: 'fire',
      norseHeroId: 'hero-apollo',
      portrait: '/portraits/heroes/apollo.png'
    },
    {
      id: 'hero-artemis',
      name: 'Artemis',
      heroClass: 'hunter',
      description: 'Goddess of the Hunt: Track and strike with deadly precision.',
      fixedCardIds: [],
      element: 'grass',
      norseHeroId: 'hero-artemis'
    },
    {
      id: 'hero-ullr',
      name: 'Ullr',
      heroClass: 'hunter',
      description: 'God of the Hunt: Master archer whose arrows never miss.',
      fixedCardIds: [],
      element: 'ice',
      norseHeroId: 'hero-ullr'
    },
    // ===== JAPANESE (SHINTO) HEROES =====
    {
      id: 'hero-tsukuyomi',
      name: 'Tsukuyomi',
      heroClass: 'rogue',
      description: 'Moon God: Strike from the shadows with lunar power.',
      fixedCardIds: [],
      element: 'dark',
      norseHeroId: 'hero-tsukuyomi'
    },
    // ===== EGYPTIAN HEROES =====
    {
      id: 'hero-serqet',
      name: 'Serqet',
      heroClass: 'rogue',
      description: 'Scorpion Goddess: Poison enemies with deadly venom.',
      fixedCardIds: [],
      element: 'dark',
      norseHeroId: 'hero-serqet'
    }
  ],
  king: [
    {
      id: 'king-ymir',
      name: 'Ymir',
      heroClass: 'neutral',
      description: 'Jötun Giant: +2 Attack to allies, -1 Attack to enemies. (Passive)',
      fixedCardIds: [],
      passiveEffect: 'ymir_passives',
      portrait: '/portraits/kings/ymir.png'
    },
    {
      id: 'king-buri',
      name: 'Buri',
      heroClass: 'neutral',
      description: 'First God: All friendly minions have +1 Armor. At the start of your turn, they gain +1 Health permanently.',
      fixedCardIds: [],
      passiveEffect: 'buri_passives',
      portrait: '/portraits/kings/buri.png'
    },
    {
      id: 'king-surtr',
      name: 'Surtr',
      heroClass: 'neutral',
      description: 'Fire Giant: All friendly minions have +1 Attack. At end of turn, deal 1 damage to all enemies.',
      fixedCardIds: [],
      passiveEffect: 'surtr_passives',
      portrait: '/portraits/kings/surtr.png'
    },
    {
      id: 'king-borr',
      name: 'Borr',
      heroClass: 'neutral',
      description: 'Father of Odin: All friendly minions have +1/+1. Whenever you play a minion, restore 2 Health to it.',
      fixedCardIds: [],
      passiveEffect: 'borr_passives',
      portrait: '/portraits/kings/borr.png'
    },
    {
      id: 'king-yggdrasil',
      name: 'Yggdrasil',
      heroClass: 'neutral',
      description: 'World Tree: Whenever a minion is healed, it gains +1 Attack permanently. End of turn heals all allies 1.',
      fixedCardIds: [],
      passiveEffect: 'yggdrasil_passives'
    },
    {
      id: 'king-audumbla',
      name: 'Auðumbla',
      heroClass: 'neutral',
      description: 'Primordial Cow: All friendly minions have +2 Health. Whenever healed, they gain +1 Attack.',
      fixedCardIds: [],
      passiveEffect: 'audumbla_passives'
    },
    {
      id: 'king-blainn',
      name: 'Blainn',
      heroClass: 'neutral',
      description: 'Dark Craftsman: Enemy minions have -1 Attack. Whenever a minion dies, summon a 1/1 Shadow token.',
      fixedCardIds: [],
      passiveEffect: 'blainn_passives',
      portrait: '/portraits/kings/blainn.png'
    },
    {
      id: 'king-brimir',
      name: 'Brimir',
      heroClass: 'neutral',
      description: 'Sea Titan: All friendly minions have +2 Health. At the start of your turn, freeze a random enemy.',
      fixedCardIds: [],
      passiveEffect: 'brimir_passives'
    },
    {
      id: 'king-ginnungagap',
      name: 'Ginnungagap',
      heroClass: 'neutral',
      description: 'Primordial Void: Enemy minions have -2 Attack. Whenever you play a minion, summon a random keyword token.',
      fixedCardIds: [],
      passiveEffect: 'ginnungagap_passives'
    }
  ],
  pawn: [
    {
      id: 'pawn-recruit',
      name: 'Silver Hand Recruit',
      heroClass: 'neutral',
      description: 'Basic pawn unit. No spells.',
      fixedCardIds: []
    }
  ]
};

/**
 * Get fixed cards for a piece based on its hero selection
 * NOTE: This now returns empty array - deck cards come from heroDeckStore
 */
export function getPieceFixedCards(piece: ChessPieceHero): number[] {
  return piece.fixedCardIds || [];
}

/**
 * Get default army selection
 */
export function getDefaultArmySelection(): ArmySelection {
  return {
    king: CHESS_PIECE_HEROES.king[0],
    queen: CHESS_PIECE_HEROES.queen[0],
    rook: CHESS_PIECE_HEROES.rook[0],
    bishop: CHESS_PIECE_HEROES.bishop[0],
    knight: CHESS_PIECE_HEROES.knight[0]
  };
}

/**
 * Check if a piece type has spells
 */
export function pieceHasSpells(pieceType: ChessPieceType): boolean {
  return pieceType !== 'king' && pieceType !== 'pawn';
}

/**
 * Get combat deck for a piece
 * NOTE: Fixed cards are now empty - use heroDeckStore for user-built decks
 * For King/Pawn, returns empty array (no spells)
 */
export function buildCombatDeck(
  pieceHero: ChessPieceHero,
  sharedDeckCardIds: number[]
): number[] {
  const fixedCards = pieceHero.fixedCardIds || [];
  if (fixedCards.length === 0 && sharedDeckCardIds.length === 0) {
    return [];
  }
  return [...fixedCards, ...sharedDeckCardIds];
}

/**
 * Spell slots per piece type (from Ragnarok GDD, updated)
 */
export const PIECE_SPELL_SLOTS: Record<ChessPieceType, number> = {
  king: 0,
  queen: 10,
  rook: 10,
  bishop: 10,
  knight: 10,
  pawn: 0
};
