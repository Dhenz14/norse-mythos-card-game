import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

interface QueuedPlayer {
	peerId: string;
	timestamp: number;
	socket?: any;
}

const matchmakingQueue: QueuedPlayer[] = [];
const activeMatches = new Map<string, { player1: string; player2: string; createdAt: number }>();

const QUEUE_STALE_MS = 5 * 60 * 1000; // 5 minutes
const QUEUE_FILE = path.join(process.cwd(), 'data', 'matchmaking-queue.json');

function ensureDataDir() {
	const dir = path.dirname(QUEUE_FILE);
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
}

function saveQueue() {
	try {
		ensureDataDir();
		const serializable = matchmakingQueue.map(({ peerId, timestamp }) => ({ peerId, timestamp }));
		fs.writeFileSync(QUEUE_FILE, JSON.stringify(serializable), 'utf8');
	} catch (err) {
		console.warn('[Matchmaking] Failed to save queue:', err);
	}
}

function loadQueue() {
	try {
		if (!fs.existsSync(QUEUE_FILE)) return;
		const raw = fs.readFileSync(QUEUE_FILE, 'utf8');
		const entries: { peerId: string; timestamp: number }[] = JSON.parse(raw);
		const now = Date.now();
		for (const entry of entries) {
			if (now - entry.timestamp < QUEUE_STALE_MS) {
				matchmakingQueue.push(entry);
			}
		}
		if (matchmakingQueue.length > 0) {
			console.log(`[Matchmaking] Restored ${matchmakingQueue.length} queue entries from disk`);
		}
	} catch (err) {
		console.warn('[Matchmaking] Failed to load queue:', err);
	}
}

// Restore queue on startup
loadQueue();

function removeStaleQueueEntries() {
	const now = Date.now();
	const before = matchmakingQueue.length;
	for (let i = matchmakingQueue.length - 1; i >= 0; i--) {
		if (now - matchmakingQueue[i].timestamp > QUEUE_STALE_MS) {
			matchmakingQueue.splice(i, 1);
		}
	}
	if (matchmakingQueue.length < before) {
		console.log(`[Matchmaking] Removed ${before - matchmakingQueue.length} stale queue entries`);
		saveQueue();
	}
}

// Clean stale entries every 60 seconds
setInterval(removeStaleQueueEntries, 60_000);

router.post('/queue', (req: Request, res: Response) => {
	const { peerId } = req.body;

	if (!peerId || typeof peerId !== 'string') {
		return res.status(400).json({ success: false, error: 'peerId required' });
	}

	removeStaleQueueEntries();

	const existingIndex = matchmakingQueue.findIndex(p => p.peerId === peerId);
	if (existingIndex !== -1) {
		return res.json({ success: true, status: 'queued', position: existingIndex + 1 });
	}

	matchmakingQueue.push({
		peerId,
		timestamp: Date.now(),
	});

	if (matchmakingQueue.length >= 2) {
		const player1 = matchmakingQueue.shift()!;
		const player2 = matchmakingQueue.shift()!;
		saveQueue();

		const matchId = `${player1.peerId}-${player2.peerId}`;
		activeMatches.set(matchId, {
			player1: player1.peerId,
			player2: player2.peerId,
			createdAt: Date.now(),
		});

		setTimeout(() => {
			activeMatches.delete(matchId);
		}, 3600000);

		return res.json({
			success: true,
			status: 'matched',
			matchId,
			opponentPeerId: player1.peerId === peerId ? player2.peerId : player1.peerId,
			isHost: player1.peerId === peerId,
		});
	}

	saveQueue();
	return res.json({ success: true, status: 'queued', position: matchmakingQueue.length });
});

router.post('/leave', (req: Request, res: Response) => {
	const { peerId } = req.body;

	if (!peerId) {
		return res.status(400).json({ success: false, error: 'peerId required' });
	}

	const index = matchmakingQueue.findIndex(p => p.peerId === peerId);
	if (index !== -1) {
		matchmakingQueue.splice(index, 1);
		saveQueue();
	}

	return res.json({ success: true });
});

router.get('/status/:peerId', (req: Request, res: Response) => {
	const { peerId } = req.params;

	const queuePosition = matchmakingQueue.findIndex(p => p.peerId === peerId);
	if (queuePosition !== -1) {
		return res.json({
			success: true,
			status: 'queued',
			position: queuePosition + 1,
			totalInQueue: matchmakingQueue.length,
		});
	}

	for (const [matchId, match] of activeMatches.entries()) {
		if (match.player1 === peerId || match.player2 === peerId) {
			return res.json({
				success: true,
				status: 'matched',
				matchId,
				opponentPeerId: match.player1 === peerId ? match.player2 : match.player1,
				isHost: match.player1 === peerId,
			});
		}
	}

	return res.json({ success: true, status: 'not_queued' });
});

router.get('/stats', (req: Request, res: Response) => {
	res.json({
		success: true,
		queueLength: matchmakingQueue.length,
		activeMatches: activeMatches.size,
	});
});

export default router;
