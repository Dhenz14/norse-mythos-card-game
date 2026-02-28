interface TournamentPlayer {
	username: string;
	elo: number;
	wins: number;
	losses: number;
	draws: number;
	buchholz: number;
	dropped: boolean;
}

interface TournamentMatch {
	id: string;
	round: number;
	player1: string;
	player2: string | null;
	winner: string | null;
	status: 'pending' | 'in_progress' | 'completed';
	scheduledAt: number;
	completedAt?: number;
}

interface TournamentRound {
	number: number;
	matches: TournamentMatch[];
	startedAt: number;
	completedAt?: number;
}

type TournamentFormat = 'swiss' | 'single_elimination' | 'double_elimination';
type TournamentStatus = 'registration' | 'in_progress' | 'completed' | 'cancelled';

export interface Tournament {
	id: string;
	name: string;
	format: TournamentFormat;
	status: TournamentStatus;
	maxPlayers: number;
	entryFee: number;
	prizePool: number;
	rounds: TournamentRound[];
	players: TournamentPlayer[];
	currentRound: number;
	totalRounds: number;
	createdAt: number;
	startsAt: number;
	completedAt?: number;
}

const tournaments = new Map<string, Tournament>();
let tournamentCounter = 0;
let matchCounter = 0;

function generateId(prefix: string): string {
	return `${prefix}_${Date.now()}_${++tournamentCounter}`;
}

function generateMatchId(): string {
	return `match_${Date.now()}_${++matchCounter}`;
}

function calculateTotalRounds(playerCount: number, format: TournamentFormat): number {
	if (format === 'swiss') {
		return Math.ceil(Math.log2(Math.max(playerCount, 2)));
	}
	if (format === 'single_elimination') {
		return Math.ceil(Math.log2(Math.max(playerCount, 2)));
	}
	return Math.ceil(Math.log2(Math.max(playerCount, 2))) * 2;
}

function swissPair(players: TournamentPlayer[], round: TournamentRound[]): TournamentMatch[] {
	const active = players
		.filter(p => !p.dropped)
		.sort((a, b) => {
			const aScore = a.wins * 3 + a.draws;
			const bScore = b.wins * 3 + b.draws;
			if (bScore !== aScore) return bScore - aScore;
			return b.buchholz - a.buchholz;
		});

	const matches: TournamentMatch[] = [];
	const paired = new Set<string>();

	for (let i = 0; i < active.length; i++) {
		if (paired.has(active[i].username)) continue;
		let opponent: TournamentPlayer | null = null;

		for (let j = i + 1; j < active.length; j++) {
			if (paired.has(active[j].username)) continue;
			opponent = active[j];
			paired.add(active[j].username);
			break;
		}

		paired.add(active[i].username);
		matches.push({
			id: generateMatchId(),
			round: round.length + 1,
			player1: active[i].username,
			player2: opponent?.username ?? null,
			winner: opponent ? null : active[i].username,
			status: opponent ? 'pending' : 'completed',
			scheduledAt: Date.now(),
			completedAt: opponent ? undefined : Date.now(),
		});
	}

	return matches;
}

function eliminationPair(players: TournamentPlayer[], roundNum: number): TournamentMatch[] {
	const active = players.filter(p => !p.dropped && p.losses === 0);
	const matches: TournamentMatch[] = [];

	for (let i = 0; i < active.length; i += 2) {
		const p1 = active[i];
		const p2 = active[i + 1] ?? null;
		matches.push({
			id: generateMatchId(),
			round: roundNum,
			player1: p1.username,
			player2: p2?.username ?? null,
			winner: p2 ? null : p1.username,
			status: p2 ? 'pending' : 'completed',
			scheduledAt: Date.now(),
			completedAt: p2 ? undefined : Date.now(),
		});
	}

	return matches;
}

export function createTournament(
	name: string,
	format: TournamentFormat,
	maxPlayers: number,
	entryFee: number,
	startsAt: number
): Tournament {
	const id = generateId('tourney');
	const tournament: Tournament = {
		id,
		name,
		format,
		status: 'registration',
		maxPlayers,
		entryFee,
		prizePool: 0,
		rounds: [],
		players: [],
		currentRound: 0,
		totalRounds: calculateTotalRounds(maxPlayers, format),
		createdAt: Date.now(),
		startsAt,
	};
	tournaments.set(id, tournament);
	return tournament;
}

