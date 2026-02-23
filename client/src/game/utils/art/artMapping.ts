import { debug } from '../../config/debugConfig';
/**
 * Art Mapping Utility
 * Maps game hero/king IDs to artwork IDs from metadata
 * 
 * IMPORTANT SEPARATION:
 * - Hero artwork (major gods) is RESERVED for playable heroes only
 * - Creature artwork (beasts, minions) is used for minion cards
 * - NO MIXING: Heroes never get creature art, minions never get hero art
 */

export interface ArtMapping {
  artId: string;
  character: string;
}

/**
 * CREATURE-ONLY characters - artwork available for minion cards (BEASTS/ANIMALS only)
 * These are NOT playable heroes and can be used for minion artwork
 * IMPORTANT: Does NOT include hero-reserved characters OR human-looking creatures
 * Human-looking creatures (sea maidens, warriors, elves, siren) are now hero-reserved
 */
const CREATURE_ART_CHARACTERS = new Set([
  'alsvin',
  'asgar-rex',
  'asgard-s-whisper',
  'asgardeagle',
  'bergrisigorilla',
  'bifrostgazer',
  'blazebear',
  'cerberos',
  'deerhornrage',
  'drakewing-guardian',
  'draugr',
  'eldericewyrm',
  'fenrishowl',
  'fjalarfeather',
  'folnirflight',
  'freki',
  'frostcarapace',
  'frostdrake',
  'frostfur',
  'frostorca',
  'frostspinner',
  'frostwhisker',
  'galdramight',
  'garmfang',
  'garmrage',
  'garmwatch',
  'geri',
  'ginnundragon',
  'gjallarhornflyer',
  'gjallarthread',
  'glaer',
  'glimmerhorse',
  'helheim-s-blaze',
  'helheimslither',
  'helheimwanderer',
  'helsilk',
  'hofvarpnir',
  'horncrestcockerel',
  'hrimfaxi',
  'hugin-munin',
  'huginn-s-gaze',
  'jormunflame',
  'jormunreptile',
  'kadi-s-hoof',
  'kraken',
  'lunargaittrotter',
  'lunarhowler',
  'managarm-celestial',
  'mare',
  'mimirpanther',
  'mimirturtle',
  'moonchaser',
  'mysticfrostorca',
  'nidhoggpython',
  'nidhoggscale',
  'nidhoggscion',
  'nidhoggwyrm',
  'nirbeak',
  'nornweaver',
  'ragnarpaws',
  'ragnarskoll',
  'runestonebeetle',
  'saga-s-siamese',
  'savagepacestalker',
  'silfrintopp',
  'skinfaxi',
  'skoll-s-twilight',
  'skuggapard',
  'skuggefenrir',
  'spiritwalkerbear',
  'thor-s-claw',
  'thunderclaws',
  'thunderroar',
  'turtlesurvivor',
  'valhallagrazer',
  'valhallaram',
  'varg',
  'vedrfolnir',
  'vedrfolnirvane',
  'vedrskyruler',
  'vedrwing',
  'yggdrasilram',
  'ymirfrost',
  'ymirshell',
]);

/**
 * Main art IDs for each character (mainArt: true from metadata) - 197 characters
 * Generated from cdn.ragnaroknft.quest API
 */
