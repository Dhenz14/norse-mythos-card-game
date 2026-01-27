/**
 * Enhanced Root Cause Analyzer
 * 
 * This module combines multiple analysis tools to provide comprehensive root cause analysis.
 * It orchestrates the analysis process and formats the results with visual indicators.
 */

// Using dynamic imports since these modules might not be fully defined yet
import RootCauseAnalysis from './RootCauseAnalysis';
import FileSystemNavigator from './FileSystemNavigator';
import PatternMatcher, { PatternMatch } from './PatternMatcher';
import RootCauseDBService from '../services/RootCauseDBService';
import RootCauseMemoryManager from '../services/RootCauseMemoryManager';
import PerformanceMonitor from '../utils/PerformanceMonitor';
import { v4 as uuidv4 } from 'uuid';

// Analysis result interface
interface AnalysisResult {
  analysis: string;
  patterns: string[];
  relatedFiles: string[];
  analysisId: string;
}

// Similar analysis interface
interface SimilarAnalysis {
  id: string;
  patterns: string[] | string | null;
  issue?: string;
  result?: string;
  timestamp?: Date;
  relatedIssues?: string | null;
  // Other fields not used in the relationship calculation
  [key: string]: any;
}

export class EnhancedRootCauseAnalyzer {
  /**
   * Analyze the root cause of an issue
   */
  public async analyzeRootCause(issue: string): Promise<AnalysisResult> {
    console.log(`Starting enhanced root cause analysis for: ${issue.substring(0, 50)}...`);
    
    // Generate a unique ID for this analysis
    const analysisId = uuidv4();
    
    // Start overall performance tracking
    const overallOpId = PerformanceMonitor.startOperation(analysisId, 'overall_analysis');
    
    try {
      // Store the issue in the database
      const dbOpId = PerformanceMonitor.startOperation(analysisId, 'db_create_analysis');
      await RootCauseDBService.createAnalysis(analysisId, issue);
      PerformanceMonitor.endOperation(dbOpId);
      
      // Find relevant files
      const filesOpId = PerformanceMonitor.startOperation(analysisId, 'find_relevant_files');
      const relevantFiles = await FileSystemNavigator.findRelevantFiles(issue);
      PerformanceMonitor.endOperation(filesOpId, { fileCount: relevantFiles.length });
      console.log(`Found ${relevantFiles.length} relevant files`);
      
      // Track file access in memory manager
      const trackOpId = PerformanceMonitor.startOperation(analysisId, 'track_file_access');
      for (const file of relevantFiles) {
        await RootCauseMemoryManager.trackFilePath(file, analysisId);
      }
      PerformanceMonitor.endOperation(trackOpId);
      
      // Match patterns in the issue description
      const patternsOpId = PerformanceMonitor.startOperation(analysisId, 'match_patterns');
      const matchedPatterns = await PatternMatcher.matchIssuePatterns(issue);
      PerformanceMonitor.endOperation(patternsOpId, { patternCount: matchedPatterns.length });
      console.log(`Matched ${matchedPatterns.length} patterns`);
      
      // Perform deep analysis
      const analysisOpId = PerformanceMonitor.startOperation(analysisId, 'deep_analysis');
      const rootCauseAnalysis = await RootCauseAnalysis.findRootCause(issue);
      PerformanceMonitor.endOperation(analysisOpId);
      
      // Find code patterns in relevant files
      const codePatternOpId = PerformanceMonitor.startOperation(analysisId, 'code_pattern_search');
      const codePatterns = await PatternMatcher.findCodePatterns(
        relevantFiles,
        matchedPatterns
      );
      PerformanceMonitor.endOperation(codePatternOpId);
      
      // Format the analysis with visual indicators
      const formatOpId = PerformanceMonitor.startOperation(analysisId, 'format_analysis');
      const formattedAnalysis = this.formatAnalysisWithEmojis(
        rootCauseAnalysis,
        matchedPatterns,
        codePatterns,
        relevantFiles
      );
      PerformanceMonitor.endOperation(formatOpId);
      
      // Extract pattern names for the response
      const patternNames = matchedPatterns.map((p: PatternMatch) => p.patternName);
      
      // Update the analysis in the database
      const updateOpId = PerformanceMonitor.startOperation(analysisId, 'db_update_analysis');
      await RootCauseDBService.updateAnalysis(
        analysisId,
        formattedAnalysis,
        patternNames
      );
      PerformanceMonitor.endOperation(updateOpId);
      
      // Record relationships between this analysis and previous similar ones
      const relOpId = PerformanceMonitor.startOperation(analysisId, 'record_relationships');
      await this.recordRelationships(analysisId, issue, patternNames);
      PerformanceMonitor.endOperation(relOpId);
      
      // End overall performance tracking and log summary
      const metrics = PerformanceMonitor.endOperation(overallOpId);
      if (metrics) {
        console.log(`Analysis completed in ${metrics.duration}ms with cache hit rates: content=${(metrics.cacheHitRate || 0).toFixed(2)}, search=${(metrics.searchCacheHitRate || 0).toFixed(2)}`);
      }
      
      return {
        analysis: formattedAnalysis,
        patterns: patternNames,
        relatedFiles: relevantFiles,
        analysisId
      };
    } catch (error) {
      console.error('Error in enhanced root cause analysis:', error);
      
      // End performance tracking with error flag
      PerformanceMonitor.endOperation(overallOpId, { error: true });
      
      // Store the error in the database
      try {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorDbOpId = PerformanceMonitor.startOperation(analysisId, 'db_update_error');
        await RootCauseDBService.updateAnalysis(
          analysisId,
          `Error during analysis: ${errorMessage}`,
          []
        );
        PerformanceMonitor.endOperation(errorDbOpId);
      } catch (dbError) {
        console.error('Error updating failed analysis in database:', dbError);
      }
      
      return {
        analysis: `Error performing analysis: ${error instanceof Error ? error.message : String(error)}`,
        patterns: [],
        relatedFiles: [],
        analysisId
      };
    }
  }
  