export function registerPlayer(tournamentId: string, username: string, elo: number = 1000): Tournament | null {
	const t = tournaments.get(tournamentId);
	if (!t || t.status !== 'registration') return null;
	if (t.players.length >= t.maxPlayers) return null;
	if (t.players.some(p => p.username === username)) return null;

	t.players.push({
		username,
		elo,
		wins: 0,
		losses: 0,
		draws: 0,
		buchholz: 0,
		dropped: false,
	});
	t.prizePool += t.entryFee;
	t.totalRounds = calculateTotalRounds(t.players.length, t.format);
	return t;
}

export function startTournament(tournamentId: string): Tournament | null {
	const t = tournaments.get(tournamentId);
	if (!t || t.status !== 'registration' || t.players.length < 2) return null;

	t.status = 'in_progress';
	t.currentRound = 1;
	advanceRound(t);
	return t;
}

function advanceRound(t: Tournament): void {
	const matches = t.format === 'swiss'
		? swissPair(t.players, t.rounds)
		: eliminationPair(t.players, t.currentRound);

	const round: TournamentRound = {
		number: t.currentRound,
		matches,
		startedAt: Date.now(),
	};
	t.rounds.push(round);
}

export function reportMatchResult(tournamentId: string, matchId: string, winner: string): Tournament | null {
	const t = tournaments.get(tournamentId);
	if (!t || t.status !== 'in_progress') return null;

	const currentRound = t.rounds[t.rounds.length - 1];
	if (!currentRound) return null;

	const match = currentRound.matches.find(m => m.id === matchId);
	if (!match || match.status === 'completed') return null;

	match.winner = winner;
	match.status = 'completed';
	match.completedAt = Date.now();

	const loser = match.player1 === winner ? match.player2 : match.player1;
	const winnerPlayer = t.players.find(p => p.username === winner);
	const loserPlayer = loser ? t.players.find(p => p.username === loser) : null;

	if (winnerPlayer) winnerPlayer.wins++;
	if (loserPlayer) {
		loserPlayer.losses++;
		if (t.format !== 'swiss') loserPlayer.dropped = true;
	}

	const allCompleted = currentRound.matches.every(m => m.status === 'completed');
	if (allCompleted) {
		currentRound.completedAt = Date.now();

		if (t.format === 'swiss') {
			for (const p of t.players) {
				p.buchholz = 0;
				for (const r of t.rounds) {
					for (const m of r.matches) {
						if (m.player1 === p.username && m.player2) {
							const opp = t.players.find(x => x.username === m.player2);
							if (opp) p.buchholz += opp.wins * 3 + opp.draws;
						} else if (m.player2 === p.username) {
							const opp = t.players.find(x => x.username === m.player1);
							if (opp) p.buchholz += opp.wins * 3 + opp.draws;
						}
					}
				}
			}
		}

		const activePlayers = t.players.filter(p => !p.dropped);
		if (t.currentRound >= t.totalRounds || activePlayers.length <= 1) {
			t.status = 'completed';
			t.completedAt = Date.now();
		} else {
			t.currentRound++;
			advanceRound(t);
		}
	}

	return t;
}

export function dropPlayer(tournamentId: string, username: string): Tournament | null {
	const t = tournaments.get(tournamentId);
	if (!t) return null;
	const player = t.players.find(p => p.username === username);
	if (player) player.dropped = true;
	return t;
}

export function getTournament(id: string): Tournament | undefined {
	return tournaments.get(id);
}

export function getAllTournaments(): Tournament[] {
	return Array.from(tournaments.values()).sort((a, b) => b.createdAt - a.createdAt);
}

export function createDefaultTournaments(): void {
	if (tournaments.size > 0) return;
	const now = Date.now();
	createTournament('Ragnarok Weekly Swiss', 'swiss', 16, 0, now + 3600_000);
	createTournament('Valhalla Championship', 'single_elimination', 8, 100, now + 7200_000);
	createTournament('Odin\'s Trial', 'swiss', 32, 0, now + 86400_000);
}
