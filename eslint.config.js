import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

function trimGlobals(...sources) {
	const merged = {};
	for (const src of sources) {
		for (const [key, val] of Object.entries(src)) {
			merged[key.trim()] = val;
		}
	}
	return merged;
}

// ─── Layer contract ───────────────────────────────────────────────────────────
// game/stores/ and game/core/ are pure logic — they cannot reach into the UI
// layer (components/). UI feedback must flow through GameEventBus so the visual
// widget can be swapped without touching game logic (e.g. future LOL-style banners).
//
// shared/ is the portable protocol-core layer: it must stay free of any
// client/-only imports so the rule predicates can be reused by P2P validators
// and a future server-side checker.
// ─────────────────────────────────────────────────────────────────────────────
const layerContractRules = [
	{
		files: [
			'client/src/game/stores/**/*.{ts,tsx}',
			'client/src/game/core/**/*.{ts,tsx}',
		],
		rules: {
			'no-restricted-imports': ['error', {
				patterns: [
					{
						group: ['**/components/**', '@/game/components/**'],
						message:
							'game/stores and game/core cannot import from components/. ' +
							'For UI feedback emit GameEventBus.emitNotification() — ' +
							'the NotificationSubscriber routes it to the active banner.',
					},
				],
			}],
		},
	},
	{
		files: ['shared/**/*.{ts,tsx}'],
		rules: {
			'no-restricted-imports': ['error', {
				patterns: [
					{
						group: ['@/*', '@/**', '**/client/**'],
						message:
							'shared/ cannot import from client/ — it must stay portable for ' +
							'P2P / server-side consumers. Move the type or constant into ' +
							'shared/protocol-core/ and import it from there.',
					},
				],
			}],
		},
	},
];

export default [
	js.configs.recommended,
	...layerContractRules,
	{
		ignores: [
			'node_modules/**',
			'dist/**',
			'assembly/**',
			'client/public/**',
			'mcp-server/**',
			'.vscode/**',
			'scripts/**',
			'**/*.d.ts',
			'**/*.{js,cjs,mjs}',
		],
	},
	{
		files: ['**/*.{ts,tsx}'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				ecmaFeatures: { jsx: true },
				ecmaVersion: 'latest',
				sourceType: 'module',
			},
			globals: {
				...trimGlobals(globals.browser, globals.node, globals.es2017),
				structuredClone: 'readonly',
				EventListener: 'readonly',
				React: 'readonly',
				JSX: 'readonly',
				NodeJS: 'readonly',
			},
		},
		plugins: {
			'@typescript-eslint': tsPlugin,
			react: reactPlugin,
			'react-hooks': reactHooks,
		},
		rules: {
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': ['warn', {
				argsIgnorePattern: '^_',
				caughtErrorsIgnorePattern: '^_',
				varsIgnorePattern: '^_',
			}],
			'no-console': 'warn',
			'react/prop-types': 'off',
			'react/react-in-jsx-scope': 'off',
			'@typescript-eslint/no-explicit-any': 'warn',
			'complexity': ['warn', 15],
			'camelcase': ['error', { properties: 'never', allow: ['^card_', '^effect_'] }],
			'no-param-reassign': ['warn', { props: true, ignorePropertyModificationsFor: ['state', 'context', 'player', 'opponent'] }],
			'no-empty': 'warn',
			'no-case-declarations': 'warn',
			...reactHooks.configs.recommended.rules,
		},
		settings: {
			react: { version: 'detect' },
		},
	},
];
