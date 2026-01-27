/**
 * File System Navigator
 * 
 * This module provides file system navigation and search capabilities.
 * It helps find relevant files for a given issue during analysis.
 */

import fs from 'fs';
import path from 'path';
import RootCauseMemoryManager from '../services/RootCauseMemoryManager';
import FileContentCache from '../services/FileContentCache';
import FileSearchCache from '../services/FileSearchCache';

interface FileInfo {
  path: string;
  content: string;
  size: number;
  extension: string;
  lastModified: Date;
}

interface ScoredFile {
  path: string;
  score: number;
}

class FileSystemNavigator {
  private projectRoot: string;
  private excludeDirs = [
    'node_modules',
    '.git',
    'dist',
    'build',
    'coverage',
    '.cache',
    '.tmp',
    'public'
  ];
  
  constructor() {
    // Default to current directory, will be updated by findRelevantFiles
    this.projectRoot = process.cwd();
  }
  
  /**
   * Get information about a file - uses FileContentCache for faster repeated access
   */
  public getFileInfo(filePath: string): FileInfo | null {
    try {
      if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        return null;
      }
      
      // Skip binary files
      const extension = path.extname(filePath).slice(1);
      if (this.isBinaryFile(filePath, extension)) {
        const stat = fs.statSync(filePath);
        return {
          path: filePath,
          content: '[Binary file]',
          size: stat.size,
          extension,
          lastModified: stat.mtime
        };
      }
      
      // Use the cache to read file content
      const fileContent = FileContentCache.getFileContent(filePath);
      
      if (!fileContent) {
        return null;
      }
      
      return {
        path: filePath,
        content: fileContent.content,
        size: fileContent.size,
        extension: fileContent.extension,
        lastModified: fileContent.lastModified
      };
    } catch (error) {
      console.error(`Error getting file info for ${filePath}:`, error);
      return null;
    }
  }
  
  /**
   * Find files that might be relevant to the given issue
   */
  public async findRelevantFiles(issue: string): Promise<string[]> {
    try {
      // 1. Extract keywords from the issue
      const keywords = this.extractKeywords(issue);
      console.log('Extracted keywords:', keywords);
      
      // 2. Get candidate files
      const candidateFiles = await this.findCandidateFiles(keywords);
      
      // 3. Prioritize files by relevance
      const scoredFiles = this.scoreFilesByRelevance(candidateFiles, keywords, issue);
      
      // 4. Get file paths sorted by score (highest first)
      const relevantFilePaths = scoredFiles
        .sort((a, b) => b.score - a.score)
        .map(file => file.path);
      
      // Track these files in the memory manager
      for (const filePath of relevantFilePaths.slice(0, 20)) {
        await RootCauseMemoryManager.trackPath(filePath, undefined, {
          searchTerms: keywords.join(','),
          issue: issue.substring(0, 100) + (issue.length > 100 ? '...' : '')
        });
      }
      
      return relevantFilePaths;
    } catch (error) {
      console.error('Error finding relevant files:', error);
      return [];
    }
  }
  
  /**
   * Extract keywords from an issue description
   */
  private extractKeywords(issue: string): string[] {
    // Remove common words and code-specific symbols
    const cleanIssue = issue
      .toLowerCase()
      .replace(/\b(the|a|an|is|in|on|to|for|of|with|by|at|from|it|and|or|this|that|but|not|be)\b/g, '')
      .replace(/[\(\)\[\]\{\}\<\>\=\+\-\*\/\&\|\^\%\$\#\@\!\?\,\.\;\:\'\"]/g, ' ')
      .trim();
    
    // Split by whitespace and filter out empty strings
    let words = cleanIssue.split(/\s+/).filter(word => word.length > 0);
    
    // Filter out common programming words if they appear too frequently
    const commonProgrammingWords = [
      'function', 'var', 'let', 'const', 'if', 'else', 'while', 'for', 'return',
      'class', 'interface', 'type', 'import', 'export', 'default', 'as',
      'public', 'private', 'protected', 'static', 'get', 'set', 'async', 'await',
      'true', 'false', 'null', 'undefined', 'NaN', 'Infinity'
    ];
    
    const wordFrequency: Record<string, number> = {};
    for (const word of words) {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    }
    
    // Filter out common programming words if they appear too frequently
    words = words.filter(word => {
      if (commonProgrammingWords.includes(word) && wordFrequency[word] > 3) {
        return false;
      }
      return true;
    });
    
    // Deduplicate keywords
    return [...new Set(words)];
  }
  
  /**
   * Find candidate files that might be relevant - uses FileSearchCache for performance
   */
  private async findCandidateFiles(keywords: string[]): Promise<string[]> {
    if (keywords.length === 0) {
      return [];
    }
    
    const excludeDirPattern = this.excludeDirs.map(dir => `**/${dir}/**`).join(',');
    const pattern = '**/*.{js,jsx,ts,tsx,css,scss,html,md,json,yaml,yml}';
    
    try {
      // Use the file search cache to find files (this will handle caching automatically)
      const files = await FileSearchCache.searchFiles(
        pattern,
        excludeDirPattern,
        {
          cwd: this.projectRoot,
          absolute: true
        }
      );
      
      // Log cache performance periodically
      if (Math.random() < 0.1) { // Log about 10% of the time
        const stats = FileSearchCache.getStats();
        console.log(`FileSearchCache stats - Hit rate: ${(stats.hitRate * 100).toFixed(1)}%, Cache size: ${stats.cacheSize}`);
        
        const contentCacheStats = FileContentCache.getStats();
        console.log(`FileContentCache stats - Hit rate: ${(contentCacheStats.hitRate * 100).toFixed(1)}%, Cache size: ${contentCacheStats.size}`);
      }
      
      return files;
    } catch (error) {
      console.error('Error finding candidate files:', error);
      return [];
    }
  }
  
  /**
   * Score files by relevance to the issue and keywords
   */
  private scoreFilesByRelevance(
    files: string[],
    keywords: string[],
    issue: string
  ): ScoredFile[] {
    return files.map(filePath => {
      // Initialize with a small score to ensure some order
      let score = 0.1;
      
      try {
        // Skip if file doesn't exist or is too large
        const stat = fs.statSync(filePath);
        if (stat.size > 1024 * 1024) { // Skip files larger than 1MB
          return { path: filePath, score };
        }
        
        const fileInfo = this.getFileInfo(filePath);
        if (!fileInfo || fileInfo.content === '[Binary file]') {
          return { path: filePath, score };
        }
        
        // Score based on file path matching keywords
        const filePathLower = filePath.toLowerCase();
        for (const keyword of keywords) {
          if (filePathLower.includes(keyword.toLowerCase())) {
            score += 5; // Higher score for path matches
          }
        }
        
        // Score based on content matching keywords
        const contentLower = fileInfo.content.toLowerCase();
        for (const keyword of keywords) {
          const keywordLower = keyword.toLowerCase();
          const matches = contentLower.split(keywordLower).length - 1;
          score += Math.min(matches, 10) * 0.5; // Cap at 5 points per keyword
        }
        
        // Bonus for recently modified files
        const ageInDays = (Date.now() - fileInfo.lastModified.getTime()) / (1000 * 60 * 60 * 24);
        if (ageInDays < 7) { // Modified in the last week
          score += (7 - ageInDays) * 0.2; // Up to 1.4 points
        }
        
        // Bonus for certain file types that are likely to contain relevant code
        const extension = path.extname(filePath).slice(1).toLowerCase();
        if (['ts', 'tsx', 'js', 'jsx'].includes(extension)) {
          score += 2; // Bonus for code files
        }
        
        return { path: filePath, score };
      } catch (error) {
        console.error(`Error scoring file ${filePath}:`, error);
        return { path: filePath, score: 0 };
      }
    }).filter(file => file.score > 0.1); // Only return files with some relevance
  }
  
  /**
   * Check if a file is likely a binary file
   */
  private isBinaryFile(filePath: string, extension: string): boolean {
    // Check by extension
    const binaryExtensions = [
      'jpg', 'jpeg', 'png', 'gif', 'bmp', 'ico', 'svg',
      'mp3', 'mp4', 'wav', 'ogg', 'webm',
      'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
      'zip', 'rar', 'tar', 'gz', '7z',
      'exe', 'dll', 'so', 'dylib',
      'ttf', 'otf', 'woff', 'woff2',
      'bin', 'dat'
    ];
    
    if (binaryExtensions.includes(extension.toLowerCase())) {
      return true;
    }
    
    // Check file size
    try {
      const stat = fs.statSync(filePath);
      if (stat.size > 5 * 1024 * 1024) { // Files larger than 5MB
        return true;
      }
    } catch (error) {
      return true;
    }
    
    return false;
  }
}

// Export singleton instance
const fileSystemNavigator = new FileSystemNavigator();
export default fileSystemNavigator;