import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { StorageKeys } from '../config/storageKeys';

declare const __BUILD_HASH__: string;

interface AssetFile {
	path: string;
	size: number;
}

interface AssetManifest {
	version: string;
	totalSize: number;
	totalFiles: number;
	files: AssetFile[];
}

const CACHE_NAME = 'ragnarok-assets-v1';
const BATCH_SIZE = 6;
const BASE = import.meta.env.BASE_URL || '/';

function toFullUrl(filePath: string): string {
	const clean = filePath.startsWith('/') ? filePath.slice(1) : filePath;
	return `${BASE}${clean}`;
}

function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
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

export { formatBytes };

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
						if (available < 350 * 1024 * 1024) {
							set({
								isDownloading: false,
								downloadError: `Not enough storage. Available: ${formatBytes(available)}. Need ~338 MB.`,
							});
							return;
						}
					}

					const manifestUrl = toFullUrl('asset-manifest.json');
					const manifestRes = await fetch(manifestUrl, { signal: controller.signal });
					if (!manifestRes.ok) throw new Error('Failed to fetch asset manifest');
					const manifest: AssetManifest = await manifestRes.json();

					set({ filesTotal: manifest.totalFiles, bytesTotal: manifest.totalSize });

					const cache = await caches.open(CACHE_NAME);

					const uncached: AssetFile[] = [];
					let alreadyCachedBytes = 0;
					let alreadyCachedFiles = 0;

					for (const file of manifest.files) {
						const url = toFullUrl(file.path);
						const match = await cache.match(url);
						if (match) {
							alreadyCachedBytes += file.size;
							alreadyCachedFiles++;
						} else {
							uncached.push(file);
						}
					}

					set({
						filesDownloaded: alreadyCachedFiles,
						bytesDownloaded: alreadyCachedBytes,
						downloadProgress: manifest.totalFiles > 0
							? Math.round((alreadyCachedFiles / manifest.totalFiles) * 100)
							: 0,
					});

					if (uncached.length === 0) {
						set({
							isDownloading: false,
							isFullyDownloaded: true,
							downloadedVersion: manifest.version,
							downloadProgress: 100,
						});
						return;
					}

					const failed: AssetFile[] = [];

					const downloadFile = async (file: AssetFile) => {
						const url = toFullUrl(file.path);
						try {
							const res = await fetch(url, { signal: controller.signal });
							if (res.ok) {
								await cache.put(url, res);
								set(state => {
									const filesDownloaded = state.filesDownloaded + 1;
									const bytesDownloaded = state.bytesDownloaded + file.size;
									return {
										filesDownloaded,
										bytesDownloaded,
										downloadProgress: Math.round((filesDownloaded / manifest.totalFiles) * 100),
									};
								});
							} else {
								failed.push(file);
							}
						} catch (err: unknown) {
							if (err instanceof Error && err.name === 'AbortError') throw err;
							failed.push(file);
						}
					};

					for (let i = 0; i < uncached.length; i += BATCH_SIZE) {
						if (controller.signal.aborted) break;
						const batch = uncached.slice(i, i + BATCH_SIZE);
						await Promise.allSettled(batch.map(downloadFile));
					}

					if (failed.length > 0 && !controller.signal.aborted) {
						const retryFailed: AssetFile[] = [];
						for (let i = 0; i < failed.length; i += BATCH_SIZE) {
							const batch = failed.slice(i, i + BATCH_SIZE);
							const results = await Promise.allSettled(batch.map(async (file) => {
								const url = toFullUrl(file.path);
								const res = await fetch(url, { signal: controller.signal });
								if (res.ok) {
									await cache.put(url, res);
									set(state => {
										const filesDownloaded = state.filesDownloaded + 1;
										const bytesDownloaded = state.bytesDownloaded + file.size;
										return {
											filesDownloaded,
											bytesDownloaded,
											downloadProgress: Math.round((filesDownloaded / manifest.totalFiles) * 100),
										};
									});
								} else {
									retryFailed.push(file);
								}
							}));
							results.forEach((r, idx) => {
								if (r.status === 'rejected' && !(r.reason?.name === 'AbortError')) {
									retryFailed.push(batch[idx]);
								}
							});
						}

						if (retryFailed.length > 0) {
							set({
								isDownloading: false,
								downloadError: `${retryFailed.length} files failed to download. Click retry.`,
							});
							return;
						}
					}

					set({
						isDownloading: false,
						isFullyDownloaded: true,
						downloadedVersion: manifest.version,
						downloadProgress: 100,
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
