import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ArmySelection from '../ArmySelection';
import { useWarbandStore } from '../../../lib/stores/useWarbandStore';
import { routes } from '../../../lib/routes';
import type { ArmySelection as ArmySelectionType } from '../../types/ChessTypes';
import { useHeroDeckStore } from '../../stores/heroDeckStore';
import { buildWarbandLoadout } from '../../deck/heroDeckRules';
import { getNFTBridge } from '../../nft';
import { cardRegistry } from '../../data/cardRegistry';

function buildReadyLoadout(army: ArmySelectionType) {
	const nftBridge = getNFTBridge();
	return buildWarbandLoadout(
		army,
		useHeroDeckStore.getState().decks,
		{
			getCardById: (cardId) => cardRegistry.find(card => Number(card.id) === cardId),
			getOwnedCopies: (cardId) => nftBridge.getOwnedCopies(cardId),
			enforceOwnership: nftBridge.isHiveMode(),
		},
	);
}

const WarbandPage: React.FC = () => {
	const navigate = useNavigate();
	const setWarband = useWarbandStore((s) => s.setWarband);

	const handleComplete = useCallback(
		(army: ArmySelectionType) => {
			const loadout = buildReadyLoadout(army);
			if (loadout.kind !== 'ready') return;
			setWarband(army, loadout.deckCardIds, loadout.deckCardIdsByPiece);
			navigate(routes.singleGame);
		},
		[setWarband, navigate]
	);

	const handleQuickStart = useCallback(
		(army: ArmySelectionType, deckCardIds: number[]) => {
			setWarband(army, deckCardIds);
			navigate(routes.singleGame);
		},
		[setWarband, navigate]
	);

	const handleBack = useCallback(() => {
		navigate(routes.home);
	}, [navigate]);

	return (
		<ArmySelection
			onComplete={handleComplete}
			onQuickStart={handleQuickStart}
			onBack={handleBack}
		/>
	);
};

export default WarbandPage;