const CHARACTER_ART_IDS: Record<string, string> = {
  'aegir': '150b-2gudiaxw',
  'alsvin': '85e7-wljmvqe7',
  'alvaldi': '9aae-tccijmav',
  'angrboda': '9787-7ahpdg4c',
  'asgar-rex': '8732-n8izut0k',
  'asgard-s-whisper': '8562-hlad99em',
  'asgardeagle': '523f-0ovd1djs',
  'astrid-olofsdotter': 'e7cc-8r1oubzy',
  'audr': 'df32-b5qphdx1',
  'aurboda': '02c5-rprsl3nq',
  'aurgelmir': '1f64-yh413x60',
  'baldr': '1601-jfuw1ee2',
  'bergelmir': '9c91-gdtc98bt',
  'bergrisigorilla': '239c-hh1wqqe1',
  'bestla': '84b2-r6m51iu5',
  'bifrostgazer': '1b3a-d4nlb8mw',
  'bjorn-ironside': '5388-g9bbr777',
  'blazebear': 'c282-2z5tb1rj',
  'blodughadda': '4434-4nu5rrrf',
  'bolthorn': '28ca-zxymlb38',
  'borr': '78e9-6mupjfob',
  'bragi': '94ce-nffxsw3q',
  'bylgja': '8648-ghgxmwfh',
  'cerberos': '12e7-bcs00amy',
  'chainsbreaker': '12b8-gv4eco23',
  'cnut-the-great': 'd939-kurp2qd4',
  'dark-elves': '23a5-lrnxovtk',
  'deerhornrage': 'dcb5-jryrjh20',
  'dellingr': 'c3cf-ku0j70m6',
  'drakewing-guardian': 'cfa9-jhfbd3wr',
  'draugr': 'e7be-0h8wgks0',
  'drofn': '39d5-zmwzqszw',
  'dufa': '0fc9-n03fmoq0',
  'dwarves': '92f4-85792li4',
  'egil-skallagrimsson': 'eb99-4t3n9fti',
  'eimyrja': '97c0-gly90upv',
  'einherjar': '2336-808i04tf',
  'eir': '1b21-8hx6f644',
  'eisa': 'c500-5pv67lfk',
  'eldericewyrm': '06e2-8pdilvrr',
  'eric-bloodaxe': '145a-ra98jlmw',
  'erik-the-red': 'd986-20v9k725',
  'farbauti': '291e-ef8fwtd5',
  'fenrir': '2477-jzfm669g',
  'fenrishowl': 'd485-79u29gow',
  'fjalarfeather': '273f-5cpqco0h',
  'folnirflight': '6e23-pn86oy72',
  'fornjotr': '5646-frtep472',
  'forseti': '4351-27r5qhba',
  'freki': '102f-ome3s4ua',
  'freya': 'd718-mekc8ckp',
  'freydis-eiriksdottir': '1d97-35odajjd',
  'freyr': '7458-t0n1oqgs',
  'frigg': '6333-p1fmzcky',
  'frostcarapace': '36c8-r5vxgyc3',
  'frostdrake': '729b-7d03gb3g',
  'frostfur': 'cede-eox5vx23',
  'frostorca': 'fcd1-evzd1369',
  'frostspinner': '08b3-j39lo5y2',
  'frostwhisker': '59bb-ffrv9c61',
  'galdramight': '534a-jec4gcf3',
  'gangr': '0483-jtqtid4l',
  'garmfang': 'a606-18xuaznq',
  'garmr': 'e1e3-gg3jq3u0',
  'garmrage': '64f4-24yr8hxe',
  'garmwatch': 'a313-kjy040q6',
  'gefjon': '3e44-araj8dlb',
  'gerd': 'efdf-cwyuxjfl',
  'gerdr': '1e19-ytm9izjp',
  'geri': '087a-3r2gs1rv',
  'ginnundragon': '1d49-jajdixap',
  'gjallarhornflyer': '14b8-isr8t5zt',
  'gjallarthread': '5d9b-kf3rnc4n',
  'glaer': 'ac45-cods9dvo',
  'glimmerhorse': 'a395-in0vknq1',
  'glod': '6c37-llo1gkzy',
  'grid': 'f9a1-98tusiw3',
  'gullveig': 'df09-mj5d0z0j',
  'gunnar-hamundarson': '3652-pb7dlata',
  'gygjar': '823f-d514hptv',
  'harald-bluetooth': '85bc-lg2pse5e',
  'harald-hardrada': '1fa1-0bt3p0qe',
  'hatiskugge': '6653-y9djk14f',
  'hefring': 'a3ef-uwsh945j',
  'heimdallr': '3c34-zji96mi7',
  'hel': '6ea4-mrar7o70',
  'helheim-s-blaze': 'a1ed-40r09564',
  'helheimslither': 'ddff-9hwzp3st',
  'helheimwanderer': '6c5f-enclx79l',
  'helsilk': 'a415-w915qhro',
  'himinglaeva': '8c39-kd4ymn12',
  'hljod': 'e48e-x9s3l2ww',
  'hodr': 'a08f-a2xbq9k1',
  'hofvarpnir': '7669-e4j8057b',
  'horncrestcockerel': 'a738-4s7wc7uu',
  'hraesvelgr': 'd032-qyw3nqpe',
  'hrimfaxi': '998a-1dhipeiq',
  'hrimgerdr': '22a0-9ic0pwfw',
  'hrodr': '7c36-amxvy4sn',
  'hronn': '01be-anhh70fk',
  'hugin-munin': 'b9e0-fk7o7k6h',
  'huginn-s-gaze': 'a626-423ym16x',
  'hyndla': 'c7cd-wbifyi1w',
  'hyrrokkin': '21e2-rigfxmta',
  'idi': '123f-fozmrwmc',
  'idun': 'a523-50tt2zcw',
  'ingvar-vittfarne': '5a44-64d4n3cy',
  'ivar-the-boneless': '46a6-4zgegjr2',
  'jarnsaxa': '5579-rtdz78q8',
  'jormunflame': '6654-mfeyt8se',
  'jormungandr': '6017-p53522dp',
  'jormunreptile': '7a9b-c1mvx7tv',
  'kadi-s-hoof': 'dec0-esnj3ywr',
  'kolga': 'bc09-7plgy7m3',
  'kraken': 'e4e8-js5gns2x',
  'lagertha': '8e3b-ublpaurd',
  'laufey': '74d0-wcwktcw1',
  'leif-erikson': '4a86-873y8lih',
  'leikn': 'acf3-ujc0m5ze',
  'loki': '5e45-mxkiu04b',
  'lunargaittrotter': 'e832-nil2y5bq',
  'lunarhowler': 'e6bc-wg7xls1q',
  'managarm': '5415-ghtr7fjn',
  'managarm-celestial': '6e7a-zuq3r82h',
  'mani': 'd638-pfkjzzuo',
  'mare': '8328-uu8iihq1',
  'mimir': '9705-p5qah4s3',
  'mimirpanther': 'cb76-puxvnjh7',
  'mimirturtle': 'b089-yi2eckk3',
  'moonchaser': 'ea47-4bx4dl0s',
  'mysticfrostorca': '4ef7-2qlowz7y',
  'naglfari': 'a632-c1k4ux4f',
  'nerthus': '23d6-nesirs51',
  'nidhogg': '4af5-7cv4qtdb',
  'nidhoggpython': 'fd76-ri6lnzuz',
  'nidhoggscale': 'f973-5zs03o10',
  'nidhoggscion': '690d-xbplsbwm',
  'nidhoggwyrm': '2803-i20ddm8o',
  'nirbeak': '45ee-yk4gye4j',
  'nornweaver': '72ed-pyfzvxwm',
  'nott': '71c1-s6o2do75',
  'odin': 'af1e-tgfxq4gr',
  'olaf-ii-of-norway': '0805-zofc19rh',
  'olaf-tryggvason': 'ac58-iedygtvt',
  'ragnar-lothbrok': '1ca8-tdtfqurr',
  'ragnarpaws': '7b6c-r5dyl06h',
  'ragnarskoll': 'd5ff-wq899zve',
  'rollo': '0aae-4igwx709',
  'runestonebeetle': '9370-t2s89bww',
  'saga-s-siamese': 'c3ed-38q1x82a',
  'savagepacestalker': '1daa-jmkguoh2',
  'sif': '1a40-cmxhweqk',
  'sigurd-ring': 'b972-ast4s29y',
  'sigurd-the-crusader': 'c141-vn5xetct',
  'sigyn': '03d8-lf9wcao3',
  'silfrintopp': 'ee28-lpu1nd1c',
  'sinmara': '27de-qwzzvho5',
  'siren': '6938-rmvdb3vo',
  'skadi': 'fdfd-7p1e2ch9',
  'skinfaxi': '3edc-cebgseku',
  'skoll': '8e72-5tsf6c4z',
  'skoll-s-twilight': 'b309-ahh6d703',
  'skuggapard': '293c-du2ktesl',
  'skuggefenrir': '5fb2-sc9m8ncs',
  'sol': '8585-51vtraoh',
  'spiritwalkerbear': 'b604-to8ru8m1',
  'surtr': 'dbeb-b0mibte9',
  'svadilfari': 'a514-ab9j0g5r',
  'sweyn-forkbeard': '7e3c-x9dxz74f',
  'thjazi': '87a5-kprlfacx',
  'thokk': '4e13-or4p37vj',
  'thor': '46c2-sy7byy2d',
  'thor-s-claw': 'f7fa-n6v3b7o4',
  'thorgils-sprakling': 'c12e-9p6c1ttu',
  'thrud': '89f2-bsi72zws',
  'thrudgelmir': '984f-0o06zvr0',
  'thunderclaws': 'f36c-aqlvbv2m',
  'thunderroar': 'dc05-8c0icj7w',
  'turtlesurvivor': 'c750-jx3qs9o9',
  'tyr': '9a82-xjclj2bn',
  'udr': '43d5-jzc7vm9k',
  'ulfhednar': '660e-4jck4nlz',
  'ullr': 'cef7-2dqqiy45',
  'valhallagrazer': '4655-o4xbxsth',
  'valhallaguard': '888f-zv6117qs',
  'valhallaram': 'e4d7-fxhqn1cf',
  'vali': '82c3-dmd7qmn8',
  'varg': '0c79-u7upsyrz',
  'vedrfolnir': 'a344-6wwdom1r',
  'vedrfolnirvane': '6c1c-zrjkhyy0',
  'vedrskyruler': '203d-wpnddi55',
  'vedrwing': 'cc39-8bp6ei5r',
  'vidarr': 'd25c-fa7g75kn',
  'yggdrasilram': 'a913-axqs13eu',
  'ymir': '8f78-n51onie8',
  'ymirfrost': '3a09-gm3gx5tq',
  'ymirshell': 'b1d0-z8eue8gt',
  // Custom art entries (not from CDN)
  'yggdrasil-world-tree': 'yggdrasil-new',  // Custom tree being art for Yggdrasil king
  'ginnungagap-void': 'ginnungagap-void',   // Custom primordial void art for Ginnungagap king
  'audumbla-cow': 'audumbla-cow',           // Custom primordial cow art for Audumbla king
};

/**
 * Hero ID to character name mapping
 * Maps game hero IDs to metadata character names
 * Uses best judgment to match heroes without exact art to similar characters
 */
