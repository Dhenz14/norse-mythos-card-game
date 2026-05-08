import type { AttackCommand, EndTurnCommand, PlayCardCommand, UseHeroPowerCommand } from '../core/commands';

export type WireGameCommand = PlayCardCommand | AttackCommand | EndTurnCommand | UseHeroPowerCommand;

export interface GameCommandEnvelope {
	type: 'game_command';
	matchId: string;
	seq: number;
	commandId: string;
	prevStateHash: string;
	command: WireGameCommand;
}
