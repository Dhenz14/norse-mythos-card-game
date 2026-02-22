import { useState, useEffect } from 'react';
import { usePeerStore } from '../../stores/peerStore';
import { P2PProvider } from '../../context/P2PContext';
import { MultiplayerLobby } from './MultiplayerLobby';
import RagnarokChessGame from '../chess/RagnarokChessGame';
import ArmySelectionComponent from '../ArmySelection';
import { ArmySelection as ArmySelectionType } from '../../types/ChessTypes';
import { useNavigate } from 'react-router-dom';
import { routes } from '../../../lib/routes';
import { useMatchmaking } from '../../hooks/useMatchmaking';
import { Toaster } from '../../../components/ui/sonner';
import { P2PStatusBadge } from './P2PStatusBadge';

export const MultiplayerGame: React.FC = () => {
	const { connectionState } = usePeerStore();
	const [gameStarted, setGameStarted] = useState(false);
	const [armySelected, setArmySelected] = useState(false);
	const [playerArmy, setPlayerArmy] = useState<ArmySelectionType | null>(null);
	const navigate = useNavigate();
	const { status: matchmakingStatus, opponentPeerId, isHost: matchmakingIsHost, joinQueue } = useMatchmaking();
	const { host, join } = usePeerStore();

	useEffect(() => {
		if (connectionState === 'connected' && armySelected) {
			setGameStarted(true);
		}
	}, [connectionState, armySelected]);

	// Handle matchmaking completion
	useEffect(() => {
		if (matchmakingStatus === 'matched' && opponentPeerId && armySelected && !gameStarted) {
			const connectToOpponent = async () => {
				try {
					if (!matchmakingIsHost) {
						// Client connects to the host's already-running peer
						await join(opponentPeerId);
					}
					// Host already has a running peer from the initial host() call in handleMatchmakingStart
					// The client will connect to us - no action needed
				} catch (err) {
					console.error('Failed to connect to opponent:', err);
				}
			};
			connectToOpponent();
		}
	}, [matchmakingStatus, opponentPeerId, matchmakingIsHost, armySelected, gameStarted, join]);

	const handleArmyComplete = (army: ArmySelectionType) => {
		setPlayerArmy(army);
		setArmySelected(true);
	};

	const handleMatchmakingStart = async (army: ArmySelectionType) => {
		setPlayerArmy(army);
		setArmySelected(true);
		// Create peer only if ArmySelection hasn't already done so
		const { myPeerId: existingPeerId } = usePeerStore.getState();
		if (!existingPeerId) {
			try {
				await host();
			} catch (err) {
				console.error('[MultiplayerGame] Failed to initialize peer for matchmaking:', err);
				return;
			}
		}
		await joinQueue();
	};

	const handleBack = () => {
		navigate(routes.home);
	};

	if (!armySelected) {
		return (
			<ArmySelectionComponent 
				onComplete={handleArmyComplete}
				onBack={handleBack}
				isMultiplayer={true}
				onMatchmakingStart={handleMatchmakingStart}
			/>
		);
	}

	if (!gameStarted) {
		return <MultiplayerLobby onGameStart={() => setGameStarted(true)} />;
	}

	return (
		<P2PProvider>
			<Toaster position="top-right" richColors />
			<P2PStatusBadge />
			<RagnarokChessGame initialArmy={playerArmy} />
		</P2PProvider>
	);
};
