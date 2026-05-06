/**
 * <MatchSetupSingle/> — synchronous wrapper for local practice matches.
 *
 * The route owns mode resolution. By the time the coordinator mounts,
 * useMatchStore.activeMatch is already an AI/practice MatchContext.
 */

import { useEffect, useState, type ReactNode } from 'react';

import { useMatchStore } from '../../store';
import type { SingleResolveArgs } from './resolver';
import { resolveSingle } from './resolver';

interface MatchSetupSingleProps extends SingleResolveArgs {
	readonly children: ReactNode;
	readonly fallback?: ReactNode;
}

export function MatchSetupSingle({
	children,
	fallback = null,
	difficulty,
	deckSource,
}: MatchSetupSingleProps) {
	const [ready, setReady] = useState(false);

	useEffect(() => {
		const ctx = resolveSingle({ difficulty, deckSource });
		useMatchStore.getState().setMatch(ctx);
		setReady(true);

		return () => {
			useMatchStore.getState().clearMatch();
		};
	}, [difficulty, deckSource]);

	if (!ready) return <>{fallback}</>;

	return <>{children}</>;
}