  /**
   * Format analysis with emoji indicators for better visual cues
   */
  private formatAnalysisWithEmojis(
    analysis: string,
    matchedPatterns: PatternMatch[],
    codePatterns: Record<string, string[]>,
    relevantFiles: string[]
  ): string {
    // Split the analysis into sections
    const sections = analysis.split(/^## /gm);
    
    // Format each section with appropriate emoji
    let formattedAnalysis = '';
    
    // Add initial emoji header
    formattedAnalysis += `🔍 Initial Analysis\n\n`;
    
    // Add the first section (usually overview/initial analysis)
    if (sections.length > 0) {
      formattedAnalysis += sections[0].trim() + '\n\n';
    }
    
    // Add matched patterns section
    if (matchedPatterns.length > 0) {
      formattedAnalysis += `🧩 Detected Patterns\n\n`;
      
      matchedPatterns.forEach((pattern, index) => {
        formattedAnalysis += `${index + 1}. **${pattern.patternName}** (${(pattern.confidence * 100).toFixed(0)}% confidence)\n`;
        formattedAnalysis += `   ${pattern.description}\n`;
        if (pattern.matchedString) {
          formattedAnalysis += `   Matched text: "${pattern.matchedString}"\n`;
        }
        formattedAnalysis += '\n';
      });
    }
    
    // Add investigation paths section (usually the second section)
    if (sections.length > 1) {
      formattedAnalysis += `🧩 Investigation Paths\n\n${sections[1].trim()}\n\n`;
    }
    
    // Add deep analysis results (usually the third section)
    if (sections.length > 2) {
      formattedAnalysis += `🌳 Root Cause Identified\n\n${sections[2].trim()}\n\n`;
    }
    
    // Add code pattern findings
    if (Object.keys(codePatterns).length > 0) {
      formattedAnalysis += `🧩 Code Pattern Matches\n\n`;
      
      for (const [file, matches] of Object.entries(codePatterns)) {
        formattedAnalysis += `In ${file}:\n`;
        matches.forEach(match => {
          formattedAnalysis += `- ${match}\n`;
        });
        formattedAnalysis += '\n';
      }
    }
    
    // Add related files section
    if (relevantFiles.length > 0) {
      formattedAnalysis += `🔍 Related Files\n\n`;
      relevantFiles.slice(0, 10).forEach(file => {
        formattedAnalysis += `- ${file}\n`;
      });
      formattedAnalysis += '\n';
    }
    
    // Add recommended solutions section (usually the fourth section)
    if (sections.length > 3) {
      formattedAnalysis += `🛠️ Suggested Fix\n\n${sections[3].trim()}\n\n`;
    }
    
    // Add completion marker
    formattedAnalysis += `✅ Analysis Complete\n\n`;
    formattedAnalysis += `This analysis identified ${matchedPatterns.length} patterns `;
    formattedAnalysis += `across ${relevantFiles.length} relevant files.\n`;
    
    return formattedAnalysis;
  }
  
  /**
   * Record relationships between this analysis and previous ones
   */
  private async recordRelationships(
    analysisId: string,
    issue: string,
    patterns: string[]
  ): Promise<void> {
    try {
      // Find similar analyses based on patterns
      const similarAnalyses: SimilarAnalysis[] = await RootCauseDBService.findSimilarAnalyses(patterns, 5);
      
      // Record relationships to similar analyses
      for (const similar of similarAnalyses) {
        if (similar.id === analysisId) continue; // Skip self
        
        // Calculate relationship strength based on pattern overlap
        const similarPatterns: string[] = typeof similar.patterns === 'string'
          ? JSON.parse(similar.patterns)
          : similar.patterns || [];
        
        const commonPatterns = patterns.filter(p => similarPatterns.includes(p));
        const strength = Math.round((commonPatterns.length / Math.max(patterns.length, similarPatterns.length)) * 100);
        
        if (strength > 20) { // Only record meaningful relationships
          await RootCauseDBService.createRelationship(
            analysisId,
            similar.id,
            'similar-patterns',
            strength
          );
        }
      }
    } catch (error) {
      console.error('Error recording analysis relationships:', 
        error instanceof Error ? error.message : String(error));
      // Non-critical error, continue without relationships
    }
  }
}