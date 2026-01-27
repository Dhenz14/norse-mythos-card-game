/**
 * Deep Root Cause Analyzer
 * 
 * This module implements a deep recursive root cause analysis system that
 * continuously investigates issues, treating each finding as a clue to dig deeper
 * until it reaches the fundamental underlying causes.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * Interface for an investigation finding
 */
export interface Finding {
  id: string;
  description: string;
  evidence: string[];
  confidence: number; // 0-100
  type: 'symptom' | 'cause' | 'root-cause';
  relatedCode?: string;
  location?: string;
  potentialCauses?: Finding[];
  validatedCauses?: Finding[];
}

/**
 * Interface for analysis options
 */
export interface AnalysisOptions {
  maxDepth?: number;
  focusArea?: string;
  includeCode?: boolean;
  confidenceThreshold?: number;
}

/**
 * Interface for the analysis result
 */
export interface AnalysisResult {
  initialIssue: string;
  rootCauses: Finding[];
  investigationPath: Finding[];
  confidence: number;
  suggestedFixes: string[];
}

/**
 * Class implementing the Deep Root Cause Analyzer
 */
export class RootCauseAnalyzer {
  private codebaseDir: string;
  private patternDatabase: Map<string, RegExp[]>;
  private issueHistory: Map<string, Finding[]>;
  
  /**
   * Create a new instance of the Root Cause Analyzer
   */
  constructor() {
    this.codebaseDir = process.cwd();
    this.patternDatabase = this.initializePatternDatabase();
    this.issueHistory = new Map();
  }
  
  /**
   * Initialize the pattern database with common issue patterns
   */
  private initializePatternDatabase(): Map<string, RegExp[]> {
    const patterns = new Map<string, RegExp[]>();
    
    // Dependency conflicts
    patterns.set('dependency-conflict', [
      /Cannot find module '(.+?)'/i,
      /Duplicate declaration "(.+?)"/i,
      /Version conflict for package "(.+?)"/i
    ]);
    
    // Race conditions
    patterns.set('race-condition', [
      /Unexpected state in async operation/i,
      /Data changed between read and write/i,
      /Concurrent modification/i
    ]);
    
    // Memory leaks
    patterns.set('memory-leak', [
      /Memory usage exceeded/i,
      /Resource not released/i,
      /Listener not removed/i
    ]);
    
    // API misuse
    patterns.set('api-misuse', [
      /Invalid parameter for function "(.+?)"/i,
      /Method "(.+?)" called with invalid context/i,
      /Expected "(.+?)" but got "(.+?)"/i
    ]);
    
    // Data integrity
    patterns.set('data-integrity', [
      /Invalid data format/i,
      /Data corruption detected/i,
      /Integrity check failed/i
    ]);
    
    // Architectural issues
    patterns.set('architectural', [
      /Circular dependency detected/i,
      /Too many dependencies for module "(.+?)"/i,
      /Tight coupling between "(.+?)" and "(.+?)"/i
    ]);
    
    // HTTP status code patterns
    patterns.set('http-issues', [
      /(\d{3}) (in \d+ms)/i,
      /GET \/api\/(.+?) (\d{3})/i,
      /POST \/api\/(.+?) (\d{3})/i
    ]);
    
    // CloudinaryAPI specific patterns
    patterns.set('cloudinary-api', [
      /cloudinary\/card\/(\d+)/i,
      /url":"https:\/\/res\.cloudinary\.com/i
    ]);
    
    // Cache issues 
    patterns.set('cache-issues', [
      /304 in \d+ms/i,
      /200 in \d+ms .* 304 in \d+ms/i
    ]);
    
    return patterns;
  }
  
