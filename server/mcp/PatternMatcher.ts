/**
 * Pattern Matcher
 * 
 * This module provides pattern matching and detection capabilities.
 * It identifies common patterns in issues and code to aid in root cause analysis.
 */

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import RootCauseDBService from '../services/RootCauseDBService';

// Pattern metadata extracted from solutions field in the database
interface PatternMetadata {
  name: string;
  category: string;
  description: string;
  confidence: number;
  detectionPattern?: RegExp;
}

// Internal pattern definition used by the matcher
interface PatternDefinition {
  name: string;
  category: string;
  description: string;
  detectionPattern: RegExp;
  confidence: number;
}

// Match result for a detected pattern
export interface PatternMatch {
  patternName: string;
  category: string;
  description: string;
  confidence: number;
  matchedString?: string;
}

class PatternMatcher {
  // Common UI issue patterns
  private uiPatterns: PatternDefinition[] = [
    {
      name: 'Phantom Border',
      category: 'ui',
      description: 'Invisible or unexpected borders appearing around elements',
      detectionPattern: /(phantom|invisible|unexpected|strange|ghost)\s*(border|outline|edge|boundary|margin)/i,
      confidence: 0.85
    },
    {
      name: 'Z-index Issue',
      category: 'ui',
      description: 'Elements appearing behind or in front of others unexpectedly',
      detectionPattern: /(z-index|stacking|layer|behind|in front|overlapping|underneath)/i,
      confidence: 0.8
    },
    {
      name: 'CSS Specificity',
      category: 'ui',
      description: 'Styles not applying due to specificity conflicts',
      detectionPattern: /(specificity|style not applying|css not working|overridden|priority|!important)/i,
      confidence: 0.75
    },
    {
      name: 'Flexbox/Grid Layout',
      category: 'ui',
      description: 'Issues with flexbox or grid layout not behaving as expected',
      detectionPattern: /(flexbox|flex|grid|layout|alignment|justify|align)/i,
      confidence: 0.7
    },
    {
      name: 'Hover Effects',
      category: 'ui',
      description: 'Problems with hover effects or interactions',
      detectionPattern: /(hover|mouse(over|enter|leave)|pointer(-events)?|interaction)/i,
      confidence: 0.8
    },
    {
      name: 'Card Rendering',
      category: 'ui',
      description: 'Issues with card rendering or display',
      detectionPattern: /(card|rendering|display|visual|drawing|image)/i,
      confidence: 0.75
    }
  ];
  
  // Common state management patterns
  private statePatterns: PatternDefinition[] = [
    {
      name: 'State Update Timing',
      category: 'state',
      description: 'Issues with state updates not happening when expected',
      detectionPattern: /(state|update|timing|async|not updating|delayed|race condition)/i,
      confidence: 0.8
    },
    {
      name: 'Redux/Context Issues',
      category: 'state',
      description: 'Problems with Redux or Context API state management',
      detectionPattern: /(redux|context|provider|store|reducer|action|dispatch)/i,
      confidence: 0.85
    },
    {
      name: 'React Lifecycle',
      category: 'state',
      description: 'Issues related to React component lifecycle or hooks',
      detectionPattern: /(lifecycle|mount|unmount|effect|hook|useEffect|component|cleanup)/i,
      confidence: 0.75
    }
  ];
  
  // Common error patterns
  private errorPatterns: PatternDefinition[] = [
    {
      name: 'Type Error',
      category: 'error',
      description: 'Issues with TypeScript types or type checking',
      detectionPattern: /(type error|undefined is not|null is not|cannot read property|typescript|interface|type)/i,
      confidence: 0.85
    },
    {
      name: 'Async Error',
      category: 'error',
      description: 'Issues with asynchronous operations',
      detectionPattern: /(async|promise|await|then|catch|setTimeout|interval|callback)/i,
      confidence: 0.8
    },
    {
      name: 'Memory Leak',
      category: 'error',
      description: 'Memory leaks or performance degradation over time',
      detectionPattern: /(memory leak|performance|slow|degradation|over time|garbage collection)/i,
      confidence: 0.75
    }
  ];
  
