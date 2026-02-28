import React, { useState, useEffect, useCallback } from 'react';
import { useFriendStore, type Friend, type FriendPresence } from '../../stores/friendStore';
import { useHiveDataStore } from '../../../data/HiveDataLayer';

function AddFriendDialog({ onAdd, onClose }: { onAdd: (name: string) => void; onClose: () => void }) {
	const [name, setName] = useState('');

	return (
		<div className="bg-gray-800/90 border border-gray-600 rounded-lg p-3 space-y-2">
			<p className="text-xs text-gray-400">Enter Hive username</p>
			<div className="flex gap-2">
				<input
					type="text"
					value={name}
					onChange={e => setName(e.target.value)}
					onKeyDown={e => { if (e.key === 'Enter' && name.trim()) onAdd(name.trim()); }}
					placeholder="@username"
					autoFocus
					className="flex-1 min-w-0 px-2 py-1 bg-gray-900 border border-gray-600 rounded text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500"
				/>
				<button
					onClick={() => { if (name.trim()) onAdd(name.trim()); }}
					disabled={!name.trim()}
					className="px-2 py-1 bg-amber-600 hover:bg-amber-500 disabled:bg-gray-700 text-white rounded text-xs font-semibold transition-colors"
				>
					Add
				</button>
				<button onClick={onClose} className="px-2 py-1 text-gray-500 hover:text-gray-300 text-xs">
					Cancel
				</button>
			</div>
		</div>
	);
}

function FriendCard({ friend, presence }: { friend: Friend; presence?: FriendPresence }) {
	const removeFriend = useFriendStore(s => s.removeFriend);
	const isOnline = presence?.online ?? false;

	return (
		<div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-800/40 group">
			<div className="flex items-center gap-2">
				<div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400 shadow-[0_0_4px_rgba(74,222,128,0.5)]' : 'bg-gray-600'}`} />
				<span className="text-sm text-gray-300">
					{friend.nickname || `@${friend.hiveUsername}`}
				</span>
			</div>
			<button
				onClick={() => removeFriend(friend.hiveUsername)}
				className="text-gray-600 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-all"
			>
				Remove
			</button>
		</div>
	);
}

export default function FriendsPanel() {
	const user = useHiveDataStore(s => s.user);
	const friends = useFriendStore(s => s.friends);
	const onlineStatus = useFriendStore(s => s.onlineStatus);
	const addFriend = useFriendStore(s => s.addFriend);
	const updatePresence = useFriendStore(s => s.updatePresence);
	const [showAdd, setShowAdd] = useState(false);
	const [expanded, setExpanded] = useState(true);

	const pollPresence = useCallback(async () => {
		if (!user || friends.length === 0) return;
		try {
			const res = await fetch('/api/friends/heartbeat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					username: user.hiveUsername,
					friends: friends.map(f => f.hiveUsername),
				}),
			});
			if (res.ok) {
				const data = await res.json();
				updatePresence(data.statuses ?? {});
			}
		} catch { /* server offline */ }
	}, [user, friends, updatePresence]);

	useEffect(() => {
		pollPresence();
		const interval = setInterval(pollPresence, 30000);
		return () => clearInterval(interval);
	}, [pollPresence]);

	const onlineFriends = friends.filter(f => onlineStatus[f.hiveUsername]?.online);
	const offlineFriends = friends.filter(f => !onlineStatus[f.hiveUsername]?.online);

	return (
		<div className="w-64 space-y-2">
			<button
				onClick={() => setExpanded(!expanded)}
				className="flex items-center justify-between w-full text-left"
			>
				<h3 className="text-xs font-bold uppercase tracking-wider text-amber-400/70">
					Friends ({friends.length})
				</h3>
				<span className="text-gray-600 text-xs">{expanded ? 'Hide' : 'Show'}</span>
			</button>

			{expanded && (
				<div className="space-y-1">
					{onlineFriends.length > 0 && (
						<>
							<p className="text-[10px] text-green-500/70 uppercase tracking-wider px-2 pt-1">Online</p>
							{onlineFriends.map(f => (
								<FriendCard key={f.hiveUsername} friend={f} presence={onlineStatus[f.hiveUsername]} />
							))}
						</>
					)}
					{offlineFriends.length > 0 && (
						<>
							<p className="text-[10px] text-gray-600 uppercase tracking-wider px-2 pt-1">Offline</p>
							{offlineFriends.map(f => (
								<FriendCard key={f.hiveUsername} friend={f} presence={onlineStatus[f.hiveUsername]} />
							))}
						</>
					)}
					{friends.length === 0 && (
						<p className="text-xs text-gray-600 px-2 py-2">No friends added yet</p>
					)}

					{showAdd ? (
						<AddFriendDialog
							onAdd={(name) => { addFriend(name); setShowAdd(false); }}
							onClose={() => setShowAdd(false)}
						/>
					) : (
						<button
							onClick={() => setShowAdd(true)}
							className="w-full px-2 py-1.5 text-xs text-gray-500 hover:text-amber-400 hover:bg-gray-800/40 rounded transition-colors text-left"
						>
							+ Add Friend
						</button>
					)}
				</div>
			)}
		</div>
	);
}