  /**
   * Analyze an issue to find its deep root causes
   * 
   * @param issue The issue to analyze
   * @param options Analysis options
   * @returns The analysis result
   */
  public async analyzeIssue(issue: string, options: AnalysisOptions = {}): Promise<AnalysisResult> {
    const maxDepth = options.maxDepth || 5;
    const confidenceThreshold = options.confidenceThreshold || 70;
    
    const initialFinding: Finding = {
      id: this.generateId(),
      description: issue,
      evidence: ['User reported issue'],
      confidence: 100,
      type: 'symptom'
    };
    
    const issueStack: Finding[] = [initialFinding];
    const rootCauses: Finding[] = [];
    const investigationPath: Finding[] = [];
    
    // Start the recursive investigation
    while (issueStack.length > 0) {
      const currentIssue = issueStack.pop()!;
      investigationPath.push(currentIssue);
      
      // Check if we've reached the maximum depth
      const currentDepth = this.calculateDepth(currentIssue, investigationPath);
      if (currentDepth >= maxDepth) {
        rootCauses.push({
          ...currentIssue,
          type: 'root-cause'
        });
        continue;
      }
      
      // Generate potential causes
      const potentialCauses = await this.generatePotentialCauses(currentIssue);
      currentIssue.potentialCauses = potentialCauses;
      
      // Investigate each potential cause
      const validCauses = await this.investigateCauses(potentialCauses, confidenceThreshold);
      currentIssue.validatedCauses = validCauses;
      
      if (validCauses.length === 0) {
        // No deeper causes found, this is a root cause
        rootCauses.push({
          ...currentIssue,
          type: 'root-cause'
        });
      } else {
        // Add valid causes to the stack for further investigation
        for (const cause of validCauses) {
          issueStack.push(cause);
        }
      }
    }
    
    // Generate suggested fixes based on the root causes
    const suggestedFixes = this.generateSuggestedFixes(rootCauses);
    
    // Calculate overall confidence
    const overallConfidence = this.calculateOverallConfidence(rootCauses);
    
    return {
      initialIssue: issue,
      rootCauses,
      investigationPath,
      confidence: overallConfidence,
      suggestedFixes
    };
  }
  
  /**
   * Calculate the depth of an issue in the investigation path
   */
  private calculateDepth(issue: Finding, path: Finding[]): number {
    let depth = 0;
    let current: Finding | undefined = issue;
    
    while (current) {
      depth++;
      
      // Find the parent of the current issue
      const parent = path.find(p => 
        p.validatedCauses?.some(c => c.id === current?.id)
      );
      
      current = parent;
    }
    
    return depth;
  }
  
  /**
   * Generate potential causes for an issue
   */
  private async generatePotentialCauses(issue: Finding): Promise<Finding[]> {
    const potentialCauses: Finding[] = [];
    
    // Step 1: Search for clues in error messages
    const errorPatternCauses = this.findCausesFromErrorPatterns(issue);
    potentialCauses.push(...errorPatternCauses);
    
    // Step 2: Search for code-related causes
    if (issue.relatedCode) {
      const codeAnalysisCauses = this.findCausesFromCodeAnalysis(issue);
      potentialCauses.push(...codeAnalysisCauses);
    }
    
    // Step 3: Search for log-related patterns
    const logPatternCauses = await this.findCausesFromLogs(issue);
    potentialCauses.push(...logPatternCauses);
    
    // Step 4: Search for architectural causes
    const architecturalCauses = this.findArchitecturalCauses(issue);
    potentialCauses.push(...architecturalCauses);
    
    // Step 5: Search for dependency-related causes
    const dependencyCauses = this.findDependencyCauses(issue);
    potentialCauses.push(...dependencyCauses);
    
    // Deduplicate causes
    const uniqueCauses = this.deduplicateFindings(potentialCauses);
    
    return uniqueCauses;
  }
  
