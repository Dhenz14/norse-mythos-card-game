/**
 * Opponent army builder for campaign mode (scripted opponent).
 *
 * Wraps the existing `buildCampaignArmy` (which knew how to compose a
 * mission's hand-authored army from chapter defaults) under a
 * ScriptedOpponent-typed signature. Today only `campaign-mission`
 * scripts exist; future tutorial / puzzle variants will need their
 * own branches here (or their own mode dir).
 */

import { buildCampaignArmy as legacyBuildCampaignArmy } from '../../../campaign/campaignArmyBuilder';
import type { ArmySelection } from '../../../types/ChessTypes';
import type { ScriptedOpponent } from '../../types';

export function buildCampaignOpponentArmy(opponent: ScriptedOpponent): ArmySelection {
	return legacyBuildCampaignArmy(opponent.script.mission);
}
