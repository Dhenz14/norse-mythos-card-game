/**
 * Response Formatter for Think Tools
 * 
 * This module handles the formatting of Think Tools responses according to
 * the required format, including tree branches, multidirectional analysis,
 * and cognitive framework sections.
 */

import { ThinkToolsAnalysisResult } from './ThinkToolsDiscoveryProtocol';

/**
 * Format the analysis result into an enhanced Think Tools response
 * 
 * @param analysis The result of the analysis to format
 * @returns Formatted Think Tools response
 */
export function formatEnhancedThinkToolsResponse(analysis: ThinkToolsAnalysisResult): string {
  // If no analysis was provided, return empty string
  if (!analysis) return '';
  
  // Begin building the response
  let formattedResponse = '';
  
  // Add the Think Tools header
  formattedResponse += '# Think Tools Analysis\n\n';
  
  // Add the tree branch section
  formattedResponse += formatTreeBranchSection(analysis);
  
  // Add the multidirectional analysis section
  formattedResponse += formatMultidirectionalAnalysis(analysis);
  
  // Add the cognitive framework section
  formattedResponse += formatCognitiveFramework(analysis);
  
  return formattedResponse;
}

/**
 * Format the tree branch section of the response
 * 
 * @param analysis The analysis result
 * @returns Formatted tree branch section
 */
function formatTreeBranchSection(analysis: ThinkToolsAnalysisResult): string {
  let section = '## 🌳 Tree Branch Thought Process\n\n';
  
  // Add root level
  section += '### 🌳 Root Problem\n';
  section += `${analysis.treeBranch?.root || 'No root problem identified'}\n\n`;
  
  // Add branches
  section += '### 🌿 Branches\n';
  
  if (analysis.treeBranch?.branches && analysis.treeBranch.branches.length > 0) {
    analysis.treeBranch.branches.forEach((branch, index) => {
      section += `${index === analysis.treeBranch!.branches.length - 1 ? '└─' : '├─'} ${branch.name || `Branch ${index + 1}`}\n`;
      
      // Add leaves for this branch
      if (branch.leaves && branch.leaves.length > 0) {
        branch.leaves.forEach((leaf, leafIndex) => {
          // Proper indentation and connecting lines
          const isLastLeaf = leafIndex === branch.leaves.length - 1;
          const prefix = index === analysis.treeBranch!.branches.length - 1 ? '   ' : '│  ';
          
          section += `${prefix}${isLastLeaf ? '└─' : '├─'} 🍃 ${leaf}\n`;
        });
      } else {
        // No leaves for this branch
        const prefix = index === analysis.treeBranch!.branches.length - 1 ? '   ' : '│  ';
        section += `${prefix}└─ No detailed analysis for this branch\n`;
      }
      
      section += '\n';
    });
  } else {
    section += 'No branches identified\n\n';
  }
  
  return section;
}

/**
 * Format the multidirectional analysis section
 * 
 * @param analysis The analysis result
 * @returns Formatted multidirectional analysis section
 */
function formatMultidirectionalAnalysis(analysis: ThinkToolsAnalysisResult): string {
  let section = '## 🔄 Multidirectional Analysis\n\n';
  
  if (analysis.multidirectional?.perspectives && analysis.multidirectional.perspectives.length > 0) {
    analysis.multidirectional.perspectives.forEach((perspective, index) => {
      section += `### 🔍 Perspective ${index + 1}: ${perspective.name}\n`;
      section += `${perspective.analysis}\n\n`;
    });
  } else {
    section += 'No perspectives available for multidirectional analysis\n\n';
  }
  
  return section;
}

/**
 * Format the cognitive framework section
 * 
 * @param analysis The analysis result
 * @returns Formatted cognitive framework section
 */
function formatCognitiveFramework(analysis: ThinkToolsAnalysisResult): string {
  let section = '## 🧠 Cognitive Framework Analysis\n\n';
  
  if (analysis.cognitiveFramework) {
    // Add insights
    section += '### 💡 Key Insights\n';
    if (analysis.cognitiveFramework.insights && analysis.cognitiveFramework.insights.length > 0) {
      analysis.cognitiveFramework.insights.forEach((insight, index) => {
        section += `${index + 1}. ${insight}\n`;
      });
    } else {
      section += 'No key insights identified\n';
    }
    section += '\n';
    
    // Add limitations
    section += '### ⚠️ Limitations & Constraints\n';
    if (analysis.cognitiveFramework.limitations && analysis.cognitiveFramework.limitations.length > 0) {
      analysis.cognitiveFramework.limitations.forEach((limitation, index) => {
        section += `${index + 1}. ${limitation}\n`;
      });
    } else {
      section += 'No limitations identified\n';
    }
    section += '\n';
    
    // Add recommendations
    section += '### ✅ Recommendations\n';
    if (analysis.cognitiveFramework.recommendations && analysis.cognitiveFramework.recommendations.length > 0) {
      analysis.cognitiveFramework.recommendations.forEach((recommendation, index) => {
        const status = recommendation.status === 'completed' ? '✓' : '→';
        section += `${status} ${recommendation.text}\n`;
      });
    } else {
      section += 'No recommendations provided\n';
    }
  } else {
    section += 'No cognitive framework analysis available\n';
  }
  
  return section;
}

export default {
  formatEnhancedThinkToolsResponse
};