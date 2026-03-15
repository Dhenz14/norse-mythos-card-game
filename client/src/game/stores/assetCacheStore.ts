import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { StorageKeys } from '../config/storageKeys';

declare const __BUILD_HASH__: string;

interface PackInfo {
	name: string;
	fileCount: number;
	uncompressedSize: number;
	compressedSize: number;
	files: string[];
}

interface PackManifest {
	version: string;
	packs: PackInfo[];
	totalFiles: number;
	totalSize: number;
}

const CACHE_NAME = 'ragnarok-assets-v2';
const BASE = import.meta.env.BASE_URL || '/';

function toFullUrl(filePath: string): string {
	const clean = filePath.startsWith('/') ? filePath.slice(1) : filePath;
	return new URL(`${BASE}${clean}`, window.location.origin).href;
}

export function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function getExtMimeType(path: string): string {
	const ext = path.split('.').pop()?.toLowerCase();
	switch (ext) {
		case 'webp': return 'image/webp';
		case 'png': return 'image/png';
		case 'jpg': case 'jpeg': return 'image/jpeg';
		case 'gif': return 'image/gif';
		case 'svg': return 'image/svg+xml';
		case 'mp3': return 'audio/mpeg';
		case 'ogg': return 'audio/ogg';
		case 'wav': return 'audio/wav';
		default: return 'application/octet-stream';
	}
}

interface AssetCacheState {
	downloadedVersion: string | null;
	isFullyDownloaded: boolean;
	isDownloading: boolean;
	downloadProgress: number;
	filesDownloaded: number;
	filesTotal: number;
	bytesDownloaded: number;
	bytesTotal: number;
	downloadError: string | null;
}

interface AssetCacheActions {
	startDownload: () => Promise<void>;
	cancelDownload: () => void;
	clearCache: () => Promise<void>;
}

let abortController: AbortController | null = null;

export const useAssetCacheStore = create<AssetCacheState & AssetCacheActions>()(
	persist(
		(set, get) => ({
			downloadedVersion: null,
			isFullyDownloaded: false,
			isDownloading: false,
			downloadProgress: 0,
			filesDownloaded: 0,
			filesTotal: 0,
			bytesDownloaded: 0,
			bytesTotal: 0,
			downloadError: null,

			startDownload: async () => {
				if (get().isDownloading) return;

				const controller = new AbortController();
				abortController = controller;
				set({
					isDownloading: true,
					downloadError: null,
					downloadProgress: 0,
					filesDownloaded: 0,
					bytesDownloaded: 0,
				});

				try {
					if (navigator.storage?.persist) {
						await navigator.storage.persist();
					}

					if (navigator.storage?.estimate) {
						const { quota = 0, usage = 0 } = await navigator.storage.estimate();
						const available = quota - usage;
						if (available < 300 * 1024 * 1024) {
							set({
								isDownloading: false,
								downloadError: `Not enough storage. Available: ${formatBytes(available)}. Need ~256 MB.`,
							});
							return;
						}
					}

					const manifestUrl = toFullUrl('packs/manifest.json');
					const manifestRes = await fetch(manifestUrl, { signal: controller.signal });
					if (!manifestRes.ok) throw new Error('Failed to fetch pack manifest');
					const manifest: PackManifest = await manifestRes.json();

					const totalCompressed = manifest.packs.reduce((s, p) => s + p.compressedSize, 0);
					set({
						filesTotal: manifest.totalFiles,
						bytesTotal: totalCompressed,
					});

					const cache = await caches.open(CACHE_NAME);

					const { unzipSync } = await import('fflate');

					let totalFilesExtracted = 0;
					let totalBytesDownloaded = 0;

					for (let i = 0; i < manifest.packs.length; i++) {
						if (controller.signal.aborted) break;

						const pack = manifest.packs[i];
						const packUrl = toFullUrl(`packs/${pack.name}`);

						const packRes = await fetch(packUrl, { signal: controller.signal });
						if (!packRes.ok) throw new Error(`Failed to download ${pack.name}: ${packRes.status}`);

						const reader = packRes.body?.getReader();
						if (!reader) throw new Error('ReadableStream not supported');

						const chunks: Uint8Array[] = [];
						let packBytes = 0;

						while (true) {
							const { done, value } = await reader.read();
							if (done) break;
							chunks.push(value);
							packBytes += value.length;
							totalBytesDownloaded += value.length;
							set({
								bytesDownloaded: totalBytesDownloaded,
								downloadProgress: Math.round((totalBytesDownloaded / totalCompressed) * 90),
							});
						}

						const zipBuffer = new Uint8Array(packBytes);
						let offset = 0;
						for (const chunk of chunks) {
							zipBuffer.set(chunk, offset);
							offset += chunk.length;
						}

						const extracted = unzipSync(zipBuffer);

						for (const [filePath, fileData] of Object.entries(extracted)) {
							const normalizedPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
							const url = toFullUrl(normalizedPath);
							const mimeType = getExtMimeType(normalizedPath);
							const response = new Response(fileData, {
								headers: {
									'Content-Type': mimeType,
									'Content-Length': fileData.length.toString(),
								},
							});
							await cache.put(new Request(url), response);
							totalFilesExtracted++;
						}

						set({
							filesDownloaded: totalFilesExtracted,
							downloadProgress: 90 + Math.round(((i + 1) / manifest.packs.length) * 10),
						});
					}

					set({
						isDownloading: false,
						isFullyDownloaded: true,
						downloadedVersion: manifest.version,
						downloadProgress: 100,
						filesDownloaded: totalFilesExtracted,
					});
				} catch (err: unknown) {
					if (err instanceof Error && err.name === 'AbortError') {
						set({ isDownloading: false, downloadError: null });
					} else {
						set({
							isDownloading: false,
							downloadError: err instanceof Error ? err.message : 'Download failed',
						});
					}
				} finally {
					abortController = null;
				}
			},

			cancelDownload: () => {
				abortController?.abort();
				set({ isDownloading: false, downloadError: null });
			},

			clearCache: async () => {
				await caches.delete(CACHE_NAME);
				set({
					downloadedVersion: null,
					isFullyDownloaded: false,
					isDownloading: false,
					downloadProgress: 0,
					filesDownloaded: 0,
					filesTotal: 0,
					bytesDownloaded: 0,
					bytesTotal: 0,
					downloadError: null,
				});
			},
		}),
		{
			name: StorageKeys.ASSET_CACHE,
			partialize: (state) => ({
				downloadedVersion: state.downloadedVersion,
				isFullyDownloaded: state.isFullyDownloaded,
			}),
		}
	)
);
