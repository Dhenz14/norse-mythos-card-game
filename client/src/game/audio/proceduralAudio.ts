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
	| 'emote';

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
		const length = rate * 1.5;
		const impulse = ctx.createBuffer(2, length, rate);
		for (let ch = 0; ch < 2; ch++) {
			const data = impulse.getChannelData(ch);
			for (let i = 0; i < length; i++) {
				data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.5);
			}
		}
		convolver.buffer = impulse;
		const wet = ctx.createGain();
		wet.gain.value = 0.3;
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
		destination?: AudioNode
	): void {
		const ctx = this.getContext();
		const source = ctx.createBufferSource();
		source.buffer = this.createNoise(duration);
		const filter = ctx.createBiquadFilter();
		filter.type = filterType;
		filter.frequency.value = filterFreq;
		filter.Q.value = 1.5;
		const gain = ctx.createGain();
		gain.gain.setValueAtTime(gainVal, startTime);
		gain.gain.linearRampToValueAtTime(0, startTime + duration);
		source.connect(filter);
		filter.connect(gain);
		gain.connect(destination || this.getMaster());
		source.start(startTime);
		source.stop(startTime + duration);
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
				default: this.soundButtonClick(); break;
			}
		} catch (_) {
			// silently ignore audio errors
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

	private soundCardPlay(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;
		this.playSweep(800, 200, 0.2, 'sine', 0.01, 0.18, 0.25);
		this.playFilteredNoiseBurst(now + 0.1, 0.1, 300, 'lowpass', 0.3);
	}

	private soundCardDraw(): void {
		this.playSweep(300, 1200, 0.15, 'sine', 0.01, 0.13, 0.2);
	}

	private soundAttack(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = 'sawtooth';
		osc.frequency.setValueAtTime(100, now);
		osc.frequency.linearRampToValueAtTime(60, now + 0.15);
		gain.gain.setValueAtTime(0.35, now);
		gain.gain.linearRampToValueAtTime(0, now + 0.3);
		osc.connect(gain);
		gain.connect(this.getMaster());
		osc.start(now);
		osc.stop(now + 0.3);
		this.playFilteredNoiseBurst(now, 0.15, 4000, 'highpass', 0.35);
		this.playFilteredNoiseBurst(now + 0.05, 0.1, 2000, 'bandpass', 0.2);
	}

	private soundDamage(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = 'sine';
		osc.frequency.setValueAtTime(80, now);
		osc.frequency.linearRampToValueAtTime(40, now + 0.25);
		gain.gain.setValueAtTime(0.4, now);
		gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
		osc.connect(gain);
		gain.connect(this.getMaster());
		osc.start(now);
		osc.stop(now + 0.25);
		this.playFilteredNoiseBurst(now, 0.12, 1500, 'bandpass', 0.3);
	}

	private soundHeal(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;
		const notes = [523.25, 659.25, 783.99];
		notes.forEach((freq, i) => {
			const delay = i * 0.12;
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.type = 'triangle';
			osc.frequency.value = freq;
			gain.gain.setValueAtTime(0, now + delay);
			gain.gain.linearRampToValueAtTime(0.2, now + delay + 0.03);
			gain.gain.linearRampToValueAtTime(0, now + delay + 0.15);
			osc.connect(gain);
			gain.connect(this.getMaster());
			gain.connect(this.getReverb());
			osc.start(now + delay);
			osc.stop(now + delay + 0.15);
		});
	}

	private soundCoin(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;
		const osc1 = ctx.createOscillator();
		const gain1 = ctx.createGain();
		osc1.type = 'triangle';
		osc1.frequency.value = 1200;
		gain1.gain.setValueAtTime(0.3, now);
		gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
		osc1.connect(gain1);
		gain1.connect(this.getMaster());
		osc1.start(now);
		osc1.stop(now + 0.1);
		const osc2 = ctx.createOscillator();
		const gain2 = ctx.createGain();
		osc2.type = 'triangle';
		osc2.frequency.value = 1800;
		gain2.gain.setValueAtTime(0.25, now + 0.06);
		gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
		osc2.connect(gain2);
		gain2.connect(this.getMaster());
		osc2.start(now + 0.06);
		osc2.stop(now + 0.2);
	}

	private soundLegendary(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;
		const brass = ctx.createOscillator();
		const brassGain = ctx.createGain();
		brass.type = 'sawtooth';
		brass.frequency.setValueAtTime(110, now);
		brass.frequency.linearRampToValueAtTime(220, now + 0.4);
		brassGain.gain.setValueAtTime(0, now);
		brassGain.gain.linearRampToValueAtTime(0.25, now + 0.3);
		brassGain.gain.linearRampToValueAtTime(0.15, now + 0.8);
		brassGain.gain.linearRampToValueAtTime(0, now + 1.5);
		brass.connect(brassGain);
		brassGain.connect(this.getMaster());
		brassGain.connect(this.getReverb());
		brass.start(now);
		brass.stop(now + 1.5);
		const shimmer = ctx.createOscillator();
		const shimmerGain = ctx.createGain();
		const lfo = ctx.createOscillator();
		const lfoGain = ctx.createGain();
		shimmer.type = 'sine';
		shimmer.frequency.setValueAtTime(2000, now + 0.3);
		shimmer.frequency.linearRampToValueAtTime(4000, now + 1.2);
		lfo.type = 'sine';
		lfo.frequency.value = 8;
		lfoGain.gain.value = 0.1;
		lfo.connect(lfoGain);
		lfoGain.connect(shimmerGain.gain);
		shimmerGain.gain.setValueAtTime(0, now + 0.3);
		shimmerGain.gain.linearRampToValueAtTime(0.12, now + 0.6);
		shimmerGain.gain.linearRampToValueAtTime(0, now + 1.5);
		shimmer.connect(shimmerGain);
		shimmerGain.connect(this.getMaster());
		shimmerGain.connect(this.getReverb());
		shimmer.start(now + 0.3);
		shimmer.stop(now + 1.5);
		lfo.start(now + 0.3);
		lfo.stop(now + 1.5);
	}

	private soundSpell(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;
		this.playSweep(400, 2000, 0.4, 'sine', 0.02, 0.35, 0.2, this.getReverb());
		this.playSweep(400, 2000, 0.4, 'sine', 0.02, 0.35, 0.15);
		this.playFilteredNoiseBurst(now + 0.15, 0.25, 3000, 'bandpass', 0.1, this.getReverb());
	}

	private soundFreeze(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;
		for (let i = 0; i < 6; i++) {
			const t = now + i * 0.05;
			const freq = 2000 + Math.random() * 4000;
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.type = 'sine';
			osc.frequency.value = freq;
			gain.gain.setValueAtTime(0.12, t);
			gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
			osc.connect(gain);
			gain.connect(this.getMaster());
			osc.start(t);
			osc.stop(t + 0.04);
		}
		this.playFilteredNoiseBurst(now, 0.35, 5000, 'highpass', 0.15);
	}

	private soundDeathrattle(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;
		const bell = ctx.createOscillator();
		const bellGain = ctx.createGain();
		bell.type = 'sine';
		bell.frequency.value = 120;
		bellGain.gain.setValueAtTime(0.3, now);
		bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
		bell.connect(bellGain);
		bellGain.connect(this.getMaster());
		bellGain.connect(this.getReverb());
		bell.start(now);
		bell.stop(now + 0.8);
		const h2 = ctx.createOscillator();
		const h2Gain = ctx.createGain();
		h2.type = 'sine';
		h2.frequency.value = 240;
		h2Gain.gain.setValueAtTime(0.12, now);
		h2Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
		h2.connect(h2Gain);
		h2Gain.connect(this.getMaster());
		h2.start(now);
		h2.stop(now + 0.5);
		const h3 = ctx.createOscillator();
		const h3Gain = ctx.createGain();
		h3.type = 'sine';
		h3.frequency.value = 360;
		h3Gain.gain.setValueAtTime(0.06, now);
		h3Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
		h3.connect(h3Gain);
		h3Gain.connect(this.getMaster());
		h3.start(now);
		h3.stop(now + 0.3);
		this.playFilteredNoiseBurst(now + 0.05, 0.6, 200, 'lowpass', 0.2);
	}

	private soundBattlecry(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = 'sawtooth';
		osc.frequency.setValueAtTime(220, now);
		osc.frequency.linearRampToValueAtTime(440, now + 0.15);
		osc.frequency.linearRampToValueAtTime(330, now + 0.4);
		gain.gain.setValueAtTime(0, now);
		gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
		gain.gain.linearRampToValueAtTime(0.15, now + 0.25);
		gain.gain.linearRampToValueAtTime(0, now + 0.4);
		osc.connect(gain);
		gain.connect(this.getMaster());
		osc.start(now);
		osc.stop(now + 0.4);
	}

	private soundDiscover(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;
		const freqs = [800, 1000, 1200];
		freqs.forEach((freq, i) => {
			const t = now + i * 0.15;
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.type = 'sine';
			osc.frequency.value = freq;
			gain.gain.setValueAtTime(0, t);
			gain.gain.linearRampToValueAtTime(0.2, t + 0.02);
			gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
			osc.connect(gain);
			gain.connect(this.getMaster());
			gain.connect(this.getReverb());
			osc.start(t);
			osc.stop(t + 0.18);
		});
	}

	private soundSecretTrigger(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;
		const noise = ctx.createBufferSource();
		noise.buffer = this.createNoise(0.3);
		const noiseFilter = ctx.createBiquadFilter();
		noiseFilter.type = 'bandpass';
		noiseFilter.frequency.setValueAtTime(500, now);
		noiseFilter.frequency.linearRampToValueAtTime(4000, now + 0.2);
		noiseFilter.Q.value = 2;
		const noiseGain = ctx.createGain();
		noiseGain.gain.setValueAtTime(0, now);
		noiseGain.gain.linearRampToValueAtTime(0.25, now + 0.15);
		noiseGain.gain.linearRampToValueAtTime(0, now + 0.3);
		noise.connect(noiseFilter);
		noiseFilter.connect(noiseGain);
		noiseGain.connect(this.getMaster());
		noise.start(now);
		noise.stop(now + 0.3);
		const reveal = ctx.createOscillator();
		const revealGain = ctx.createGain();
		reveal.type = 'sine';
		reveal.frequency.setValueAtTime(600, now + 0.15);
		reveal.frequency.linearRampToValueAtTime(1200, now + 0.35);
		revealGain.gain.setValueAtTime(0, now + 0.15);
		revealGain.gain.linearRampToValueAtTime(0.25, now + 0.25);
		revealGain.gain.linearRampToValueAtTime(0, now + 0.5);
		reveal.connect(revealGain);
		revealGain.connect(this.getMaster());
		revealGain.connect(this.getReverb());
		reveal.start(now + 0.15);
		reveal.stop(now + 0.5);
	}

	private soundGameStart(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;
		const horn = ctx.createOscillator();
		const hornGain = ctx.createGain();
		horn.type = 'sawtooth';
		horn.frequency.setValueAtTime(220, now);
		horn.frequency.linearRampToValueAtTime(330, now + 0.8);
		horn.frequency.linearRampToValueAtTime(220, now + 1.5);
		hornGain.gain.setValueAtTime(0, now);
		hornGain.gain.linearRampToValueAtTime(0.2, now + 0.5);
		hornGain.gain.linearRampToValueAtTime(0.15, now + 1.2);
		hornGain.gain.linearRampToValueAtTime(0, now + 2.0);
		horn.connect(hornGain);
		hornGain.connect(this.getMaster());
		hornGain.connect(this.getReverb());
		horn.start(now);
		horn.stop(now + 2.0);
		const sub = ctx.createOscillator();
		const subGain = ctx.createGain();
		sub.type = 'sine';
		sub.frequency.value = 110;
		subGain.gain.setValueAtTime(0, now);
		subGain.gain.linearRampToValueAtTime(0.15, now + 0.3);
		subGain.gain.linearRampToValueAtTime(0, now + 2.0);
		sub.connect(subGain);
		subGain.connect(this.getMaster());
		sub.start(now);
		sub.stop(now + 2.0);
		this.playFilteredNoiseBurst(now, 0.15, 200, 'lowpass', 0.4);
		this.playFilteredNoiseBurst(now + 0.5, 0.15, 200, 'lowpass', 0.3);
		this.playFilteredNoiseBurst(now + 1.0, 0.1, 200, 'lowpass', 0.2);
	}

	private soundVictory(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;
		const notes = [261.63, 329.63, 392.0, 523.25];
		notes.forEach((freq, i) => {
			const t = now + i * 0.2;
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.type = 'triangle';
			osc.frequency.value = freq;
			gain.gain.setValueAtTime(0, t);
			gain.gain.linearRampToValueAtTime(0.25, t + 0.05);
			gain.gain.linearRampToValueAtTime(0.15, t + 0.2);
			gain.gain.linearRampToValueAtTime(0, t + 0.5);
			osc.connect(gain);
			gain.connect(this.getMaster());
			gain.connect(this.getReverb());
			osc.start(t);
			osc.stop(t + 0.5);
			const osc2 = ctx.createOscillator();
			const gain2 = ctx.createGain();
			osc2.type = 'sine';
			osc2.frequency.value = freq * 2;
			gain2.gain.setValueAtTime(0, t);
			gain2.gain.linearRampToValueAtTime(0.08, t + 0.05);
			gain2.gain.linearRampToValueAtTime(0, t + 0.4);
			osc2.connect(gain2);
			gain2.connect(this.getMaster());
			osc2.start(t);
			osc2.stop(t + 0.4);
		});
	}

	private soundDefeat(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;
		const notes = [220.0, 174.61, 146.83];
		notes.forEach((freq, i) => {
			const t = now + i * 0.25;
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.type = 'sine';
			osc.frequency.value = freq;
			gain.gain.setValueAtTime(0, t);
			gain.gain.linearRampToValueAtTime(0.2, t + 0.05);
			gain.gain.linearRampToValueAtTime(0, t + 0.35);
			osc.connect(gain);
			gain.connect(this.getMaster());
			gain.connect(this.getReverb());
			osc.start(t);
			osc.stop(t + 0.35);
		});
		const rumble = ctx.createOscillator();
		const rumbleGain = ctx.createGain();
		rumble.type = 'sine';
		rumble.frequency.value = 50;
		rumbleGain.gain.setValueAtTime(0.15, now);
		rumbleGain.gain.linearRampToValueAtTime(0, now + 1.0);
		rumble.connect(rumbleGain);
		rumbleGain.connect(this.getMaster());
		rumble.start(now);
		rumble.stop(now + 1.0);
	}

	private soundCardHover(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = 'sine';
		osc.frequency.value = 3000;
		gain.gain.setValueAtTime(0.06, now);
		gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
		osc.connect(gain);
		gain.connect(this.getMaster());
		osc.start(now);
		osc.stop(now + 0.03);
	}

	private soundCardClick(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = 'sine';
		osc.frequency.value = 1000;
		gain.gain.setValueAtTime(0.15, now);
		gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
		osc.connect(gain);
		gain.connect(this.getMaster());
		osc.start(now);
		osc.stop(now + 0.05);
	}

	private soundButtonClick(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = 'sine';
		osc.frequency.value = 800;
		gain.gain.setValueAtTime(0.15, now);
		gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
		osc.connect(gain);
		gain.connect(this.getMaster());
		osc.start(now);
		osc.stop(now + 0.06);
		this.playFilteredNoiseBurst(now, 0.03, 3000, 'highpass', 0.08);
	}

	private soundError(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;
		const osc1 = ctx.createOscillator();
		const osc2 = ctx.createOscillator();
		const gain = ctx.createGain();
		osc1.type = 'sine';
		osc1.frequency.value = 300;
		osc2.type = 'sine';
		osc2.frequency.value = 310;
		gain.gain.setValueAtTime(0.2, now);
		gain.gain.linearRampToValueAtTime(0, now + 0.3);
		osc1.connect(gain);
		osc2.connect(gain);
		gain.connect(this.getMaster());
		osc1.start(now);
		osc2.start(now);
		osc1.stop(now + 0.3);
		osc2.stop(now + 0.3);
	}

	private soundHeroPower(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = 'sawtooth';
		osc.frequency.setValueAtTime(150, now);
		osc.frequency.linearRampToValueAtTime(300, now + 0.3);
		osc.frequency.linearRampToValueAtTime(250, now + 0.5);
		gain.gain.setValueAtTime(0, now);
		gain.gain.linearRampToValueAtTime(0.2, now + 0.1);
		gain.gain.linearRampToValueAtTime(0.15, now + 0.3);
		gain.gain.linearRampToValueAtTime(0, now + 0.5);
		osc.connect(gain);
		gain.connect(this.getMaster());
		gain.connect(this.getReverb());
		osc.start(now);
		osc.stop(now + 0.5);
		const shimmer = ctx.createOscillator();
		const shimmerGain = ctx.createGain();
		shimmer.type = 'sine';
		shimmer.frequency.setValueAtTime(1500, now + 0.1);
		shimmer.frequency.linearRampToValueAtTime(3000, now + 0.5);
		shimmerGain.gain.setValueAtTime(0, now + 0.1);
		shimmerGain.gain.linearRampToValueAtTime(0.08, now + 0.2);
		shimmerGain.gain.linearRampToValueAtTime(0, now + 0.5);
		shimmer.connect(shimmerGain);
		shimmerGain.connect(this.getMaster());
		shimmer.start(now + 0.1);
		shimmer.stop(now + 0.5);
	}

	private soundAttackPrepare(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = 'sine';
		osc.frequency.setValueAtTime(80, now);
		osc.frequency.linearRampToValueAtTime(200, now + 0.4);
		gain.gain.setValueAtTime(0, now);
		gain.gain.linearRampToValueAtTime(0.15, now + 0.35);
		gain.gain.linearRampToValueAtTime(0, now + 0.5);
		osc.connect(gain);
		gain.connect(this.getMaster());
		osc.start(now);
		osc.stop(now + 0.5);
		this.playFilteredNoiseBurst(now, 0.5, 400, 'lowpass', 0.08);
	}

	private soundSpellCharge(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = 'sine';
		osc.frequency.setValueAtTime(200, now);
		osc.frequency.exponentialRampToValueAtTime(2000, now + 0.6);
		gain.gain.setValueAtTime(0.05, now);
		gain.gain.linearRampToValueAtTime(0.2, now + 0.5);
		gain.gain.linearRampToValueAtTime(0, now + 0.7);
		osc.connect(gain);
		gain.connect(this.getMaster());
		gain.connect(this.getReverb());
		osc.start(now);
		osc.stop(now + 0.7);
		const osc2 = ctx.createOscillator();
		const gain2 = ctx.createGain();
		osc2.type = 'sine';
		osc2.frequency.setValueAtTime(205, now);
		osc2.frequency.exponentialRampToValueAtTime(2050, now + 0.6);
		gain2.gain.setValueAtTime(0.03, now);
		gain2.gain.linearRampToValueAtTime(0.12, now + 0.5);
		gain2.gain.linearRampToValueAtTime(0, now + 0.7);
		osc2.connect(gain2);
		gain2.connect(this.getMaster());
		osc2.start(now);
		osc2.stop(now + 0.7);
	}

	private soundSpellCast(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;
		this.playSweep(1500, 400, 0.3, 'sine', 0.01, 0.28, 0.25, this.getReverb());
		this.playSweep(1500, 400, 0.3, 'sine', 0.01, 0.28, 0.2);
		this.playFilteredNoiseBurst(now, 0.15, 2000, 'bandpass', 0.2);
	}

	private soundSpellImpact(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = 'sine';
		osc.frequency.setValueAtTime(120, now);
		osc.frequency.linearRampToValueAtTime(40, now + 0.3);
		gain.gain.setValueAtTime(0.4, now);
		gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
		osc.connect(gain);
		gain.connect(this.getMaster());
		osc.start(now);
		osc.stop(now + 0.4);
		this.playFilteredNoiseBurst(now, 0.2, 1000, 'lowpass', 0.35);
		this.playFilteredNoiseBurst(now, 0.1, 5000, 'highpass', 0.15);
	}

	private soundFireImpact(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = 'sawtooth';
		osc.frequency.setValueAtTime(200, now);
		osc.frequency.linearRampToValueAtTime(60, now + 0.35);
		gain.gain.setValueAtTime(0.3, now);
		gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
		osc.connect(gain);
		gain.connect(this.getMaster());
		osc.start(now);
		osc.stop(now + 0.4);
		const crackle = ctx.createBufferSource();
		crackle.buffer = this.createNoise(0.3);
		const crackleFilter = ctx.createBiquadFilter();
		crackleFilter.type = 'bandpass';
		crackleFilter.frequency.setValueAtTime(3000, now);
		crackleFilter.frequency.linearRampToValueAtTime(800, now + 0.3);
		crackleFilter.Q.value = 3;
		const crackleGain = ctx.createGain();
		crackleGain.gain.setValueAtTime(0.25, now);
		crackleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
		crackle.connect(crackleFilter);
		crackleFilter.connect(crackleGain);
		crackleGain.connect(this.getMaster());
		crackle.start(now);
		crackle.stop(now + 0.3);
	}

	private soundLegendaryEntrance(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;
		this.playFilteredNoiseBurst(now, 0.2, 150, 'lowpass', 0.4);
		const horn1 = ctx.createOscillator();
		const horn1Gain = ctx.createGain();
		horn1.type = 'sawtooth';
		horn1.frequency.setValueAtTime(146.83, now + 0.15);
		horn1.frequency.linearRampToValueAtTime(220, now + 0.6);
		horn1Gain.gain.setValueAtTime(0, now + 0.15);
		horn1Gain.gain.linearRampToValueAtTime(0.2, now + 0.4);
		horn1Gain.gain.linearRampToValueAtTime(0.15, now + 1.0);
		horn1Gain.gain.linearRampToValueAtTime(0, now + 1.8);
		horn1.connect(horn1Gain);
		horn1Gain.connect(this.getMaster());
		horn1Gain.connect(this.getReverb());
		horn1.start(now + 0.15);
		horn1.stop(now + 1.8);
		const chord = ctx.createOscillator();
		const chordGain = ctx.createGain();
		chord.type = 'sawtooth';
		chord.frequency.value = 330;
		chordGain.gain.setValueAtTime(0, now + 0.5);
		chordGain.gain.linearRampToValueAtTime(0.1, now + 0.8);
		chordGain.gain.linearRampToValueAtTime(0, now + 1.8);
		chord.connect(chordGain);
		chordGain.connect(this.getMaster());
		chordGain.connect(this.getReverb());
		chord.start(now + 0.5);
		chord.stop(now + 1.8);
		const shimmer = ctx.createOscillator();
		const shimmerGain = ctx.createGain();
		shimmer.type = 'sine';
		shimmer.frequency.setValueAtTime(2500, now + 0.4);
		shimmer.frequency.linearRampToValueAtTime(4500, now + 1.5);
		shimmerGain.gain.setValueAtTime(0, now + 0.4);
		shimmerGain.gain.linearRampToValueAtTime(0.08, now + 0.7);
		shimmerGain.gain.linearRampToValueAtTime(0, now + 1.8);
		shimmer.connect(shimmerGain);
		shimmerGain.connect(this.getMaster());
		shimmerGain.connect(this.getReverb());
		shimmer.start(now + 0.4);
		shimmer.stop(now + 1.8);
		this.playFilteredNoiseBurst(now + 0.8, 0.15, 200, 'lowpass', 0.25);
	}

	private soundTurnStart(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = 'sine';
		osc.frequency.value = 880;
		gain.gain.setValueAtTime(0, now);
		gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
		gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
		osc.connect(gain);
		gain.connect(this.getMaster());
		gain.connect(this.getReverb());
		osc.start(now);
		osc.stop(now + 0.4);
		const h = ctx.createOscillator();
		const hGain = ctx.createGain();
		h.type = 'sine';
		h.frequency.value = 1320;
		hGain.gain.setValueAtTime(0, now);
		hGain.gain.linearRampToValueAtTime(0.08, now + 0.02);
		hGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
		h.connect(hGain);
		hGain.connect(this.getMaster());
		h.start(now);
		h.stop(now + 0.3);
	}

	private soundTurnEnd(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = 'sine';
		osc.frequency.setValueAtTime(700, now);
		osc.frequency.linearRampToValueAtTime(500, now + 0.2);
		gain.gain.setValueAtTime(0.12, now);
		gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
		osc.connect(gain);
		gain.connect(this.getMaster());
		osc.start(now);
		osc.stop(now + 0.2);
	}

	private soundDamageHero(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = 'sine';
		osc.frequency.setValueAtTime(60, now);
		osc.frequency.linearRampToValueAtTime(30, now + 0.4);
		gain.gain.setValueAtTime(0.45, now);
		gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
		osc.connect(gain);
		gain.connect(this.getMaster());
		osc.start(now);
		osc.stop(now + 0.4);
		this.playFilteredNoiseBurst(now, 0.15, 800, 'lowpass', 0.4);
		this.playFilteredNoiseBurst(now, 0.08, 4000, 'highpass', 0.15);
		const crunch = ctx.createOscillator();
		const crunchGain = ctx.createGain();
		crunch.type = 'square';
		crunch.frequency.setValueAtTime(150, now);
		crunch.frequency.linearRampToValueAtTime(50, now + 0.15);
		crunchGain.gain.setValueAtTime(0.1, now);
		crunchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
		crunch.connect(crunchGain);
		crunchGain.connect(this.getMaster());
		crunch.start(now);
		crunch.stop(now + 0.15);
	}

	private soundManaFill(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = 'sine';
		osc.frequency.setValueAtTime(1000, now);
		osc.frequency.linearRampToValueAtTime(1500, now + 0.2);
		gain.gain.setValueAtTime(0, now);
		gain.gain.linearRampToValueAtTime(0.15, now + 0.03);
		gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
		osc.connect(gain);
		gain.connect(this.getMaster());
		osc.start(now);
		osc.stop(now + 0.3);
		const h = ctx.createOscillator();
		const hGain = ctx.createGain();
		h.type = 'triangle';
		h.frequency.setValueAtTime(2000, now + 0.05);
		h.frequency.linearRampToValueAtTime(3000, now + 0.2);
		hGain.gain.setValueAtTime(0, now + 0.05);
		hGain.gain.linearRampToValueAtTime(0.06, now + 0.08);
		hGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
		h.connect(hGain);
		hGain.connect(this.getMaster());
		h.start(now + 0.05);
		h.stop(now + 0.25);
	}

	private soundManaSpend(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = 'sine';
		osc.frequency.setValueAtTime(800, now);
		osc.frequency.linearRampToValueAtTime(400, now + 0.15);
		gain.gain.setValueAtTime(0.12, now);
		gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
		osc.connect(gain);
		gain.connect(this.getMaster());
		osc.start(now);
		osc.stop(now + 0.2);
		this.playFilteredNoiseBurst(now, 0.08, 3000, 'highpass', 0.08);
	}

	private soundFatigue(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;
		const rumble = ctx.createOscillator();
		const rumbleGain = ctx.createGain();
		rumble.type = 'sine';
		rumble.frequency.value = 50;
		rumbleGain.gain.setValueAtTime(0.2, now);
		rumbleGain.gain.linearRampToValueAtTime(0, now + 0.6);
		rumble.connect(rumbleGain);
		rumbleGain.connect(this.getMaster());
		rumble.start(now);
		rumble.stop(now + 0.6);
		const warn = ctx.createOscillator();
		const warnGain = ctx.createGain();
		warn.type = 'sawtooth';
		warn.frequency.value = 440;
		warnGain.gain.setValueAtTime(0, now + 0.1);
		warnGain.gain.linearRampToValueAtTime(0.15, now + 0.15);
		warnGain.gain.linearRampToValueAtTime(0, now + 0.35);
		warn.connect(warnGain);
		warnGain.connect(this.getMaster());
		warn.start(now + 0.1);
		warn.stop(now + 0.35);
	}

	private soundEmote(): void {
		const ctx = this.getContext();
		const now = ctx.currentTime;
		const osc1 = ctx.createOscillator();
		const gain1 = ctx.createGain();
		osc1.type = 'sine';
		osc1.frequency.value = 800;
		gain1.gain.setValueAtTime(0.15, now);
		gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
		osc1.connect(gain1);
		gain1.connect(this.getMaster());
		osc1.start(now);
		osc1.stop(now + 0.08);
		const osc2 = ctx.createOscillator();
		const gain2 = ctx.createGain();
		osc2.type = 'sine';
		osc2.frequency.value = 1000;
		gain2.gain.setValueAtTime(0.15, now + 0.08);
		gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
		osc2.connect(gain2);
		gain2.connect(this.getMaster());
		osc2.start(now + 0.08);
		osc2.stop(now + 0.2);
	}
}

export const proceduralAudio = new ProceduralAudio();