const HERO_TO_CHARACTER: Record<string, string> = {
  // Primary Norse gods
  'hero-odin': 'odin',
  'hero-thor': 'thor',
  'hero-freya': 'freya',
  'hero-freyr': 'freyr',
  'hero-frey': 'freyr',
  'hero-loki': 'loki',
  'hero-heimdall': 'heimdallr',
  'hero-tyr': 'tyr',
  'hero-baldr': 'baldr',
  'hero-baldur': 'baldr',
  'hero-hel': 'hel',
  'hero-skadi': 'skadi',
  'hero-ullr': 'ullr',
  'hero-vidar': 'vidarr',
  'hero-vali': 'vali',
  'hero-bragi': 'bragi',
  'hero-idun': 'idun',
  'hero-idunn': 'idun',
  'hero-sif': 'sif',
  'hero-frigg': 'frigg',
  'hero-forseti': 'forseti',
  'hero-hodr': 'hodr',
  'hero-hoder': 'hodr',
  'hero-eir': 'eir',
  'hero-gefjon': 'gefjon',
  'hero-nerthus': 'nerthus',
  'hero-sol': 'sol',
  'hero-mani': 'mani',
  'hero-nott': 'nott',
  'hero-sigyn': 'sigyn',
  'hero-gerd': 'gerd',
  'hero-dellingr': 'dellingr',
  
  // Giants and creatures
  'hero-angrboda': 'angrboda',
  'hero-fenrir': 'fenrir',
  'hero-jormungandr': 'jormungandr',
  'hero-mimir': 'mimir',
  'hero-nidhogg': 'nidhogg',
  'hero-gullveig': 'gullveig',
  'hero-skoll': 'skoll',
  'hero-hati': 'hatiskugge',
  'hero-managarm': 'managarm',
  'hero-hraesvelgr': 'hraesvelgr',
  'hero-garmr': 'garmr',
  'hero-gormr': 'garmr',
  'hero-sinmara': 'sinmara',
  // hero-aegir removed — 'aegir' art identical to chronos portrait
  'hero-ran': 'kolga',
  'hero-grid': 'grid',
  'hero-thrud': 'thrud',
  'hero-svadilfari': 'svadilfari',
  'hero-thjazi': 'thjazi',
  'hero-jarnsaxa': 'jarnsaxa',
  'hero-hyrrokkin': 'hyrrokkin',
  
  // Alternate heroes (best judgment matches)
  'hero-njord': 'nerthus',
  'hero-hoenir': 'mimir',
  'hero-ve': 'vidarr',
  'hero-vili': 'vali',
  'hero-fjorgyn': 'frigg',
  'hero-lirien': 'gerd',
  'hero-magni': 'thor',
  'hero-solvi': 'sol',
  'hero-myrka': 'nott',
  'hero-ylva': 'ulfhednar',
  'hero-fjora': 'skadi',
  'hero-logi': 'surtr',
  
  // Greek goddesses - using Norse wave maidens (human-looking female artwork)
  'hero-ammit': 'nott',
  'hero-aphrodite': 'bylgja',
  'hero-artemis': 'hefring',
  'hero-athena': 'himinglaeva',
  'hero-demeter': 'hronn',
  'hero-persephone': 'drofn',
  'hero-hera': 'dufa',
  'hero-gaia': 'udr',
  'hero-hestia': 'blodughadda',
  'hero-nyx': 'siren',
  
  // Greek gods - using Norse warrior artwork (human-looking male artwork)
  'hero-ares': 'einherjar',
  'hero-hephaestus': 'chainsbreaker',
  'hero-zeus': 'valhallaguard',
  'hero-hades': 'dark-elves',
  'hero-dionysus': 'vidarr',           // Vidarr (previously used for Yggdrasil)
  'hero-apollo': 'dellingr',           // Dellingr - god of light
  'hero-poseidon': 'fornjotr',         // Fornjotr - primordial giant of sea
  'hero-hermes': 'hrodr',              // Hrodr - swift messenger type
  
  // Vikings (historical characters)
  'hero-ragnar': 'ragnar-lothbrok',
  'hero-bjorn': 'bjorn-ironside',
  'hero-lagertha': 'lagertha',
  'hero-ivar': 'ivar-the-boneless',
  'hero-rollo': 'rollo',
  'hero-leif': 'leif-erikson',
  'hero-erik': 'erik-the-red',
};

/**
 * King ID to character name mapping
 */
const KING_TO_CHARACTER: Record<string, string> = {
  'king-ymir': 'ymir',
  'king-buri': 'bestla',
  'king-surtr': 'surtr',
  'king-borr': 'borr',
  'king-yggdrasil': 'yggdrasil-world-tree',  // Custom art - tree being humanoid
  'king-audumbla': 'audumbla-cow',
  'king-blainn': 'dwarves',
  'king-brimir': 'brimir',
  'king-ginnungagap': 'ginnungagap-void',
};

/**
 * HERO-RESERVED characters - DERIVED from HERO_TO_CHARACTER and KING_TO_CHARACTER
 * All character artwork used by playable heroes/kings is reserved
 * These should NEVER be used for minion/spell cards
 */
const HERO_RESERVED_CHARACTERS = new Set([
  ...Object.values(HERO_TO_CHARACTER),
  ...Object.values(KING_TO_CHARACTER)
]);

const HERO_RESERVED_ART_IDS = new Set(
  [...HERO_RESERVED_CHARACTERS]
    .map(char => CHARACTER_ART_IDS[char])
    .filter((id): id is string => !!id)
);

const CREATURE_RESERVED_ART_IDS = new Set(
  [...CREATURE_ART_CHARACTERS]
    .map(char => CHARACTER_ART_IDS[char])
    .filter((id): id is string => !!id)
);

// All art IDs that belong to ANY named character (hero, king, god, creature, human, etc.)
// Used to distinguish "random AI art" (not in this set) from "character-specific art"
const ALL_CHARACTER_ART_IDS_SET = new Set(Object.values(CHARACTER_ART_IDS));

/**
 * MINION_CARD_TO_ART Mapping - STRICT 1:1 MAPPINGS
 * Each artwork character can ONLY be used by ONE minion card
 * Maps minion card names (lowercase) to creature artwork character names
 * 
 * RULES:
 * 1. Each artwork = exactly ONE card (no duplicates)
 * 2. Best thematic match wins
 * 3. If no perfect fit, artwork stays unused
 * 4. No forced/mismatched art (e.g., NO treant→ram, NO boar→gorilla)
 */
