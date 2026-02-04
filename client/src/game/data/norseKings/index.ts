/**
 * Norse Kings Module
 * 
 * Exports all King-related data and utilities.
 */

export * from './kingDefinitions';

import { NORSE_KINGS, getKingById, getAllKings, KING_LIST } from './kingDefinitions';
import { NorseKing } from '../../types/NorseTypes';

export { NORSE_KINGS, getKingById, getAllKings, KING_LIST };

export const KING_COUNT = Object.keys(NORSE_KINGS).length;

/**
 * @deprecated Kings do not have elements. This function is kept for backwards compatibility.
 * Always returns an empty array.
 */
export function getKingsByElement(element: string): NorseKing[] {
  console.warn('[getKingsByElement] Kings do not have elements. This function is deprecated.');
  return [];
}

export function validateAllKingsExist(): boolean {
  const expectedKings = 9;
  const actualKings = KING_LIST.length;
  
  if (actualKings !== expectedKings) {
    console.warn(`[VALIDATION] Expected ${expectedKings} Kings, found ${actualKings}`);
    return false;
  }
  
  console.log(`[VALIDATION] All ${actualKings} Kings validated successfully`);
  return true;
}
