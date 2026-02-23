import { create } from 'zustand';
import Peer, { DataConnection } from 'peerjs';

// 'waiting'      = host peer created, waiting for opponent to connect
// 'reconnecting' = client lost connection, attempting one auto-reconnect
export type P2PConnectionState = 'disconnected' | 'connecting' | 'waiting' | 'connected' | 'reconnecting' | 'error';

export interface PeerStore {
	myPeerId: string | null;
	remotePeerId: string | null;
	connection: DataConnection | null;
	peer: Peer | null;
	connectionState: P2PConnectionState;
	isHost: boolean;
	error: string | null;

	setMyPeerId: (id: string | null) => void;
	setRemotePeerId: (id: string | null) => void;
	setConnection: (conn: DataConnection | null) => void;
	setPeer: (peer: Peer | null) => void;
	setConnectionState: (state: P2PConnectionState) => void;
	setIsHost: (isHost: boolean) => void;
	setError: (error: string | null) => void;

	host: () => Promise<void>;
	join: (remoteId: string, isReconnect?: boolean) => Promise<void>;
	disconnect: () => void;
	send: (data: any) => void;
}

export const usePeerStore = create<PeerStore>((set, get) => ({
	myPeerId: null,
	remotePeerId: null,
	connection: null,
	peer: null,
	connectionState: 'disconnected',
	isHost: false,
	error: null,

	setMyPeerId: (id) => set({ myPeerId: id }),
	setRemotePeerId: (id) => set({ remotePeerId: id }),
	setConnection: (conn) => set({ connection: conn }),
	setPeer: (peer) => set({ peer }),
	setConnectionState: (state) => set({ connectionState: state }),
	setIsHost: (isHost) => set({ isHost }),
	setError: (error) => set({ error }),

	host: async () => {
		const { peer, disconnect } = get();
		if (peer) {
			disconnect();
		}

		set({ connectionState: 'connecting', isHost: true, error: null });

		return new Promise((resolve, reject) => {
			const newPeer = new Peer({
				host: '0.peerjs.com',
				port: 443,
				path: '/',
				secure: true,
			});

			newPeer.on('open', (id) => {
				// Peer initialized — now waiting for an opponent, NOT yet 'connected'
				set({ myPeerId: id, peer: newPeer, connectionState: 'waiting' });
				resolve();
			});

			newPeer.on('error', (err) => {
				const errorMsg = err.message || 'Failed to create peer connection';
				set({ error: errorMsg, connectionState: 'error' });
				reject(err);
			});

			newPeer.on('connection', (conn) => {
				conn.on('open', () => {
					set({ connection: conn, connectionState: 'connected', remotePeerId: conn.peer });
				});

				conn.on('error', (err) => {
					set({ error: err.message || 'Connection error', connectionState: 'error' });
				});

				// When opponent disconnects, host goes back to 'waiting' so a new opponent can join
				conn.on('close', () => {
					set({ connection: null, connectionState: 'waiting', remotePeerId: null });
				});
			});
		});
	},

	join: async (remoteId: string, isReconnect = false) => {
		const { peer, disconnect } = get();
		if (peer) {
			disconnect();
		}

		const state = isReconnect ? 'reconnecting' : 'connecting';
		set({ connectionState: state, isHost: false, remotePeerId: remoteId, error: null });

		return new Promise((resolve, reject) => {
			const newPeer = new Peer({
				host: '0.peerjs.com',
				port: 443,
				path: '/',
				secure: true,
			});

			newPeer.on('open', (id) => {
				set({ myPeerId: id, peer: newPeer });

				const conn = newPeer.connect(remoteId, {
					reliable: true,
				});

				conn.on('open', () => {
					set({ connection: conn, connectionState: 'connected' });
					resolve();
				});

				conn.on('error', (err) => {
					const errorMsg = err.message || 'Failed to connect to host';
					set({ error: errorMsg, connectionState: 'error' });
					reject(err);
				});

				conn.on('close', () => {
					const { remotePeerId } = get();
					if (!isReconnect && remotePeerId) {
						// First drop — attempt one auto-reconnect after 2 seconds
						console.warn('[PeerStore] Connection lost — attempting reconnect in 2s');
						set({ connection: null, connectionState: 'reconnecting' });
						setTimeout(() => {
							get().join(remotePeerId, true).catch(() => {
								console.error('[PeerStore] Reconnect failed');
								set({ connectionState: 'disconnected' });
							});
						}, 2000);
					} else {
						// Already tried reconnecting — give up
						set({ connection: null, connectionState: 'disconnected' });
					}
				});
			});

			newPeer.on('error', (err) => {
				const errorMsg = err.message || 'Failed to create peer connection';
				set({ error: errorMsg, connectionState: 'error' });
				reject(err);
			});
		});
	},

	disconnect: () => {
		const { connection, peer } = get();
		if (connection) {
			connection.close();
		}
		if (peer) {
			peer.destroy();
		}
		set({
			myPeerId: null,
			remotePeerId: null,
			connection: null,
			peer: null,
			connectionState: 'disconnected',
			isHost: false,
			error: null,
		});
	},

	send: (data: any) => {
		const { connection, connectionState } = get();
		if (connection && connectionState === 'connected') {
			try {
				connection.send(data);
			} catch (err) {
				console.error('[PeerStore] Failed to send data:', err);
				set({ error: 'Failed to send data' });
			}
		} else {
			console.warn('[PeerStore] Cannot send - not connected');
		}
	},
}));
