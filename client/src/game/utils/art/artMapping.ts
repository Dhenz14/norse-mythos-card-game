import { debug } from '../../config/debugConfig';
import { assetPath } from '../assetPath';

export const DEFAULT_PORTRAIT = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256' viewBox='0 0 256 256'%3E%3Crect fill='%231a1a2e' width='256' height='256'/%3E%3Cpath d='M128 60l-40 80h80z' fill='%23c9a84c' opacity='0.6'/%3E%3Ccircle cx='128' cy='170' r='30' fill='none' stroke='%23c9a84c' stroke-width='2' opacity='0.4'/%3E%3Ctext x='128' y='178' text-anchor='middle' fill='%23c9a84c' font-size='24' opacity='0.7'%3E%E2%9C%A6%3C/text%3E%3C/svg%3E";
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
 * Character name → local art file ID mapping (all files in client/public/art/)
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
  // Custom art entries
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
  // hero-ran uses dedicated ran.png portrait (set in ChessPieceConfig)
  'hero-grid': 'grid',
  'hero-thrud': 'thrud',
  'hero-svadilfari': 'svadilfari',
  'hero-thjazi': 'thjazi',
  'hero-jarnsaxa': 'jarnsaxa',
  'hero-hyrrokkin': 'hyrrokkin',
  
  // Alternate heroes — no dedicated portrait, use closest match
  'hero-njord': 'nerthus',
  'hero-hoenir': 'mimir',
  'hero-ve': 'vidarr',
  'hero-vili': 'vali',
  'hero-fjorgyn': 'frigg',
  'hero-lirien': 'gerd',
  'hero-solvi': 'sol',
  'hero-ylva': 'ulfhednar',
  'hero-fjora': 'skadi',
  // hero-magni, hero-myrka, hero-logi removed — have dedicated portraits

  // Greek heroes — no dedicated portrait, use closest match
  'hero-ammit': 'nott',
  'hero-artemis': 'hefring',
  'hero-demeter': 'hronn',
  'hero-blainn': 'udr',
  'hero-dionysus': 'vidarr',
  'hero-hermes': 'hrodr',
  // aphrodite, athena, persephone, hera, hestia, nyx, ares, hephaestus,
  // zeus, hades, apollo, poseidon removed — have dedicated portraits
  
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
 * Kings use their own portrait PNGs from /portraits/kings/ — not the AI art override system
 */
const KING_TO_CHARACTER: Record<string, string> = {};

/**
 * Direct hero art overrides — highest priority
 * Maps hero IDs directly to art file IDs (bypasses CHARACTER_ART_IDS)
 * Sources: ragnarok-art-export.json (AI-generated hero portraits)
 */
const HERO_ART_OVERRIDE: Record<string, string> = {
	// ── Norse Gods (new AI art from export JSON) ──
	'hero-odin': '17c1-d273b6d8',
	'hero-thor': 'fb79-a09ea9b3',
	'hero-loki': 'e8f6-c135e81a',
	'hero-freya': 'cda6-d28df479',
	'hero-bragi': 'c76a-a581a7c5',
	'hero-eir': 'e1c3-e2d51bc2',
	'hero-forseti': '4bb3-ce4b2ed9',
	'hero-idunn': 'd9ce-c81a7cad',
	'hero-sol': 'f5d6-01ff0c12',
	'hero-kvasir': '2a21-f54a507f',
	'hero-skadi': '2a03-58ae797a',
	'hero-heimdall': 'b62d-d2625495',
	'hero-vili': '6975-92010e2a',
	'hero-aegir': '01f2-91d6d978',
	'hero-hel': '62e5-8d33485a',
	'hero-baldur': 'be87-7f6e4b1b',
	'hero-tyr': '5a19-57185498',
	'hero-vidar': '9a25-fbad0a4b',
	'hero-hoenir': 'b03b-7d0873e9',

	// ── Greek Gods (new AI art from export JSON) ──
	'hero-zeus': '761d-b53ad267',
	'hero-athena': 'f552-7a8f56df',
	'hero-hades': 'e444-2488ac9c',
	'hero-poseidon': 'f386-d67122f8',
	'hero-apollo': 'f2e8-0b20f068',
	'hero-ares': 'b17a-ec608a43',
	'hero-hermes': '9576-e4d01974',
	'hero-aphrodite': 'b082-88cee63a',
	'hero-hephaestus': '54df-42ef3878',
	'hero-dionysus': 'e2c3-fc9ad5a2',
	'hero-artemis': 'c380-df49fbd2',
	'hero-demeter': '6ddf-0f8740b6',
	'hero-hyperion': '378a-1bff480f',
	'hero-chronos': '4128-54b33535',
	'hero-persephone': '3c41-d5bf8c82',
	'hero-nyx': '502a-6dafa318',

	// ── Norse heroes (local art for heroes not in export) ──
	'hero-frigg': '6333-p1fmzcky',
	'hero-groa': 'c7cd-wbifyi1w',
	'hero-frey': '7458-t0n1oqgs',
	'hero-gullveig': 'df09-mj5d0z0j',
	'hero-sinmara': '27de-qwzzvho5',
	'hero-mani': '78e9-6mupjfob',
	'hero-hoder': 'a08f-a2xbq9k1',
	'hero-gefjon': '3e44-araj8dlb',
	'hero-gerd': 'efdf-cwyuxjfl',
	'hero-sigyn': '03d8-lf9wcao3',
	'hero-ullr': 'cef7-2dqqiy45',
	'hero-njord': '23d6-nesirs51',
	'hero-fjorgyn': '6333-p1fmzcky',
	'hero-gormr': 'e1e3-gg3jq3u0',
	'hero-ve': 'd25c-fa7g75kn',

	// ── Base/Common heroes ──
	'hero-erik-flameheart': 'd986-20v9k725',
	'hero-ragnar-ironside': '1ca8-tdtfqurr',
	'hero-bjorn-ironside': '5388-g9bbr777',
	'hero-hervor': '8e3b-ublpaurd',
	'hero-bestla': '84b2-r6m51iu5',
	// hero-brynhild needs god art (d4b7 is pet card "Brynhildr Awakened")
	'hero-nanna': '23d6-nesirs51',
	'hero-volva': 'c7cd-wbifyi1w',
	'hero-sigurd': 'b972-ast4s29y',
	'hero-gudrun': '1d97-35odajjd',
	'hero-starkad': '145a-ra98jlmw',
	'hero-hermod': '82c3-dmd7qmn8',
	'hero-solvi': '8585-51vtraoh',
	'hero-ylva': '660e-4jck4nlz',
	'hero-fjora': 'fdfd-7p1e2ch9',
	'hero-lirien': 'efdf-cwyuxjfl',

	// ── Vikings / fictional heroes ──
	'hero-thorgrim': '46c2-sy7byy2d',
	'hero-valthrud': '9aae-tccijmav',
	'hero-thryma': '984f-0o06zvr0',
	'hero-eldrin': 'c500-5pv67lfk',
	'hero-magni': '89f2-bsi72zws',
	'hero-brakki': '92f4-85792li4',
	'hero-myrka': 'c7cd-wbifyi1w',
	'hero-logi': 'dbeb-b0mibte9',

	// ── Eastern mythology (closest Norse proxy) ──
	'hero-izanami': '6ea4-mrar7o70',
	// hero-tsukuyomi needs god art (d638 is Mani's female-presenting art)
	'hero-sarutahiko': '9a82-xjclj2bn',
	'hero-kamimusubi': '7458-t0n1oqgs',

	// ── Egyptian mythology (closest Norse proxy) ──
	'hero-ammit': '71c1-s6o2do75',
	'hero-maat': '3e44-araj8dlb',
	'hero-serqet': '5579-rtdz78q8',
	'hero-khepri': '9370-t2s89bww',

	// ── Greek misc (eros, hera need god art — export only has their weapons) ──
	'hero-hestia': 'd638-pfkjzzuo',
	'hero-blainn': '23a5-lrnxovtk',
	'hero-ran': '4434-4nu5rrrf',
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

const HERO_RESERVED_ART_IDS = new Set([
  ...[...HERO_RESERVED_CHARACTERS]
    .map(char => CHARACTER_ART_IDS[char])
    .filter((id): id is string => !!id),
  ...Object.values(HERO_ART_OVERRIDE),
]);

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

  // ========== DEMON/ABYSS ARTWORKS ==========
  "titan lord of helheim": "/art/demon_lord_helheim.png",

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
  const override = HERO_ART_OVERRIDE[heroId];
  if (override) return override;
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
  return assetPath(`/art/${artId}.webp`);
}