  /**
   * Find causes based on error patterns
   */
  private findCausesFromErrorPatterns(issue: Finding): Finding[] {
    const causes: Finding[] = [];
    
    for (const [patternType, regexList] of this.patternDatabase.entries()) {
      for (const regex of regexList) {
        // Check in the issue description
        const descriptionMatch = issue.description.match(regex);
        if (descriptionMatch) {
          causes.push({
            id: this.generateId(),
            description: `Detected ${patternType} pattern: ${descriptionMatch[0]}`,
            evidence: [`Pattern match in issue description: ${regex.toString()}`],
            confidence: 75,
            type: 'cause'
          });
        }
        
        // Check in the evidence
        for (const evidence of issue.evidence) {
          const evidenceMatch = evidence.match(regex);
          if (evidenceMatch) {
            causes.push({
              id: this.generateId(),
              description: `Detected ${patternType} pattern in evidence: ${evidenceMatch[0]}`,
              evidence: [`Pattern match in evidence: ${regex.toString()}`],
              confidence: 80,
              type: 'cause'
            });
          }
        }
      }
    }
    
    return causes;
  }
  
  /**
   * Find causes based on code analysis
   */
  private findCausesFromCodeAnalysis(issue: Finding): Finding[] {
    const causes: Finding[] = [];
    
    if (!issue.relatedCode) {
      return causes;
    }
    
    // Check for common code issues
    if (issue.relatedCode.includes('undefined') || issue.relatedCode.includes('null')) {
      causes.push({
        id: this.generateId(),
        description: 'Potential null or undefined reference',
        evidence: [`Code contains null/undefined references`],
        confidence: 85,
        type: 'cause',
        relatedCode: issue.relatedCode
      });
    }
    
    if (issue.relatedCode.includes('async') && !issue.relatedCode.includes('await')) {
      causes.push({
        id: this.generateId(),
        description: 'Missing await in async function',
        evidence: [`Code contains async without corresponding await`],
        confidence: 75,
        type: 'cause',
        relatedCode: issue.relatedCode
      });
    }
    
    if (issue.relatedCode.includes('try') && !issue.relatedCode.includes('catch')) {
      causes.push({
        id: this.generateId(),
        description: 'Uncaught exception in try block',
        evidence: [`Code contains try without catch`],
        confidence: 80,
        type: 'cause',
        relatedCode: issue.relatedCode
      });
    }
    
    return causes;
  }
  
  /**
   * Find architectural causes
   */
  private findArchitecturalCauses(issue: Finding): Finding[] {
    const causes: Finding[] = [];
    
    // Look for architectural patterns in the issue
    if (issue.description.includes('circular') || issue.description.includes('cyclic')) {
      causes.push({
        id: this.generateId(),
        description: 'Potential circular dependency',
        evidence: [`Issue mentions circular or cyclic relationships`],
        confidence: 70,
        type: 'cause'
      });
    }
    
    if (issue.description.includes('memory') || issue.description.includes('leak')) {
      causes.push({
        id: this.generateId(),
        description: 'Potential memory leak',
        evidence: [`Issue mentions memory or leak`],
        confidence: 65,
        type: 'cause'
      });
    }
    
    return causes;
  }
  
  /**
   * Find dependency-related causes
   */
  private findDependencyCauses(issue: Finding): Finding[] {
    const causes: Finding[] = [];
    
    // Look for dependency-related patterns in the issue
    if (issue.description.includes('version') || issue.description.includes('dependency')) {
      causes.push({
        id: this.generateId(),
        description: 'Potential dependency version conflict',
        evidence: [`Issue mentions version or dependency`],
        confidence: 75,
        type: 'cause'
      });
    }
    
    if (issue.description.includes('import') || issue.description.includes('require')) {
      causes.push({
        id: this.generateId(),
        description: 'Potential import/require issue',
        evidence: [`Issue mentions import or require`],
        confidence: 80,
        type: 'cause'
      });
    }
    
    return causes;
  }
  
