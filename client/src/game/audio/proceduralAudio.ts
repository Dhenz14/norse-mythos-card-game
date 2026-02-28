import type { AnimationArchetype, AnimationElement } from '../combat/data/heroAnimationProfiles';

export type SoundType =
	| 'card_play'
	| 'card_draw'
	| 'attack'
	| 'damage'
	| 'heal'
	| 'coin'
	| 'legendary'
	| 'spell'
	| 'freeze'
	| 'deathrattle'
	| 'battlecry'
	| 'discover'
	| 'secret_trigger'
	| 'game_start'
	| 'victory'
	| 'defeat'
	| 'card_hover'
	| 'card_click'
	| 'button_click'
	| 'error'
	| 'hero_power'
	| 'attack_prepare'
	| 'spell_charge'
	| 'spell_cast'
	| 'spell_impact'
	| 'fire_impact'
	| 'legendary_entrance'
	| 'turn_start'
	| 'turn_end'
	| 'damage_hero'
	| 'mana_fill'
	| 'mana_spend'
	| 'fatigue'
	| 'emote'
	| 'combat_melee'
	| 'combat_ranged'
	| 'combat_magic'
	| 'combat_divine'
	| 'combat_nature'
	| 'combat_shadow'
	| 'combat_brace'
	| 'norse_horn'
	| 'sword_clash'
	| 'rune_whisper';

export class ProceduralAudio {
	private ctx: AudioContext | null = null;
	private masterGain: GainNode | null = null;
	private reverbNode: ConvolverNode | null = null;
	private enabled = true;
	private volume = 0.7;

	private getContext(): AudioContext {
		if (!this.ctx) {
			this.ctx = new AudioContext();
			this.masterGain = this.ctx.createGain();
			this.masterGain.gain.value = this.volume;
			this.masterGain.connect(this.ctx.destination);
			this.reverbNode = this.createReverb(this.ctx);
		}
		if (this.ctx.state === 'suspended') this.ctx.resume();
		return this.ctx;
	}

	private getMaster(): GainNode {
		this.getContext();
		return this.masterGain!;
	}

	private getReverb(): ConvolverNode {
		this.getContext();
		return this.reverbNode!;
	}

