import { useEffect, useRef, useState } from 'react';
import Peer, { DataConnection } from 'peerjs';
import type { GameState } from '../types';

export type SpectatorStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export function useSpectatorSync(hostPeerId: string | null) {
	const [gameState, setGameState] = useState<GameState | null>(null);
	const [status, setStatus] = useState<SpectatorStatus>('disconnected');
	const [error, setError] = useState<string | null>(null);
	const peerRef = useRef<Peer | null>(null);
	const connRef = useRef<DataConnection | null>(null);

	useEffect(() => {
		if (!hostPeerId) return;

		setStatus('connecting');
		setError(null);

		const peer = new Peer({ host: '0.peerjs.com', port: 443, secure: true });
		peerRef.current = peer;

		peer.on('open', () => {
			const conn = peer.connect(hostPeerId, { metadata: { type: 'spectator' } });
			connRef.current = conn;

			conn.on('open', () => {
				setStatus('connected');
				conn.send({ type: 'spectator_join' });
			});

			conn.on('data', (data: any) => {
				if (data && data.type === 'spectator_state' && data.gameState) {
					setGameState(data.gameState);
				}
			});

			conn.on('close', () => {
				setStatus('disconnected');
			});

			conn.on('error', (err) => {
				setError(err.message || 'Connection error');
				setStatus('error');
			});
		});

		peer.on('error', (err) => {
			setError(err.message || 'Peer error');
			setStatus('error');
		});

		return () => {
			connRef.current?.close();
			peer.destroy();
			peerRef.current = null;
			connRef.current = null;
		};
	}, [hostPeerId]);

	return { gameState, status, error };
}
