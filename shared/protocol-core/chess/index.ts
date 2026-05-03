/**
 * Public surface of the portable chess rule predicates.
 * See `chessRules.ts` for the contract.
 */
export {
	getValidMoves,
	getThreateningPieces,
	isKingInCheck,
	isCheckmate,
	checkPawnPromotion,
	checkWinCondition
} from './chessRules';
export type { ValidMoves } from './chessRules';
