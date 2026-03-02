import { GameState } from '../types';

export function checkPetEvolutionTrigger(state: GameState, trigger: string, minionId?: string): GameState {
	for (const side of ['player', 'opponent'] as const) {
		for (const minion of state.players[side].battlefield) {
			if (minion.petEvolutionMet) continue;
			const cond = (minion.card as any).evolutionCondition;
			if (!cond || cond.trigger !== trigger) continue;
			if (minionId && minion.instanceId !== minionId) continue;
			minion.petEvolutionMet = true;
		}
	}
	return state;
}