const MINION_CARD_TO_ART: Record<string, string> = {
  // ========== WOLF ARTWORKS (11) - ONE card each ==========
  "fenrir": "fenrishowl",                          // fenrishowl → fenrir (direct match)
  "shadowmaw direwolf": "skuggefenrir",            // skuggefenrir → shadow wolf
  "wolf": "varg",                                  // varg → generic wolf
  "freki, odin's wolf": "freki",                   // freki → named wolf
  "geri, odin's wolf": "geri",                     // geri → named wolf
  "hati, the moon-devourer": "lunarhowler",        // lunarhowler → moon wolf
  "moonchaser": "moonchaser",                      // moonchaser → direct match
  "skoll, sun-chaser": "ragnarskoll",              // ragnarskoll → sun wolf
  "skoll": "skoll-s-twilight",                     // skoll-s-twilight → twilight wolf
  "mánagarm, the blood moon": "managarm-celestial",// managarm-celestial → blood moon wolf
  "dire wolf alpha": "ragnarpaws",                 // ragnarpaws → dire wolf

  // ========== BEAR ARTWORKS (3) - ONE card each ==========
  "armored bear of thor": "blazebear",             // blazebear → battle bear
  "bjorn, the sacred bear": "spiritwalkerbear",    // spiritwalkerbear → spirit bear
  "thunderroar": "thunderroar",                    // thunderroar → direct match

  // ========== DRAGON/WYRM ARTWORKS (8) - ONE card each ==========
  "dreaming drake": "frostdrake",                  // frostdrake → ice dragon
  "jade dragon": "ginnundragon",                   // ginnundragon → mythical dragon
  "níðhöggr": "nidhoggwyrm",                       // nidhoggwyrm → Nidhogg wyrm
  "nidhogg whelp": "nidhoggscion",                 // nidhoggscion → baby Nidhogg
  "chillmaw": "eldericewyrm",                      // eldericewyrm → ice wyrm
  "drakonid operative": "drakewing-guardian",      // drakewing-guardian → mechanical dragon
  "nidhogg, the root-gnawer": "nidhoggpython",     // nidhoggpython → python wyrm
  "cleric of scales": "nidhoggscale",              // nidhoggscale → scaled creature

  // ========== HOUND/DOG ARTWORKS (4) - ONE card each ==========
  "hound": "garmfang",                             // garmfang → hellhound variant
  "trollhound": "garmrage",                        // garmrage → rage hound
  "hunting mastiff": "garmwatch",                  // garmwatch → watch hound
  "cerberus rex": "cerberos",                      // cerberos → direct match

  // ========== HORSE ARTWORKS (10) - ONE card each ==========
  "armored warhorse": "hofvarpnir",                // hofvarpnir → Valkyrie's horse
  "sleipnir": "silfrintopp",                       // silfrintopp → Odin's 8-legged horse
  "hrímfaxi, the night horse": "hrimfaxi",         // hrimfaxi → night horse
  "skinfaxi, the day horse": "skinfaxi",           // skinfaxi → day horse
  "nyk, the water horse": "glimmerhorse",          // glimmerhorse → water horse
  "helhest, the death mare": "mare",               // mare → death horse
  "kodorider": "lunargaittrotter",                 // lunargaittrotter → lunar horse
  "storm-winged stallion": "glaer",                // glaer → storm horse
  "valkyrie pegasus": "kadi-s-hoof",               // kadi-s-hoof → hooved creature
  "alsvin": "alsvin",                              // alsvin → direct match (sun horse)

  // ========== BIRD ARTWORKS (13) - ONE card each ==========
  "asgardeagle": "asgardeagle",                    // asgardeagle → direct match
  "veðrfölnir": "vedrfolnir",                      // vedrfolnir → sky hawk
  "huginn, odin's raven": "hugin-munin",           // hugin-munin → Odin's ravens
  "muninn, odin's raven": "huginn-s-gaze",         // huginn-s-gaze → raven gaze
  "phoenix": "fjalarfeather",                      // fjalarfeather → fire bird
  "gullinkambi, the ragnarok rooster": "horncrestcockerel", // horncrestcockerel → rooster
  "young hippogriff": "vedrfolnirvane",            // vedrfolnirvane → hippogriff
  "hræsvelgr": "vedrskyruler",                     // vedrskyruler → wind giant bird
  "harpy of the storm": "vedrwing",                // vedrwing → storm wing
  "nesting roc": "folnirflight",                   // folnirflight → flying creature
  "ironbeak owl": "asgard-s-whisper",              // asgard-s-whisper → owl
  "flame raven": "gjallarhornflyer",               // gjallarhornflyer → fire flyer
  "raptor": "nirbeak",                             // nirbeak → raptor bird

  // ========== CAT/PANTHER ARTWORKS (7) - ONE card each ==========
  "panther": "mimirpanther",                       // mimirpanther → panther
  "jungle panther": "skuggapard",                  // skuggapard → shadow panther
  "sabretooth stalker": "thor-s-claw",             // thor-s-claw → thunder cat
  "savagepacestalker": "savagepacestalker",        // savagepacestalker → direct match
  "dire cat form": "saga-s-siamese",               // saga-s-siamese → cat
  "frostfur": "frostfur",                          // frostfur → direct match
  "frostwhisker": "frostwhisker",                  // frostwhisker → direct match

  // ========== UNDEAD ARTWORKS (2) - ONE card each ==========
  "draugr": "draugr",                              // draugr → direct match
  "restless mummy": "helheimwanderer",             // helheimwanderer → helheim undead

  // ========== SERPENT ARTWORKS (2) - ONE card each ==========
  "jörmungandr": "jormunreptile",                  // jormunreptile → world serpent
  "serpent": "helheimslither",                     // helheimslither → helheim snake

  // ========== SEA CREATURE ARTWORKS (3) - ONE card each ==========
  "kraken": "kraken",                              // kraken → direct match
  "frostorca": "frostorca",                        // frostorca → direct match
  "mysticfrostorca": "mysticfrostorca",            // mysticfrostorca → direct match

  // ========== SPIDER/INSECT ARTWORKS (5) - ONE card each ==========
  "spider bomb": "frostspinner",                   // frostspinner → frost spider
  "helsilk": "helsilk",                            // helsilk → direct match
  "nornweaver": "nornweaver",                      // nornweaver → fate weaver
  "jeweled scarab": "runestonebeetle",             // runestonebeetle → beetle
  "gjallarthread": "gjallarthread",                // gjallarthread → direct match

  // ========== TURTLE/SHELL ARTWORKS (4) - ONE card each ==========
  "ornery tortoise": "mimirturtle",                // mimirturtle → turtle
  "swamp turtle of midgard": "turtlesurvivor",     // turtlesurvivor → survivor turtle
  "stubborn gastropod": "ymirshell",               // ymirshell → shell creature
  "frostcarapace": "frostcarapace",                // frostcarapace → direct match

  // ========== GOAT/RAM ARTWORKS (2) - ONE card each ==========
  "tanngrisnir, the charging goat": "valhallaram", // valhallaram → Thor's goat
  "heidrun, the mead goat": "yggdrasilram",        // yggdrasilram → mythological goat

  // ========== STAG/DEER ARTWORK (1) - ONE card ==========
  "eikthyrnir, the stag of valhalla": "deerhornrage", // deerhornrage → stag

  // ========== BOVINE ARTWORK (1) - ONE card ==========
  "audhumla, the primordial cow": "valhallagrazer",// valhallagrazer → primordial cow

  // ========== GIANT/APE ARTWORKS (2) - ONE card each ==========
  "elder gorilla of the forest": "bergrisigorilla",// bergrisigorilla → gorilla
  "jötun giant": "ymirfrost",                      // ymirfrost → frost giant

  // ========== FIRE ARTWORKS (2) - ONE card each ==========
  "muspeldreki": "jormunflame",                    // jormunflame → fire serpent
  "helheim's blaze": "helheim-s-blaze",            // helheim-s-blaze → direct match

  // ========== MAGIC/MYSTICAL ARTWORKS (3) - ONE card each ==========
  "bifrostgazer": "bifrostgazer",                  // bifrostgazer → direct match
  "galdramight": "galdramight",                    // galdramight → direct match
  "thunderclaws": "thunderclaws",                  // thunderclaws → direct match

  // ========== MISC ARTWORKS (1) ==========
  "asgar-rex": "asgar-rex",                        // asgar-rex → direct match (prehistoric beast)
};

/**
 * Get art ID for a hero
 */
export function getHeroArtId(heroId: string): string | null {
  const character = HERO_TO_CHARACTER[heroId];
  if (!character) return null;
  return CHARACTER_ART_IDS[character] || null;
}

/**
 * Get art ID for a king
 */
