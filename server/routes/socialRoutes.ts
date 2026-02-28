import { Router, type Request, type Response } from 'express';

const router = Router();

const presenceMap = new Map<string, { peerId?: string; lastSeen: number }>();
const challenges = new Map<string, { from: string; peerId: string; timestamp: number }[]>();

const STALE_THRESHOLD = 90_000;

function pruneStale() {
	const now = Date.now();
	for (const [user, data] of presenceMap) {
		if (now - data.lastSeen > STALE_THRESHOLD) {
			presenceMap.delete(user);
		}
	}
}

router.post('/heartbeat', (req: Request, res: Response) => {
	const { username, peerId, friends } = req.body;
	if (!username || typeof username !== 'string') {
		res.status(400).json({ error: 'username required' });
		return;
	}

	pruneStale();

	presenceMap.set(username.toLowerCase(), {
		peerId,
		lastSeen: Date.now(),
	});

	const friendList = Array.isArray(friends) ? friends : [];
	const statuses: Record<string, { online: boolean; peerId?: string; lastSeen?: number }> = {};

	for (const friend of friendList) {
		const normalized = String(friend).toLowerCase();
		const presence = presenceMap.get(normalized);
		statuses[normalized] = presence
			? { online: true, peerId: presence.peerId, lastSeen: presence.lastSeen }
			: { online: false };
	}

	const pending = challenges.get(username.toLowerCase()) || [];
	challenges.delete(username.toLowerCase());

	res.json({ statuses, challenges: pending });
});

router.post('/challenge', (req: Request, res: Response) => {
	const { from, to, peerId } = req.body;
	if (!from || !to || !peerId) {
		res.status(400).json({ error: 'from, to, peerId required' });
		return;
	}

	const target = String(to).toLowerCase();
	const existing = challenges.get(target) || [];
	existing.push({ from: String(from).toLowerCase(), peerId, timestamp: Date.now() });
	challenges.set(target, existing.slice(-10));

	res.json({ ok: true });
});

router.get('/challenges/:username', (req: Request, res: Response) => {
	const username = req.params.username.toLowerCase();
	const pending = challenges.get(username) || [];
	res.json({ challenges: pending });
});

export default router;
