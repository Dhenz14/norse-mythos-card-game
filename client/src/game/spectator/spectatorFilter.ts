import type { GameState, Player } from '../types';

function filterPlayer(player: Player): Player {
	return {
		...player,
		hand: player.hand.map(card => ({
			...card,
			name: '???',
			description: '',
			keywords: [],
		})),
		deck: [],
	};
}

export function filterGameStateForSpectator(state: GameState): GameState {
	return {
		...state,
		players: {
			player: filterPlayer(state.players.player),
			opponent: filterPlayer(state.players.opponent),
		},
	};
}
