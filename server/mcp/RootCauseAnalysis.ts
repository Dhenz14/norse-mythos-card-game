/**
 * Root Cause Analysis
 * 
 * This module provides deep analysis of issues to find their root causes.
 * It uses a recursive approach to drill down into potential causes.
 */

import FileSystemNavigator from './FileSystemNavigator';
import PatternMatcher from './PatternMatcher';
import RootCauseMemoryManager from '../services/RootCauseMemoryManager';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

class RootCauseAnalysis {
  /**
   * Perform a deep analysis to find the root cause of an issue
   */
  public async findRootCause(issue: string): Promise<string> {
    console.log(`Starting root cause analysis for: ${issue.substring(0, 50)}...`);
    
    // Step 1: Find patterns in the issue description
    const patterns = await PatternMatcher.matchIssuePatterns(issue);
    console.log(`Found ${patterns.length} patterns`);
    
    // Step 2: Find relevant files
    const relevantFiles = await FileSystemNavigator.findRelevantFiles(issue);
    console.log(`Found ${relevantFiles.length} relevant files`);
    
    // Step 3: Filter to most relevant files based on patterns
    const filteredFiles = this.filterFilesByPatterns(relevantFiles, patterns);
    console.log(`Filtered to ${filteredFiles.length} most relevant files`);
    
    // Step 4: Find code patterns in relevant files
    const codePatterns = await PatternMatcher.findCodePatterns(
      filteredFiles, 
      patterns
    );
    
    // Step 5: Generate the analysis
    const analysis = this.generateAnalysis(issue, patterns, filteredFiles, codePatterns);
    
    return analysis;
  }
  
  /**
   * Filter files to find the most relevant ones based on patterns
   */
  private filterFilesByPatterns(
    files: string[], 
    patterns: any[]
  ): string[] {
    // If there are no patterns or files, return as is
    if (patterns.length === 0 || files.length === 0) {
      return files;
    }
    
    // Score files based on pattern relevance
    const scoredFiles = files.map(file => {
      let score = 0;
      
      // Get file extension
      const ext = path.extname(file).slice(1).toLowerCase();
      
      // Prioritize by file type based on patterns
      for (const pattern of patterns) {
        // UI patterns prioritize CSS and component files
        if (pattern.category === 'ui' && ['css', 'scss', 'tsx', 'jsx'].includes(ext)) {
          score += 5;
        }
        
        // Database patterns prioritize schema and migration files
        if (pattern.category === 'database' && 
            (file.includes('schema') || file.includes('migration') || 
             file.includes('model') || ext === 'sql')) {
          score += 5;
        }
        
        // API patterns prioritize route and controller files
        if (pattern.category === 'api' && 
            (file.includes('route') || file.includes('controller') || 
             file.includes('api') || file.includes('service'))) {
          score += 5;
        }
        
        // State patterns prioritize store/reducer files
        if (pattern.category === 'state' && 
            (file.includes('store') || file.includes('reducer') || 
             file.includes('context') || file.includes('provider'))) {
          score += 5;
        }
      }
      
      // Additional scoring rules
      if (file.includes('test') || file.includes('spec')) {
        score -= 2; // Reduce priority of test files
      }
      
      if (file.includes('util') || file.includes('helper')) {
        score += 1; // Slight boost for utility files
      }
      
      return { file, score };
    });
    
    // Sort by score (descending) and return top files
    return scoredFiles
      .sort((a, b) => b.score - a.score)
      .map(item => item.file)
      .slice(0, 25); // Return top 25 files
  }
  