export function getKingArtId(kingId: string): string | null {
  const character = KING_TO_CHARACTER[kingId];
  if (!character) return null;
  return CHARACTER_ART_IDS[character] || null;
}

/**
 * Get art path for a hero (returns /art/{id}.webp)
 */
export function getHeroArtPath(heroId: string): string | null {
  const artId = getHeroArtId(heroId);
  if (!artId) return null;
  return `/art/${artId}.webp`;
}

/**
 * Get art path for a king (returns /art/{id}.webp)
 */
export function getKingArtPath(kingId: string): string | null {
  const artId = getKingArtId(kingId);
  if (!artId) return null;
  return `/art/${artId}.webp`;
}

/**
 * Get art path for any hero or king by ID
 */
export function getCharacterArtPath(id: string): string | null {
  if (id.startsWith('hero-')) {
    return getHeroArtPath(id);
  }
  if (id.startsWith('king-')) {
    return getKingArtPath(id);
  }
  return null;
}

/**
 * Resolve the best available portrait for a hero or king.
 * Checks explicit portrait first, then falls back to art mapping.
 */
export function resolveHeroPortrait(heroId?: string, explicitPortrait?: string): string | undefined {
  if (explicitPortrait) return explicitPortrait;
  if (!heroId) return undefined;
  return getCharacterArtPath(heroId) ?? undefined;
}

/**
 * Find art for a card by name (fuzzy matching)
 * Useful for minions/spells that match character names
 * @deprecated Use getCardArtPath instead - this is kept for backwards compatibility
 */
export function findArtByName(name: string): string | null {
  return getCardArtPath(name);
}

/**
 * Get all character art IDs (for browsing)
 */
export function getAllCharacterArtIds(): Record<string, string> {
  return { ...CHARACTER_ART_IDS };
}

/**
 * Direct card art mappings from the Ragnarok New Art gallery
 * Maps card names (lowercase) to full image URLs
 * These take priority over MINION_CARD_TO_ART creature mappings
 */
