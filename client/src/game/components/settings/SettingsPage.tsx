import React from 'react';
import { Link } from 'react-router-dom';
import { routes } from '../../../lib/routes';
import SettingsPanel from './SettingsPanel';

export default function SettingsPage() {
	return (
		<div className="min-h-screen bg-gray-950 text-white">
			<div className="max-w-2xl mx-auto px-4 py-8">
				<div className="flex items-center justify-between mb-8">
					<h1 className="text-3xl font-bold text-amber-400 tracking-wide">Settings</h1>
					<Link
						to={routes.home}
						className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm border border-gray-700 transition-colors"
					>
						Back to Menu
					</Link>
				</div>

				<div className="bg-gray-900/60 border border-gray-800/60 rounded-xl p-6">
					<SettingsPanel />
				</div>
			</div>
		</div>
	);
}