  /**
   * Find causes based on server and application logs
   */
  private async findCausesFromLogs(issue: Finding): Promise<Finding[]> {
    const causes: Finding[] = [];
    let logs: string = '';
    
    // Attempt to collect recent logs from the workflow
    try {
      const result = execSync('tail -n 100 ~/.pm2/logs/*out.log 2>/dev/null || echo "No PM2 logs found"', 
        { encoding: 'utf-8' });
      logs += result;
    } catch (error) {
      // Ignore errors when accessing logs
      logs += "Could not access PM2 logs";
    }
    
    // Try to get express server logs if available
    try {
      const result = execSync('grep -a "\\[express\\]" ~/.pm2/logs/*out.log 2>/dev/null | tail -n 30', 
        { encoding: 'utf-8' });
      if (result) {
        logs += "\n" + result;
      }
    } catch (error) {
      // Ignore errors
    }
    
    // Analyze logs for patterns
    if (logs) {
      // Look for HTTP 304 (Not Modified) responses
      const notModifiedMatches = logs.match(/304 in \d+ms/g);
      if (notModifiedMatches && notModifiedMatches.length > 3) {
        causes.push({
          id: this.generateId(),
          description: 'Excessive HTTP 304 Not Modified responses',
          evidence: [
            `Found ${notModifiedMatches.length} 304 responses in logs`,
            'Indicates potential caching inefficiency',
            'May suggest unnecessary re-requests of already cached resources'
          ],
          confidence: 85,
          type: 'cause'
        });
      }
      
      // Look for repeated Cloudinary API calls
      const cloudinaryMatches = logs.match(/\/api\/cloudinary\/card\/(\d+)/g);
      if (cloudinaryMatches) {
        // Count occurrences of each card ID
        const cardCounts = new Map<string, number>();
        for (const match of cloudinaryMatches) {
          const cardId = match.replace('/api/cloudinary/card/', '');
          cardCounts.set(cardId, (cardCounts.get(cardId) || 0) + 1);
        }
        
        // Check for any card with more than 2 requests
        let duplicateCards = 0;
        let highestCount = 0;
        let highestCardId = '';
        
        for (const [cardId, count] of cardCounts.entries()) {
          if (count > 2) {
            duplicateCards++;
            if (count > highestCount) {
              highestCount = count;
              highestCardId = cardId;
            }
          }
        }
        
        if (duplicateCards > 0) {
          causes.push({
            id: this.generateId(),
            description: 'Repeated Cloudinary API calls for the same cards',
            evidence: [
              `Found ${duplicateCards} cards with multiple API requests`,
              `Card ${highestCardId} had ${highestCount} requests`,
              'Indicates inefficient caching or unnecessary component re-renders'
            ],
            confidence: 90,
            type: 'cause'
          });
        }
      }
      
      // Look for rapid consecutive API calls (within milliseconds)
      const apiTimestampMatches = logs.match(/\d+:\d+:\d+ [AP]M \[express\] [A-Z]+ \/api/g);
      if (apiTimestampMatches && apiTimestampMatches.length > 5) {
        causes.push({
          id: this.generateId(),
          description: 'High frequency of API calls in short timeframe',
          evidence: [
            `Found ${apiTimestampMatches.length} API calls in logs`,
            'Potential component re-render issues causing duplicate API calls',
            'May indicate missing useMemo or useCallback hooks'
          ],
          confidence: 80,
          type: 'cause'
        });
      }
    }
    
    return causes;
  }
  
  /**
   * Investigate potential causes to determine which are valid
   */
  private async investigateCauses(causes: Finding[], confidenceThreshold: number): Promise<Finding[]> {
    const validCauses: Finding[] = [];
    
    for (const cause of causes) {
      // Skip causes with low confidence
      if (cause.confidence < confidenceThreshold) {
        continue;
      }
      
      // Gather additional evidence
      const additionalEvidence = await this.gatherAdditionalEvidence(cause);
      cause.evidence.push(...additionalEvidence);
      
      // Recalculate confidence based on new evidence
      cause.confidence = this.calculateConfidence(cause);
      
      // If still above threshold, consider it valid
      if (cause.confidence >= confidenceThreshold) {
        validCauses.push(cause);
      }
    }
    
    return validCauses;
  }
  