	private createReverb(ctx: AudioContext): ConvolverNode {
		const convolver = ctx.createConvolver();
		const rate = ctx.sampleRate;
		const length = rate * 2.0;
		const impulse = ctx.createBuffer(2, length, rate);
		for (let ch = 0; ch < 2; ch++) {
			const data = impulse.getChannelData(ch);
			for (let i = 0; i < length; i++) {
				data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.0);
			}
		}
		convolver.buffer = impulse;
		const wet = ctx.createGain();
		wet.gain.value = 0.35;
		convolver.connect(wet);
		wet.connect(this.masterGain!);
		return convolver;
	}

	private createNoise(duration: number): AudioBuffer {
		const ctx = this.getContext();
		const length = ctx.sampleRate * duration;
		const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
		const data = buffer.getChannelData(0);
		for (let i = 0; i < length; i++) {
			data[i] = Math.random() * 2 - 1;
		}
		return buffer;
	}

	private playTone(
		freq: number,
		duration: number,
		type: OscillatorType,
		attack: number,
		decay: number,
		gainVal = 0.3,
		destination?: AudioNode
	): OscillatorNode {
		const ctx = this.getContext();
		const now = ctx.currentTime;
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = type;
		osc.frequency.value = freq;
		gain.gain.setValueAtTime(0, now);
		gain.gain.linearRampToValueAtTime(gainVal, now + attack);
		gain.gain.linearRampToValueAtTime(0, now + attack + decay);
		osc.connect(gain);
		gain.connect(destination || this.getMaster());
		osc.start(now);
		osc.stop(now + duration);
		return osc;
	}

	private playNoise(
		duration: number,
		filterFreq: number,
		filterType: BiquadFilterType,
		gainVal = 0.2,
		destination?: AudioNode
	): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;
		const source = ctx.createBufferSource();
		source.buffer = this.createNoise(duration);
		const filter = ctx.createBiquadFilter();
		filter.type = filterType;
		filter.frequency.value = filterFreq;
		filter.Q.value = 1;
		const gain = ctx.createGain();
		gain.gain.setValueAtTime(gainVal, now);
		gain.gain.linearRampToValueAtTime(0, now + duration);
		source.connect(filter);
		filter.connect(gain);
		gain.connect(destination || this.getMaster());
		source.start(now);
		source.stop(now + duration);
	}

	private playSweep(
		startFreq: number,
		endFreq: number,
		duration: number,
		type: OscillatorType,
		attack: number,
		decay: number,
		gainVal = 0.3,
		destination?: AudioNode
	): OscillatorNode {
		const ctx = this.getContext();
		const now = ctx.currentTime;
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = type;
		osc.frequency.setValueAtTime(startFreq, now);
		osc.frequency.linearRampToValueAtTime(endFreq, now + duration);
		gain.gain.setValueAtTime(0, now);
		gain.gain.linearRampToValueAtTime(gainVal, now + attack);
		gain.gain.linearRampToValueAtTime(0, now + attack + decay);
		osc.connect(gain);
		gain.connect(destination || this.getMaster());
		osc.start(now);
		osc.stop(now + duration);
		return osc;
	}

	private playFilteredNoiseBurst(
		startTime: number,
		duration: number,
		filterFreq: number,
		filterType: BiquadFilterType,
		gainVal = 0.2,
		destination?: AudioNode,
		Q = 1.5
	): void {
		const ctx = this.getContext();
		const source = ctx.createBufferSource();
		source.buffer = this.createNoise(duration);
		const filter = ctx.createBiquadFilter();
		filter.type = filterType;
		filter.frequency.value = filterFreq;
		filter.Q.value = Q;
		const gain = ctx.createGain();
		gain.gain.setValueAtTime(gainVal, startTime);
		gain.gain.linearRampToValueAtTime(0, startTime + duration);
		source.connect(filter);
		filter.connect(gain);
		gain.connect(destination || this.getMaster());
		source.start(startTime);
		source.stop(startTime + duration);
	}

	private playScheduledTone(
		startTime: number,
		freq: number,
		duration: number,
		type: OscillatorType,
		gainVal: number,
		destination?: AudioNode
	): OscillatorNode {
		const ctx = this.getContext();
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = type;
		osc.frequency.value = freq;
		gain.gain.setValueAtTime(0, startTime);
		gain.gain.linearRampToValueAtTime(gainVal, startTime + 0.01);
		gain.gain.linearRampToValueAtTime(0, startTime + duration);
		osc.connect(gain);
		gain.connect(destination || this.getMaster());
		osc.start(startTime);
		osc.stop(startTime + duration);
		return osc;
	}

	play(type: SoundType | string): void {
		if (!this.enabled) return;
		try {
			switch (type as SoundType) {
				case 'card_play': this.soundCardPlay(); break;
				case 'card_draw': this.soundCardDraw(); break;
				case 'attack': this.soundAttack(); break;
				case 'damage': this.soundDamage(); break;
				case 'heal': this.soundHeal(); break;
				case 'coin': this.soundCoin(); break;
				case 'legendary': this.soundLegendary(); break;
				case 'spell': this.soundSpell(); break;
				case 'freeze': this.soundFreeze(); break;
				case 'deathrattle': this.soundDeathrattle(); break;
				case 'battlecry': this.soundBattlecry(); break;
				case 'discover': this.soundDiscover(); break;
				case 'secret_trigger': this.soundSecretTrigger(); break;
				case 'game_start': this.soundGameStart(); break;
				case 'victory': this.soundVictory(); break;
				case 'defeat': this.soundDefeat(); break;
				case 'card_hover': this.soundCardHover(); break;
				case 'card_click': this.soundCardClick(); break;
				case 'button_click': this.soundButtonClick(); break;
				case 'error': this.soundError(); break;
				case 'hero_power': this.soundHeroPower(); break;
				case 'attack_prepare': this.soundAttackPrepare(); break;
				case 'spell_charge': this.soundSpellCharge(); break;
				case 'spell_cast': this.soundSpellCast(); break;
				case 'spell_impact': this.soundSpellImpact(); break;
				case 'fire_impact': this.soundFireImpact(); break;
				case 'legendary_entrance': this.soundLegendaryEntrance(); break;
				case 'turn_start': this.soundTurnStart(); break;
				case 'turn_end': this.soundTurnEnd(); break;
				case 'damage_hero': this.soundDamageHero(); break;
				case 'mana_fill': this.soundManaFill(); break;
				case 'mana_spend': this.soundManaSpend(); break;
				case 'fatigue': this.soundFatigue(); break;
				case 'emote': this.soundEmote(); break;
				case 'combat_melee': this.soundCombatMelee(); break;
				case 'combat_ranged': this.soundCombatRanged(); break;
				case 'combat_magic': this.soundCombatMagic(); break;
				case 'combat_divine': this.soundCombatDivine(); break;
				case 'combat_nature': this.soundCombatNature(); break;
				case 'combat_shadow': this.soundCombatShadow(); break;
				case 'combat_brace': this.soundCombatBrace(); break;
				case 'norse_horn': this.soundNorseHorn(); break;
				case 'sword_clash': this.soundSwordClash(); break;
				case 'rune_whisper': this.soundRuneWhisper(); break;
				default: this.soundButtonClick(); break;
			}
		} catch (_) {
			// silently ignore audio errors
		}
	}

	playCombatSound(archetype: AnimationArchetype, element: AnimationElement, intensity = 0.7): void {
		if (!this.enabled) return;
		try {
			const archetypeMap: Record<AnimationArchetype, () => void> = {
				melee_strike: () => this.soundCombatMeleeElemental(element, intensity),
				ranged_shot: () => this.soundCombatRangedElemental(element, intensity),
				magic_blast: () => this.soundCombatMagicElemental(element, intensity),
				divine_radiance: () => this.soundCombatDivineElemental(element, intensity),
				nature_surge: () => this.soundCombatNatureElemental(element, intensity),
				shadow_strike: () => this.soundCombatShadowElemental(element, intensity),
			};
			archetypeMap[archetype]();
		} catch (_) {
			// silently ignore
		}
	}

	setVolume(v: number): void {
		this.volume = Math.max(0, Math.min(1, v));
		if (this.masterGain) {
			this.masterGain.gain.value = this.volume;
		}
	}

	setEnabled(e: boolean): void {
		this.enabled = e;
	}

	getEnabled(): boolean {
		return this.enabled;
	}

	getVolume(): number {
		return this.volume;
	}

	// ═══════════════════════════════════════════
	//  ELEMENT MODULATION HELPERS
	// ═══════════════════════════════════════════

	private getElementFreqOffset(element: AnimationElement): number {
		switch (element) {
			case 'fire': return 50;
			case 'ice': return -20;
			case 'electric': return 30;
			case 'water': return -30;
			case 'light': return 20;
			case 'dark': return -40;
			case 'grass': return -10;
			default: return 0;
		}
	}

	private addElementLayer(element: AnimationElement, intensity: number): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;
		const g = intensity * 0.15;

		switch (element) {
			case 'fire': {
				const crackle = ctx.createBufferSource();
				crackle.buffer = this.createNoise(0.3);
				const f = ctx.createBiquadFilter();
				f.type = 'bandpass';
				f.frequency.setValueAtTime(3000, now);
				f.frequency.linearRampToValueAtTime(800, now + 0.3);
				f.Q.value = 3;
				const gain = ctx.createGain();
				gain.gain.setValueAtTime(g, now);
				gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
				crackle.connect(f);
				f.connect(gain);
				gain.connect(this.getMaster());
				crackle.start(now);
				crackle.stop(now + 0.3);
				break;
			}
			case 'ice': {
				for (let i = 0; i < 4; i++) {
					const t = now + i * 0.06;
					const freq = 3000 + Math.random() * 3000;
					this.playScheduledTone(t, freq, 0.05, 'sine', g * 0.8);
				}
				break;
			}
			case 'electric': {
				const buzz = ctx.createOscillator();
				const lfo = ctx.createOscillator();
				const lfoGain = ctx.createGain();
				const buzzGain = ctx.createGain();
				buzz.type = 'sawtooth';
				buzz.frequency.value = 120;
				lfo.type = 'square';
				lfo.frequency.value = 15;
				lfoGain.gain.value = 60;
				lfo.connect(lfoGain);
				lfoGain.connect(buzz.frequency);
				buzzGain.gain.setValueAtTime(g, now);
				buzzGain.gain.linearRampToValueAtTime(0, now + 0.25);
				buzz.connect(buzzGain);
				buzzGain.connect(this.getMaster());
				buzz.start(now);
				buzz.stop(now + 0.25);
				lfo.start(now);
				lfo.stop(now + 0.25);
				break;
			}
			case 'water': {
				this.playFilteredNoiseBurst(now, 0.4, 400, 'bandpass', g, this.getReverb(), 2);
				break;
			}
			case 'light': {
				this.playScheduledTone(now, 880, 0.5, 'triangle', g * 0.6, this.getReverb());
				this.playScheduledTone(now + 0.05, 1320, 0.4, 'triangle', g * 0.3, this.getReverb());
				break;
			}
			case 'dark': {
				const d1 = ctx.createOscillator();
				const d2 = ctx.createOscillator();
				const dg = ctx.createGain();
				d1.type = 'sawtooth';
				d1.frequency.value = 50;
				d2.type = 'sawtooth';
				d2.frequency.value = 53;
				dg.gain.setValueAtTime(g, now);
				dg.gain.linearRampToValueAtTime(0, now + 0.4);
				d1.connect(dg);
				d2.connect(dg);
				dg.connect(this.getMaster());
				d1.start(now);
				d2.start(now);
				d1.stop(now + 0.4);
				d2.stop(now + 0.4);
				break;
			}
			case 'grass': {
				const wobble = ctx.createOscillator();
				const wobbleLfo = ctx.createOscillator();
				const wobbleLfoGain = ctx.createGain();
				const wobbleGain = ctx.createGain();
				wobble.type = 'sine';
				wobble.frequency.value = 300;
				wobbleLfo.type = 'sine';
				wobbleLfo.frequency.value = 3;
				wobbleLfoGain.gain.value = 40;
				wobbleLfo.connect(wobbleLfoGain);
				wobbleLfoGain.connect(wobble.frequency);
				wobbleGain.gain.setValueAtTime(g * 0.5, now);
				wobbleGain.gain.linearRampToValueAtTime(0, now + 0.4);
				wobble.connect(wobbleGain);
				wobbleGain.connect(this.getReverb());
				wobble.start(now);
				wobble.stop(now + 0.4);
				wobbleLfo.start(now);
				wobbleLfo.stop(now + 0.4);
				break;
			}
		}
	}

	// ═══════════════════════════════════════════
	//  NORSE HORN — Gjallarhorn
	// ═══════════════════════════════════════════

	private soundNorseHorn(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;

		// Main horn — sawtooth through ascending fifths
		const horn = ctx.createOscillator();
		const hornGain = ctx.createGain();
		horn.type = 'sawtooth';
		horn.frequency.setValueAtTime(110, now);
		horn.frequency.linearRampToValueAtTime(165, now + 0.8);
		horn.frequency.linearRampToValueAtTime(220, now + 1.5);
		horn.frequency.linearRampToValueAtTime(165, now + 2.2);
		hornGain.gain.setValueAtTime(0, now);
		hornGain.gain.linearRampToValueAtTime(0.22, now + 0.4);
		hornGain.gain.linearRampToValueAtTime(0.28, now + 1.0);
		hornGain.gain.linearRampToValueAtTime(0.18, now + 2.0);
		hornGain.gain.linearRampToValueAtTime(0, now + 2.5);
		const hornFilter = ctx.createBiquadFilter();
		hornFilter.type = 'lowpass';
		hornFilter.frequency.setValueAtTime(600, now);
		hornFilter.frequency.linearRampToValueAtTime(1200, now + 1.0);
		hornFilter.frequency.linearRampToValueAtTime(800, now + 2.5);
		horn.connect(hornFilter);
		hornFilter.connect(hornGain);
		hornGain.connect(this.getMaster());
		hornGain.connect(this.getReverb());
		horn.start(now);
		horn.stop(now + 2.5);

		// Sub-bass foundation
		const sub = ctx.createOscillator();
		const subGain = ctx.createGain();
		sub.type = 'sine';
		sub.frequency.value = 55;
		subGain.gain.setValueAtTime(0, now);
		subGain.gain.linearRampToValueAtTime(0.2, now + 0.3);
		subGain.gain.linearRampToValueAtTime(0.12, now + 1.5);
		subGain.gain.linearRampToValueAtTime(0, now + 2.5);
		sub.connect(subGain);
		subGain.connect(this.getMaster());
		sub.start(now);
		sub.stop(now + 2.5);

		// Breath noise (horn air)
		const breath = ctx.createBufferSource();
		breath.buffer = this.createNoise(2.5);
		const breathFilter = ctx.createBiquadFilter();
		breathFilter.type = 'bandpass';
		breathFilter.frequency.setValueAtTime(300, now);
		breathFilter.frequency.linearRampToValueAtTime(600, now + 1.0);
		breathFilter.frequency.linearRampToValueAtTime(300, now + 2.5);
		breathFilter.Q.value = 2;
		const breathGain = ctx.createGain();
		breathGain.gain.setValueAtTime(0, now);
		breathGain.gain.linearRampToValueAtTime(0.08, now + 0.3);
		breathGain.gain.linearRampToValueAtTime(0.05, now + 2.0);
		breathGain.gain.linearRampToValueAtTime(0, now + 2.5);
		breath.connect(breathFilter);
		breathFilter.connect(breathGain);
		breathGain.connect(this.getMaster());
		breath.start(now);
		breath.stop(now + 2.5);

		// Drum hits
		this.playFilteredNoiseBurst(now + 0.05, 0.12, 150, 'lowpass', 0.35);
		this.playFilteredNoiseBurst(now + 0.8, 0.1, 150, 'lowpass', 0.25);
		this.playFilteredNoiseBurst(now + 1.5, 0.1, 150, 'lowpass', 0.3);
	}

	// ═══════════════════════════════════════════
	//  SWORD CLASH — Two blades meeting
	// ═══════════════════════════════════════════

	private soundSwordClash(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;

		// First blade strike
		this.playFilteredNoiseBurst(now, 0.08, 8000, 'highpass', 0.35);
		// Second blade ring (30ms offset)
		this.playFilteredNoiseBurst(now + 0.03, 0.1, 6000, 'highpass', 0.3);

		// Metallic resonance
		const ring = ctx.createOscillator();
		const ringGain = ctx.createGain();
		ring.type = 'sine';
		ring.frequency.setValueAtTime(800, now);
		ring.frequency.exponentialRampToValueAtTime(400, now + 0.3);
		ringGain.gain.setValueAtTime(0.25, now);
		ringGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
		ring.connect(ringGain);
		ringGain.connect(this.getMaster());
		ringGain.connect(this.getReverb());
		ring.start(now);
		ring.stop(now + 0.3);

		// Sub thud
		const thud = ctx.createOscillator();
		const thudGain = ctx.createGain();
		thud.type = 'sine';
		thud.frequency.value = 60;
		thudGain.gain.setValueAtTime(0.2, now);
		thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
		thud.connect(thudGain);
		thudGain.connect(this.getMaster());
		thud.start(now);
		thud.stop(now + 0.15);
	}

	// ═══════════════════════════════════════════
	//  RUNE WHISPER — Subtle magic
	// ═══════════════════════════════════════════

	private soundRuneWhisper(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;

		// Quiet bandpass breath
		this.playFilteredNoiseBurst(now, 0.15, 1500, 'bandpass', 0.04, undefined, 8);

		// Detuned sine pair (mystical shimmer)
		const s1 = ctx.createOscillator();
		const s2 = ctx.createOscillator();
		const sGain = ctx.createGain();
		s1.type = 'sine';
		s1.frequency.value = 600;
		s2.type = 'sine';
		s2.frequency.value = 603;
		sGain.gain.setValueAtTime(0.04, now);
		sGain.gain.linearRampToValueAtTime(0, now + 0.15);
		s1.connect(sGain);
		s2.connect(sGain);
		sGain.connect(this.getMaster());
		sGain.connect(this.getReverb());
		s1.start(now);
		s2.start(now);
		s1.stop(now + 0.15);
		s2.stop(now + 0.15);
	}

	// ═══════════════════════════════════════════
	//  COMBAT BRACE — Shield block
	// ═══════════════════════════════════════════

	private soundCombatBrace(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;

		// Shield impact — heavy lowpass burst
		this.playFilteredNoiseBurst(now, 0.15, 500, 'lowpass', 0.4);

		// Resonant body
		const body = ctx.createOscillator();
		const bodyGain = ctx.createGain();
		body.type = 'sine';
		body.frequency.setValueAtTime(180, now);
		body.frequency.exponentialRampToValueAtTime(100, now + 0.3);
		bodyGain.gain.setValueAtTime(0.3, now);
		bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
		body.connect(bodyGain);
		bodyGain.connect(this.getMaster());
		body.start(now);
		body.stop(now + 0.35);

		// Metallic ring (sword hitting shield rim)
		const ring = ctx.createOscillator();
		const ringGain = ctx.createGain();
		ring.type = 'sine';
		ring.frequency.value = 2500;
		ringGain.gain.setValueAtTime(0.12, now + 0.02);
		ringGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
		ring.connect(ringGain);
		ringGain.connect(this.getMaster());
		ring.start(now + 0.02);
		ring.stop(now + 0.2);

		// Wood creak
		this.playFilteredNoiseBurst(now + 0.05, 0.08, 1200, 'bandpass', 0.1, undefined, 4);
	}

	// ═══════════════════════════════════════════
	//  COMBAT ARCHETYPE SOUNDS (base)
	// ═══════════════════════════════════════════

	private soundCombatMelee(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;

		// Sword slash sweep
		this.playSweep(200, 80, 0.2, 'sawtooth', 0.01, 0.18, 0.3);

		// Metal ring
		this.playFilteredNoiseBurst(now, 0.12, 6000, 'highpass', 0.3);

		// Thud on contact
		const thud = ctx.createOscillator();
		const thudGain = ctx.createGain();
		thud.type = 'sine';
		thud.frequency.value = 60;
		thudGain.gain.setValueAtTime(0.25, now + 0.1);
		thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
		thud.connect(thudGain);
		thudGain.connect(this.getMaster());
		thud.start(now + 0.1);
		thud.stop(now + 0.3);

		// Secondary slash trail
		this.playFilteredNoiseBurst(now + 0.05, 0.08, 3000, 'bandpass', 0.15);
	}

	private soundCombatRanged(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;

		// Arrow whoosh (noise sweep)
		const whoosh = ctx.createBufferSource();
		whoosh.buffer = this.createNoise(0.4);
		const whooshFilter = ctx.createBiquadFilter();
		whooshFilter.type = 'bandpass';
		whooshFilter.frequency.setValueAtTime(1000, now);
		whooshFilter.frequency.linearRampToValueAtTime(4000, now + 0.3);
		whooshFilter.Q.value = 2;
		const whooshGain = ctx.createGain();
		whooshGain.gain.setValueAtTime(0.05, now);
		whooshGain.gain.linearRampToValueAtTime(0.25, now + 0.15);
		whooshGain.gain.linearRampToValueAtTime(0, now + 0.4);
		whoosh.connect(whooshFilter);
		whooshFilter.connect(whooshGain);
		whooshGain.connect(this.getMaster());
		whoosh.start(now);
		whoosh.stop(now + 0.4);

		// Bowstring twang
		this.playScheduledTone(now, 400, 0.08, 'triangle', 0.15);

		// Impact thud at end
		const thud = ctx.createOscillator();
		const thudGain = ctx.createGain();
		thud.type = 'sine';
		thud.frequency.value = 80;
		thudGain.gain.setValueAtTime(0.2, now + 0.3);
		thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
		thud.connect(thudGain);
		thudGain.connect(this.getMaster());
		thud.start(now + 0.3);
		thud.stop(now + 0.5);
	}

	private soundCombatMagic(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;

		// Rising energy chord (root + fifth + octave)
		const root = ctx.createOscillator();
		const fifth = ctx.createOscillator();
		const oct = ctx.createOscillator();
		const chordGain = ctx.createGain();
		root.type = 'sine';
		root.frequency.setValueAtTime(220, now);
		root.frequency.linearRampToValueAtTime(440, now + 0.4);
		fifth.type = 'sine';
		fifth.frequency.setValueAtTime(330, now);
		fifth.frequency.linearRampToValueAtTime(660, now + 0.4);
		oct.type = 'sine';
		oct.frequency.setValueAtTime(440, now);
		oct.frequency.linearRampToValueAtTime(880, now + 0.4);

		// LFO tremolo
		const lfo = ctx.createOscillator();
		const lfoGain = ctx.createGain();
		lfo.type = 'sine';
		lfo.frequency.value = 6;
		lfoGain.gain.value = 0.08;
		lfo.connect(lfoGain);
		lfoGain.connect(chordGain.gain);

		chordGain.gain.setValueAtTime(0.05, now);
		chordGain.gain.linearRampToValueAtTime(0.2, now + 0.3);
		chordGain.gain.linearRampToValueAtTime(0, now + 0.6);
		root.connect(chordGain);
		fifth.connect(chordGain);
		oct.connect(chordGain);
		chordGain.connect(this.getMaster());
		chordGain.connect(this.getReverb());
		root.start(now); root.stop(now + 0.6);
		fifth.start(now); fifth.stop(now + 0.6);
		oct.start(now); oct.stop(now + 0.6);
		lfo.start(now); lfo.stop(now + 0.6);

		// Burst at peak
		this.playFilteredNoiseBurst(now + 0.35, 0.15, 2000, 'bandpass', 0.2, this.getReverb());
	}

	private soundCombatDivine(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;

		// Choir-like harmonics fading in
		const freqs = [220, 440, 880];
		freqs.forEach((freq, i) => {
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.type = 'triangle';
			osc.frequency.value = freq;
			gain.gain.setValueAtTime(0, now);
			gain.gain.linearRampToValueAtTime(0.12 / (i + 1), now + 0.3);
			gain.gain.linearRampToValueAtTime(0.08 / (i + 1), now + 0.5);
			gain.gain.linearRampToValueAtTime(0, now + 0.7);
			osc.connect(gain);
			gain.connect(this.getMaster());
			gain.connect(this.getReverb());
			osc.start(now);
			osc.stop(now + 0.7);
		});

		// Shimmer
		const shimmer = ctx.createOscillator();
		const shimmerGain = ctx.createGain();
		shimmer.type = 'sine';
		shimmer.frequency.setValueAtTime(3000, now + 0.2);
		shimmer.frequency.linearRampToValueAtTime(5000, now + 0.6);
		shimmerGain.gain.setValueAtTime(0, now + 0.2);
		shimmerGain.gain.linearRampToValueAtTime(0.06, now + 0.35);
		shimmerGain.gain.linearRampToValueAtTime(0, now + 0.7);
		shimmer.connect(shimmerGain);
		shimmerGain.connect(this.getReverb());
		shimmer.start(now + 0.2);
		shimmer.stop(now + 0.7);
	}

	private soundCombatNature(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;

		// Wind sweep
		const wind = ctx.createBufferSource();
		wind.buffer = this.createNoise(0.5);
		const windFilter = ctx.createBiquadFilter();
		windFilter.type = 'bandpass';
		windFilter.frequency.setValueAtTime(200, now);
		windFilter.frequency.linearRampToValueAtTime(2000, now + 0.3);
		windFilter.frequency.linearRampToValueAtTime(600, now + 0.5);
		windFilter.Q.value = 1.5;
		const windGain = ctx.createGain();
		windGain.gain.setValueAtTime(0.05, now);
		windGain.gain.linearRampToValueAtTime(0.2, now + 0.2);
		windGain.gain.linearRampToValueAtTime(0, now + 0.5);
		wind.connect(windFilter);
		windFilter.connect(windGain);
		windGain.connect(this.getMaster());
		windGain.connect(this.getReverb());
		wind.start(now);
		wind.stop(now + 0.5);

		// Organic wobble
		const wobble = ctx.createOscillator();
		const wobbleLfo = ctx.createOscillator();
		const wobbleLfoGain = ctx.createGain();
		const wobbleGain = ctx.createGain();
		wobble.type = 'sine';
		wobble.frequency.value = 250;
		wobbleLfo.type = 'sine';
		wobbleLfo.frequency.value = 4;
		wobbleLfoGain.gain.value = 50;
		wobbleLfo.connect(wobbleLfoGain);
		wobbleLfoGain.connect(wobble.frequency);
		wobbleGain.gain.setValueAtTime(0, now);
		wobbleGain.gain.linearRampToValueAtTime(0.1, now + 0.15);
		wobbleGain.gain.linearRampToValueAtTime(0, now + 0.5);
		wobble.connect(wobbleGain);
		wobbleGain.connect(this.getMaster());
		wobble.start(now);
		wobble.stop(now + 0.5);
		wobbleLfo.start(now);
		wobbleLfo.stop(now + 0.5);
	}

	private soundCombatShadow(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;

		// Detuned dark drones
		const d1 = ctx.createOscillator();
		const d2 = ctx.createOscillator();
		const droneGain = ctx.createGain();
		d1.type = 'sawtooth';
		d1.frequency.value = 50;
		d2.type = 'sawtooth';
		d2.frequency.value = 53;
		droneGain.gain.setValueAtTime(0, now);
		droneGain.gain.linearRampToValueAtTime(0.15, now + 0.1);
		droneGain.gain.linearRampToValueAtTime(0.12, now + 0.3);
		droneGain.gain.linearRampToValueAtTime(0, now + 0.5);
		d1.connect(droneGain);
		d2.connect(droneGain);
		droneGain.connect(this.getMaster());
		d1.start(now); d1.stop(now + 0.5);
		d2.start(now); d2.stop(now + 0.5);

		// Reverse-ish noise (fade in then cut)
		const revNoise = ctx.createBufferSource();
		revNoise.buffer = this.createNoise(0.3);
		const revFilter = ctx.createBiquadFilter();
		revFilter.type = 'lowpass';
		revFilter.frequency.value = 1000;
		const revGain = ctx.createGain();
		revGain.gain.setValueAtTime(0, now + 0.1);
		revGain.gain.linearRampToValueAtTime(0.2, now + 0.35);
		revGain.gain.setValueAtTime(0, now + 0.36);
		revNoise.connect(revFilter);
		revFilter.connect(revGain);
		revGain.connect(this.getMaster());
		revNoise.start(now + 0.1);
		revNoise.stop(now + 0.4);

		// High sinister ping
		this.playScheduledTone(now + 0.35, 1800, 0.12, 'sine', 0.1, this.getReverb());
	}

	// ═══════════════════════════════════════════
	//  COMBAT SOUNDS WITH ELEMENT MODULATION
	// ═══════════════════════════════════════════

	private soundCombatMeleeElemental(element: AnimationElement, intensity: number): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;
		const freqOff = this.getElementFreqOffset(element);

		this.playSweep(200 + freqOff, 80, 0.2, 'sawtooth', 0.01, 0.18, 0.3 * intensity);
		this.playFilteredNoiseBurst(now, 0.12, 6000, 'highpass', 0.3 * intensity);

		const thud = ctx.createOscillator();
		const thudGain = ctx.createGain();
		thud.type = 'sine';
		thud.frequency.value = 60;
		thudGain.gain.setValueAtTime(0.25 * intensity, now + 0.1);
		thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
		thud.connect(thudGain);
		thudGain.connect(this.getMaster());
		thud.start(now + 0.1);
		thud.stop(now + 0.3);

		this.addElementLayer(element, intensity);
	}

	private soundCombatRangedElemental(element: AnimationElement, intensity: number): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;

		const whoosh = ctx.createBufferSource();
		whoosh.buffer = this.createNoise(0.4);
		const wf = ctx.createBiquadFilter();
		wf.type = 'bandpass';
		wf.frequency.setValueAtTime(1000, now);
		wf.frequency.linearRampToValueAtTime(4000, now + 0.3);
		wf.Q.value = 2;
		const wg = ctx.createGain();
		wg.gain.setValueAtTime(0.05, now);
		wg.gain.linearRampToValueAtTime(0.25 * intensity, now + 0.15);
		wg.gain.linearRampToValueAtTime(0, now + 0.4);
		whoosh.connect(wf);
		wf.connect(wg);
		wg.connect(this.getMaster());
		whoosh.start(now);
		whoosh.stop(now + 0.4);

		this.playScheduledTone(now, 400, 0.08, 'triangle', 0.15 * intensity);

		const thud = ctx.createOscillator();
		const thudGain = ctx.createGain();
		thud.type = 'sine';
		thud.frequency.value = 80;
		thudGain.gain.setValueAtTime(0.2 * intensity, now + 0.3);
		thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
		thud.connect(thudGain);
		thudGain.connect(this.getMaster());
		thud.start(now + 0.3);
		thud.stop(now + 0.5);

		this.addElementLayer(element, intensity);
	}

	private soundCombatMagicElemental(element: AnimationElement, intensity: number): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;
		const freqOff = this.getElementFreqOffset(element);
		const baseFreq = 220 + freqOff;

		const root = ctx.createOscillator();
		const fifth = ctx.createOscillator();
		const chordGain = ctx.createGain();
		root.type = 'sine';
		root.frequency.setValueAtTime(baseFreq, now);
		root.frequency.linearRampToValueAtTime(baseFreq * 2, now + 0.4);
		fifth.type = 'sine';
		fifth.frequency.setValueAtTime(baseFreq * 1.5, now);
		fifth.frequency.linearRampToValueAtTime(baseFreq * 3, now + 0.4);

		const lfo = ctx.createOscillator();
		const lfoGain = ctx.createGain();
		lfo.type = 'sine';
		lfo.frequency.value = 6;
		lfoGain.gain.value = 0.08 * intensity;
		lfo.connect(lfoGain);
		lfoGain.connect(chordGain.gain);

		chordGain.gain.setValueAtTime(0.05, now);
		chordGain.gain.linearRampToValueAtTime(0.2 * intensity, now + 0.3);
		chordGain.gain.linearRampToValueAtTime(0, now + 0.6);
		root.connect(chordGain);
		fifth.connect(chordGain);
		chordGain.connect(this.getMaster());
		chordGain.connect(this.getReverb());
		root.start(now); root.stop(now + 0.6);
		fifth.start(now); fifth.stop(now + 0.6);
		lfo.start(now); lfo.stop(now + 0.6);

		this.playFilteredNoiseBurst(now + 0.35, 0.15, 2000, 'bandpass', 0.2 * intensity, this.getReverb());
		this.addElementLayer(element, intensity);
	}

	private soundCombatDivineElemental(element: AnimationElement, intensity: number): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;

		const freqs = [220, 440, 880];
		freqs.forEach((freq, i) => {
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.type = 'triangle';
			osc.frequency.value = freq;
			const g = (0.12 / (i + 1)) * intensity;
			gain.gain.setValueAtTime(0, now);
			gain.gain.linearRampToValueAtTime(g, now + 0.3);
			gain.gain.linearRampToValueAtTime(g * 0.6, now + 0.5);
			gain.gain.linearRampToValueAtTime(0, now + 0.7);
			osc.connect(gain);
			gain.connect(this.getMaster());
			gain.connect(this.getReverb());
			osc.start(now);
			osc.stop(now + 0.7);
		});

		this.addElementLayer(element, intensity);
	}

	private soundCombatNatureElemental(element: AnimationElement, intensity: number): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;

		const wind = ctx.createBufferSource();
		wind.buffer = this.createNoise(0.5);
		const wf = ctx.createBiquadFilter();
		wf.type = 'bandpass';
		wf.frequency.setValueAtTime(200, now);
		wf.frequency.linearRampToValueAtTime(2000, now + 0.3);
		wf.Q.value = 1.5;
		const wg = ctx.createGain();
		wg.gain.setValueAtTime(0.05, now);
		wg.gain.linearRampToValueAtTime(0.2 * intensity, now + 0.2);
		wg.gain.linearRampToValueAtTime(0, now + 0.5);
		wind.connect(wf);
		wf.connect(wg);
		wg.connect(this.getMaster());
		wg.connect(this.getReverb());
		wind.start(now);
		wind.stop(now + 0.5);

		this.addElementLayer(element, intensity);
	}

	private soundCombatShadowElemental(element: AnimationElement, intensity: number): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;

		const d1 = ctx.createOscillator();
		const d2 = ctx.createOscillator();
		const dg = ctx.createGain();
		d1.type = 'sawtooth';
		d1.frequency.value = 50;
		d2.type = 'sawtooth';
		d2.frequency.value = 53;
		dg.gain.setValueAtTime(0, now);
		dg.gain.linearRampToValueAtTime(0.15 * intensity, now + 0.1);
		dg.gain.linearRampToValueAtTime(0, now + 0.5);
		d1.connect(dg);
		d2.connect(dg);
		dg.connect(this.getMaster());
		d1.start(now); d1.stop(now + 0.5);
		d2.start(now); d2.stop(now + 0.5);

		this.playScheduledTone(now + 0.35, 1800, 0.12, 'sine', 0.1 * intensity, this.getReverb());
		this.addElementLayer(element, intensity);
	}

	// ═══════════════════════════════════════════
	//  CARD & UI SOUNDS — Norse-themed
	// ═══════════════════════════════════════════

	private soundCardPlay(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;

		// Rune whisper
		this.playFilteredNoiseBurst(now, 0.1, 1500, 'bandpass', 0.05, undefined, 6);

		// Stone table thud
		this.playFilteredNoiseBurst(now + 0.03, 0.08, 300, 'lowpass', 0.25);

		// Brief resonance
		const thud = ctx.createOscillator();
		const thudGain = ctx.createGain();
		thud.type = 'sine';
		thud.frequency.value = 150;
		thudGain.gain.setValueAtTime(0.2, now + 0.03);
		thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
		thud.connect(thudGain);
		thudGain.connect(this.getMaster());
		thud.start(now + 0.03);
		thud.stop(now + 0.15);
	}

	private soundCardDraw(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;

		// Rune whisper
		this.playFilteredNoiseBurst(now, 0.08, 1200, 'bandpass', 0.04, undefined, 6);

		// Parchment slide (noise sweep)
		const slide = ctx.createBufferSource();
		slide.buffer = this.createNoise(0.15);
		const slideFilter = ctx.createBiquadFilter();
		slideFilter.type = 'bandpass';
		slideFilter.frequency.setValueAtTime(800, now);
		slideFilter.frequency.linearRampToValueAtTime(2000, now + 0.15);
		slideFilter.Q.value = 2;
		const slideGain = ctx.createGain();
		slideGain.gain.setValueAtTime(0.15, now);
		slideGain.gain.linearRampToValueAtTime(0, now + 0.15);
		slide.connect(slideFilter);
		slideFilter.connect(slideGain);
		slideGain.connect(this.getMaster());
		slide.start(now);
		slide.stop(now + 0.15);
	}

	private soundAttack(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;

		// Sword slash
		this.playSweep(300, 100, 0.2, 'sawtooth', 0.01, 0.18, 0.3);

		// Metal ring
		this.playFilteredNoiseBurst(now, 0.1, 5000, 'highpass', 0.3);

		// Whoosh
		this.playFilteredNoiseBurst(now, 0.15, 2000, 'bandpass', 0.15);

		// Contact thud
		const thud = ctx.createOscillator();
		const thudGain = ctx.createGain();
		thud.type = 'sine';
		thud.frequency.value = 80;
		thudGain.gain.setValueAtTime(0.2, now + 0.08);
		thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
		thud.connect(thudGain);
		thudGain.connect(this.getMaster());
		thud.start(now + 0.08);
		thud.stop(now + 0.25);
	}

	private soundDamage(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;

		// Shield/armor impact
		this.playFilteredNoiseBurst(now, 0.1, 400, 'lowpass', 0.35);

		// Resonant bell
		const bell = ctx.createOscillator();
		const bellGain = ctx.createGain();
		bell.type = 'sine';
		bell.frequency.setValueAtTime(120, now);
		bell.frequency.exponentialRampToValueAtTime(60, now + 0.3);
		bellGain.gain.setValueAtTime(0.3, now);
		bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
		bell.connect(bellGain);
		bellGain.connect(this.getMaster());
		bell.start(now);
		bell.stop(now + 0.3);

		// Crunch
		this.playFilteredNoiseBurst(now + 0.02, 0.08, 2000, 'bandpass', 0.2);
	}

	private soundDamageHero(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;

		// Deep sub-bass thud
		const sub = ctx.createOscillator();
		const subGain = ctx.createGain();
		sub.type = 'sine';
		sub.frequency.setValueAtTime(40, now);
		sub.frequency.linearRampToValueAtTime(20, now + 0.5);
		subGain.gain.setValueAtTime(0.5, now);
		subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
		sub.connect(subGain);
		subGain.connect(this.getMaster());
		sub.start(now);
		sub.stop(now + 0.5);

		// Heavy impact
		this.playFilteredNoiseBurst(now, 0.15, 600, 'lowpass', 0.45);

		// Crunch layers
		this.playFilteredNoiseBurst(now, 0.1, 3000, 'bandpass', 0.2);
		this.playFilteredNoiseBurst(now + 0.03, 0.08, 5000, 'highpass', 0.12);

		// Body resonance
		const body = ctx.createOscillator();
		const bodyGain = ctx.createGain();
		body.type = 'square';
		body.frequency.setValueAtTime(100, now);
		body.frequency.linearRampToValueAtTime(40, now + 0.2);
		bodyGain.gain.setValueAtTime(0.12, now);
		bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
		body.connect(bodyGain);
		bodyGain.connect(this.getMaster());
		body.start(now);
		body.stop(now + 0.2);
	}

	private soundHeal(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;

		// Gentle chime triad (C-E-G)
		const notes = [523.25, 659.25, 783.99];
		notes.forEach((freq, i) => {
			const t = now + i * 0.1;
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.type = 'triangle';
			osc.frequency.value = freq;
			gain.gain.setValueAtTime(0, t);
			gain.gain.linearRampToValueAtTime(0.15, t + 0.03);
			gain.gain.linearRampToValueAtTime(0, t + 0.25);
			osc.connect(gain);
			gain.connect(this.getMaster());
			gain.connect(this.getReverb());
			osc.start(t);
			osc.stop(t + 0.25);
		});

		// Nature wind breath
		this.playFilteredNoiseBurst(now, 0.3, 800, 'bandpass', 0.04, this.getReverb(), 2);
	}

	private soundSpell(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;

		// Rune charge — rising sweep with detuned pair
		const s1 = ctx.createOscillator();
		const s2 = ctx.createOscillator();
		const sGain = ctx.createGain();
		s1.type = 'sine';
		s1.frequency.setValueAtTime(200, now);
		s1.frequency.exponentialRampToValueAtTime(1500, now + 0.4);
		s2.type = 'sine';
		s2.frequency.setValueAtTime(203, now);
		s2.frequency.exponentialRampToValueAtTime(1505, now + 0.4);
		sGain.gain.setValueAtTime(0.05, now);
		sGain.gain.linearRampToValueAtTime(0.2, now + 0.3);
		sGain.gain.linearRampToValueAtTime(0, now + 0.5);
		s1.connect(sGain);
		s2.connect(sGain);
		sGain.connect(this.getMaster());
		sGain.connect(this.getReverb());
		s1.start(now); s1.stop(now + 0.5);
		s2.start(now); s2.stop(now + 0.5);

		// Whoosh
		this.playFilteredNoiseBurst(now + 0.2, 0.2, 2000, 'bandpass', 0.12, this.getReverb());
	}

	private soundSpellCast(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;

		// Rune release — descending sweep
		this.playSweep(1500, 300, 0.3, 'sine', 0.01, 0.28, 0.22, this.getReverb());
		this.playSweep(1505, 303, 0.3, 'sine', 0.01, 0.28, 0.15);

		// Burst
		this.playFilteredNoiseBurst(now, 0.12, 2500, 'bandpass', 0.2);

		// Reverb tail
		this.playFilteredNoiseBurst(now + 0.1, 0.25, 1000, 'bandpass', 0.06, this.getReverb());
	}

	private soundSpellCharge(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;

		// Rising rune energy
		const s1 = ctx.createOscillator();
		const s2 = ctx.createOscillator();
		const gain = ctx.createGain();
		s1.type = 'sine';
		s1.frequency.setValueAtTime(200, now);
		s1.frequency.exponentialRampToValueAtTime(2000, now + 0.6);
		s2.type = 'sine';
		s2.frequency.setValueAtTime(205, now);
		s2.frequency.exponentialRampToValueAtTime(2050, now + 0.6);

		// Growing tremolo
		const lfo = ctx.createOscillator();
		const lfoG = ctx.createGain();
		lfo.type = 'sine';
		lfo.frequency.setValueAtTime(2, now);
		lfo.frequency.linearRampToValueAtTime(12, now + 0.6);
		lfoG.gain.value = 0.1;
		lfo.connect(lfoG);
		lfoG.connect(gain.gain);

		gain.gain.setValueAtTime(0.04, now);
		gain.gain.linearRampToValueAtTime(0.18, now + 0.5);
		gain.gain.linearRampToValueAtTime(0, now + 0.7);
		s1.connect(gain);
		s2.connect(gain);
		gain.connect(this.getMaster());
		gain.connect(this.getReverb());
		s1.start(now); s1.stop(now + 0.7);
		s2.start(now); s2.stop(now + 0.7);
		lfo.start(now); lfo.stop(now + 0.7);
	}

	private soundSpellImpact(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;

		// Energy burst
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = 'sine';
		osc.frequency.setValueAtTime(120, now);
		osc.frequency.linearRampToValueAtTime(40, now + 0.3);
		gain.gain.setValueAtTime(0.35, now);
		gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
		osc.connect(gain);
		gain.connect(this.getMaster());
		osc.start(now);
		osc.stop(now + 0.35);

		this.playFilteredNoiseBurst(now, 0.15, 800, 'lowpass', 0.3);
		this.playFilteredNoiseBurst(now, 0.08, 5000, 'highpass', 0.12);
	}

	private soundFireImpact(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;

		// Fire roar
		this.playSweep(200, 60, 0.35, 'sawtooth', 0.01, 0.33, 0.28);

		// Crackle
		const crackle = ctx.createBufferSource();
		crackle.buffer = this.createNoise(0.3);
		const cf = ctx.createBiquadFilter();
		cf.type = 'bandpass';
		cf.frequency.setValueAtTime(3000, now);
		cf.frequency.linearRampToValueAtTime(800, now + 0.3);
		cf.Q.value = 3;
		const cg = ctx.createGain();
		cg.gain.setValueAtTime(0.22, now);
		cg.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
		crackle.connect(cf);
		cf.connect(cg);
		cg.connect(this.getMaster());
		crackle.start(now);
		crackle.stop(now + 0.3);

		// Sub thud
		const thud = ctx.createOscillator();
		const thudGain = ctx.createGain();
		thud.type = 'sine';
		thud.frequency.value = 50;
		thudGain.gain.setValueAtTime(0.2, now);
		thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
		thud.connect(thudGain);
		thudGain.connect(this.getMaster());
		thud.start(now);
		thud.stop(now + 0.2);
	}

	private soundCoin(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;

		// Metal clink — two staccato strikes
		const t1 = ctx.createOscillator();
		const g1 = ctx.createGain();
		t1.type = 'triangle';
		t1.frequency.value = 1500;
		g1.gain.setValueAtTime(0.25, now);
		g1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
		t1.connect(g1);
		g1.connect(this.getMaster());
		t1.start(now);
		t1.stop(now + 0.08);

		const t2 = ctx.createOscillator();
		const g2 = ctx.createGain();
		t2.type = 'triangle';
		t2.frequency.value = 2200;
		g2.gain.setValueAtTime(0.2, now + 0.05);
		g2.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
		t2.connect(g2);
		g2.connect(this.getMaster());
		t2.start(now + 0.05);
		t2.stop(now + 0.15);

		// Brief ring tail
		this.playScheduledTone(now + 0.05, 1800, 0.1, 'sine', 0.06, this.getReverb());
	}

	private soundFreeze(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;

		// Ice crackle — rapid high sine pings
		for (let i = 0; i < 8; i++) {
			const t = now + i * 0.04;
			const freq = 2500 + Math.random() * 4000;
			this.playScheduledTone(t, freq, 0.04, 'sine', 0.1);
		}

		// Crystalline noise
		this.playFilteredNoiseBurst(now, 0.3, 6000, 'highpass', 0.12);

		// Cold air
		this.playFilteredNoiseBurst(now + 0.1, 0.25, 2000, 'bandpass', 0.06, this.getReverb(), 4);
	}

	private soundLegendary(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;

		// Mini norse horn fanfare
		const horn = ctx.createOscillator();
		const hornGain = ctx.createGain();
		const hornFilter = ctx.createBiquadFilter();
		horn.type = 'sawtooth';
		horn.frequency.setValueAtTime(110, now);
		horn.frequency.linearRampToValueAtTime(165, now + 0.4);
		horn.frequency.linearRampToValueAtTime(220, now + 0.8);
		hornFilter.type = 'lowpass';
		hornFilter.frequency.setValueAtTime(400, now);
		hornFilter.frequency.linearRampToValueAtTime(1000, now + 0.5);
		hornGain.gain.setValueAtTime(0, now);
		hornGain.gain.linearRampToValueAtTime(0.2, now + 0.2);
		hornGain.gain.linearRampToValueAtTime(0.12, now + 0.8);
		hornGain.gain.linearRampToValueAtTime(0, now + 1.2);
		horn.connect(hornFilter);
		hornFilter.connect(hornGain);
		hornGain.connect(this.getMaster());
		hornGain.connect(this.getReverb());
		horn.start(now);
		horn.stop(now + 1.2);

		// Shimmer
		const shimmer = ctx.createOscillator();
		const shimmerGain = ctx.createGain();
		shimmer.type = 'sine';
		shimmer.frequency.setValueAtTime(2000, now + 0.3);
		shimmer.frequency.linearRampToValueAtTime(4000, now + 1.0);
		shimmerGain.gain.setValueAtTime(0, now + 0.3);
		shimmerGain.gain.linearRampToValueAtTime(0.06, now + 0.5);
		shimmerGain.gain.linearRampToValueAtTime(0, now + 1.2);
		shimmer.connect(shimmerGain);
		shimmerGain.connect(this.getReverb());
		shimmer.start(now + 0.3);
		shimmer.stop(now + 1.2);

		// Sub drum
		this.playFilteredNoiseBurst(now, 0.1, 150, 'lowpass', 0.3);
	}

	private soundLegendaryEntrance(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;

		// Full norse horn
		this.playFilteredNoiseBurst(now, 0.15, 150, 'lowpass', 0.4);

		const horn1 = ctx.createOscillator();
		const horn1Gain = ctx.createGain();
		const horn1Filter = ctx.createBiquadFilter();
		horn1.type = 'sawtooth';
		horn1.frequency.setValueAtTime(110, now + 0.1);
		horn1.frequency.linearRampToValueAtTime(165, now + 0.6);
		horn1.frequency.linearRampToValueAtTime(220, now + 1.0);
		horn1Filter.type = 'lowpass';
		horn1Filter.frequency.setValueAtTime(400, now + 0.1);
		horn1Filter.frequency.linearRampToValueAtTime(1200, now + 0.8);
		horn1Gain.gain.setValueAtTime(0, now + 0.1);
		horn1Gain.gain.linearRampToValueAtTime(0.22, now + 0.4);
		horn1Gain.gain.linearRampToValueAtTime(0.15, now + 1.2);
		horn1Gain.gain.linearRampToValueAtTime(0, now + 1.8);
		horn1.connect(horn1Filter);
		horn1Filter.connect(horn1Gain);
		horn1Gain.connect(this.getMaster());
		horn1Gain.connect(this.getReverb());
		horn1.start(now + 0.1);
		horn1.stop(now + 1.8);

		// Harmony fifth
		const chord = ctx.createOscillator();
		const chordGain = ctx.createGain();
		const chordFilter = ctx.createBiquadFilter();
		chord.type = 'sawtooth';
		chord.frequency.value = 330;
		chordFilter.type = 'lowpass';
		chordFilter.frequency.value = 1000;
		chordGain.gain.setValueAtTime(0, now + 0.5);
		chordGain.gain.linearRampToValueAtTime(0.1, now + 0.8);
		chordGain.gain.linearRampToValueAtTime(0, now + 1.8);
		chord.connect(chordFilter);
		chordFilter.connect(chordGain);
		chordGain.connect(this.getMaster());
		chordGain.connect(this.getReverb());
		chord.start(now + 0.5);
		chord.stop(now + 1.8);

		// Shimmer
		const shimmer = ctx.createOscillator();
		const shimmerGain = ctx.createGain();
		shimmer.type = 'sine';
		shimmer.frequency.setValueAtTime(2500, now + 0.4);
		shimmer.frequency.linearRampToValueAtTime(5000, now + 1.5);
		shimmerGain.gain.setValueAtTime(0, now + 0.4);
		shimmerGain.gain.linearRampToValueAtTime(0.07, now + 0.7);
		shimmerGain.gain.linearRampToValueAtTime(0, now + 1.8);
		shimmer.connect(shimmerGain);
		shimmerGain.connect(this.getReverb());
		shimmer.start(now + 0.4);
		shimmer.stop(now + 1.8);

		// Drum sequence
		this.playFilteredNoiseBurst(now + 0.8, 0.1, 150, 'lowpass', 0.25);
		this.playFilteredNoiseBurst(now + 1.2, 0.08, 150, 'lowpass', 0.2);
	}

	private soundBattlecry(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;

		// War shout — ascending sawtooth
		const shout = ctx.createOscillator();
		const shoutGain = ctx.createGain();
		const shoutFilter = ctx.createBiquadFilter();
		shout.type = 'sawtooth';
		shout.frequency.setValueAtTime(110, now);
		shout.frequency.linearRampToValueAtTime(330, now + 0.2);
		shout.frequency.linearRampToValueAtTime(250, now + 0.4);
		shoutFilter.type = 'lowpass';
		shoutFilter.frequency.setValueAtTime(500, now);
		shoutFilter.frequency.linearRampToValueAtTime(1500, now + 0.15);
		shoutFilter.frequency.linearRampToValueAtTime(800, now + 0.4);
		shoutGain.gain.setValueAtTime(0, now);
		shoutGain.gain.linearRampToValueAtTime(0.25, now + 0.06);
		shoutGain.gain.linearRampToValueAtTime(0.15, now + 0.25);
		shoutGain.gain.linearRampToValueAtTime(0, now + 0.4);
		shout.connect(shoutFilter);
		shoutFilter.connect(shoutGain);
		shoutGain.connect(this.getMaster());
		shoutGain.connect(this.getReverb());
		shout.start(now);
		shout.stop(now + 0.4);

		// Crowd roar
		this.playFilteredNoiseBurst(now, 0.3, 400, 'lowpass', 0.15);
	}

	private soundDeathrattle(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;

		// Death bell — low sine with long decay
		const bell = ctx.createOscillator();
		const bellGain = ctx.createGain();
		bell.type = 'sine';
		bell.frequency.value = 80;
		bellGain.gain.setValueAtTime(0.3, now);
		bellGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
		bell.connect(bellGain);
		bellGain.connect(this.getMaster());
		bellGain.connect(this.getReverb());
		bell.start(now);
		bell.stop(now + 1.0);

		// Dissonant harmonic
		const dis = ctx.createOscillator();
		const disGain = ctx.createGain();
		dis.type = 'sine';
		dis.frequency.value = 113; // minor second above fundamental
		disGain.gain.setValueAtTime(0.1, now);
		disGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
		dis.connect(disGain);
		disGain.connect(this.getMaster());
		disGain.connect(this.getReverb());
		dis.start(now);
		dis.stop(now + 0.6);

		// Low noise rumble
		this.playFilteredNoiseBurst(now + 0.05, 0.5, 200, 'lowpass', 0.15, this.getReverb());
	}

	private soundDiscover(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;

		// 3 ascending rune whispers
		const freqs = [800, 1000, 1200];
		freqs.forEach((freq, i) => {
			const t = now + i * 0.12;
			// Detuned pair
			const s1 = ctx.createOscillator();
			const s2 = ctx.createOscillator();
			const gain = ctx.createGain();
			s1.type = 'sine';
			s1.frequency.value = freq;
			s2.type = 'sine';
			s2.frequency.value = freq + 3;
			gain.gain.setValueAtTime(0, t);
			gain.gain.linearRampToValueAtTime(0.12, t + 0.02);
			gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
			s1.connect(gain);
			s2.connect(gain);
			gain.connect(this.getMaster());
			gain.connect(this.getReverb());
			s1.start(t); s1.stop(t + 0.18);
			s2.start(t); s2.stop(t + 0.18);
		});
	}

	private soundSecretTrigger(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;

		// Noise sweep up (rune reveal)
		const noise = ctx.createBufferSource();
		noise.buffer = this.createNoise(0.3);
		const nf = ctx.createBiquadFilter();
		nf.type = 'bandpass';
		nf.frequency.setValueAtTime(500, now);
		nf.frequency.linearRampToValueAtTime(4000, now + 0.25);
		nf.Q.value = 2;
		const ng = ctx.createGain();
		ng.gain.setValueAtTime(0, now);
		ng.gain.linearRampToValueAtTime(0.2, now + 0.15);
		ng.gain.linearRampToValueAtTime(0, now + 0.3);
		noise.connect(nf);
		nf.connect(ng);
		ng.connect(this.getMaster());
		noise.start(now);
		noise.stop(now + 0.3);

		// Bright chord reveal
		const chord = [800, 1200, 1600];
		chord.forEach(freq => {
			this.playScheduledTone(now + 0.15, freq, 0.3, 'sine', 0.1, this.getReverb());
		});
	}

	private soundGameStart(): void {
		this.soundNorseHorn();
	}

	private soundVictory(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;

		// Triumphant ascending horn fifths
		const notes = [
			{ freq: 110, time: 0, dur: 0.4 },
			{ freq: 165, time: 0.3, dur: 0.4 },
			{ freq: 220, time: 0.6, dur: 0.6 },
			{ freq: 330, time: 1.0, dur: 0.8 },
		];

		notes.forEach(n => {
			const t = now + n.time;
			const horn = ctx.createOscillator();
			const hornGain = ctx.createGain();
			const hornFilter = ctx.createBiquadFilter();
			horn.type = 'sawtooth';
			horn.frequency.value = n.freq;
			hornFilter.type = 'lowpass';
			hornFilter.frequency.value = n.freq * 4;
			hornGain.gain.setValueAtTime(0, t);
			hornGain.gain.linearRampToValueAtTime(0.18, t + 0.08);
			hornGain.gain.linearRampToValueAtTime(0.1, t + n.dur * 0.7);
			hornGain.gain.linearRampToValueAtTime(0, t + n.dur);
			horn.connect(hornFilter);
			hornFilter.connect(hornGain);
			hornGain.connect(this.getMaster());
			hornGain.connect(this.getReverb());
			horn.start(t);
			horn.stop(t + n.dur);
		});

		// Drum hits
		this.playFilteredNoiseBurst(now, 0.1, 150, 'lowpass', 0.35);
		this.playFilteredNoiseBurst(now + 0.3, 0.08, 150, 'lowpass', 0.25);
		this.playFilteredNoiseBurst(now + 0.6, 0.1, 150, 'lowpass', 0.3);
		this.playFilteredNoiseBurst(now + 1.0, 0.12, 150, 'lowpass', 0.35);

		// Crowd shimmer
		const shimmer = ctx.createOscillator();
		const shimmerGain = ctx.createGain();
		shimmer.type = 'sine';
		shimmer.frequency.setValueAtTime(3000, now + 0.5);
		shimmer.frequency.linearRampToValueAtTime(5000, now + 1.5);
		shimmerGain.gain.setValueAtTime(0, now + 0.5);
		shimmerGain.gain.linearRampToValueAtTime(0.05, now + 0.8);
		shimmerGain.gain.linearRampToValueAtTime(0, now + 1.8);
		shimmer.connect(shimmerGain);
		shimmerGain.connect(this.getReverb());
		shimmer.start(now + 0.5);
		shimmer.stop(now + 1.8);
	}

	private soundDefeat(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;

		// Mournful descending horn (minor)
		const notes = [220, 196, 165]; // A-G-E (minor descent)
		notes.forEach((freq, i) => {
			const t = now + i * 0.3;
			const horn = ctx.createOscillator();
			const hornGain = ctx.createGain();
			const hornFilter = ctx.createBiquadFilter();
			horn.type = 'sawtooth';
			horn.frequency.value = freq;
			hornFilter.type = 'lowpass';
			hornFilter.frequency.value = 600;
			hornGain.gain.setValueAtTime(0, t);
			hornGain.gain.linearRampToValueAtTime(0.15, t + 0.05);
			hornGain.gain.linearRampToValueAtTime(0.08, t + 0.25);
			hornGain.gain.linearRampToValueAtTime(0, t + 0.4);
			horn.connect(hornFilter);
			hornFilter.connect(hornGain);
			hornGain.connect(this.getMaster());
			hornGain.connect(this.getReverb());
			horn.start(t);
			horn.stop(t + 0.4);
		});

		// Low rumble
		const rumble = ctx.createOscillator();
		const rumbleGain = ctx.createGain();
		rumble.type = 'sine';
		rumble.frequency.value = 40;
		rumbleGain.gain.setValueAtTime(0.15, now);
		rumbleGain.gain.linearRampToValueAtTime(0, now + 1.2);
		rumble.connect(rumbleGain);
		rumbleGain.connect(this.getMaster());
		rumble.start(now);
		rumble.stop(now + 1.2);

		// Fading noise
		this.playFilteredNoiseBurst(now, 0.8, 300, 'lowpass', 0.06, this.getReverb());
	}

	private soundHeroPower(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;

		// Rune activation — rising chord
		const root = ctx.createOscillator();
		const fifth = ctx.createOscillator();
		const chordGain = ctx.createGain();
		root.type = 'sine';
		root.frequency.setValueAtTime(220, now);
		root.frequency.linearRampToValueAtTime(330, now + 0.3);
		fifth.type = 'sine';
		fifth.frequency.setValueAtTime(330, now);
		fifth.frequency.linearRampToValueAtTime(440, now + 0.3);
		chordGain.gain.setValueAtTime(0, now);
		chordGain.gain.linearRampToValueAtTime(0.15, now + 0.1);
		chordGain.gain.linearRampToValueAtTime(0.1, now + 0.3);
		chordGain.gain.linearRampToValueAtTime(0, now + 0.5);
		root.connect(chordGain);
		fifth.connect(chordGain);
		chordGain.connect(this.getMaster());
		chordGain.connect(this.getReverb());
		root.start(now); root.stop(now + 0.5);
		fifth.start(now); fifth.stop(now + 0.5);

		// Shimmer
		this.playScheduledTone(now + 0.15, 2000, 0.3, 'sine', 0.05, this.getReverb());

		// Subtle horn
		const horn = ctx.createOscillator();
		const hornGain = ctx.createGain();
		const hornFilter = ctx.createBiquadFilter();
		horn.type = 'sawtooth';
		horn.frequency.value = 165;
		hornFilter.type = 'lowpass';
		hornFilter.frequency.value = 500;
		hornGain.gain.setValueAtTime(0, now + 0.1);
		hornGain.gain.linearRampToValueAtTime(0.06, now + 0.2);
		hornGain.gain.linearRampToValueAtTime(0, now + 0.5);
		horn.connect(hornFilter);
		hornFilter.connect(hornGain);
		hornGain.connect(this.getMaster());
		horn.start(now + 0.1);
		horn.stop(now + 0.5);
	}

	private soundAttackPrepare(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;

		// Sword unsheathing — rising highpass noise
		const unsheathe = ctx.createBufferSource();
		unsheathe.buffer = this.createNoise(0.35);
		const uf = ctx.createBiquadFilter();
		uf.type = 'highpass';
		uf.frequency.setValueAtTime(2000, now);
		uf.frequency.linearRampToValueAtTime(6000, now + 0.3);
		const ug = ctx.createGain();
		ug.gain.setValueAtTime(0.05, now);
		ug.gain.linearRampToValueAtTime(0.2, now + 0.2);
		ug.gain.linearRampToValueAtTime(0, now + 0.35);
		unsheathe.connect(uf);
		uf.connect(ug);
		ug.connect(this.getMaster());
		unsheathe.start(now);
		unsheathe.stop(now + 0.35);

		// Tension drone
		const drone = ctx.createOscillator();
		const droneGain = ctx.createGain();
		drone.type = 'sine';
		drone.frequency.setValueAtTime(80, now);
		drone.frequency.linearRampToValueAtTime(120, now + 0.4);
		droneGain.gain.setValueAtTime(0, now);
		droneGain.gain.linearRampToValueAtTime(0.1, now + 0.3);
		droneGain.gain.linearRampToValueAtTime(0, now + 0.5);
		drone.connect(droneGain);
		droneGain.connect(this.getMaster());
		drone.start(now);
		drone.stop(now + 0.5);
	}

	private soundTurnStart(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;

		// Single horn note
		const horn = ctx.createOscillator();
		const hornGain = ctx.createGain();
		const hornFilter = ctx.createBiquadFilter();
		horn.type = 'sawtooth';
		horn.frequency.value = 220;
		hornFilter.type = 'lowpass';
		hornFilter.frequency.value = 800;
		hornGain.gain.setValueAtTime(0, now);
		hornGain.gain.linearRampToValueAtTime(0.15, now + 0.05);
		hornGain.gain.linearRampToValueAtTime(0.08, now + 0.3);
		hornGain.gain.linearRampToValueAtTime(0, now + 0.4);
		horn.connect(hornFilter);
		hornFilter.connect(hornGain);
		hornGain.connect(this.getMaster());
		hornGain.connect(this.getReverb());
		horn.start(now);
		horn.stop(now + 0.4);

		// Soft drum hit
		this.playFilteredNoiseBurst(now, 0.08, 150, 'lowpass', 0.2);
	}

	private soundTurnEnd(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;

		// Descending horn note
		const horn = ctx.createOscillator();
		const hornGain = ctx.createGain();
		const hornFilter = ctx.createBiquadFilter();
		horn.type = 'sawtooth';
		horn.frequency.setValueAtTime(220, now);
		horn.frequency.linearRampToValueAtTime(165, now + 0.25);
		hornFilter.type = 'lowpass';
		hornFilter.frequency.value = 600;
		hornGain.gain.setValueAtTime(0.1, now);
		hornGain.gain.linearRampToValueAtTime(0, now + 0.3);
		horn.connect(hornFilter);
		hornFilter.connect(hornGain);
		hornGain.connect(this.getMaster());
		horn.start(now);
		horn.stop(now + 0.3);
	}

	private soundCardHover(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;

		// Very quiet rune whisper
		const s1 = ctx.createOscillator();
		const s2 = ctx.createOscillator();
		const gain = ctx.createGain();
		s1.type = 'sine';
		s1.frequency.value = 800;
		s2.type = 'sine';
		s2.frequency.value = 803;
		gain.gain.setValueAtTime(0.03, now);
		gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
		s1.connect(gain);
		s2.connect(gain);
		gain.connect(this.getMaster());
		s1.start(now);
		s2.start(now);
		s1.stop(now + 0.04);
		s2.stop(now + 0.04);
	}

	private soundCardClick(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;

		// Stone tap
		this.playFilteredNoiseBurst(now, 0.04, 400, 'lowpass', 0.15);

		const tap = ctx.createOscillator();
		const tapGain = ctx.createGain();
		tap.type = 'sine';
		tap.frequency.value = 400;
		tapGain.gain.setValueAtTime(0.12, now);
		tapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
		tap.connect(tapGain);
		tapGain.connect(this.getMaster());
		tap.start(now);
		tap.stop(now + 0.06);
	}

	private soundButtonClick(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;

		// Wood knock
		this.playFilteredNoiseBurst(now, 0.04, 800, 'bandpass', 0.12, undefined, 3);

		const knock = ctx.createOscillator();
		const knockGain = ctx.createGain();
		knock.type = 'sine';
		knock.frequency.setValueAtTime(300, now);
		knock.frequency.exponentialRampToValueAtTime(150, now + 0.06);
		knockGain.gain.setValueAtTime(0.15, now);
		knockGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
		knock.connect(knockGain);
		knockGain.connect(this.getMaster());
		knock.start(now);
		knock.stop(now + 0.08);
	}

	private soundError(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;

		// Dissonant minor second buzz
		const o1 = ctx.createOscillator();
		const o2 = ctx.createOscillator();
		const gain = ctx.createGain();
		o1.type = 'sawtooth';
		o1.frequency.value = 300;
		o2.type = 'sawtooth';
		o2.frequency.value = 315;
		gain.gain.setValueAtTime(0.15, now);
		gain.gain.linearRampToValueAtTime(0, now + 0.25);

		const filter = ctx.createBiquadFilter();
		filter.type = 'lowpass';
		filter.frequency.value = 1200;
		o1.connect(filter);
		o2.connect(filter);
		filter.connect(gain);
		gain.connect(this.getMaster());
		o1.start(now);
		o2.start(now);
		o1.stop(now + 0.25);
		o2.stop(now + 0.25);
	}

	private soundManaFill(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;

		// Crystal chime
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = 'sine';
		osc.frequency.setValueAtTime(1200, now);
		osc.frequency.linearRampToValueAtTime(1600, now + 0.2);
		gain.gain.setValueAtTime(0, now);
		gain.gain.linearRampToValueAtTime(0.12, now + 0.03);
		gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
		osc.connect(gain);
		gain.connect(this.getMaster());
		gain.connect(this.getReverb());
		osc.start(now);
		osc.stop(now + 0.3);

		// Harmonic
		this.playScheduledTone(now + 0.02, 2400, 0.2, 'sine', 0.04, this.getReverb());
	}

	private soundManaSpend(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;

		// Soft descending spend
		this.playSweep(1000, 600, 0.15, 'sine', 0.01, 0.13, 0.1);
		this.playFilteredNoiseBurst(now, 0.06, 3000, 'highpass', 0.05);
	}

	private soundFatigue(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;

		// Low warning drone
		const drone = ctx.createOscillator();
		const droneGain = ctx.createGain();
		drone.type = 'sine';
		drone.frequency.value = 50;
		droneGain.gain.setValueAtTime(0.2, now);
		droneGain.gain.linearRampToValueAtTime(0, now + 0.6);
		drone.connect(droneGain);
		droneGain.connect(this.getMaster());
		drone.start(now);
		drone.stop(now + 0.6);

		// Dissonant sawtooth
		const warn = ctx.createOscillator();
		const warnGain = ctx.createGain();
		const warnFilter = ctx.createBiquadFilter();
		warn.type = 'sawtooth';
		warn.frequency.value = 440;
		warnFilter.type = 'lowpass';
		warnFilter.frequency.value = 800;
		warnGain.gain.setValueAtTime(0, now + 0.1);
		warnGain.gain.linearRampToValueAtTime(0.12, now + 0.15);
		warnGain.gain.linearRampToValueAtTime(0, now + 0.35);
		warn.connect(warnFilter);
		warnFilter.connect(warnGain);
		warnGain.connect(this.getMaster());
		warn.start(now + 0.1);
		warn.stop(now + 0.35);
	}

	private soundEmote(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;

		// Quick horn pip
		const horn = ctx.createOscillator();
		const hornGain = ctx.createGain();
		const hornFilter = ctx.createBiquadFilter();
		horn.type = 'sawtooth';
		horn.frequency.value = 330;
		hornFilter.type = 'lowpass';
		hornFilter.frequency.value = 800;
		hornGain.gain.setValueAtTime(0.12, now);
		hornGain.gain.linearRampToValueAtTime(0, now + 0.1);
		horn.connect(hornFilter);
		hornFilter.connect(hornGain);
		hornGain.connect(this.getMaster());
		horn.start(now);
		horn.stop(now + 0.1);
	}
}

export const proceduralAudio = new ProceduralAudio();