const VERCEL_CARD_ART: Record<string, string> = {
  "rider of sleipnir": "/art/fef0-0f15bf87.webp",
  "berserker combatant": "/art/048f-f32875d5.webp",
  "crystalline oracle": "/art/6dd4-df5ea380.webp",
  "resting archer of ullr": "/art/06ad-53c982e6.webp",
  "xyrella, the devout": "/art/f6c1-8c7afbca.webp",
  "goody two-shields": "/art/516f-1bae72ea.webp",
  "possessed lackey": "/art/ab76-3effa1a8.webp",
  "warden of valhalla": "/art/4aec-0683ccbf.webp",
  "headmaster of niflheim": "/art/a893-df4b505c.webp",
  "restless mummy": "/art/e9bd-94bce6e3.webp",
  "kharj sandtongue": "/art/7504-f0bcb0c2.webp",
  "sea sprite oracle": "/art/5071-2f4d005e.webp",
  "bound fire-phoenix": "/art/67df-5aac4c40.webp",
  "týr, champion of justice": "/art/eb34-078cea46.webp",
  "cerberus rex": "/art/cbe0-7eb935ad.webp",
  "jotun of the depths": "/art/b1f2-3e7dd08d.webp",
  "bound void sprite": "/art/b8f6-f8451592.webp",
  "sunwalker": "/art/ca1e-d617aa0d.webp",
  "erik the shadow lord": "/art/8de8-8b814790.webp",
  "metamorphosis typhon": "/art/d81f-0d291dc9.webp",
  "cernunnos staghelm": "/art/0520-abfd3215.webp",
  "flame-touched pyromancer": "/art/f164-0824ce6c.webp",
  "kraken of the deep": "/art/8adc-0eaefbf6.webp",
  "einherjar vanguard": "/art/f2be-1df95b47.webp",
  "earthen sentinel": "/art/b62c-ac1dc6a1.webp",
  "acolyte of hestia": "/art/b1c8-451fba78.webp",
  "hera, queen of gods": "/art/4109-76fbf6df.webp",
  "valkyrie champion": "/art/18a0-28a73ca8.webp",
  "bragi, bard of the gods": "/art/2998-1e075204.webp",
  "yggdrasil": "/art/8215-7c352ae7.webp",
  "völva bloodweaver": "/art/005d-62d607f5.webp",
  "víðarr the bold": "/art/54e8-d12e1de2.webp",
  "perseus the relic hunter": "/art/e855-fe9c6e55.webp",
  "níðhöggr": "/art/c672-c9142811.webp",
  "nótt stargazer": "/art/b776-859ca4d2.webp",
  "tech priest of hephaestus": "/art/adb0-3678e465.webp",
  "hrungnir": "/art/c43d-6ce6df3c.webp",
  "dvalinn, the root stag": "/art/1517-8aad873a.webp",
  "sindri": "/art/97d0-a7e1c63e.webp",
  "daedalus, the tinkerer": "/art/c692-fb4e009e.webp",
  "beast-lord of artemis": "/art/fb1c-b8fafcf4.webp",
  "brokkr the explorer": "/art/ab9c-df065bfa.webp",
  "king fafnir": "/art/33fe-9f2e4a77.webp",
  "fenrisulfr, beast king": "/art/a8d9-eee8c126.webp",
  "lady liadrin": "/art/2d33-1560e41f.webp",
  "muspel imp": "/art/7c47-5aad6343.webp",
  "chimera, beast of flame": "/art/5cf4-c2316405.webp",
  "forager of the wild": "/art/9c86-b1367c6a.webp",
  "curse lord of circe": "/art/647d-890bd83b.webp",
  "charon the steward": "/art/c088-ad2fc9ed.webp",
  "hermès the trader": "/art/c34e-1db07574.webp",
  "deckhand of njord": "/art/612d-23cc0c1f.webp",
  "loki, trickster of chaos": "/art/5f6c-0d05e3a8.webp",
  "medusa, gorgon queen": "/art/fb7d-82f7181c.webp",
  "ancient of lore": "/art/cec8-dc67e3b1.webp",
  "mnemosyne the chronicler": "/art/dc94-80faa3e9.webp",
  "níðhöggr the wyrm queen": "/art/556e-5fd736ca.webp",
  "nidhogg, the corruptor": "/art/2000-b04c97b2.webp",
  "mimir, wisdom keeper": "/art/6da7-ca0fc6e0.webp",
  "moirai, master of fate": "/art/7d57-f8490489.webp",
  "charybdis, the devourer": "/art/8abb-6bf6aeea.webp",
  "hermes, divine messenger": "/art/8159-7d41a656.webp",
  "loki, trickster god": "/art/86f7-8cb16c88.webp",
  "primordial wyrm": "/art/bd55-987b9fd4.webp",
  "echo of the norns": "/art/bead-9bf434ac.webp",
  "thanatos, demon form": "/art/450c-0fc107e1.webp",
  "high priest of hades": "/art/fba2-dd9bb4b7.webp",
  "corruptor of tartarus": "/art/681d-db2e93f0.webp",
  "bloodthirsty raider": "/art/4c5f-62ce228c.webp",
  "bragi, battle conductor": "/art/e17d-219031e7.webp",
  "drake of midgard sky": "/art/a3fd-83f7ea12.webp",
  "totem of muspelheim": "/art/d801-7b4d24a5.webp",
  "glow-tron": "/art/154d-6053a70b.webp",
  "satyr reveler": "/art/12d9-3c8e0733.webp",
  "gaia, stone mother": "/art/a534-4fcc0ac2.webp",
  "mechanical construct": "/art/b6be-4ae475dc.webp",
  "apophis, world ender": "/art/dfe6-c8f1baeb.webp",
  "craftsman of nidavellir": "/art/329d-cafbf408.webp",
  "harpy of the storm": "/art/ce51-63dd2bd9.webp",
  "ran": "/art/fb8b-1ece3434.webp",
  "daedalus the inventor": "/art/5081-59720b15.webp",
  "njörðr the fisher": "/art/5109-14028336.webp",
  "jotun brute": "/art/ce88-79840db1.webp",
  "terror of the grave": "/art/457b-62c061cb.webp",
  "jötun giant": "/art/c552-72aaf7cb.webp",
  "ymir, earth sculptor": "/art/b755-625e150b.webp",
  "arachne the weaver": "/art/fff7-afaec725.webp",
  "hypnos, dream weaver": "/art/6942-45622003.webp",
  "defender of bifrost": "/art/e08f-4965df25.webp",
  "scylla, terror of depths": "/art/680e-871ef147.webp",
  "garmr": "/art/c7e1-b2f9514e.webp",
  "valkyrie crusader": "/art/f31c-128c125b.webp",
  "gaia, earth sculptor": "/art/c838-ebed9878.webp",
  "replay specialist": "/art/d1be-5ae8e3a4.webp",
  "chronos the time dragon": "/art/0776-9e2bce21.webp",
  "storm lizard of thor": "/art/94f4-9cf2f0ac.webp",
  "automaton of ivaldi": "/art/d5ff-4fc50e75.webp",
  "flame-born of muspel": "/art/bbe6-dc918a65.webp",
  "hunter of skadi": "/art/f81d-60c11498.webp",
  "moon-mad fenriskin": "/art/9c1b-844015cb.webp",
  "pesterer of loki": "/art/6998-11a8dec8.webp",
  "arcane giant of olympus": "/art/d437-c256713a.webp",
  "hraesvelgr, the wind-bringer": "/art/5556-2013936e.webp",
  "oracle of delphi": "/art/6a25-ae20eaca.webp",
  "aegir, lord of the deep": "/art/7076-201ce228.webp",
  "hungry wyrm of jormungandr": "/art/ae2b-a657c3e5.webp",
  "sentinel of mimir": "/art/76e0-702e569b.webp",
  "auðumbla the primordial": "/art/a62e-95ca6eb3.webp",
  "mechanical whelp": "/art/7c91-a7f00b87.webp",
  "khartut defender": "/art/9936-c9deeae7.webp",
  "twilight summoner": "/art/5cdc-10bab677.webp",
  "corrupted healbot": "/art/7855-a8bdfa04.webp",
  "abomination": "/art/3776-b3f02430.webp",
  "typhon": "/art/b6ca-d5962a21.webp",
  "mánagarm, the blood moon": "/art/a8e2-ea7daa72.webp",
  "ladon, the hundred-eyed": "/art/b608-d0c0d2e0.webp",
  "viðófnir, the tree guardian": "/art/d9b1-5876ff9a.webp",
  "vánagand, the eclipse dragon": "/art/0182-c9b3b483.webp",
  "lernaean flame": "/art/af3b-b6cab5a5.webp",
  "scylla, the world-render": "/art/6ec8-1643d76c.webp",
  "stheno, the stone-gazer": "/art/447a-296da71d.webp",
  "echidna, mother of dragons": "/art/2b8f-03b3796e.webp",
  "bygul, freyja": "/art/f45e-07ac6ecd.webp",
  "stormcaller wyvern": "/art/72c5-3bf0fa09.webp",
  "bloodfury brewmaster": "/art/54f3-72f9c1d9.webp",
  "pain embracer": "/art/13d0-f697e174.webp",
  "blood reaver": "/art/76af-1b01258a.webp",
  "dark whisperer": "/art/3d07-bd318af2.webp",
  "freya, valkyrie queen": "/art/7ce4-76314b3e.webp",
  "curious excavator": "/art/5e39-2bee39b1.webp",
  "drakonid operative": "/art/195e-9c92d38e.webp",
  "muspeldreki": "/art/97eb-855a83c1.webp",
  "eldjotnar": "/art/f09c-c5673319.webp",
  "bone wraith": "/art/3291-9c9148e1.webp",
  "bronze gatekeeper": "/art/f9bc-04e778a9.webp",
  "baldur, god of light": "/art/613e-640c277e.webp",
  "smith of nidavellir": "/art/efdd-112f8e5e.webp",
  "hecate, dark inquisitor": "/art/860f-b5f9e513.webp",
  "chronos timekeeper": "/art/5435-369ae6cb.webp",
  "ancient eye of the deep": "/art/0f7c-2ff14c3c.webp",
  "frey": "/art/bd6a-95ce78c6.webp",
  "voidfang": "/art/582b-32906c05.webp",
  "dáinn": "/art/cdba-06955e36.webp",
  "ljósálfr": "/art/ed22-fa7284c2.webp",
  "iron boar": "/art/e211-43420d15.webp",
  "druid of the plains": "/art/eea9-f6e3d8dd.webp",
  "iron golem of sindri": "/art/1d23-acecf152.webp",
  "stonetusk boar of gullinbursti": "/art/cf43-3ab9fce1.webp",
  "draugr bones": "/art/087b-02553bwr.webp",
  "draugr, the deathless hunger": "/art/0cf9-oarixvli.webp",
  "skeletal warrior": "/art/130a-hq7tmpye.webp",
  "skeleton": "/art/1d05-1hgo14ai.webp",
  "skeletal lord": "/art/486e-5yogife3.webp",
  "death knight": "/art/4a8d-9eh0ajkz.webp",
  "death knight initiate": "/art/5dce-80i1xfeu.webp",
  "ghoul": "/art/645f-iplk8zo8.webp",
  "risen guardian": "/art/6dfd-wnbc3xxu.webp",
  "zombie": "/art/7062-xwoh2ewg.webp",
  "bone collector": "/art/7338-zus0zamb.webp",
  "rider of death": "/art/8368-kj9k8gw3.webp",
  "doomed guardian": "/art/8711-tnk2u5sb.webp",
  "scourge champion": "/art/8de6-xve9stte.webp",
  "venomfang serpent": "/art/9b16-1fmfzodt.webp",
  "grave robber": "/art/adf6-9j5o3f2q.webp",
  "soul remnant": "/art/c7ec-e4ivcgjc.webp",
  "soul devourer": "/art/d028-mlwffxtg.webp",
  "draugr flesh eater": "/art/d242-o97lo0ic.webp",
  "the abyss bound": "/art/da50-xxfxd3on.webp",
  "einherjar berserker": "/art/045b-s0s32iuj.webp",
  "einherjar elite": "/art/2008-54tu9mt9.webp",
  "einherjar shieldbearer": "/art/c621-6qkaa39a.webp",
  "dark priestess": "/art/030b-ipmne5nf.webp",
  "shadow dancer": "/art/177f-g7hu5cng.webp",
  "shadow hound": "/art/1f54-72m2h14b.webp",
  "shadow imp": "/art/22ae-5dn5jjkx.webp",
  "shadow keeper": "/art/3d86-2lvnvzvs.webp",
  "shadow panther": "/art/4cec-8nftfnwf.webp",
  "shadow pup": "/art/5244-6gvqezbj.webp",
  "shadow thief": "/art/6dd3-6l9wd7rf.webp",
  "shadow whisperer": "/art/817f-wv8q3s76.webp",
  "shadow wolf": "/art/95d0-m51nszio.webp",
  "shadowmaw alpha": "/art/afc6-ob20nnf5.webp",
  "void shade": "/art/bb14-c6ht768i.webp",
  "void wanderer": "/art/c408-9xxu9a72.webp",
  "void breaker": "/art/d0bf-blddgqgk.webp",
  "yggdrasil shadowblade": "/art/e9e2-rognnfhy.webp",
  "echidna, mother of monsters": "/art/095a-g7gjlt5b.webp",
  "arachne, spider lord": "/art/1aaa-333ts18j.webp",
  "arachne": "/art/1ba3-bjnkto9l.webp",
  "arachne, taunt weaver": "/art/3c0d-k7hegp81.webp",
  "typhon, chaos elemental": "/art/4c0f-wurcp818.webp",
  "briareos, the hundred-armed": "/art/5183-o1b3xh13.webp",
  "hecate, the accused": "/art/5517-1f7bqzje.webp",
  "circe, echo witch": "/art/65de-h9kigxwq.webp",
  "moirai confessor": "/art/7bd1-b4ip7ji2.webp",
  "priestess of nemesis": "/art/adbf-lp8ye61z.webp",
  "nyx, dark inquisitor": "/art/addf-4wjxxka4.webp",
  "persephone, queen of shades": "/art/af55-mcz2glr0.webp",
  "eris, mind thief": "/art/fb18-qx4m1ksv.webp",
  "lich queen": "/art/1665-xqnaw540.webp",
  "rune weaver": "/art/3937-ax7x9u4g.webp",
  "chronos, time weaver": "/art/41ce-m0jd0ymi.webp",
  "rune scholar": "/art/4242-vz7cy9vj.webp",
  "rune spark": "/art/6a5e-ocn2s6ak.webp",
  "bifrost arcanist": "/art/6d85-xznex7yq.webp",
  "frostweaver spirit": "/art/76b5-bwzyb3c4.webp",
  "amber weaver": "/art/92c0-5zvr6h9k.webp",
  "æther weaver": "/art/a053-bn3oyk4c.webp",
  "arcanologist": "/art/a231-2mm7gjmc.webp",
  "wand thief": "/art/b507-gvhjbjgz.webp",
  "runescribe initiate": "/art/c5f8-ct2dhwm7.webp",
  "failed student": "/art/c6c8-od6agjtc.webp",
  "apprentice mage": "/art/d359-69ckithi.webp",
  "poison master": "/art/f2eb-osv793c7.webp",
  "hel": "/art/3308-4ceectwu.webp",
  "shade of hades": "/art/504c-fy22uj0f.webp",
  "selene, the devout": "/art/8a47-zgnv1dad.webp",
  "styx reliquary": "/art/8f32-5atoaan3.webp",
  "gemini illusion": "/art/9600-2uc6ue3n.webp",
  "banshee": "/art/08dc-1f4jdlb9.webp",
  "spirit wolf": "/art/1ca6-k1sl785t.webp",
  "frost wraith": "/art/bfc4-iejwrheq.webp",
  "nokken, the water spirit": "/art/cc1f-5ha7i6v8.webp",
  "baldur": "/art/13d6-21np1mu9.webp",
  "baldur the radiant": "/art/e808-9qy2tzqo.webp",
  "surtr": "/art/30a7-1lckcwg0.webp",
  "surtr, flame lord": "/art/73f8-itgrlfi4.webp",
  "múspellsmegir, the fire titan": "/art/d829-1b2npvad.webp",
  "tyr, god of war": "/art/44a5-yfcvx4ut.webp",
  "gladiator": "/art/a0f8-xxspmfv1.webp",
  "heroic challenger": "/art/e7a2-46blwsht.webp",
  "odin": "/art/35f5-kxbkd6cl.webp",
  "ancient of wisdom": "/art/4e4a-jbe5z2ha.webp",
  "fandral the wise": "/art/b17e-v6jm83fs.webp",
  "stern mentor": "/art/f01d-9dcmv9ao.webp",
  "mountain sentinel": "/art/f65f-p0cr7tc7.webp",
  "heimdall": "/art/218d-9wvbnvhs.webp",
  "heimdall, guardian of bifrost": "/art/3fb4-n9501hix.webp",
  "beast king of freya": "/art/0433-1465k5g4.webp",
  "hildisvini, freyja": "/art/1005-wc3i1dke.webp",
  "trjegul, freyja": "/art/5c26-gfo3pan5.webp",
  "valkyrie": "/art/8ba9-cuixtu4v.webp",
  "valkyrie commander": "/art/c7c8-3eygeu3y.webp",
  "valkyrie warlord": "/art/f437-jkhxemxt.webp",
  "grove keeper": "/art/2874-0kzcb8hn.webp",
  "grove warden": "/art/72aa-13a9lxuc.webp",
  "beast tracker": "/art/652d-3fruptt2.webp",
  "hunter of artemis": "/art/67cc-a8ockltq.webp",
  "wilderness scout": "/art/6e64-l30c5tei.webp",
  "forest scout": "/art/79bd-szc13qxf.webp",
  "pack alpha": "/art/9126-gqnsbj5d.webp",
  "forest warden omu": "/art/f5bf-s7iotwa3.webp",
  "jormungandr, echo serpent": "/art/0b0b-xzlu2e8y.webp",
  "loki": "/art/5dcd-o15t632m.webp",
  "proteus, face collector": "/art/77fd-h2r8tkg6.webp",
  "hafgufa, the sea-mist": "/art/801c-e9u5oyne.webp",
  "sol, the sun goddess": "/art/42ec-h35gt366.webp",
  "selene": "/art/9def-nnlmtyvd.webp",
  "helios, sun strider": "/art/b1ae-jn7f8i5b.webp",
  "sol": "/art/7e12-5sufv4zl.webp",
  "spirit of healing": "/art/25ec-sh4r71a9.webp",
  "essence of vitality": "/art/ce30-dbajbor3.webp",
  "well of vitality": "/art/dfb5-guy6bfcm.webp",
  "dwarven artificer": "/art/4246-w193m7p3.webp",
  "shield crafter": "/art/7c7b-10nz846g.webp",
  "brokkr forge-captain": "/art/ce57-n14wzrp3.webp",
  "spellbreaker": "/art/1ca8-wgo85bl3.webp",
  "asclepius, high priest": "/art/8628-8m5v40u3.webp",
  "acolyte of valhalla": "/art/884e-569bv7e0.webp",
  "restoration golem": "/art/af80-gn10s1bb.webp",
  "amara, shield of persephone": "/art/cb93-m8ivjgjw.webp",
  "thunder titan": "/art/9135-1vcfatl1.webp",
  "athena, war maiden": "/art/4cb2-6trmtk8t.webp",
  "weapons master": "/art/75e9-7vtupj6s.webp",
  "argus, storm watcher": "/art/9690-1zwekh9e.webp",
  "pain acceptor": "/art/68ac-d6r8xk8x.webp",
  "huldra, the forest spirit": "/art/f06f-uuaa5bw6.webp",
  "storm elemental": "/art/a55b-gwo99sp4.webp",
  "the storm guardian": "/art/ba8e-1tdq0rli.webp",
  "garm, the hellhound": "/art/97a8-frcm436d.webp",
  "battle-hardened veteran": "/art/0441-ujzwxfqa.webp",
  "raging berserker": "/art/953e-swf1tvb2.webp",
  "fang commander": "/art/1af7-g502sskx.webp",
  "ancestral guardian": "/art/769b-8lxrumdk.webp",
  "ironwood sage": "/art/208d-4ilzugfo.webp",
  "twilight elder": "/art/a6d6-6w7o2my0.webp",
  "sibyl of delphi": "/art/58c7-7miu0kuo.webp",
  "ares, relentless warrior": "/art/6f02-yerac949.webp",
  "enraged berserker": "/art/2265-zp8fovec.webp",
  "ember whelp": "/art/5940-n3snb3ua.webp",
  "firebrand": "/art/dc43-bu47ikb8.webp",
  "cyclops siege tower": "/art/2bbb-oxl7d7ni.webp",
  "talos, elemental titan": "/art/3db9-zkg5entq.webp",
  "muspel berserker": "/art/a642-s6opcphd.webp",
  "elder longneck": "/art/552c-j4hbss6i.webp",
  "stone guardian": "/art/7e79-wuvfl370.webp",
  "primordial druid": "/art/621f-x6pjrh99.webp",
  "earth elemental": "/art/d7fb-sss1cjes.webp",
  "kidnapper": "/art/beca-xje1t9e8.webp",
  "nerida, wave keeper": "/art/8b14-cmovodff.webp",
  "beckoner of evil": "/art/a3ff-axgty9b5.webp",
  "jötun shieldbearer": "/art/c266-vyrzmlaz.webp",
  "primordial fury": "/art/312d-g7hdk1bi.webp",
  "root guardian": "/art/c684-rogi9xw2.webp",
  "root defender": "/art/e0c8-pwdgii2c.webp",
  "guardian of the woods": "/art/e949-r3yc9gw8.webp",
  "verdian, nature": "/art/f674-xy50v0b4.webp",
  "jörð": "/art/f733-z2fpg8q2.webp",
  "pan, nature": "/art/fdb4-pgffnylv.webp",
  "lord of the pit": "/art/71db-t2s6902m.webp",
  "infernal": "/art/fd15-esta87rq.webp",
  "barnabus, world tree spirit": "/art/a521-vsi1eae3.webp",
  "yggdrasil golem": "/art/aeff-q23xlmep.webp",
  "sea sprite scout": "/art/9952-qpi0lscp.webp",
  "ísormr, the frost serpent": "/art/d0b0-nv2dx1yn.webp",
  "myrkrkló": "/art/386d-ig168es7.webp",
  "toad of the wilds": "/art/067b-uw4uaq9s.webp",
  "plant": "/art/8684-xe3hb2fr.webp",
  "verdant longneck": "/art/9605-zfp4egv7.webp",
  "shady dealer": "/art/4bee-dwmp4o4v.webp",
  "jötunn thornback": "/art/ebff-tmhw2wzs.webp",
  "ginnungagap": "/art/60eb-a8jlgznz.webp",
  "helheim valiant": "/art/30fa-4t35xv1n.webp",
  "einherjar recruit": "/art/d06b-vk7ei0k7.webp",
  "muspel infernal": "/art/7431-9wkai9y0.webp",
  "eldþurs, the lava giant": "/art/d37d-h5qceohb.webp",
  "spark": "/art/85c9-yz0ua28c.webp",
  "aeolus, wind tyrant": "/art/a5f0-dxnsb0ev.webp",
  "shield of the colossus": "/art/7130-0b8094b7.webp",
  "temple guardian": "/art/bf42-9zhsqklq.webp",
  "temple berserker": "/art/bd2a-m76xauwn.webp",
  "speaker gidra": "/art/c857-wm2cc1zh.webp",
  "theseus, the equalizer": "/art/6c5f-q5se4d7c.webp",
  "orpheus, battle conductor": "/art/8bb6-r8ug7jzo.webp",
  "prometheus the outcast": "/art/e9c6-ogupxww1.webp",
  "prometheus the firebringer": "/art/e304-1sebgpwj.webp",
  "abyssal enforcer": "/art/028d-vt8aecnj.webp",
  "achilles, immortal warrior": "/art/0429-y5arol11.webp",
  "acolyte of athena": "/art/047f-yymwaczr.webp",
  "ægir greenwave": "/art/0705-wkjpdj4e.webp",
  "ares, war commander": "/art/258c-cx4vkfm3.webp",
  "argus white-eye": "/art/283e-wed4vq3l.webp",
  "artemis the huntress": "/art/3193-0c4j0kwe.webp",
  "askr & embla": "/art/37dc-8lo9azf3.webp",
  "augmented porcupine": "/art/3a95-a09cvqxa.webp",
  "aviana, goddess of birds": "/art/3f60-7nyftfcn.webp",
  "baldr, invulnerable": "/art/4143-wmwdmfsx.webp",
  "bomb maker of sindri": "/art/6608-mn0zp585.webp",
  "bound forge-imp": "/art/6c4b-otijmg2l.webp",
  "brawler of valhalla": "/art/73b0-pepudnqn.webp",
  "centaur chieftain": "/art/8490-auxcxubs.webp",
  "chronos, time dragon": "/art/983c-33dnmgxq.webp",
  "cutpurse": "/art/bbb4-16zr8qmq.webp",
  "cyclops guardian": "/art/be99-pev40ohb.webp",
  "cyclops siege engine": "/art/bf25-9aygfsaf.webp",
  "dionysus, revelry lord": "/art/d2d6-ejoy76yq.webp",
};

