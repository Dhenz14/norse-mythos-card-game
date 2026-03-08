import { HIVE_EXPLORER_URL, HIVE_BLOCK_EXPLORER_URL } from './hiveConfig';

export function getTransactionUrl(trxId: string): string {
	return `${HIVE_EXPLORER_URL}${trxId}`;
}

export function getBlockUrl(blockNum: number): string {
	return `${HIVE_BLOCK_EXPLORER_URL}${blockNum}`;
}