  /**
   * Generate the full analysis report
   */
  private generateAnalysis(
    issue: string, 
    patterns: any[], 
    relevantFiles: string[],
    codePatterns: Record<string, string[]>
  ): string {
    let analysis = '';
    
    // Add overview
    analysis += `# Root Cause Analysis: ${issue.split('\n')[0]}\n\n`;
    analysis += `## Overview\n\n`;
    analysis += `Issue: ${issue}\n\n`;
    
    // Add patterns section
    if (patterns.length > 0) {
      analysis += `Detected patterns:\n`;
      patterns.forEach((pattern, index) => {
        analysis += `${index + 1}. **${pattern.patternName}** (${(pattern.confidence * 100).toFixed(0)}% confidence)\n`;
        analysis += `   ${pattern.description}\n`;
        if (pattern.matchedString) {
          analysis += `   Matched text: "${pattern.matchedString}"\n`;
        }
        analysis += '\n';
      });
    } else {
      analysis += `No specific patterns detected. Proceeding with general analysis.\n\n`;
    }
    
    // Add investigation paths
    analysis += `## Investigation Paths\n\n`;
    
    // Generate investigation paths based on patterns
    if (patterns.length > 0) {
      patterns.forEach((pattern, index) => {
        analysis += `### Path ${index + 1}: ${pattern.patternName}\n\n`;
        
        analysis += `Based on the "${pattern.patternName}" pattern, we should investigate:\n\n`;
        
        // Add category-specific advice
        if (pattern.category === 'ui') {
          analysis += `- CSS specificity issues and conflicting styles\n`;
          analysis += `- Component rendering and DOM structure\n`;
          analysis += `- Z-index stacking context issues\n`;
          
          if (pattern.patternName.toLowerCase().includes('phantom')) {
            analysis += `- Unwanted borders or outlines from CSS\n`;
            analysis += `- Pseudo-elements (::before, ::after) adding visual elements\n`;
            analysis += `- Browser-specific rendering issues\n`;
          }
        } else if (pattern.category === 'database') {
          analysis += `- Database connection configuration\n`;
          analysis += `- SQL query syntax and constraints\n`;
          analysis += `- Data schema or migration issues\n`;
        } else if (pattern.category === 'api') {
          analysis += `- API endpoint definitions and handlers\n`;
          analysis += `- Request/response formatting\n`;
          analysis += `- Error handling in API calls\n`;
        } else if (pattern.category === 'state') {
          analysis += `- State management (Redux, Context, etc.)\n`;
          analysis += `- State update timing and async operations\n`;
          analysis += `- Component lifecycle and effect hooks\n`;
        } else if (pattern.category === 'error') {
          analysis += `- Exception handling and error boundaries\n`;
          analysis += `- Null/undefined checking\n`;
          analysis += `- Type validation and conversion\n`;
        } else if (pattern.category === 'performance') {
          analysis += `- Resource leaks and cleanup\n`;
          analysis += `- Render optimization and memoization\n`;
          analysis += `- Expensive operations and calculations\n`;
        }
        
        analysis += '\n';
      });
    } else {
      analysis += `Without clear patterns, we'll need to investigate multiple areas:\n\n`;
      analysis += `- Front-end UI rendering and styling\n`;
      analysis += `- State management and data flow\n`;
      analysis += `- API integration and data fetching\n`;
      analysis += `- Core business logic\n\n`;
    }
    
    // Add deep analysis section
    analysis += `## Deep Analysis\n\n`;
    
    // If we detected the "phantom borders" pattern, add specific analysis
    const phantomBorderPattern = patterns.find(p => 
      p.patternName.toLowerCase().includes('phantom') && 
      p.patternName.toLowerCase().includes('border')
    );
    
    if (phantomBorderPattern) {
      analysis += `### Phantom Border Analysis\n\n`;
      analysis += `Phantom borders often occur due to the following reasons:\n\n`;
      analysis += `1. **CSS Box Model Issues**: Unexpected margins, paddings, or borders are applied to elements\n`;
      analysis += `2. **Pseudo-elements**: ::before or ::after pseudo-elements with borders or backgrounds\n`;
      analysis += `3. **Z-index Stacking**: Elements with different z-index values showing through each other\n`;
      analysis += `4. **Outline Properties**: CSS outline property applied unintentionally\n`;
      analysis += `5. **Transparent Borders**: Border with partial transparency or only certain sides\n\n`;
      
      // Add specific recommendations based on codebase findings
      if (Object.keys(codePatterns).length > 0) {
        analysis += `Based on the codebase analysis, the phantom borders might be coming from:\n\n`;
        
        let hasAddedFile = false;
        for (const [file, matches] of Object.entries(codePatterns)) {
          if (matches.some(match => 
            match.includes('border') || 
            match.includes('outline') || 
            match.includes('::before') || 
            match.includes('::after')
          )) {
            hasAddedFile = true;
            analysis += `- **${path.basename(file)}**:\n`;
            matches.filter(match => 
              match.includes('border') || 
              match.includes('outline') || 
              match.includes('::before') || 
              match.includes('::after')
            ).forEach(match => {
              analysis += `  - ${match}\n`;
            });
            analysis += '\n';
          }
        }
        
        if (!hasAddedFile) {
          analysis += `No direct border-related code was found in the analyzed files. `;
          analysis += `The issue might be in a common CSS file or a library component.\n\n`;
        }
      }
      
      // Add recommendations
      analysis += `**Recommended Fixes for Phantom Borders:**\n\n`;
      analysis += `1. **Inspect Element**: Use browser developer tools to inspect the elements showing phantom borders\n`;
      analysis += `2. **CSS Debug**: Add temporary outline colors to identify the source\n`;
      analysis += `3. **Box Model Fix**: Add \`box-sizing: border-box\` to relevant components\n`;
      analysis += `4. **Reset Styles**: Ensure CSS reset is properly applied\n`;
      analysis += `5. **Z-index Management**: Review z-index hierarchy in components\n\n`;
    }
    
    // Add code patterns section
    if (Object.keys(codePatterns).length > 0) {
      analysis += `### Code Pattern Analysis\n\n`;
      analysis += `Found the following code patterns that may relate to the issue:\n\n`;
      
      for (const [file, matches] of Object.entries(codePatterns)) {
        analysis += `**${path.basename(file)}:**\n`;
        matches.forEach(match => {
          analysis += `- ${match}\n`;
        });
        analysis += '\n';
      }
    }
    
    // Add root cause conclusion
    analysis += `## Root Cause Identification\n\n`;
    
    if (phantomBorderPattern) {
      analysis += `Based on the analysis, the most likely root cause of the phantom borders is:\n\n`;
      
      // See if we can identify a specific root cause from code patterns
      let specificCause = false;
      for (const [file, matches] of Object.entries(codePatterns)) {
        if (matches.some(match => match.includes('::before') || match.includes('::after'))) {
          analysis += `**Pseudo-elements creating visual artifacts**. The ::before or ::after pseudo-elements in ${path.basename(file)} are likely creating the appearance of phantom borders.\n\n`;
          specificCause = true;
          break;
        } else if (matches.some(match => match.includes('outline'))) {
          analysis += `**Unintended outline properties**. There are outline CSS properties in ${path.basename(file)} that may be creating the phantom borders.\n\n`;
          specificCause = true;
          break;
        } else if (matches.some(match => match.includes('border'))) {
          analysis += `**Unexpected border properties**. There are border CSS properties in ${path.basename(file)} that may be creating the phantom borders.\n\n`;
          specificCause = true;
          break;
        }
      }
      
      if (!specificCause) {
        analysis += `**CSS Box Model/Stacking Context Issues**. Without a clear direct cause in the code, the issue is likely related to complex CSS interactions such as unexpected box model behavior or z-index stacking context problems.\n\n`;
      }
    } else if (patterns.length > 0) {
      // For other types of issues, provide a generalized root cause
      const topPattern = patterns[0];
      
      analysis += `Based on the "${topPattern.patternName}" pattern and code analysis, the most likely root cause is:\n\n`;
      
      if (topPattern.category === 'ui') {
        analysis += `**UI Rendering Issue**: Components are either rendering incorrectly or have CSS conflicts causing visual artifacts.\n\n`;
      } else if (topPattern.category === 'state') {
        analysis += `**State Management Problem**: The application state is not being handled correctly, leading to inconsistent UI or behavior.\n\n`;
      } else if (topPattern.category === 'api') {
        analysis += `**API Integration Issue**: Data is not being fetched or processed correctly from the API.\n\n`;
      } else if (topPattern.category === 'error') {
        analysis += `**Error Handling Gap**: The application is not properly handling exceptions or edge cases.\n\n`;
      } else if (topPattern.category === 'performance') {
        analysis += `**Performance Bottleneck**: There are inefficient operations or resource leaks causing performance degradation.\n\n`;
      } else {
        analysis += `**${topPattern.patternName}**: ${topPattern.description}\n\n`;
      }
    } else {
      analysis += `Without clear patterns, the root cause is likely a combination of factors or a complex interaction between components. A systematic investigation is needed, focusing on the most recent changes to the codebase.\n\n`;
    }
    
    // Add recommended fixes
    analysis += `## Recommended Fixes\n\n`;
    
    if (phantomBorderPattern) {
      analysis += `To fix the phantom borders issue:\n\n`;
      
      // Based on specific findings
      let hasSpecificFix = false;
      for (const [file, matches] of Object.entries(codePatterns)) {
        if (matches.some(match => match.includes('::before') || match.includes('::after'))) {
          analysis += `1. Review the ::before and ::after pseudo-elements in ${path.basename(file)} and ensure they're not creating unwanted visual artifacts.\n`;
          analysis += `2. Check if these pseudo-elements need borders or if they can be removed/modified.\n`;
          analysis += `3. Add \`content: ''\` to ensure pseudo-elements render as expected.\n`;
          hasSpecificFix = true;
          break;
        } else if (matches.some(match => match.includes('outline'))) {
          analysis += `1. Check the outline properties in ${path.basename(file)} and consider setting \`outline: none\` where appropriate.\n`;
          analysis += `2. If outlines are needed for accessibility, use a more visible color or style.\n`;
          hasSpecificFix = true;
          break;
        } else if (matches.some(match => match.includes('border'))) {
          analysis += `1. Review the border properties in ${path.basename(file)} and ensure they're only applied where needed.\n`;
          analysis += `2. Consider using \`box-shadow\` instead of borders for subtle effects.\n`;
          hasSpecificFix = true;
          break;
        }
      }
      
      if (!hasSpecificFix) {
        analysis += `1. Add a global CSS rule to the problematic components to explicitly set \`border: none\` and \`outline: none\`.\n`;
        analysis += `2. Use browser developer tools to inspect the elements with phantom borders and identify the CSS properties causing them.\n`;
        analysis += `3. Add \`box-sizing: border-box\` to ensure consistent box model behavior.\n`;
        analysis += `4. Check z-index values and stacking contexts to ensure elements aren't showing through each other.\n`;
      }
      
      analysis += `\nAdditionally, implement a comprehensive CSS solution that addresses the root cause rather than just applying quick fixes. Consider using a CSS-in-JS solution or CSS Modules to prevent style leakage between components.\n`;
    } else if (patterns.length > 0) {
      // For other types of issues, provide generalized fixes
      const topPattern = patterns[0];
      
      if (topPattern.category === 'ui') {
        analysis += `1. Review component rendering and CSS specificity issues.\n`;
        analysis += `2. Ensure styles aren't conflicting or cascading unexpectedly.\n`;
        analysis += `3. Check for browser-specific rendering differences.\n`;
        analysis += `4. Consider using more isolated styling approaches like CSS Modules or styled-components.\n`;
      } else if (topPattern.category === 'state') {
        analysis += `1. Review state update logic and ensure it's consistent.\n`;
        analysis += `2. Check for race conditions in asynchronous operations.\n`;
        analysis += `3. Implement proper error handling and loading states.\n`;
        analysis += `4. Consider using a state management library like Redux or Zustand for complex state.\n`;
      } else if (topPattern.category === 'api') {
        analysis += `1. Verify API endpoints and request formats.\n`;
        analysis += `2. Add proper error handling for API calls.\n`;
        analysis += `3. Implement request/response validation.\n`;
        analysis += `4. Add retry logic for transient failures.\n`;
      } else if (topPattern.category === 'error') {
        analysis += `1. Add comprehensive error handling with clear user feedback.\n`;
        analysis += `2. Implement null/undefined checks before property access.\n`;
        analysis += `3. Add error boundaries to prevent entire app crashes.\n`;
        analysis += `4. Improve logging for better debugging.\n`;
      } else if (topPattern.category === 'performance') {
        analysis += `1. Identify and optimize expensive operations.\n`;
        analysis += `2. Add proper resource cleanup in useEffect hooks.\n`;
        analysis += `3. Implement memoization for expensive calculations.\n`;
        analysis += `4. Review render optimizations like React.memo or useMemo.\n`;
      }
    } else {
      analysis += `Without a clear root cause, try these general approaches:\n\n`;
      analysis += `1. Review recent changes to the codebase that might have introduced the issue.\n`;
      analysis += `2. Implement additional logging to better understand the problem.\n`;
      analysis += `3. Create a minimal reproduction of the issue to isolate the cause.\n`;
      analysis += `4. Use browser developer tools to inspect the UI and network activity.\n`;
    }
    
    return analysis;
  }
}

// Export singleton instance
const rootCauseAnalysis = new RootCauseAnalysis();
export default rootCauseAnalysis;