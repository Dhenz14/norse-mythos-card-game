/**
 * Root Cause Analysis Service
 * 
 * This service provides a centralized interface for performing root cause analysis
 * using the enhanced analyzer with database integration and memory tracking.
 */

import { EnhancedRootCauseAnalyzer } from '../mcp/EnhancedRootCauseAnalyzer';
import { RootCauseDBService } from './RootCauseDBService';
import { RootCauseMemoryManager } from './RootCauseMemoryManager';
import { v4 as uuidv4 } from 'uuid';

// Analysis progress stages
export enum AnalysisStage {
  INITIAL = 'initial',
  ANALYZING = 'analyzing',
  ROOT_CAUSE_IDENTIFIED = 'root_cause_identified',
  SOLUTION_PROPOSED = 'solution_proposed',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// Progress update interface
export interface AnalysisProgress {
  stage: AnalysisStage;
  details: string;
  timestamp: Date;
}

export class RootCauseAnalysisService {
  private static instance: RootCauseAnalysisService;
  private analyzer: any; // EnhancedRootCauseAnalyzer
  private dbService: any; // RootCauseDBService
  private memoryManager: any; // RootCauseMemoryManager
  private progressCallbacks: Map<string, (progress: AnalysisProgress) => void> = new Map();

  private constructor() {
    // Initialize dependencies if they exist, otherwise use mocks for now
    this.analyzer = EnhancedRootCauseAnalyzer ? new EnhancedRootCauseAnalyzer() : {
      analyzeIssue: async (issue: string) => ({
        analysis: `Mock analysis for: ${issue}`,
        patterns: [],
        relatedFiles: [],
        analysisId: uuidv4()
      })
    };
    
    this.dbService = RootCauseDBService ? RootCauseDBService.getInstance() : {
      saveAnalysis: async () => uuidv4(),
      getAnalysis: async () => null,
      getRecentAnalyses: async () => [],
      searchAnalyses: async () => []
    };
    
    this.memoryManager = RootCauseMemoryManager ? RootCauseMemoryManager.getInstance() : {
      recordIssueAnalysis: async () => {},
      getNavigationMap: async () => ({}),
      getSuggestedPaths: async () => []
    };
    
    console.log('Root Cause Analysis Service initialized');
  }

  public static getInstance(): RootCauseAnalysisService {
    if (!RootCauseAnalysisService.instance) {
      RootCauseAnalysisService.instance = new RootCauseAnalysisService();
    }
    return RootCauseAnalysisService.instance;
  }

  /**
   * Analyze a specific issue using the enhanced analyzer
   */
  public async analyzeIssue(issue: string): Promise<any> {
    try {
      console.log(`Analyzing issue: ${issue.substring(0, 50)}...`);
      
      // Run analysis
      const result = await this.analyzer.analyzeIssue(issue);
      
      // Save analysis
      const analysisId = await this.dbService.saveAnalysis({
        issue,
        result: result.analysis,
        patterns: JSON.stringify(result.patterns),
        timestamp: new Date()
      });
      
      // Record for memory/learning
      await this.memoryManager.recordIssueAnalysis(issue, result);
      
      return {
        ...result,
        analysisId
      };
    } catch (error) {
      console.error('Error analyzing issue:', error);
      throw error;
    }
  }

  /**
   * Get a previously saved analysis by ID
   */
  public async getAnalysis(analysisId: string): Promise<any> {
    try {
      return await this.dbService.getAnalysis(analysisId);
    } catch (error) {
      console.error(`Error getting analysis with ID ${analysisId}:`, error);
      throw error;
    }
  }

  /**
   * Analyze a game state with a specific issue
   */
  public async analyzeGameStateWithIssue(gameState: any, issue: string): Promise<any> {
    try {
      console.log(`Analyzing game state with issue: ${issue.substring(0, 50)}...`);
      
      // Create an enhanced issue with game state context
      const enhancedIssue = `Issue with game state: ${issue}\n\nGame State:\n${this.formatGameStateForAnalysis(gameState)}`;
      
      // Run analysis
      const result = await this.analyzer.analyzeIssue(enhancedIssue);
      
      // Save analysis
      const analysisId = await this.dbService.saveAnalysis({
        issue: enhancedIssue,
        result: result.analysis,
        patterns: JSON.stringify(result.patterns),
        gameState: JSON.stringify(gameState),
        timestamp: new Date()
      });
      
      return {
        ...result,
        analysisId,
        gameStateIncluded: true
      };
    } catch (error) {
      console.error('Error analyzing game state with issue:', error);
      throw error;
    }
  }

