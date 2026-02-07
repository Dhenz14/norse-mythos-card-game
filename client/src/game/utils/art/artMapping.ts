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
  'hero-aegir': 'aegir',
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
