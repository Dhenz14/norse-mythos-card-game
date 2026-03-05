import { Router, type Request, type Response } from 'express';
import {
	createTournament,
	registerPlayer,
	startTournament,
	reportMatchResult,
	dropPlayer,
	getTournament,
	getAllTournaments,
	createDefaultTournaments,
} from '../services/tournamentManager';
import { verifyHiveAuth, isValidHiveUsername, isTimestampFresh } from '../services/hiveAuth';

const router = Router();

createDefaultTournaments();

router.get('/', (_req: Request, res: Response) => {
	const tournaments = getAllTournaments().map(t => ({
		id: t.id,
		name: t.name,
		format: t.format,
		status: t.status,
		playerCount: t.players.length,
		maxPlayers: t.maxPlayers,
		entryFee: t.entryFee,
		prizePool: t.prizePool,
		startsAt: t.startsAt,
	}));
	res.json({ tournaments });
});

router.get('/:id', (req: Request, res: Response) => {
	const tournament = getTournament(req.params.id);
	if (!tournament) {
		res.status(404).json({ error: 'Tournament not found' });
		return;
	}
	res.json({ tournament });
});

router.post('/', (req: Request, res: Response) => {
	const { name, format, maxPlayers, entryFee, startsAt } = req.body;
	if (!name || !format) {
		res.status(400).json({ error: 'name and format required' });
		return;
	}
	const tournament = createTournament(
		name,
		format,
		maxPlayers || 16,
		entryFee || 0,
		startsAt || Date.now() + 3600_000
	);
	res.json({ tournament });
});

router.post('/:id/register', async (req: Request, res: Response) => {
	const { username, elo, signature, timestamp } = req.body;
	if (!username || typeof username !== 'string') {
		res.status(400).json({ error: 'username required' });
		return;
	}
	if (!isValidHiveUsername(username)) {
		res.status(400).json({ error: 'Invalid Hive username format' });
		return;
	}
	if (!signature || !timestamp) {
		res.status(401).json({ error: 'Hive signature required' });
		return;
	}
	if (!isTimestampFresh(timestamp)) {
		res.status(401).json({ error: 'Timestamp expired' });
		return;
	}
	const message = `ragnarok-tournament-register:${username}:${req.params.id}:${timestamp}`;
	const authResult = await verifyHiveAuth(username, message, signature);
	if (!authResult.valid) {
		const status = authResult.error === 'network_error' ? 503 : 401;
		res.status(status).json({ error: authResult.error === 'network_error' ? 'Auth service unavailable' : 'Invalid Hive signature' });
		return;
	}
	const tournament = registerPlayer(req.params.id, username, elo);
	if (!tournament) {
		res.status(400).json({ error: 'Cannot register' });
		return;
	}
	res.json({ tournament });
});

router.post('/:id/start', (req: Request, res: Response) => {
	const tournament = startTournament(req.params.id);
	if (!tournament) {
		res.status(400).json({ error: 'Cannot start tournament' });
		return;
	}
	res.json({ tournament });
});

router.post('/:id/result', async (req: Request, res: Response) => {
	const { matchId, winner, signature, timestamp } = req.body;
	if (!matchId || !winner) {
		res.status(400).json({ error: 'matchId and winner required' });
		return;
	}
	if (typeof winner !== 'string' || !isValidHiveUsername(winner)) {
		res.status(400).json({ error: 'Invalid winner username format' });
		return;
	}
	if (!signature || !timestamp) {
		res.status(401).json({ error: 'Hive signature required' });
		return;
	}
	if (!isTimestampFresh(timestamp)) {
		res.status(401).json({ error: 'Timestamp expired' });
		return;
	}
	const message = `ragnarok-tournament-result:${winner}:${req.params.id}:${matchId}:${timestamp}`;
	const authResult = await verifyHiveAuth(winner, message, signature);
	if (!authResult.valid) {
		const status = authResult.error === 'network_error' ? 503 : 401;
		res.status(status).json({ error: authResult.error === 'network_error' ? 'Auth service unavailable' : 'Invalid Hive signature' });
		return;
	}
	const tournament = reportMatchResult(req.params.id, matchId, winner);
	if (!tournament) {
		res.status(400).json({ error: 'Cannot report result' });
		return;
	}
	res.json({ tournament });
});

router.post('/:id/drop', async (req: Request, res: Response) => {
	const { username, signature, timestamp } = req.body;
	if (!username || typeof username !== 'string') {
		res.status(400).json({ error: 'username required' });
		return;
	}
	if (!isValidHiveUsername(username)) {
		res.status(400).json({ error: 'Invalid Hive username format' });
		return;
	}
	if (!signature || !timestamp) {
		res.status(401).json({ error: 'Hive signature required' });
		return;
	}
	if (!isTimestampFresh(timestamp)) {
		res.status(401).json({ error: 'Timestamp expired' });
		return;
	}
	const message = `ragnarok-tournament-drop:${username}:${req.params.id}:${timestamp}`;
	const authResult = await verifyHiveAuth(username, message, signature);
	if (!authResult.valid) {
		const status = authResult.error === 'network_error' ? 503 : 401;
		res.status(status).json({ error: authResult.error === 'network_error' ? 'Auth service unavailable' : 'Invalid Hive signature' });
		return;
	}
	const tournament = dropPlayer(req.params.id, username);
	if (!tournament) {
		res.status(400).json({ error: 'Cannot drop player' });
		return;
	}
	res.json({ tournament });
});

export default router;
