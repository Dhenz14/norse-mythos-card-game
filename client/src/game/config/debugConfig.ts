/**
 * Debug configuration for the game
 * Controls logging verbosity and debug features
 */

interface DebugConfig {
  enableLogging: boolean;
  enableVerboseLogging: boolean;
  enablePerformanceLogging: boolean;
  logCardOperations: boolean;
  logManaOperations: boolean;
  logGameState: boolean;
  logAIDecisions: boolean;
  logBattlefieldChanges: boolean;
}

const debugConfig: DebugConfig = {
  enableLogging: process.env.NODE_ENV === 'development',
  enableVerboseLogging: false,
  enablePerformanceLogging: false,
  logCardOperations: process.env.NODE_ENV === 'development',
  logManaOperations: process.env.NODE_ENV === 'development',
  logGameState: false,
  logAIDecisions: process.env.NODE_ENV === 'development',
  logBattlefieldChanges: false,
};

export const debug = {
  log: (...args: any[]) => {
    if (debugConfig.enableLogging) {
      console.log(...args);
    }
  },
  verbose: (...args: any[]) => {
    if (debugConfig.enableVerboseLogging) {
      console.log('[VERBOSE]', ...args);
    }
  },
  card: (...args: any[]) => {
    if (debugConfig.logCardOperations) {
      console.log('[CARD]', ...args);
    }
  },
  mana: (...args: any[]) => {
    if (debugConfig.logManaOperations) {
      console.log('[MANA]', ...args);
    }
  },
  state: (...args: any[]) => {
    if (debugConfig.logGameState) {
      console.log('[STATE]', ...args);
    }
  },
  ai: (...args: any[]) => {
    if (debugConfig.logAIDecisions) {
      console.log('[AI]', ...args);
    }
  },
  error: (...args: any[]) => {
    console.error(...args);
  },
  warn: (...args: any[]) => {
    console.warn(...args);
  }
};

let _isAISimulation = false;

export const setAISimulationMode = (value: boolean): void => {
  _isAISimulation = value;
};

export const isAISimulationMode = (): boolean => {
  if (_isAISimulation) return true;
  if (typeof window === 'undefined') return false;
  try {
    return window.location.pathname.includes('ai') || 
           window.location.href.includes('ai-game');
  } catch {
    return false;
  }
};

export const setDebugOption = (option: keyof DebugConfig, value: boolean) => {
  debugConfig[option] = value;
};

export const getDebugConfig = () => ({ ...debugConfig });

export default debugConfig;