  /**
   * Gather additional evidence for a cause
   */
  private async gatherAdditionalEvidence(cause: Finding): Promise<string[]> {
    const evidence: string[] = [];
    
    // Search codebase for related patterns
    if (cause.relatedCode) {
      try {
        const searchResult = execSync(
          `grep -r "${cause.relatedCode.replace(/"/g, '\\"')}" ${this.codebaseDir} --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx"`,
          { encoding: 'utf-8' }
        );
        
        if (searchResult) {
          evidence.push(`Found related code pattern in other files: ${searchResult.split('\n').length} matches`);
        }
      } catch (error) {
        // Grep returns non-zero exit code if no matches found, which throws an error
        // This is expected behavior
      }
    }
    
    // Check for similar patterns in issue history
    const similarIssues = this.findSimilarIssuesInHistory(cause);
    if (similarIssues.length > 0) {
      evidence.push(`Found ${similarIssues.length} similar issues in history`);
    }
    
    return evidence;
  }
  
  /**
   * Find similar issues in history
   */
  private findSimilarIssuesInHistory(cause: Finding): Finding[] {
    const similarIssues: Finding[] = [];
    
    for (const [, findings] of this.issueHistory) {
      for (const finding of findings) {
        if (this.calculateSimilarity(cause, finding) > 0.7) {
          similarIssues.push(finding);
        }
      }
    }
    
    return similarIssues;
  }
  
  /**
   * Calculate similarity between two findings
   */
  private calculateSimilarity(a: Finding, b: Finding): number {
    // Simple implementation - could be improved with more sophisticated algorithms
    let similarity = 0;
    
    // Compare descriptions
    if (a.description && b.description) {
      const aWords = new Set(a.description.toLowerCase().split(/\\s+/));
      const bWords = new Set(b.description.toLowerCase().split(/\\s+/));
      
      const intersection = new Set([...aWords].filter(x => bWords.has(x)));
      const union = new Set([...aWords, ...bWords]);
      
      similarity = intersection.size / union.size;
    }
    
    return similarity;
  }
  
  /**
   * Calculate confidence score for a finding
   */
  private calculateConfidence(finding: Finding): number {
    let confidence = finding.confidence;
    
    // Adjust confidence based on evidence
    confidence += finding.evidence.length * 5;
    
    // Cap at 100
    return Math.min(100, confidence);
  }
  
  /**
   * Calculate overall confidence for the analysis
   */
  private calculateOverallConfidence(rootCauses: Finding[]): number {
    if (rootCauses.length === 0) {
      return 0;
    }
    
    const totalConfidence = rootCauses.reduce((sum, cause) => sum + cause.confidence, 0);
    return totalConfidence / rootCauses.length;
  }
  
  /**
   * Generate suggested fixes based on root causes
   */
  private generateSuggestedFixes(rootCauses: Finding[]): string[] {
    const fixes: string[] = [];
    
    for (const cause of rootCauses) {
      // Generate fix based on cause type
      switch (true) {
        case cause.description.includes('null') || cause.description.includes('undefined'):
          fixes.push(`Add null checks for variables in ${cause.location || 'the affected code'}`);
          break;
          
        case cause.description.includes('async') || cause.description.includes('await'):
          fixes.push(`Ensure all async functions use proper await keywords`);
          break;
          
        case cause.description.includes('circular dependency'):
          fixes.push(`Refactor to break circular dependency, possibly using dependency injection or a mediator pattern`);
          break;
          
        case cause.description.includes('memory leak'):
          fixes.push(`Check for event listeners or subscriptions that aren't being cleaned up`);
          break;
          
        case cause.description.includes('version conflict'):
          fixes.push(`Review package.json for conflicting dependencies and update versions`);
          break;
          
        case cause.description.includes('Cloudinary API calls'):
          fixes.push(`Implement React.useMemo() for Cloudinary image URLs to prevent regenerating them on each render`);
          fixes.push(`Add a client-side image cache to store and reuse Cloudinary URLs`);
          fixes.push(`Use the useCallback hook for functions that fetch Cloudinary images`);
          break;
          
        case cause.description.includes('HTTP 304'):
          fixes.push(`Add cache control headers to API responses with appropriate max-age values`);
          fixes.push(`Implement a request deduplication middleware that prevents duplicate API calls`);
          fixes.push(`Check for unnecessary component re-renders that trigger duplicate requests`);
          break;
          
        case cause.description.includes('High frequency of API calls'):
          fixes.push(`Use React DevTools to profile component renders and identify unnecessary re-renders`);
          fixes.push(`Implement React.memo() on components that don't need to re-render frequently`);
          fixes.push(`Add proper dependencies arrays to useEffect hooks to prevent unnecessary effects`);
          break;
          
        default:
          fixes.push(`Investigate ${cause.description} further`);
      }
    }
    
    return fixes;
  }
  