  /**
   * Check if an issue is related to AI game simulation
   */
  public async isGameSimulationIssue(issue: string): Promise<boolean> {
    // Define patterns that indicate a game simulation issue
    const gameSimulationPatterns = [
      /ai vs ai/i,
      /ai game simulation/i,
      /game simulation/i,
      /simulator/i,
      /visual simulation/i,
      /text simulation/i,
      /cards? not playing/i,
      /minions? not attacking/i,
      /turn order/i,
      /gameplay/i
    ];
    
    // Check if any patterns match
    return gameSimulationPatterns.some(pattern => pattern.test(issue));
  }

  /**
   * Format game state for analysis
   */
  private formatGameStateForAnalysis(gameState: any): string {
    if (!gameState) return 'No game state provided';
    
    try {
      let formatted = '';
      
      // Basic game info
      formatted += `Turn: ${gameState.turnNumber}, Current Turn: ${gameState.currentTurn}\n`;
      formatted += `Game Phase: ${gameState.gamePhase}\n\n`;
      
      // Player 1 info
      if (gameState.players?.player) {
        const player = gameState.players.player;
        formatted += `Player 1:\n`;
        formatted += `  Health: ${player.health}\n`;
        formatted += `  Mana: ${player.mana?.current || 0}/${player.mana?.max || 0}\n`;
        formatted += `  Hand: ${player.hand?.length || 0} cards\n`;
        formatted += `  Deck: ${player.deckSize || 0} cards\n`;
        formatted += `  Battlefield: ${player.battlefield?.length || 0} minions\n`;
        
        // List minions
        if (player.battlefield?.length) {
          formatted += `  Minions:\n`;
          player.battlefield.forEach((minion: any, index: number) => {
            formatted += `    ${index + 1}. ${minion.card?.name || 'Unknown'} (${minion.card?.attack || 0}/${minion.currentHealth || 0})\n`;
          });
        }
        formatted += '\n';
      }
      
      // Player 2 info
      if (gameState.players?.opponent) {
        const opponent = gameState.players.opponent;
        formatted += `Player 2:\n`;
        formatted += `  Health: ${opponent.health}\n`;
        formatted += `  Mana: ${opponent.mana?.current || 0}/${opponent.mana?.max || 0}\n`;
        formatted += `  Hand: ${opponent.hand?.length || 0} cards\n`;
        formatted += `  Deck: ${opponent.deckSize || 0} cards\n`;
        formatted += `  Battlefield: ${opponent.battlefield?.length || 0} minions\n`;
        
        // List minions
        if (opponent.battlefield?.length) {
          formatted += `  Minions:\n`;
          opponent.battlefield.forEach((minion: any, index: number) => {
            formatted += `    ${index + 1}. ${minion.card?.name || 'Unknown'} (${minion.card?.attack || 0}/${minion.currentHealth || 0})\n`;
          });
        }
      }
      
      return formatted;
    } catch (error) {
      console.error('Error formatting game state:', error);
      return `Error formatting game state: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  /**
   * Check if a command is a root cause analysis command
   */
  public isRootCauseCommand(command: string): boolean {
    const rootCausePatterns = [
      /find\s+(?:the\s+)?root\s+cause/i,
      /analyze\s+(?:the\s+)?root\s+cause/i,
      /what(?:'|\s+i)s\s+(?:the\s+)?root\s+cause/i,
      /debug\s+(?:the\s+)?issue/i,
      /troubleshoot\s+(?:the\s+)?problem/i
    ];
    
    return rootCausePatterns.some(pattern => pattern.test(command));
  }

  /**
   * Get recent analyses
   */
  public async getRecentAnalyses(limit: number = 10) {
    return this.dbService.getRecentAnalyses(limit);
  }

  /**
   * Search for analyses by issue content
   */
  public async searchAnalyses(query: string) {
    return this.dbService.searchAnalyses(query);
  }

  /**
   * Get navigation map
   */
  public async getNavigationMap() {
    return this.memoryManager.getNavigationMap();
  }

  /**
   * Get suggested paths for an issue
   */
  public async getSuggestedPaths(issue: string) {
    return this.memoryManager.getSuggestedPaths(issue);
  }
}

// Export a singleton instance
export default RootCauseAnalysisService.getInstance();