  // Code patterns to look for
  private codePatterns: Record<string, RegExp> = {
    'border': /border(-[a-z]+)?:\s*[^;]+;/g,
    'outline': /outline(-[a-z]+)?:\s*[^;]+;/g,
    'z-index': /z-index:\s*[^;]+;/g,
    'pseudo-element': /::?(before|after)\s*{[^}]*}/g,
    'hover': /:hover\s*{[^}]*}/g,
    'pointer-events': /pointer-events:\s*[^;]+;/g,
    'position': /position:\s*(absolute|relative|fixed|sticky);/g,
    'box-model': /(margin|padding)(-[a-z]+)?:\s*[^;]+;/g
  };
  
  /**
   * Check if a string matches any of the patterns
   */
  public async matchIssuePatterns(issueText: string): Promise<PatternMatch[]> {
    const matches: PatternMatch[] = [];
    
    // First, try to match against known patterns from the database
    const dbPatterns = await RootCauseDBService.getPatterns();
    
    for (const dbPattern of dbPatterns) {
      try {
        const regex = new RegExp(dbPattern.pattern, 'i');
        const match = issueText.match(regex);
        
        if (match) {
          // Increment occurences in the database
          await RootCauseDBService.incrementPatternOccurrence(dbPattern.id);
          
          // Extract pattern metadata from solutions JSON
          let patternMetadata: PatternMetadata = { 
            name: 'Unknown', 
            category: 'unknown', 
            description: '', 
            confidence: 75 
          };
          try {
            if (dbPattern.solutions) {
              patternMetadata = JSON.parse(dbPattern.solutions) as PatternMetadata;
            }
          } catch (e) {
            console.warn('Failed to parse pattern solutions JSON:', e);
          }
          
          matches.push({
            patternName: patternMetadata.name || 'Unknown',
            category: patternMetadata.category || 'unknown',
            description: patternMetadata.description || '',
            confidence: (patternMetadata.confidence || 75) / 100, // Convert from percentage to decimal
            matchedString: match[0]
          });
        }
      } catch (error) {
        console.error(`Error matching pattern ${dbPattern.id}:`, error);
      }
    }
    
    // Then match against built-in patterns
    const allPatterns: PatternDefinition[] = [
      ...this.uiPatterns,
      ...this.statePatterns,
      ...this.errorPatterns
    ];
    
    for (const pattern of allPatterns) {
      const match = issueText.match(pattern.detectionPattern);
      
      if (match) {
        // Check if this pattern already matched from the database
        const existingMatch = matches.find(m => 
          m.patternName.toLowerCase() === pattern.name.toLowerCase()
        );
        
        if (!existingMatch) {
          matches.push({
            patternName: pattern.name,
            category: pattern.category,
            description: pattern.description,
            confidence: pattern.confidence,
            matchedString: match[0]
          });
          
          // Add this pattern to the database for future matching
          await this.persistPattern(pattern, match[0]);
        }
      }
    }
    
    // Sort by confidence (highest first)
    return matches.sort((a, b) => b.confidence - a.confidence);
  }
  
  /**
   * Find code patterns in the given files that might match the issue patterns
   */
  public async findCodePatterns(
    files: string[],
    patterns: PatternMatch[]
  ): Promise<Record<string, string[]>> {
    const results: Record<string, string[]> = {};
    
    for (const file of files) {
      try {
        // Skip non-existent or non-accessible files
        if (!fs.existsSync(file)) continue;
        
        // Skip binary files or very large files
        const stat = fs.statSync(file);
        if (stat.size > 1024 * 1024) continue; // Skip files larger than 1MB
        
        const content = fs.readFileSync(file, 'utf8');
        const matches: string[] = [];
        
        // Check for each code pattern
        for (const [name, regex] of Object.entries(this.codePatterns)) {
          const patternMatches = content.match(regex);
          
          if (patternMatches) {
            // Add each unique match to the results
            for (const match of patternMatches) {
              if (!matches.includes(match)) {
                matches.push(`${name}: ${match.trim()}`);
              }
            }
          }
        }
        
        // If any patterns found, add them to the results
        if (matches.length > 0) {
          results[file] = matches;
        }
      } catch (error) {
        console.error(`Error finding code patterns in file ${file}:`, error);
      }
    }
    
    return results;
  }
  
  /**
   * Save a new pattern to the database
   */
  private async persistPattern(pattern: PatternDefinition, matchedString: string): Promise<void> {
    try {
      // Check if this pattern already exists
      const existingPatterns = await RootCauseDBService.getPatterns();
      const existingPattern = existingPatterns.find(p => 
        p.pattern === pattern.detectionPattern.toString()
      );
      
      if (existingPattern) {
        // Just increment the occurrence count
        await RootCauseDBService.incrementPatternOccurrence(existingPattern.id);
      } else {
        // Create a new pattern
        const patternId = uuidv4();
        
        // Create the pattern with only the fields the DB schema expects
        await RootCauseDBService.createPattern({
          id: patternId,
          pattern: pattern.detectionPattern.toString(),
          occurrences: 1,
          firstDetected: new Date(),
          lastDetected: new Date(),
          solutions: JSON.stringify({
            name: pattern.name,
            category: pattern.category,
            description: pattern.description,
            confidence: Math.round(pattern.confidence * 100)
          })
        });
      }
    } catch (error) {
      console.error('Error persisting pattern:', error);
    }
  }
}

// Export singleton instance
const patternMatcher = new PatternMatcher();
export default patternMatcher;