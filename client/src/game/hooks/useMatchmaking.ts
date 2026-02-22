import { useEffect, useRef, useCallback } from 'react';
import { useMatchmakingStore } from '../stores/matchmakingStore';
import { usePeerStore } from '../stores/peerStore';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function useMatchmaking() {
	const { myPeerId } = usePeerStore();
	const {
		status,
		queuePosition,
		opponentPeerId,
		isHost,
		error,
		setStatus,
		setQueuePosition,
		setOpponent,
		setError,
		reset,
	} = useMatchmakingStore();

	const pollIntervalRef = useRef<number | null>(null);

	const joinQueue = useCallback(async () => {
		if (!myPeerId) {
			setError('No peer ID available');
			return;
		}

		try {
			setStatus('queued');
			setError(null);

			const response = await fetch(`${API_BASE}/api/matchmaking/queue`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ peerId: myPeerId }),
			}).catch(() => {
				throw new Error('Matchmaking service unavailable. Please use manual match.');
			});

			if (!response.ok) {
				throw new Error('Matchmaking service unavailable. Please use manual match.');
			}

			const data = await response.json();

			if (!data.success) {
				throw new Error(data.error || 'Failed to join queue');
			}

			if (data.status === 'matched') {
				setStatus('matched');
				setOpponent(data.opponentPeerId, data.isHost);
				setQueuePosition(null);
				return;
			}

			setQueuePosition(data.position || null);

			const interval = window.setInterval(async () => {
				const statusResponse = await fetch(`${API_BASE}/api/matchmaking/status/${myPeerId}`);
				const statusData = await statusResponse.json();

				if (statusData.success && statusData.status === 'matched') {
					setStatus('matched');
					setOpponent(statusData.opponentPeerId, statusData.isHost);
					setQueuePosition(null);
					if (pollIntervalRef.current) {
						clearInterval(pollIntervalRef.current);
						pollIntervalRef.current = null;
					}
				} else if (statusData.success && statusData.status === 'queued') {
					setQueuePosition(statusData.position || null);
				}
			}, 2000);

			pollIntervalRef.current = interval;
		} catch (err: any) {
			setError(err.message || 'Failed to join matchmaking queue');
			setStatus('error');
		}
	}, [myPeerId, setStatus, setError, setQueuePosition, setOpponent]);

	const leaveQueue = useCallback(async () => {
		if (!myPeerId) return;

		if (pollIntervalRef.current) {
			clearInterval(pollIntervalRef.current);
			pollIntervalRef.current = null;
		}

		try {
			await fetch(`${API_BASE}/api/matchmaking/leave`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ peerId: myPeerId }),
			});
		} catch (err) {
			console.error('[useMatchmaking] Failed to leave queue:', err);
		}

		reset();
	}, [myPeerId, reset]);

	useEffect(() => {
		return () => {
			if (pollIntervalRef.current) {
				clearInterval(pollIntervalRef.current);
			}
		};
	}, []);

	return {
		status,
		queuePosition,
		opponentPeerId,
		isHost,
		error,
		joinQueue,
		leaveQueue,
	};
}