/**
 * Get art path for a MINION card by name
 * Uses EXPLICIT MAPPING from MINION_CARD_TO_ART
 * Returns /art/{id}.webp path for matching creatures, or null if no match
 *
 * IMPORTANT: Validates that mapped artwork is in CREATURE_ART_CHARACTERS
 * to prevent minions from using hero-reserved artwork
 *
 * @param cardName - The minion card name
 * @returns The art path (/art/{id}.webp) or null if no explicit mapping exists
 */
export function getCardArtPath(cardName: string): string | null {
  if (!cardName) return null;

  const lowerName = cardName.toLowerCase().trim();

  // Check VERCEL_CARD_ART first (new curated art takes priority)
  const vercelUrl = VERCEL_CARD_ART[lowerName];
  if (vercelUrl) {
    const artIdMatch = vercelUrl.match(/\/art\/(.+)\.webp$/);
    if (artIdMatch) {
      const artId = artIdMatch[1];
      // Block if art belongs to any named character that is NOT a creature
      // (covers heroes, kings, gods, humans, and any other non-creature characters)
      if (ALL_CHARACTER_ART_IDS_SET.has(artId) && !CREATURE_RESERVED_ART_IDS.has(artId)) {
        return null;
      }
    }
    return vercelUrl;
  }

  // Check MINION_CARD_TO_ART for exact match
  const character = MINION_CARD_TO_ART[lowerName];
  if (!character) return null;
  
  // Validate character is in creature-only set (not hero-reserved)
  if (!CREATURE_ART_CHARACTERS.has(character)) {
    debug.warn(`[artMapping] Warning: "${cardName}" maps to hero-reserved character "${character}"`);
    return null;
  }
  
  // Get the art ID for this creature
  const artId = CHARACTER_ART_IDS[character];
  if (!artId) return null;
  
  return `/art/${artId}.webp`;
}

/**
 * Check if a character name is creature-only (available for minion cards)
 */
export function isCreatureCharacter(character: string): boolean {
  return CREATURE_ART_CHARACTERS.has(character);
}

/**
 * Check if a character name is hero-reserved (not available for minions)
 */
export function isHeroReservedCharacter(character: string): boolean {
  return HERO_RESERVED_CHARACTERS.has(character);
}
