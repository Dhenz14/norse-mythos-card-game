/**
 * Search Configuration Module
 * 
 * This module manages the search configuration for the Think Tools system.
 * It provides an interface for reading and updating search settings.
 */

import fs from 'fs';
import path from 'path';

export interface SearchConfig {
  isEnabled: boolean;
  preferredEngine: string; // 'google', 'bing', 'serper', 'brave', 'fallback'
  cacheEnabled: boolean;
  apiKeys: {
    google: string;
    googleCx: string; // Google Custom Search Engine ID
    bing: string;
    serper: string;
    brave: string; // Brave Search API key
  };
}

// Path to the configuration file
const CONFIG_FILE_PATH = path.join(process.cwd(), 'data', 'searchConfig.json');

// Default configuration
const DEFAULT_CONFIG: SearchConfig = {
  isEnabled: false,
  preferredEngine: 'google',
  cacheEnabled: true,
  apiKeys: {
    google: '',
    googleCx: '',
    bing: '',
    serper: '',
    brave: ''
  }
};

/**
 * Ensure that the config directory exists
 */
function ensureConfigDirectoryExists(): void {
  const configDir = path.dirname(CONFIG_FILE_PATH);
  
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
}

/**
 * Get the current search configuration
 */
export function getSearchConfig(): SearchConfig {
  // Ensure the config directory exists
  ensureConfigDirectoryExists();
  
  // If the config file doesn't exist, create it with the default config
  if (!fs.existsSync(CONFIG_FILE_PATH)) {
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2));
    return { ...DEFAULT_CONFIG };
  }
  
  // Read the config file
  try {
    const configData = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
    const parsedConfig = JSON.parse(configData) as SearchConfig;
    
    // Merge with default to ensure all fields exist
    return {
      ...DEFAULT_CONFIG,
      ...parsedConfig,
      apiKeys: {
        ...DEFAULT_CONFIG.apiKeys,
        ...parsedConfig.apiKeys
      }
    };
  } catch (error: any) {
    console.error(`Error reading search config file: ${error.message}`);
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Update the search configuration
 */
export function updateSearchConfig(config: SearchConfig): void {
  // Ensure the config directory exists
  ensureConfigDirectoryExists();
  
  // Merge with the existing config to ensure all fields exist
  const existingConfig = getSearchConfig();
  const updatedConfig: SearchConfig = {
    ...existingConfig,
    ...config,
    apiKeys: {
      ...existingConfig.apiKeys,
      ...config.apiKeys
    }
  };
  
  // Write the updated config to the file
  try {
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(updatedConfig, null, 2));
  } catch (error: any) {
    console.error(`Error writing search config file: ${error.message}`);
  }
}

/**
 * Check if an API key is available for a specific engine
 */
export function hasApiKey(engine: keyof SearchConfig['apiKeys']): boolean {
  const config = getSearchConfig();
  return !!config.apiKeys[engine] && config.apiKeys[engine].trim() !== '';
}

/**
 * Get an API key for a specific engine
 */
export function getApiKey(engine: keyof SearchConfig['apiKeys']): string {
  const config = getSearchConfig();
  return config.apiKeys[engine] || '';
}

/**
 * Check if the search system is properly configured
 */
export function isSearchConfigured(): boolean {
  const config = getSearchConfig();
  
  // Check if the preferred engine has a valid API key
  switch (config.preferredEngine) {
    case 'google':
      return hasApiKey('google') && hasApiKey('googleCx');
    case 'bing':
      return hasApiKey('bing');
    case 'serper':
      return hasApiKey('serper');
    case 'brave':
      return hasApiKey('brave');
    case 'fallback':
      return true; // Fallback method doesn't require API keys
    default:
      return false;
  }
}

/**
 * Initialize search configuration
 */
export function initializeSearchConfig(): void {
  // Make sure the default config file exists
  if (!fs.existsSync(CONFIG_FILE_PATH)) {
    console.log('Creating default search configuration file');
    ensureConfigDirectoryExists();
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2));
  }
}