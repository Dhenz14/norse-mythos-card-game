import { CombatPhase, PokerPosition } from '../../types/PokerCombatTypes';

export interface ActivePlayerContext {
  playerPosition: PokerPosition;
  playerId: string;
  opponentId: string;
}

export function getSmallBlindPlayerId(ctx: ActivePlayerContext): string {
  return ctx.playerPosition === 'small_blind' ? ctx.playerId : ctx.opponentId;
}

export function getBigBlindPlayerId(ctx: ActivePlayerContext): string {
  return ctx.playerPosition === 'big_blind' ? ctx.playerId : ctx.opponentId;
}

export function getActivePlayerForPhase(
  phase: CombatPhase,
  ctx: ActivePlayerContext
): string | null {
  switch (phase) {
    case CombatPhase.SPELL_PET:
    case CombatPhase.FAITH:
      return getSmallBlindPlayerId(ctx);
      
    case CombatPhase.FORESIGHT:
    case CombatPhase.DESTINY:
      return getBigBlindPlayerId(ctx);
      
    case CombatPhase.MULLIGAN:
    case CombatPhase.FIRST_STRIKE:
    case CombatPhase.RESOLUTION:
    default:
      return null;
  }
}

export function isBettingPhase(phase: CombatPhase): boolean {
  return phase === CombatPhase.SPELL_PET ||
         phase === CombatPhase.FAITH ||
         phase === CombatPhase.FORESIGHT ||
         phase === CombatPhase.DESTINY;
}

export function validateActivePlayer(
  phase: CombatPhase,
  activePlayerId: string | null,
  source: string
): void {
  if (isBettingPhase(phase) && activePlayerId === null) {
    console.error(
      `[POKER BUG] activePlayerId is null during betting phase ${phase} at ${source}. ` +
      `This will cause buttons to freeze. Check phase transition logic.`
    );
  }
}
