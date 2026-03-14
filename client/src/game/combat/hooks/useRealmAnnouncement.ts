import { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore';

export function useRealmAnnouncement() {
	const activeRealmId = useGameStore(state => state.gameState?.activeRealm?.id);
	const activeRealmName = useGameStore(state => state.gameState?.activeRealm?.name);
	const [realmAnnouncement, setRealmAnnouncement] = useState<string | null>(null);
	const prevRealmRef = useRef<string | undefined>(undefined);

	useEffect(() => {
		if (activeRealmId && activeRealmId !== prevRealmRef.current) {
			const isShift = prevRealmRef.current !== undefined;
			prevRealmRef.current = activeRealmId;
			if (isShift) {
				setRealmAnnouncement(activeRealmName || activeRealmId);
				const timer = setTimeout(() => setRealmAnnouncement(null), 2500);
				return () => clearTimeout(timer);
			}
		} else if (!activeRealmId && prevRealmRef.current) {
			prevRealmRef.current = undefined;
		}
		return undefined;
	}, [activeRealmId, activeRealmName]);

	const realmClass = activeRealmId ? `realm-${activeRealmId}` : 'realm-midgard';

	return { realmAnnouncement, realmClass, activeRealmId, activeRealmName };
}
