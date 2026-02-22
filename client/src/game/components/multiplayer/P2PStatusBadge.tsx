import { usePeerStore } from '../../stores/peerStore';

interface P2PStatusBadgeProps {
	className?: string;
}

export const P2PStatusBadge: React.FC<P2PStatusBadgeProps> = ({ className = '' }) => {
	const { connectionState, isHost } = usePeerStore();

	if (connectionState !== 'connected') return null;

	return (
		<div
			className={`p2p-status-badge ${className}`}
			title={`P2P Multiplayer — ${isHost ? 'Host' : 'Guest'}`}
			style={{
				position: 'fixed',
				top: '8px',
				right: '8px',
				zIndex: 9999,
				display: 'flex',
				alignItems: 'center',
				gap: '5px',
				background: 'rgba(0,0,0,0.75)',
				border: '1px solid rgba(74,222,128,0.5)',
				borderRadius: '20px',
				padding: '3px 10px 3px 6px',
				fontSize: '11px',
				fontWeight: 600,
				color: '#4ade80',
				backdropFilter: 'blur(4px)',
				userSelect: 'none',
				pointerEvents: 'none',
			}}
		>
			<span
				style={{
					width: 8,
					height: 8,
					borderRadius: '50%',
					background: '#4ade80',
					boxShadow: '0 0 6px #4ade80',
					flexShrink: 0,
					animation: 'pulse 2s ease-in-out infinite',
				}}
			/>
			P2P · {isHost ? 'Host' : 'Guest'}
		</div>
	);
};

export default P2PStatusBadge;