  /**
   * Deduplicate findings based on similarity
   */
  private deduplicateFindings(findings: Finding[]): Finding[] {
    const uniqueFindings: Finding[] = [];
    
    for (const finding of findings) {
      let isDuplicate = false;
      
      for (const uniqueFinding of uniqueFindings) {
        if (this.calculateSimilarity(finding, uniqueFinding) > 0.8) {
          isDuplicate = true;
          
          // Merge evidence
          uniqueFinding.evidence = [...new Set([...uniqueFinding.evidence, ...finding.evidence])];
          
          // Take the higher confidence
          uniqueFinding.confidence = Math.max(uniqueFinding.confidence, finding.confidence);
          
          break;
        }
      }
      
      if (!isDuplicate) {
        uniqueFindings.push(finding);
      }
    }
    
    return uniqueFindings;
  }
  
  /**
   * Generate a unique ID for a finding
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
  
  /**
   * Format the analysis result into a readable string
   */
  public formatAnalysisResult(result: AnalysisResult): string {
    let formattedResult = '';
    
    // Add the header
    formattedResult += '# 🔍 Deep Root Cause Analysis\n\n';
    
    // Add the initial issue
    formattedResult += `## 🔎 Initial Issue\n${result.initialIssue}\n\n`;
    
    // Add the root causes
    formattedResult += '## 🌳 Root Causes\n\n';
    for (const cause of result.rootCauses) {
      formattedResult += `### 🔴 ${cause.description}\n`;
      formattedResult += `**Confidence:** ${cause.confidence}%\n\n`;
      
      formattedResult += '**Evidence:**\n';
      for (const evidence of cause.evidence) {
        formattedResult += `- ${evidence}\n`;
      }
      
      if (cause.relatedCode) {
        formattedResult += '\n**Related Code:**\n```typescript\n';
        formattedResult += cause.relatedCode;
        formattedResult += '\n```\n';
      }
      
      formattedResult += '\n';
    }
    
    // Add the investigation path
    formattedResult += '## 🧩 Investigation Path\n\n';
    
    // Create a tree-like structure showing the investigation path
    this.formatInvestigationPathRecursive(result.investigationPath[0], result.investigationPath, 0, (line) => {
      formattedResult += line + '\n';
    });
    
    formattedResult += '\n';
    
    // Add the suggested fixes
    formattedResult += '## 🛠️ Suggested Fixes\n\n';
    for (const fix of result.suggestedFixes) {
      formattedResult += `- ${fix}\n`;
    }
    
    // Add the confidence score
    formattedResult += `\n**Overall Confidence:** ${result.confidence.toFixed(1)}%\n`;
    
    return formattedResult;
  }
  
  /**
   * Format the investigation path recursively
   */
  private formatInvestigationPathRecursive(
    currentFinding: Finding,
    allFindings: Finding[],
    depth: number,
    output: (line: string) => void
  ): void {
    // Create the prefix based on depth
    const prefix = depth === 0 ? '' : ' '.repeat((depth - 1) * 2) + '└─ ';
    
    // Output the current finding
    output(`${prefix}🔍 ${currentFinding.description} (${currentFinding.confidence}%)`);
    
    // Find all validated causes of the current finding
    const children = allFindings.filter(f => 
      currentFinding.validatedCauses?.some(c => c.id === f.id)
    );
    
    // Recursively format each child
    for (const child of children) {
      this.formatInvestigationPathRecursive(child, allFindings, depth + 1, output);
    }
  }
}