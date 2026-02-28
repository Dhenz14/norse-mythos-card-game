import React, { useState } from 'react';
import { useCraftingStore } from '../../crafting/craftingStore';
import { getDustValue, getCraftCost } from '../../crafting/craftingConstants';

interface CraftingPanelProps {
	cardName: string;
	cardRarity: string;
	owned: boolean;
	onDisenchant?: () => void;
	onCraft?: () => void;
}

export default function CraftingPanel({ cardName, cardRarity, owned, onDisenchant, onCraft }: CraftingPanelProps) {
	const dust = useCraftingStore(s => s.dust);
	const addDust = useCraftingStore(s => s.addDust);
	const spendDust = useCraftingStore(s => s.spendDust);
	const [showConfirm, setShowConfirm] = useState<'craft' | 'disenchant' | null>(null);

	const dustValue = getDustValue(cardRarity);
	const craftCost = getCraftCost(cardRarity);
	const canCraft = dust >= craftCost && craftCost > 0;

	const handleDisenchant = () => {
		addDust(dustValue);
		onDisenchant?.();
		setShowConfirm(null);
	};

	const handleCraft = () => {
		if (spendDust(craftCost)) {
			onCraft?.();
		}
		setShowConfirm(null);
	};

	return (
		<div className="bg-gray-900/80 border border-gray-700/50 rounded-lg p-4 space-y-3">
			<div className="flex items-center justify-between">
				<span className="text-sm font-semibold text-gray-200">{cardName}</span>
				<div className="flex items-center gap-1">
					<span className="text-xs text-blue-400 font-bold">{dust}</span>
					<span className="text-xs text-gray-500">Dust</span>
				</div>
			</div>

			{showConfirm ? (
				<div className="space-y-2">
					<p className="text-xs text-gray-400">
						{showConfirm === 'disenchant'
							? `Disenchant ${cardName} for ${dustValue} dust?`
							: `Craft ${cardName} for ${craftCost} dust?`
						}
					</p>
					<div className="flex gap-2">
						<button
							onClick={showConfirm === 'disenchant' ? handleDisenchant : handleCraft}
							className="flex-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold transition-colors"
						>
							Confirm
						</button>
						<button
							onClick={() => setShowConfirm(null)}
							className="flex-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs transition-colors"
						>
							Cancel
						</button>
					</div>
				</div>
			) : (
				<div className="flex gap-2">
					{owned && dustValue > 0 && (
						<button
							onClick={() => setShowConfirm('disenchant')}
							className="flex-1 px-3 py-1.5 bg-red-900/50 hover:bg-red-800/60 text-red-300 rounded text-xs font-medium border border-red-700/40 transition-colors"
						>
							Disenchant ({dustValue})
						</button>
					)}
					{!owned && craftCost > 0 && (
						<button
							onClick={() => canCraft && setShowConfirm('craft')}
							disabled={!canCraft}
							className="flex-1 px-3 py-1.5 bg-blue-900/50 hover:bg-blue-800/60 disabled:bg-gray-800/40 disabled:text-gray-600 text-blue-300 rounded text-xs font-medium border border-blue-700/40 transition-colors"
						>
							Craft ({craftCost})
						</button>
					)}
				</div>
			)}
		</div>
	);
}