/**
 * Get art path for a king (returns /art/{id}.webp)
 */
export function getKingArtPath(kingId: string): string | null {
  const artId = getKingArtId(kingId);
  if (!artId) return null;
  return assetPath(`/art/${artId}.webp`);
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
 * Priority: HERO_ART_OVERRIDE > CHARACTER_ART_IDS > explicit portrait PNG
 */
export function resolveHeroPortrait(heroId?: string, explicitPortrait?: string): string | undefined {
  if (heroId) {
    const artPath = getCharacterArtPath(heroId);
    if (artPath) return artPath;
  }
  if (explicitPortrait) return assetPath(explicitPortrait);
  return undefined;
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
  "primordial wyrm": "/art/bd55-987b9fd4.webp",
  "echo of the norns": "/art/bead-9bf434ac.webp",
  "thanatos, titan form": "/art/450c-0fc107e1.webp",
  "high priest of hades": "/art/fba2-dd9bb4b7.webp",
  "corruptor of tartarus": "/art/681d-db2e93f0.webp",
  "bloodthirsty raider": "/art/4c5f-62ce228c.webp",
  "bragi, battle conductor": "/art/e17d-219031e7.webp",
  "drake of midgard sky": "/art/a3fd-83f7ea12.webp",
  "totem of muspelheim": "/art/d801-7b4d24a5.webp",
  "glow-tron": "/art/154d-6053a70b.webp",
  "satyr reveler": "/art/12d9-3c8e0733.webp",
  "mechanical construct": "/art/b6be-4ae475dc.webp",
  "apophis, world ender": "/art/dfe6-c8f1baeb.webp",
  "craftsman of nidavellir": "/art/329d-cafbf408.webp",
  "harpy of the storm": "/art/ce51-63dd2bd9.webp",
  "daedalus the inventor": "/art/5081-59720b15.webp",
  "njörðr the fisher": "/art/5109-14028336.webp",
  "jotun brute": "/art/ce88-79840db1.webp",
  "terror of the grave": "/art/457b-62c061cb.webp",
  "jötun giant": "/art/c552-72aaf7cb.webp",
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
  "curious excavator": "/art/5e39-2bee39b1.webp",
  "drakonid operative": "/art/195e-9c92d38e.webp",
  "muspeldreki": "/art/97eb-855a83c1.webp",
  "eldjotnar": "/art/f09c-c5673319.webp",
  "bone wraith": "/art/3291-9c9148e1.webp",
  "bronze gatekeeper": "/art/f9bc-04e778a9.webp",
  "smith of nidavellir": "/art/efdd-112f8e5e.webp",
  "hecate, dark inquisitor": "/art/860f-b5f9e513.webp",
  "ancient eye of the deep": "/art/0f7c-2ff14c3c.webp",
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
  "einherjar elite": "/art/2008-54tu9mt9.webp",
  "dark priestess": "/art/030b-ipmne5nf.webp",
  "shadow dancer": "/art/177f-g7hu5cng.webp",
  "shadow hound": "/art/1f54-72m2h14b.webp",
  "shadow imp": "/art/22ae-5dn5jjkx.webp",
  "shadow keeper": "/art/3d86-2lvnvzvs.webp",
  "shadow panther": "/art/4cec-8nftfnwf.webp",
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
  "circe, echo witch": "/art/65de-h9kigxwq.webp",
  "moirai confessor": "/art/7bd1-b4ip7ji2.webp",
  "priestess of nemesis": "/art/adbf-lp8ye61z.webp",
  "nyx, dark inquisitor": "/art/addf-4wjxxka4.webp",
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
  "styx reliquary": "/art/8f32-5atoaan3.webp",
  "gemini illusion": "/art/9600-2uc6ue3n.webp",
  "banshee": "/art/08dc-1f4jdlb9.webp",
  "spirit wolf": "/art/1ca6-k1sl785t.webp",
  "frost wraith": "/art/bfc4-iejwrheq.webp",
  "nokken, the water spirit": "/art/cc1f-5ha7i6v8.webp",
  "baldur the radiant": "/art/e808-9qy2tzqo.webp",
  "surtr": "/art/30a7-1lckcwg0.webp",
  "surtr, flame lord": "/art/73f8-itgrlfi4.webp",
  "múspellsmegir, the fire titan": "/art/d829-1b2npvad.webp",
  "gladiator": "/art/a0f8-xxspmfv1.webp",
  "heroic challenger": "/art/e7a2-46blwsht.webp",
  "ancient of wisdom": "/art/4e4a-jbe5z2ha.webp",
  "fandral the wise": "/art/b17e-v6jm83fs.webp",
  "stern mentor": "/art/f01d-9dcmv9ao.webp",
  "mountain sentinel": "/art/f65f-p0cr7tc7.webp",
  "heimdall, guardian of bifrost": "/art/3fb4-n9501hix.webp",
  "beast king of freya": "/art/0433-1465k5g4.webp",
  "hildisvini, freyja": "/art/1005-wc3i1dke.webp",
  "trjegul, freyja": "/art/5c26-gfo3pan5.webp",
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
  "proteus, face collector": "/art/77fd-h2r8tkg6.webp",
  "hafgufa, the sea-mist": "/art/801c-e9u5oyne.webp",
  "sol, the sun goddess": "/art/42ec-h35gt366.webp",
  "selene": "/art/9def-nnlmtyvd.webp",
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
const CARD_ID_TO_ART: Record<number, string> = {
	// 2202: hero-chronos art removed
	3001: '/art/d8dc-6c8aea91.webp',
	3005: '/art/098c-f2eb06ca.webp',
	3007: '/art/4869-44ee81ed.webp',
	3009: '/art/ae61-c56bdd92.webp',
	3011: '/art/2572-fb2d36cd.webp',
	3012: '/art/c2dc-a38e1ef8.webp',
	3013: '/art/faa9-146624c0.webp',
	3014: '/art/302c-a765f163.webp',
	3017: '/art/53c7-291482ac.webp',
	3018: '/art/3ba0-077c4c0b.webp',
	3021: '/art/7517-455fc997.webp',
	3022: '/art/8bc6-89290116.webp',
	3024: '/art/5ae5-ca764e48.webp',
	3025: '/art/c933-c935b27e.webp',
	4003: '/art/e752-a5ddf141.webp',
	4004: '/art/4638-6bf918df.webp',
	4100: '/art/dd5b-74ce66d1.webp',
	4105: '/art/1a38-074e387c.webp',
	4106: '/art/e1a5-b0bf1d7d.webp',
	4108: '/art/72b9-77717eb5.webp',
	4109: '/art/0005-de79b923.webp',
	4110: '/art/c3b8-b61ab6f4.webp',
	4111: '/art/c42f-49b6043d.webp',
	4112: '/art/e5a0-a3a18ac2.webp',
	4113: '/art/f9f2-bd69c6fb.webp',
	4114: '/art/911a-ba666e81.webp',
	4115: '/art/0217-f8801765.webp',
	4116: '/art/39df-a3c72539.webp',
	4117: '/art/1153-241bad88.webp',
	4118: '/art/a9c7-a76a4c04.webp',
	4119: '/art/f8a2-84177c04.webp',
	4200: '/art/77ac-f7a6d593.webp',
	// 4393: hero-baldur art removed
	5001: '/art/ddbb-b37e34cd.webp',
	5011: '/art/02d7-a15ee6d2.webp',
	5013: '/art/ca1c-0caa98f9.webp',
	5014: '/art/1005-0dab1ea2.webp',
	5017: '/art/c88b-5751d38a.webp',
	5019: '/art/3474-191eb4a4.webp',
	5022: '/art/5b05-b706a815.webp',
	5023: '/art/128f-ca15dd84.webp',
	5025: '/art/736d-ab055fd7.webp',
	5026: '/art/78bb-d07b4fb8.webp',
	5029: '/art/df68-17b59148.webp',
	// 5108: hero-persephone art removed
	5114: '/art/c629-4ec7c61d.webp',
	5116: '/art/8972-1981311b.webp',
	5118: '/art/2754-800ba2aa.webp',
	5119: '/art/fcc0-69a843e6.webp',
	5121: '/art/c84c-b957b976.webp',
	5123: '/art/4503-d11a0276.webp',
	5124: '/art/64dc-3ae4dab1.webp',
	5201: '/art/f857-572ebc85.webp',
	5221: '/art/9c07-f3025c08.webp',
	5222: '/art/44f8-075a53da.webp',
	5251: '/art/68fc-84b7f42f.webp',
	5252: '/art/7faf-b9e0897c.webp',
	5919: '/art/99c8-0858a674.webp',
	6000: '/art/ccbc-7b004754.webp',
	6001: '/art/4409-228f1901.webp',
	6002: '/art/e493-bda995e7.webp',
	6003: '/art/d2de-bba208ff.webp',
	6004: '/art/167e-96422cd0.webp',
	6005: '/art/2f2e-548c153b.webp',
	6006: '/art/a43f-72e6ebb4.webp',
	6007: '/art/15a0-f7c02468.webp',
	6008: '/art/a60a-2d17e566.webp',
	6009: '/art/5f79-89404345.webp',
	7001: '/art/b452-41e83e6d.webp',
	7002: '/art/9506-66f4de35.webp',
	7003: '/art/7898-b74e8fd2.webp',
	7005: '/art/7850-0cbf133b.webp',
	7011: '/art/9c49-7e438361.webp',
	7015: '/art/1992-3358a05e.webp',
	7019: '/art/dc61-a52dd5b2.webp',
	7022: '/art/9d06-6131df1f.webp',
	7023: '/art/20b7-462b2fea.webp',
	7102: '/art/fe30-dfb39eda.webp',
	7103: '/art/84d2-57d2b12d.webp',
	7105: '/art/61e1-9e49ebe5.webp',
	7108: '/art/ffb2-2d4bc2d6.webp',
	7109: '/art/09da-c8388cf2.webp',
	7200: '/art/46be-777532bb.webp',
	7201: '/art/0155-1374279c.webp',
	7503: '/art/1b33-2585e634.webp',
	7504: '/art/b96f-e056ab78.webp',
	7505: '/art/9ae8-383bfe6b.webp',
	7520: '/art/649b-b7101782.webp',
	8003: '/art/b5d0-e05e3a52.webp',
	8004: '/art/701f-1278ad4d.webp',
	8005: '/art/e42b-c8753953.webp',
	8006: '/art/6732-4123d2e4.webp',
	8008: '/art/8779-5215f003.webp',
	8009: '/art/6749-d1dc778c.webp',
	8011: '/art/4c55-ad7a6455.webp',
	8013: '/art/2483-b64c11d0.webp',
	8014: '/art/f30b-305c88c9.webp',
	8015: '/art/47c2-d800678a.webp',
	8016: '/art/0c3e-e8e97d3b.webp',
	8501: '/art/b7c0-961a91b2.webp',
	8520: '/art/dcc9-28b56dbf.webp',
	9002: '/art/dcce-2617518e.webp',
	9016: '/art/c17c-948d9827.webp',
	9023: '/art/77cd-4b1d0e36.webp',
	9026: '/art/d0ed-28ac729e.webp',
	9027: '/art/0808-d75b72de.webp',
	9029: '/art/3db9-563d0e79.webp',
	9030: '/art/5090-e103f4b3.webp',
	9031: '/art/a42a-dc2afcdc.webp',
	9101: '/art/a39c-77d58df4.webp',
	9102: '/art/18be-a7bfb386.webp',
	9103: '/art/1336-507a6c2f.webp',
	9104: '/art/27b5-9dae3038.webp',
	9105: '/art/58e5-f216180e.webp',
	9111: '/art/fc88-111cb434.webp',
	9113: '/art/dd34-96db04a0.webp',
	9114: '/art/8cd1-42994331.webp',
	9116: '/art/f096-8deb0ee5.webp',
	9117: '/art/b502-1256db8b.webp',
	9200: '/art/1080-f3ea55af.webp',
	9201: '/art/7d9a-d69cc48e.webp',
	9202: '/art/cdd2-1034dc55.webp',
	9203: '/art/3289-cb9e7246.webp',
	9204: '/art/0f36-ae334c40.webp',
	9205: '/art/7173-6bef8c86.webp',
	9206: '/art/8030-910766e7.webp',
	9207: '/art/7170-040f4ac4.webp',
	10001: '/art/d70f-820456c3.webp',
	10002: '/art/4a72-b276b3f9.webp',
	10004: '/art/e905-cb088536.webp',
	10006: '/art/c3a8-aba25354.webp',
	10007: '/art/bd6a-95ce78c6.webp',
	10008: '/art/4dbf-5a2e85e2.webp',
	10009: '/art/fa0c-e1da5c39.webp',
	10011: '/art/79d2-181fb871.webp',
	10601: '/art/46d3-9721112c.webp',
	10602: '/art/6af1-5358de37.webp',
	10603: '/art/7e04-e4cc9a7f.webp',
	11003: '/art/af89-264993bb.webp',
	11015: '/art/f731-60e5086b.webp',
	11020: '/art/0c44-13316db4.webp',
	11040: '/art/5bd9-fd952221.webp',
	11045: '/art/999c-81604eb3.webp',
	11050: '/art/7533-538178ab.webp',
	11052: '/art/255a-04d36bb7.webp',
	11054: '/art/71b7-198c1324.webp',
	11058: '/art/4b18-04d61506.webp',
	11059: '/art/9e27-d128608d.webp',
	11060: '/art/7167-f8761164.webp',
	12101: '/art/fb5e-039a7dd2.webp',
	12102: '/art/cf81-9d5f9876.webp',
	12104: '/art/d286-792a09e3.webp',
	12105: '/art/3fe3-db2232fd.webp',
	12106: '/art/d367-37d00933.webp',
	12108: '/art/4aec-e8f562e9.webp',
	12109: '/art/59af-0fcd54b7.webp',
	12301: '/art/fcf4-111b9c2a.webp',
	12302: '/art/55ee-5617088a.webp',
	12303: '/art/4247-404af393.webp',
	12304: '/art/397a-8e3031db.webp',
	12401: '/art/837d-d1baa2fb.webp',
	12403: '/art/0de6-c2da73c9.webp',
	14001: '/art/cafd-4a1db968.webp',
	14009: '/art/4a7f-7774aba2.webp',
	14010: '/art/e524-08654cc4.webp',
	14012: '/art/e3f1-3c0177a1.webp',
	14013: '/art/9b2f-b6ea735d.webp',
	16001: '/art/2677-2ce5e9ca.webp',
	16002: '/art/2d7c-818fa714.webp',
	16003: '/art/ccb8-0dcf6a8f.webp',
	16004: '/art/413e-94e356b7.webp',
	16005: '/art/d381-31c13bd3.webp',
	16006: '/art/de11-d3da8ce4.webp',
	16007: '/art/e2a5-0f472d8d.webp',
	16008: '/art/436c-7a5ce3e7.webp',
	16009: '/art/2d88-46357ef0.webp',
	16010: '/art/cb21-e8c1711e.webp',
	16103: '/art/a379-80c87de0.webp',
	16104: '/art/925a-7227d313.webp',
	16105: '/art/ffbf-5597b93e.webp',
	17002: '/art/b743-2c68234d.webp',
	17003: '/art/2e2a-9bac89dc.webp',
	17006: '/art/b8a1-14ad3e6f.webp',
	17009: '/art/0bdb-6a834840.webp',
	17102: '/art/66d1-ebdc5005.webp',
	17103: '/art/054b-9e4dd4d9.webp',
	17105: '/art/30b0-945c8b29.webp',
	17106: '/art/9c29-e9b65f27.webp',
	17107: '/art/57ed-713e9d51.webp',
	17109: '/art/3184-00e1080e.webp',
	17202: '/art/fe2e-13067748.webp',
	17503: '/art/2ac7-5aed9395.webp',
	17504: '/art/014c-4683eafa.webp',
	17505: '/art/93bb-c2779a3c.webp',
	17506: '/art/c3a8-f2f86b91.webp',
	// 20001-20005, 20016-17, 20023, 20027, 20030, 20032-34: hero art removed
	20009: '/art/4974-c1fcd35a.webp',
	20011: '/art/0d51-cfff8374.webp',
	20015: '/art/c933-44fa8b3a.webp',
	20019: '/art/bbe0-786d23f0.webp',
	20022: '/art/b3d3-b364c9c9.webp',
	20036: '/art/7228-ee76269d.webp',
	// 20106: god art removed (hero-reserved)
	20114: '/art/f7f3-352992b6.webp',
	// 20116: god art removed (hero-reserved)
	20118: '/art/5eff-e0406d21.webp',
	// 20119: hero-poseidon art removed
	20213: '/art/0f71-ceaceac3.webp',
	20217: '/art/b55a-2c916440.webp',
	// 20300: hero-hephaestus art removed
	20403: '/art/306c-e2f06c7d.webp',
	20404: '/art/6be9-3140e0b7.webp',
	20405: '/art/ee59-5348f3b4.webp',
	20407: '/art/8516-b0c46cb4.webp',
	20408: '/art/b89a-b4bdd601.webp',
	20702: '/art/75b9-8165babe.webp',
	20709: '/art/292a-d14b1e8b.webp',
	20710: '/art/347d-295fa15f.webp',
	// 20806, 20808, 20809: hero art removed (ares, hermes, idunn)
	// 28002: god art removed (hero-reserved)
	29001: '/art/bd6e-0dbe7c29.webp',
	29002: '/art/cc96-5c2a4a1f.webp',
	29004: '/art/d43f-efc86695.webp',
	29800: '/art/d6cf-4b753a8d.webp',
	29801: '/art/147f-b75a30a0.webp',
	29802: '/art/ef83-e9fb9eda.webp',
	29803: '/art/dada-15d7c0eb.webp',
	29804: '/art/44c6-c487784a.webp',
	29805: '/art/5d17-fdd00d66.webp',
	29806: '/art/8380-791b734e.webp',
	29807: '/art/9194-b0432a0b.webp',
	29808: '/art/3a13-10b905de.webp',
	29809: '/art/e6e2-5b536e46.webp',
	29810: '/art/06ec-a92313ce.webp',
	29811: '/art/9ee8-ef857d3b.webp',
	29812: '/art/05e8-680ae5de.webp',
	29813: '/art/1dbd-c2fb2426.webp',
	29814: '/art/6033-e7d8ea2d.webp',
	29815: '/art/4e7e-37bc33fe.webp',
	29816: '/art/7104-6a8f7f0d.webp',
	29817: '/art/9fee-160c4eb5.webp',
	29818: '/art/c1cc-a580f1ae.webp',
	29819: '/art/8187-a3a28870.webp',
	29820: '/art/372d-29a1cc94.webp',
	29821: '/art/a351-52ed14d0.webp',
	29822: '/art/0b9e-9035f1cd.webp',
	29823: '/art/6934-f19b91ff.webp',
	29824: '/art/2ad2-fe979926.webp',
	29825: '/art/5365-d85b9a66.webp',
	29826: '/art/a87e-a34e71dd.webp',
	29827: '/art/8828-c1e58469.webp',
	29828: '/art/0d89-8808b6ef.webp',
	29829: '/art/3dd8-00084ac8.webp',
	29830: '/art/0372-82d27b38.webp',
	29831: '/art/4023-5eb9e920.webp',
	29832: '/art/b715-f917fbf7.webp',
	29833: '/art/88c3-8ea91c02.webp',
	29834: '/art/acc9-4d521447.webp',
	29835: '/art/0cdc-f31bfee8.webp',
	29836: '/art/d4c4-78e12bd0.webp',
	29837: '/art/b6e9-9835f30a.webp',
	29838: '/art/7422-0bea2902.webp',
	29839: '/art/b902-b692c03c.webp',
	29840: '/art/5e62-7ccfda92.webp',
	29841: '/art/1f92-424db856.webp',
	29842: '/art/cd35-c8bbce96.webp',
	29843: '/art/070a-31f6be5b.webp',
	29844: '/art/e301-552897da.webp',
	29845: '/art/ea1b-f22c3d76.webp',
	29846: '/art/7e41-82af8247.webp',
	29847: '/art/fb32-80535ba6.webp',
	29848: '/art/e6e6-aec33a8a.webp',
	29849: '/art/0fa3-f1f13973.webp',
	29900: '/art/4bdb-2926fb0f.webp',
	29901: '/art/09c6-88f10003.webp',
	29902: '/art/452b-99645a01.webp',
	29903: '/art/1798-7e6b2895.webp',
	29904: '/art/bee8-409f3f5d.webp',
	29905: '/art/1d11-f40a9a0f.webp',
	29906: '/art/020d-3994ba8b.webp',
	29907: '/art/e68f-4055ca02.webp',
	29908: '/art/cd54-a5b97b4b.webp',
	29909: '/art/ed90-aa778595.webp',
	29910: '/art/303c-d4147375.webp',
	29911: '/art/ab20-5ec0b360.webp',
	29912: '/art/2d48-b34a1e6c.webp',
	29913: '/art/6af9-f105656b.webp',
	29914: '/art/c2b4-c2f59116.webp',
	29915: '/art/1ec7-c229975b.webp',
	29916: '/art/0afa-9c4a54ed.webp',
	29917: '/art/79c6-dc61f14c.webp',
	29918: '/art/68d8-954d95ef.webp',
	29919: '/art/a6a8-b331317c.webp',
	29920: '/art/2c65-9e21694c.webp',
	29921: '/art/315a-40a81285.webp',
	29922: '/art/1076-fb2849a6.webp',
	29923: '/art/f9bc-289ea1f4.webp',
	29924: '/art/dfe9-bb0e414f.webp',
	29925: '/art/9a65-05198687.webp',
	29926: '/art/c1b5-208ce896.webp',
	29927: '/art/d2ad-39189fa4.webp',
	29928: '/art/386c-285a0b63.webp',
	29929: '/art/97da-52436c1b.webp',
	29930: '/art/d0af-a41ca345.webp',
	29931: '/art/f51b-b4e4b953.webp',
	29932: '/art/5308-32f03666.webp',
	29933: '/art/ec48-bbe00142.webp',
	29934: '/art/116c-a281ec88.webp',
	29935: '/art/4839-3fa33eb6.webp',
	29936: '/art/26cf-46fee050.webp',
	29937: '/art/ac32-22bfbc53.webp',
	29938: '/art/3be4-7135749b.webp',
	29939: '/art/d266-78db31b8.webp',
	29940: '/art/4c39-eba424bc.webp',
	29941: '/art/3723-889c55cc.webp',
	29942: '/art/5871-dfeb5515.webp',
	29943: '/art/8e85-10968320.webp',
	29944: '/art/8951-d10d9fe3.webp',
	29945: '/art/70fe-949a3c47.webp',
	29946: '/art/9faf-12d0cb50.webp',
	29947: '/art/5f9f-915c13dd.webp',
	29948: '/art/4bf1-2423017c.webp',
	29949: '/art/a994-8f90349e.webp',
	29950: '/art/091c-2a9202cb.webp',
	29951: '/art/1a1e-88a6bed4.webp',
	29952: '/art/7216-58e9aa6f.webp',
	29953: '/art/df5b-3fff3a53.webp',
	29954: '/art/c68d-8515a70b.webp',
	29955: '/art/a417-075be6ac.webp',
	29956: '/art/0e38-b38646c0.webp',
	29957: '/art/cc60-f9666ab3.webp',
	29958: '/art/f879-e6a1555f.webp',
	29959: '/art/2123-4d3d303f.webp',
	29960: '/art/71e1-029be784.webp',
	29961: '/art/294c-e3571cbb.webp',
	29962: '/art/6fd8-17d6d70c.webp',
	29963: '/art/8c37-c6d48ea8.webp',
	29964: '/art/31e6-17946162.webp',
	29965: '/art/8f79-c0e1ae47.webp',
	29966: '/art/491a-fef98c3f.webp',
	29967: '/art/684b-e052658e.webp',
	// 31002-31007: hero art removed (hoenir, forseti, kvasir, vili, bragi)
	31009: '/art/df37-c092d66b.webp',
	31017: '/art/c8b2-54178ac7.webp',
	31019: '/art/d0e1-0bf77be6.webp',
	31022: '/art/50ed-24f9bedb.webp',
	31035: '/art/51f3-58b8462c.webp',
	31036: '/art/bda7-1152c17c.webp',
	31050: '/art/03c9-8d3a258c.webp',
	31051: '/art/0b74-3feb4c74.webp',
	31052: '/art/6b85-226d5e6e.webp',
	31053: '/art/72fe-afca7915.webp',
	31054: '/art/e73e-ad1c70a2.webp',
	31055: '/art/a429-f3c90fcd.webp',
	31056: '/art/11c1-39e7e1e8.webp',
	31057: '/art/732e-4c592d3d.webp',
	31058: '/art/8c3f-dcf20ac3.webp',
	31059: '/art/b7b0-c8efe9a4.webp',
	31104: '/art/e0a8-b2784e21.webp',
	31501: '/art/93d4-514494fa.webp',
	// 31512: hero-vidar art removed
	5050: '/art/43b1-28482b60.webp',
	31303: '/art/a1eb-fa3fb055.webp',
	31403: '/art/4c00-12f6f52f.webp',
	31923: '/art/behemoth.webp',
	40120: '/art/cottus.webp',
	40121: '/art/gyges.webp',
	40122: '/art/briareos.webp',
	32001: '/art/7926-bd63b140.webp',
	32002: '/art/68bc-a4c95451.webp',
	32004: '/art/b9af-9f73c29d.webp',
	32005: '/art/99a2-9b8ce6db.webp',
	32006: '/art/53a8-249e0de0.webp',
	32007: '/art/24b9-2ac25ef8.webp',
	32009: '/art/e4f9-0393171f.webp',
	32010: '/art/28aa-9f22cc1c.webp',
	32011: '/art/3dd5-b2fe859f.webp',
	32012: '/art/e0c8-fd44fdaf.webp',
	32013: '/art/27bf-9d595048.webp',
	32015: '/art/349a-e500d636.webp',
	32017: '/art/9ea8-ae4a808b.webp',
	32018: '/art/8b44-02ba688d.webp',
	32019: '/art/d757-829aa904.webp',
	32020: '/art/3667-f587b676.webp',
	32033: '/art/893d-8a1d062f.webp',
	33001: '/art/4efb-b841e240.webp',
	33004: '/art/7203-522638f9.webp',
	33005: '/art/3790-e4ebf660.webp',
	33007: '/art/cb11-9ecb4fdb.webp',
	33008: '/art/cb88-11963593.webp',
	33009: '/art/a2c5-f226a573.webp',
	33011: '/art/037c-289db32b.webp',
	33126: '/art/045b-s0s32iuj.webp',
	33148: '/art/c621-6qkaa39a.webp',
	33233: '/art/0a8d-336ea882.webp',
	33272: '/art/b569-c77f450b.webp',
	33295: '/art/5435-369ae6cb.webp',
	35004: '/art/06ec-1fa49c65.webp',
	35005: '/art/8198-24f0cced.webp',
	35007: '/art/b562-821711d7.webp',
	35008: '/art/6cb2-d2552c68.webp',
	35009: '/art/ff11-b430043f.webp',
	35011: '/art/21d2-ee5a5bb2.webp',
	35012: '/art/3836-ca436173.webp',
	35014: '/art/eb59-e8c1abc1.webp',
	35017: '/art/62b1-b345ef22.webp',
	35018: '/art/0937-d3a77aca.webp',
	37001: '/art/c466-e858f317.webp',
	37002: '/art/f506-21be1471.webp',
	37003: '/art/af70-ddb7cb1d.webp',
	37004: '/art/7fbf-6eb22c2d.webp',
	37005: '/art/bf79-a39159ca.webp',
	37006: '/art/cbaf-3ba52925.webp',
	37007: '/art/6fb4-eda9089a.webp',
	37008: '/art/01dc-c7be74bc.webp',
	37009: '/art/20f0-3a5c0725.webp',
	37010: '/art/55c6-7f5bc11e.webp',
	// 38010, 38208, 38506, 40006: hero art removed (hyperion, aegir, hel, sol)
	40008: '/art/b3c0-abb9990a.webp',
	40009: '/art/cd77-b63c2d2d.webp',
	40010: '/art/d1d5-ed57b8d5.webp',
	40011: '/art/345e-9f704ce5.webp',
	40014: '/art/a1a9-358e66f8.webp',
	40017: '/art/328d-826bf00f.webp',
	40019: '/art/73ea-da31edfa.webp',
	40024: '/art/f532-24356f0b.webp',
	47001: '/art/4dd0-5193cdb3.webp',
	47003: '/art/6db3-8d078793.webp',
	47005: '/art/fd22-26c435eb.webp',
	47007: '/art/c4e8-bca6e5d2.webp',
	47008: '/art/f8df-42980a25.webp',
	47010: '/art/d85d-62cf533a.webp',
	47431: '/art/f0e5-1dd9c897.webp',
	50000: '/art/fe4f-bc994e6b.webp',
	50001: '/art/69e8-fccbb044.webp',
	50002: '/art/dd7c-b35ebacd.webp',
	50003: '/art/8d87-1fdf8fe7.webp',
	50004: '/art/76e8-43656386.webp',
	50005: '/art/6592-dd76bccb.webp',
	50006: '/art/d8a8-fd0fa86c.webp',
	50010: '/art/94e0-16ad1842.webp',
	50011: '/art/8265-9fa1a624.webp',
	50012: '/art/48f0-79fa64cb.webp',
	50013: '/art/ef17-78087ee7.webp',
	50014: '/art/25d4-28ea6639.webp',
	50015: '/art/c108-e265502a.webp',
	50016: '/art/642f-7f800332.webp',
	50020: '/art/f69e-d966cfeb.webp',
	50021: '/art/2ebd-cd5e229d.webp',
	50022: '/art/78f8-22138757.webp',
	50023: '/art/d328-dc306910.webp',
	50024: '/art/0967-cd6539c1.webp',
	50025: '/art/d9bc-df01747a.webp',
	50026: '/art/85d7-1facb4b0.webp',
	50030: '/art/3a2b-4af6e03e.webp',
	50031: '/art/de14-360c9b41.webp',
	50032: '/art/a6c3-0a0396f3.webp',
	50033: '/art/bff6-f12fbc5d.webp',
	50034: '/art/ad68-7716dd58.webp',
	50035: '/art/6b4b-02252807.webp',
	50036: '/art/1857-bb251f93.webp',
	50040: '/art/0d6f-67693f15.webp',
	50041: '/art/d1cb-706fb960.webp',
	50042: '/art/0ff2-b9755514.webp',
	50043: '/art/265d-e51f4637.webp',
	50044: '/art/a82f-46431487.webp',
	50045: '/art/fab2-8448f407.webp',
	50046: '/art/e893-0b79249a.webp',
	50050: '/art/ee8b-46560d33.webp',
	50051: '/art/f2d3-2e7caac7.webp',
	50052: '/art/c846-ecfca375.webp',
	50053: '/art/aacb-6f736b55.webp',
	50054: '/art/651d-d77932e3.webp',
	50055: '/art/e67c-f01c6aa6.webp',
	50056: '/art/7f99-862737e2.webp',
	50060: '/art/fa1e-14e764ba.webp',
	50061: '/art/287a-0560bd81.webp',
	50062: '/art/39f5-2f42918b.webp',
	50063: '/art/9a39-d44fc509.webp',
	50064: '/art/1460-673a2933.webp',
	50065: '/art/2264-3377d2cf.webp',
	50066: '/art/64b0-11ef8ae6.webp',
	50070: '/art/5233-488fc310.webp',
	50071: '/art/cb31-1f06675f.webp',
	50072: '/art/62be-6a77feaa.webp',
	50073: '/art/d4b7-2cece17d.webp',
	50074: '/art/ae91-7835cb7f.webp',
	50075: '/art/6873-40225b60.webp',
	50076: '/art/ef95-f68fe4a7.webp',
	50080: '/art/7ee5-fd1e84c9.webp',
	50081: '/art/7fc9-62988d52.webp',
	50082: '/art/feae-7472e8b4.webp',
	50083: '/art/3ce4-99667a92.webp',
	50084: '/art/2c56-537f5426.webp',
	50085: '/art/a41f-68543620.webp',
	50086: '/art/2763-58c211cd.webp',
	50090: '/art/82bb-40b2b7ad.webp',
	50091: '/art/8544-be9dce8b.webp',
	50092: '/art/7e0c-3ee6de19.webp',
	50093: '/art/8d09-dbb58027.webp',
	50094: '/art/f851-0ae162ba.webp',
	50095: '/art/fa66-dffd26ca.webp',
	50096: '/art/8ff4-766553a9.webp',
	50100: '/art/a158-7dee3c46.webp',
	50101: '/art/c78d-c5d09af8.webp',
	50102: '/art/a62a-50aea86a.webp',
	50103: '/art/f3df-776a49e2.webp',
	50104: '/art/1760-d07da7aa.webp',
	50105: '/art/b6f5-964e5fec.webp',
	50106: '/art/bb1e-0d00c183.webp',
	50110: '/art/64c7-6048d749.webp',
	50111: '/art/0f60-ac493bb0.webp',
	50112: '/art/dff9-68ae18da.webp',
	50113: '/art/c403-54672f3b.webp',
	50114: '/art/8a35-d7dd2a2c.webp',
	50115: '/art/94e7-ea6bd1c7.webp',
	50116: '/art/1217-c86ad550.webp',
	50120: '/art/eae8-1752aef7.webp',
	50121: '/art/507a-c60962c0.webp',
	50122: '/art/9f84-f28ca929.webp',
	50123: '/art/383a-e93c1367.webp',
	50124: '/art/6c54-6db031fe.webp',
	50125: '/art/9996-a8643b15.webp',
	50126: '/art/b044-cc05fc52.webp',
	50130: '/art/600f-78f39e2e.webp',
	50131: '/art/f2b4-ba8bb6e4.webp',
	50132: '/art/b8ac-5ddcef0a.webp',
	50133: '/art/f02e-06092bb6.webp',
	50134: '/art/935e-b0fbcf04.webp',
	50135: '/art/2487-181fd9c7.webp',
	50136: '/art/4c9a-8bb84034.webp',
	50140: '/art/4348-f4138824.webp',
	50141: '/art/8e78-1ecd93e1.webp',
	50142: '/art/73f9-ee54ae42.webp',
	50143: '/art/3091-371b4844.webp',
	50144: '/art/b26d-90c72e7a.webp',
	50145: '/art/673f-7f0b114b.webp',
	50146: '/art/0584-6eee5484.webp',
	50150: '/art/18fe-f3df6471.webp',
	50151: '/art/f39e-e732a85d.webp',
	50152: '/art/295a-d4d0acbf.webp',
	50153: '/art/ddec-d38d8328.webp',
	50154: '/art/019a-b94f6675.webp',
	50155: '/art/22be-c4687262.webp',
	50156: '/art/301b-3cd1cc93.webp',
	50160: '/art/eb72-baee1225.webp',
	50161: '/art/a58a-41ceecbd.webp',
	50162: '/art/960c-5ed0ee05.webp',
	50163: '/art/e8e0-67f486c1.webp',
	50164: '/art/40a4-8a087766.webp',
	50165: '/art/4a05-825ca26a.webp',
	50166: '/art/f62a-ea6eb335.webp',
	50170: '/art/796b-bf1a5748.webp',
	50171: '/art/3318-b5494efd.webp',
	50172: '/art/bada-925add8e.webp',
	50173: '/art/bae2-afcba488.webp',
	50174: '/art/d750-a9d68f28.webp',
	50175: '/art/c394-f0a797f2.webp',
	50176: '/art/7967-df61060f.webp',
	50180: '/art/ede3-b328c2f9.webp',
	50181: '/art/5b9e-a7b7f3c9.webp',
	50182: '/art/3387-352ecb72.webp',
	50183: '/art/07df-6c36f470.webp',
	50184: '/art/b285-8b441d62.webp',
	50185: '/art/9aa8-dc34ad6e.webp',
	50186: '/art/8c11-b7bec573.webp',
	50190: '/art/2ab9-5466f76c.webp',
	50191: '/art/58a4-71a294aa.webp',
	50192: '/art/3506-2e965d3c.webp',
	50193: '/art/c6d0-89b396f6.webp',
	50194: '/art/4a15-ff3fc465.webp',
	50195: '/art/9cd1-692268d1.webp',
	50196: '/art/6d5e-3f45a40e.webp',
	50200: '/art/79af-38492946.webp',
	50201: '/art/8145-2abc1e24.webp',
	50202: '/art/a851-c2a1e08d.webp',
	50203: '/art/e8ca-4f216eff.webp',
	50204: '/art/e074-1928b25e.webp',
	50205: '/art/56e9-b9092bd9.webp',
	50206: '/art/8460-65b8eed4.webp',
	50210: '/art/8d5f-2d8b79f0.webp',
	50211: '/art/1d58-1b7d1d5d.webp',
	50212: '/art/2221-bc86cf47.webp',
	50213: '/art/6b07-c21f4837.webp',
	50214: '/art/175d-d470b754.webp',
	50215: '/art/65ad-81d9318b.webp',
	50216: '/art/ed8c-bc761125.webp',
	50220: '/art/d62b-7fb17d3b.webp',
	50221: '/art/6566-18ecdaa0.webp',
	50222: '/art/1b0e-8e8ab24d.webp',
	50223: '/art/25ad-5ab42f80.webp',
	50224: '/art/ccdd-a84c4cb1.webp',
	50225: '/art/d4e2-5dc214b1.webp',
	50226: '/art/78af-83a4baf8.webp',
	50230: '/art/b833-38903b92.webp',
	50231: '/art/ff73-70cbc891.webp',
	50232: '/art/e47d-988c7247.webp',
	50233: '/art/cebe-229357b8.webp',
	50234: '/art/76eb-92ea5db5.webp',
	50235: '/art/361a-f73c72e6.webp',
	50236: '/art/c6de-24da099d.webp',
	50240: '/art/b71a-10e7151a.webp',
	50241: '/art/2cf2-3994cbf2.webp',
	50242: '/art/93c0-e467a2c3.webp',
	50243: '/art/87dc-6eb18ea4.webp',
	50244: '/art/f30c-7465c5c6.webp',
	50245: '/art/f0e8-474fcc01.webp',
	50246: '/art/0490-4d563634.webp',
	50250: '/art/f96b-7da213ae.webp',
	50251: '/art/e92e-360f1182.webp',
	50252: '/art/2099-6f2d26f9.webp',
	50253: '/art/78d3-d0f77bbd.webp',
	50254: '/art/7c8a-1b05cfc9.webp',
	50255: '/art/f4b1-913da422.webp',
	50256: '/art/8480-62deaa1a.webp',
	50260: '/art/a4e9-6a09684f.webp',
	50261: '/art/8a48-cd32c090.webp',
	50262: '/art/609b-029279d3.webp',
	50263: '/art/998d-62026d9a.webp',
	50264: '/art/bb63-d5c070fa.webp',
	50265: '/art/149d-ddeaee59.webp',
	50266: '/art/b25a-81583a1b.webp',
	50270: '/art/a976-cc758442.webp',
	50271: '/art/2359-a6959fd2.webp',
	50272: '/art/c126-b0b34aa5.webp',
	50273: '/art/a8ee-041c2a1e.webp',
	50274: '/art/33c3-23267c73.webp',
	50275: '/art/64e4-4f2a5141.webp',
	50276: '/art/9859-38103ccb.webp',
	50280: '/art/b133-4c7b10e2.webp',
	50281: '/art/a346-1029de10.webp',
	50282: '/art/4bca-f29ea88e.webp',
	50283: '/art/9d9d-b8d99eb2.webp',
	50284: '/art/c562-80477ab0.webp',
	50285: '/art/0f9d-de71ee39.webp',
	50286: '/art/228f-459cf5fb.webp',
	50290: '/art/f152-213f537d.webp',
	50291: '/art/d9ba-479246ef.webp',
	50292: '/art/fba3-2c817f51.webp',
	50293: '/art/3859-2d61baf6.webp',
	50294: '/art/1fd9-7ee2061f.webp',
	50295: '/art/8525-5206bcb1.webp',
	50296: '/art/de1f-d241785c.webp',
	50300: '/art/7148-cdc6f6cf.webp',
	50301: '/art/4483-438d877e.webp',
	50302: '/art/64a7-38da5cc9.webp',
	50303: '/art/c3f0-17cf03a5.webp',
	50304: '/art/794e-e362b6c5.webp',
	50305: '/art/f29d-81fbfb57.webp',
	50306: '/art/d052-a9dcbbea.webp',
	50310: '/art/db7a-e0c19891.webp',
	50311: '/art/91a9-b4b94e97.webp',
	50312: '/art/4573-3dba45ed.webp',
	50313: '/art/6e07-1e8a937e.webp',
	50314: '/art/a5e3-ceb9962b.webp',
	50315: '/art/d443-2e499948.webp',
	50316: '/art/09a5-b08c3d58.webp',
	50320: '/art/5fc8-55dca09b.webp',
	50321: '/art/b2dc-710d8a79.webp',
	50322: '/art/57ae-c36363bb.webp',
	50323: '/art/03f0-a0a30fb9.webp',
	50324: '/art/dba0-7263f1d4.webp',
	50325: '/art/7745-23053253.webp',
	50326: '/art/777f-decf403c.webp',
	50330: '/art/8bf0-425adfc6.webp',
	50331: '/art/f292-77cb072e.webp',
	50332: '/art/47e2-9ea9bb68.webp',
	50333: '/art/5fb6-994549d9.webp',
	50334: '/art/7fd4-f4b83ab9.webp',
	50335: '/art/0d63-722c7902.webp',
	50336: '/art/4da5-89bed449.webp',
	50340: '/art/c0b5-89affb98.webp',
	50341: '/art/cf09-94774a9b.webp',
	50342: '/art/6db1-b71ec861.webp',
	50343: '/art/dc96-77bc3e4d.webp',
	50344: '/art/79e4-a4fdbcc6.webp',
	50345: '/art/b22a-2865935a.webp',
	50346: '/art/076a-61e58195.webp',
	50350: '/art/7dd3-3ff2069b.webp',
	50351: '/art/37df-a9bd39ff.webp',
	50352: '/art/eccc-06c32f90.webp',
	50353: '/art/b4e9-b6a5612c.webp',
	50354: '/art/0a38-f0c4f8f4.webp',
	50355: '/art/8c7e-0c48ec45.webp',
	50356: '/art/d157-8b367d4e.webp',
	50360: '/art/dd3c-f1e48983.webp',
	50361: '/art/157f-d5a44501.webp',
	50362: '/art/9047-d9555e63.webp',
	50363: '/art/b2e6-9c73c5f2.webp',
	50364: '/art/20fe-78a2ac01.webp',
	50365: '/art/750e-6ab8f04a.webp',
	50366: '/art/18b8-e29e2f8b.webp',
	50370: '/art/3de9-1b896ea7.webp',
	50371: '/art/62f9-f9801461.webp',
	50372: '/art/5cb7-962a2b4d.webp',
	50373: '/art/42d3-3ac1688a.webp',
	50374: '/art/640c-a89f06ff.webp',
	50375: '/art/fc41-bd54af03.webp',
	50376: '/art/613d-9033f641.webp',
	50400: '/art/b4f2-a4377344.webp',
	50401: '/art/af80-ff2b55c1.webp',
	50402: '/art/0d9f-0498f2d6.webp',
	50403: '/art/09b7-ee1af7bd.webp',
	50404: '/art/8a56-59641bc5.webp',
	50405: '/art/5f7e-51e5a0f5.webp',
	50406: '/art/16fb-9f085049.webp',
	50407: '/art/08bc-79f66e5e.webp',
	50408: '/art/e00b-47c62d0f.webp',
	50409: '/art/8621-6dcc124b.webp',
	50410: '/art/e16f-90296cb7.webp',
	50411: '/art/bb9e-4fce48b0.webp',
	50412: '/art/f8e4-386be9d3.webp',
	50413: '/art/96e5-308117de.webp',
	50414: '/art/181c-10d6b19e.webp',
	50415: '/art/aaad-3ca87fdc.webp',
	50416: '/art/9654-2cd78712.webp',
	50417: '/art/3b32-fde46de1.webp',
	50500: '/art/04b7-88285000.webp',
	50501: '/art/4eef-11a43002.webp',
	50502: '/art/bbf7-0166328e.webp',
	50503: '/art/ffde-007b6bae.webp',
	50504: '/art/5804-9c8c8d56.webp',
	50505: '/art/d5de-6b78b58e.webp',
	50506: '/art/f60f-8f36954e.webp',
	50507: '/art/0c45-b1c130dc.webp',
	50508: '/art/c3c4-d931d3d1.webp',
	50509: '/art/077d-a9741602.webp',
	50510: '/art/254a-a112a91b.webp',
	50511: '/art/414e-af5dadb1.webp',
	50512: '/art/e293-5eb31a82.webp',
	50513: '/art/95f4-75e2420a.webp',
	50600: '/art/995d-1b9f7107.webp',
	50601: '/art/fa84-98f4c257.webp',
	50602: '/art/672c-e22afb77.webp',
	50603: '/art/f839-68f1e3d9.webp',
	50604: '/art/1497-b8f89511.webp',
	50605: '/art/05f6-48bf3d26.webp',
	50606: '/art/3507-860ebcff.webp',
	50607: '/art/137f-71dbf902.webp',
	50608: '/art/703d-ffa432fd.webp',
	50609: '/art/982f-ea8f4fef.webp',
	50610: '/art/2df6-cb27a76a.webp',
	50611: '/art/8e68-623bee80.webp',
	50612: '/art/82bd-fedd59e1.webp',
	50613: '/art/9264-c325e147.webp',
	50614: '/art/64db-82daaaf0.webp',
	50615: '/art/2407-5a48091b.webp',
	60001: '/art/0e75-ba19d7d0.webp',
	60004: '/art/2ccf-b84c525b.webp',
	60010: '/art/497d-58b49102.webp',
	60101: '/art/39cb-0387e0f1.webp',
	60102: '/art/fe94-1f25c28b.webp',
	60103: '/art/9fb3-2ad1f041.webp',
	70001: '/art/4d45-5ca5f18e.webp',
	70002: '/art/38b6-cbd83e09.webp',
	70003: '/art/89e9-6cd47cef.webp',
	70004: '/art/970f-dc8eb854.webp',
	70005: '/art/e7e6-98befc04.webp',
	70006: '/art/088e-d4d23253.webp',
	70011: '/art/5fa7-1cba3338.webp',
	70012: '/art/d659-0cef67e3.webp',
	70013: '/art/6d49-2e15abbf.webp',
	70017: '/art/a6f9-a6f8ef33.webp',
	70020: '/art/dbf5-334072df.webp',
	70021: '/art/7c02-36a3762e.webp',
	71002: '/art/01c6-cd73b01f.webp',
	80003: '/art/d13a-486d7d40.webp',
	80010: '/art/12bd-7ee0d5c3.webp',
	80011: '/art/fd28-2f0581b6.webp',
	80020: '/art/4537-f69e2c5e.webp',
	80021: '/art/e5ca-329f7a2f.webp',
	85001: '/art/cf0a-a1a8af03.webp',
	85002: '/art/6b7e-dd24a1b9.webp',
	85003: '/art/220e-62f8b863.webp',
	85005: '/art/2c96-40bf32fc.webp',
	85010: '/art/9c72-799a4917.webp',
	85011: '/art/1f12-c371d891.webp',
	85020: '/art/ef80-c0086c13.webp',
	85001001: '/art/82ae-8fd7158e.webp',
	85001002: '/art/d74e-bdd750c1.webp',

};

/** Set of all art file paths reserved for heroes — built once from HERO_ART_OVERRIDE */
const HERO_ART_PATHS = new Set(
	Object.values(HERO_ART_OVERRIDE).map(id => `/art/${id}.webp`)
);

/** Set of all hero art IDs (without path/extension) for VERCEL_CARD_ART guard */
const HERO_ART_IDS_SET = new Set(Object.values(HERO_ART_OVERRIDE));

export function getCardArtById(cardId: number | string): string | null {
	const id = typeof cardId === 'string' ? parseInt(cardId, 10) : cardId;
	if (isNaN(id)) return null;
	const path = CARD_ID_TO_ART[id];
	if (!path) return null;
	// Guard: never serve hero-reserved art for card IDs
	if (HERO_ART_PATHS.has(path)) {
		debug.warn(`Blocked hero art ${path} for card ${id}`);
		return null;
	}
	return assetPath(path);
}

const _artPathCache = new Map<string, string | null>();

export function getCardArtPath(cardName: string, cardId?: number | string): string | null {
  if (!cardName) return null;

  const cacheKey = cardId != null ? `id:${cardId}` : cardName.toLowerCase().trim();

  if (_artPathCache.has(cacheKey)) {
    return _artPathCache.get(cacheKey)!;
  }

  if (cardId != null) {
    const idResult = getCardArtById(cardId);
    if (idResult) {
      _artPathCache.set(cacheKey, idResult);
      return idResult;
    }
  }

  const lowerName = cardName.toLowerCase().trim();

  let result: string | null = null;

  // Check VERCEL_CARD_ART first (new curated art takes priority)
  const vercelUrl = VERCEL_CARD_ART[lowerName];
  if (vercelUrl) {
    const artIdMatch = vercelUrl.match(/\/art\/(.+)\.webp$/);
    if (artIdMatch) {
      const artId = artIdMatch[1];
      // Block if art belongs to any named character that is NOT a creature
      // (covers heroes, kings, gods, humans, and any other non-creature characters)
      // Also block art reserved for heroes via HERO_ART_OVERRIDE (closes gap where
      // 35+ hero art IDs exist outside CHARACTER_ART_IDS)
      if ((ALL_CHARACTER_ART_IDS_SET.has(artId) && !CREATURE_RESERVED_ART_IDS.has(artId)) || HERO_ART_IDS_SET.has(artId)) {
        _artPathCache.set(lowerName, null);
        return null;
      }
    }
    result = assetPath(vercelUrl);
    _artPathCache.set(lowerName, result);
    return result;
  }

  // Check MINION_CARD_TO_ART for exact match
  const character = MINION_CARD_TO_ART[lowerName];
  if (!character) {
    _artPathCache.set(lowerName, null);
    return null;
  }

  // Validate character is in creature-only set (not hero-reserved)
  if (!CREATURE_ART_CHARACTERS.has(character)) {
    debug.warn(`[artMapping] Warning: "${cardName}" maps to hero-reserved character "${character}"`);
    _artPathCache.set(lowerName, null);
    return null;
  }

  // Get the art ID for this creature
  const artId = CHARACTER_ART_IDS[character];
  if (!artId) {
    _artPathCache.set(lowerName, null);
    return null;
  }

  result = assetPath(`/art/${artId}.webp`);
  _artPathCache.set(lowerName, result);
  return result;
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
