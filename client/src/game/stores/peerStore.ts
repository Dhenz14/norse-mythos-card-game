import { create } from 'zustand';
import Peer, { DataConnection } from 'peerjs';
import { debug } from '../config/debugConfig';

let reconnectTimerId: ReturnType<typeof setTimeout> | null = null;
const PEER_CONNECT_TIMEOUT_MS = 25_000; // 25s for cross-continent NAT traversal
const PEER_RETRY_DELAY_MS = 3_000;
const MAX_JOIN_RETRIES = 2;

// ICE servers for NAT traversal — critical for cross-network play
// eslint-disable-next-line no-undef
const ICE_SERVERS: RTCIceServer[] = [
	// Google STUN (free, global, reliable)
	{ urls: 'stun:stun.l.google.com:19302' },
	{ urls: 'stun:stun1.l.google.com:19302' },
	{ urls: 'stun:stun2.l.google.com:19302' },
	{ urls: 'stun:stun3.l.google.com:19302' },
	{ urls: 'stun:stun4.l.google.com:19302' },
	// Open STUN relays (fallback diversity)
	{ urls: 'stun:stun.stunprotocol.org:3478' },
	{ urls: 'stun:stun.nextcloud.com:443' },
	// Open TURN relay (metered.ca free tier — 50GB/month)
	{
		urls: ['turn:a.relay.metered.ca:80', 'turn:a.relay.metered.ca:80?transport=tcp', 'turn:a.relay.metered.ca:443', 'turns:a.relay.metered.ca:443'],
		username: 'open',
		credential: 'open',
	},
];

const PEER_CONFIG = {
	host: '0.peerjs.com',
	port: 443,
	path: '/',
	secure: true,
	config: { iceServers: ICE_SERVERS },
	debug: 0, // 0=none, 1=errors, 2=warnings, 3=all
};

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
	join: (remoteId: string, isReconnect?: boolean, _retryCount?: number) => Promise<void>;
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
			const timeoutId = setTimeout(() => {
				newPeer.destroy();
				const err = new Error('Connection timeout — check your internet connection and try again');
				set({ error: err.message, connectionState: 'error' });
				reject(err);
			}, PEER_CONNECT_TIMEOUT_MS);

			const newPeer = new Peer(PEER_CONFIG);

			newPeer.on('open', (id) => {
				clearTimeout(timeoutId);
				// Peer initialized — now waiting for an opponent, NOT yet 'connected'
				set({ myPeerId: id, peer: newPeer, connectionState: 'waiting' });
				resolve();
			});

			newPeer.on('error', (err) => {
				clearTimeout(timeoutId);
				const errorMsg = err.message || 'Failed to create peer connection';
				set({ error: errorMsg, connectionState: 'error' });
				reject(err);
			});

			newPeer.on('connection', (conn) => {
				conn.on('open', () => {
					set({ connection: conn, connectionState: 'connected', remotePeerId: conn.peer });
				});

				conn.on('error', (err) => {
					if (!get().peer) return; // Already disconnected intentionally
					set({ error: err.message || 'Connection error', connectionState: 'error' });
				});

				// When opponent disconnects, host goes back to 'waiting' so a new opponent can join
				conn.on('close', () => {
					if (!get().peer) return; // Already disconnected intentionally
					set({ connection: null, connectionState: 'waiting', remotePeerId: null });
				});
			});
		});
	},

	join: async (remoteId: string, isReconnect = false, _retryCount = 0) => {
		const { peer, disconnect } = get();
		if (peer) {
			disconnect();
		}

		const state = isReconnect ? 'reconnecting' : 'connecting';
		set({ connectionState: state, isHost: false, remotePeerId: remoteId, error: null });

		return new Promise<void>((resolve, reject) => {
			const timeoutId = setTimeout(() => {
				newPeer.destroy();
				// Retry logic: try again with backoff before giving up
				if (_retryCount < MAX_JOIN_RETRIES) {
					debug.warn(`[PeerStore] Connection attempt ${_retryCount + 1} timed out — retrying in ${PEER_RETRY_DELAY_MS / 1000}s...`);
					set({ error: null, connectionState: 'connecting' });
					setTimeout(() => {
						get().join(remoteId, isReconnect, _retryCount + 1).then(resolve).catch(reject);
					}, PEER_RETRY_DELAY_MS);
					return;
				}
				const err = new Error('Connection failed after multiple attempts. Your opponent may be behind a restrictive firewall. Try sharing the game code directly.');
				set({ error: err.message, connectionState: 'error' });
				reject(err);
			}, PEER_CONNECT_TIMEOUT_MS);

			const newPeer = new Peer(PEER_CONFIG);

			newPeer.on('open', (id) => {
				set({ myPeerId: id, peer: newPeer });
				debug.log(`[PeerStore] Peer opened: ${id}, connecting to ${remoteId}...`);

				const conn = newPeer.connect(remoteId, {
					reliable: true,
				});

				conn.on('open', () => {
					clearTimeout(timeoutId);
					debug.log(`[PeerStore] Connected to ${remoteId}`);
					set({ connection: conn, connectionState: 'connected' });
					resolve();
				});

				conn.on('error', (err) => {
					clearTimeout(timeoutId);
					if (!get().peer) return;
					const errorMsg = err.message || 'Failed to connect to host';
					set({ error: errorMsg, connectionState: 'error' });
					reject(err);
				});

				conn.on('close', () => {
					if (!get().peer) return;
					const { remotePeerId } = get();
					if (!isReconnect && remotePeerId) {
						debug.warn('[PeerStore] Connection lost — attempting reconnect in 2s');
						set({ connection: null, connectionState: 'reconnecting' });
						reconnectTimerId = setTimeout(() => {
							reconnectTimerId = null;
							const currentState = get();
							if (currentState.connectionState !== 'reconnecting' || currentState.connection) return;
							get().join(remotePeerId, true).catch(() => {
								debug.error('[PeerStore] Reconnect failed');
								set({ connectionState: 'disconnected' });
							});
						}, 2000);
					} else {
						set({ connection: null, connectionState: 'disconnected' });
					}
				});
			});

			newPeer.on('error', (err) => {
				clearTimeout(timeoutId);
				const errorMsg = err.message || 'Failed to create peer connection';
				debug.error('[PeerStore] Peer error:', errorMsg);
				set({ error: errorMsg, connectionState: 'error' });
				reject(err);
			});
		});
	},

	disconnect: () => {
		if (reconnectTimerId !== null) {
			clearTimeout(reconnectTimerId);
			reconnectTimerId = null;
		}
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
				debug.error('[PeerStore] Failed to send data:', err);
				set({ error: 'Failed to send data' });
			}
		} else {
			debug.warn('[PeerStore] Cannot send - not connected');
		}
	},
}));
