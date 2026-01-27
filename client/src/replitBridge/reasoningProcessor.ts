/**
 * Reasoning Processor
 * 
 * Defines the interface and implementations for processing content
 * with different reasoning methodologies.
 */

import { ReasoningContext } from './reasoningContext';
import { ReasoningMode } from './reasoningModes';
import { THINK_TOOLS_CONFIG } from './thinkToolsConfig';

/**
 * Interface for reasoning processors
 */
export interface IReasoningProcessor {
  process(content: string, context: ReasoningContext): string;
  canProcess(content: string, context: ReasoningContext): boolean;
}

/**
 * Sequential processor implementation
 */
export class SequentialProcessor implements IReasoningProcessor {
  canProcess(content: string, context: ReasoningContext): boolean {
    return context.mode === ReasoningMode.SEQUENTIAL;
  }
  
  process(content: string, context: ReasoningContext): string {
    let formattedResponse = `${THINK_TOOLS_CONFIG.EMOJIS.SEQUENTIAL} ${THINK_TOOLS_CONFIG.HEADERS.SEQUENTIAL_START} ${THINK_TOOLS_CONFIG.EMOJIS.SEQUENTIAL}\n\n`;
    
    // Extract and format step sections
    const stepIndicators = ["Step 1:", "Step 2:", "Step 3:", "Step 4:", "Step 5:", "Step 6:", "Step 7:", "Step 8:", "Step 9:"];
    const stepMatches = [];
    
    for (let i = 0; i < stepIndicators.length; i++) {
      const currentStep = stepIndicators[i];
      const nextStep = stepIndicators[i + 1];
      
      if (content.includes(currentStep)) {
        const stepStart = content.indexOf(currentStep);
        let stepEnd;
        
        if (nextStep && content.includes(nextStep)) {
          stepEnd = content.indexOf(nextStep);
        } else {
          // Use the end of the string if no next step
          stepEnd = content.length;
        }
        
        if (stepEnd > stepStart) {
          stepMatches.push(content.substring(stepStart, stepEnd));
        }
      }
    }
    
    if (stepMatches.length > 0) {
      formattedResponse += stepMatches.join('\n');
    } else {
      // If no explicit steps found, try to break down content into paragraphs
      const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
      if (paragraphs.length > 0) {
        paragraphs.forEach((paragraph, index) => {
          formattedResponse += `Step ${index + 1}: ${paragraph.trim()}\n\n`;
        });
      } else {
        formattedResponse += content;
      }
    }
    
    formattedResponse += `\n${THINK_TOOLS_CONFIG.EMOJIS.SEQUENTIAL} ${THINK_TOOLS_CONFIG.HEADERS.SEQUENTIAL_END} ${THINK_TOOLS_CONFIG.EMOJIS.SEQUENTIAL}`;
    
    return formattedResponse;
  }
}

/**
 * Tree of Thoughts processor implementation
 */
export class TreeOfThoughtsProcessor implements IReasoningProcessor {
  canProcess(content: string, context: ReasoningContext): boolean {
    return context.mode === ReasoningMode.TREE_OF_THOUGHTS;
  }
  
  process(content: string, context: ReasoningContext): string {
    let formattedResponse = `${THINK_TOOLS_CONFIG.EMOJIS.TREE_OF_THOUGHTS} ${THINK_TOOLS_CONFIG.HEADERS.TREE_OF_THOUGHTS_START} ${THINK_TOOLS_CONFIG.EMOJIS.TREE_OF_THOUGHTS}\n\n`;
    
    // Extract problem statement
    const problemSection = this.extractProblemSection(content);
    if (problemSection) {
      formattedResponse += `PROBLEM STATEMENT:\n${problemSection}\n\n`;
    }
    
    // Format solution branches
    formattedResponse += `BRANCHES OF EXPLORATION:\n\n`;
    
    // Try to find explicit branches
    const branches = this.extractBranches(content);
    if (branches && branches.length > 0) {
      branches.forEach((branch, index) => {
        formattedResponse += `BRANCH ${index + 1}: ${branch.title}\n`;
        formattedResponse += `${branch.content}\n\n`;
        
        // Add sub-branches if available
        if (branch.subBranches && branch.subBranches.length > 0) {
          branch.subBranches.forEach((subBranch, subIndex) => {
            formattedResponse += `  SUB-BRANCH ${index + 1}.${subIndex + 1}: ${subBranch.title}\n`;
            formattedResponse += `  ${subBranch.content}\n\n`;
          });
        }
      });
    } else {
      // If no explicit branches, create them from paragraphs or sections
      const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
      if (paragraphs.length > 1) {
        // Skip first paragraph (assume it's the problem statement)
        paragraphs.slice(1).forEach((paragraph, index) => {
          formattedResponse += `BRANCH ${index + 1}: Approach ${index + 1}\n`;
          formattedResponse += `${paragraph.trim()}\n\n`;
        });
      } else {
        formattedResponse += "No explicit branches found in the content.\n\n";
        formattedResponse += content;
      }
    }
    
    // Extract conclusion or synthesis
    const conclusion = this.extractConclusion(content);
    if (conclusion) {
      formattedResponse += `CONCLUSION:\n${conclusion}\n\n`;
    }
    
    formattedResponse += `${THINK_TOOLS_CONFIG.EMOJIS.TREE_OF_THOUGHTS} ${THINK_TOOLS_CONFIG.HEADERS.TREE_OF_THOUGHTS_END} ${THINK_TOOLS_CONFIG.EMOJIS.TREE_OF_THOUGHTS}`;
    
    return formattedResponse;
  }
  
  private extractProblemSection(content: string): string | null {
    // Look for explicit problem statement section
    const problemMatch = content.match(/problem statement[:]*\s*(.*?)(?=branch|approach|conclusion|$)/is);
    if (problemMatch && problemMatch[1].trim()) {
      return problemMatch[1].trim();
    }
    
    // If no explicit problem section, use first paragraph
    const paragraphs = content.split('\n\n');
    if (paragraphs.length > 0) {
      return paragraphs[0].trim();
    }
    
    return null;
  }
  
  private extractBranches(content: string): Array<{
    title: string;
    content: string;
    subBranches?: Array<{ title: string; content: string }>;
  }> | null {
    const branches = [];
    
    // Look for explicit branch markers
    const branchMatches = [...content.matchAll(/branch\s*(\d+|[a-z])[:]*\s*(.*?)(?=branch\s*\d+|branch\s*[a-z]|conclusion|$)/gis)];
    
    for (const match of branchMatches) {
      const branchId = match[1];
      const branchContent = match[2].trim();
      
      // Extract title from first line if possible
      const titleMatch = branchContent.match(/^(.*?)(?:\n|$)/);
      const title = titleMatch ? titleMatch[1] : `Branch ${branchId}`;
      
      // Look for sub-branches
      const subBranches = [];
      const subBranchMatches = [...branchContent.matchAll(/sub-branch\s*(\d+|[a-z])[:]*\s*(.*?)(?=sub-branch\s*\d+|sub-branch\s*[a-z]|$)/gis)];
      
      for (const subMatch of subBranchMatches) {
        const subId = subMatch[1];
        const subContent = subMatch[2].trim();
        
        // Extract sub-branch title
        const subTitleMatch = subContent.match(/^(.*?)(?:\n|$)/);
        const subTitle = subTitleMatch ? subTitleMatch[1] : `Sub-branch ${subId}`;
        
        subBranches.push({
          title: subTitle,
          content: subContent
        });
      }
      
      branches.push({
        title,
        content: branchContent,
        subBranches: subBranches.length > 0 ? subBranches : undefined
      });
    }
    
    // If no explicit branches found, look for approaches
    if (branches.length === 0) {
      const approachMatches = [...content.matchAll(/approach\s*(\d+|[a-z])[:]*\s*(.*?)(?=approach\s*\d+|approach\s*[a-z]|conclusion|$)/gis)];
      
      for (const match of approachMatches) {
        const approachId = match[1];
        const approachContent = match[2].trim();
        
        const titleMatch = approachContent.match(/^(.*?)(?:\n|$)/);
        const title = titleMatch ? titleMatch[1] : `Approach ${approachId}`;
        
        branches.push({
          title,
          content: approachContent
        });
      }
    }
    
    return branches.length > 0 ? branches : null;
  }
  
  private extractConclusion(content: string): string | null {
    // Extract conclusion section
    const conclusionMatch = content.match(/conclusion[:]*\s*(.*?)(?=$)/is);
    if (conclusionMatch && conclusionMatch[1].trim()) {
      return conclusionMatch[1].trim();
    }
    
    // Look for synthesis or summary section
    const synthesisMatch = content.match(/(?:synthesis|summary)[:]*\s*(.*?)(?=$)/is);
    if (synthesisMatch && synthesisMatch[1].trim()) {
      return synthesisMatch[1].trim();
    }
    
    return null;
  }
}

/**
 * Backward Chaining processor implementation
 */
export class BackwardChainingProcessor implements IReasoningProcessor {
  canProcess(content: string, context: ReasoningContext): boolean {
    return context.mode === ReasoningMode.BACKWARD_CHAINING;
  }
  
  process(content: string, context: ReasoningContext): string {
    let formattedResponse = `🔄 ${THINK_TOOLS_CONFIG.HEADERS.BACKWARD_CHAINING_START} 🔄\n\n`;
    
    // Extract goal state
    const goalState = this.extractGoalState(content);
    if (goalState) {
      formattedResponse += `GOAL STATE:\n${goalState}\n\n`;
    }
    
    // Extract subgoals and preconditions
    const subgoals = this.extractSubgoals(content);
    if (subgoals && subgoals.length > 0) {
      formattedResponse += `REQUIRED PRECONDITIONS:\n\n`;
      
      subgoals.forEach((subgoal, index) => {
        formattedResponse += `SUBGOAL ${index + 1}: ${subgoal.title}\n`;
        formattedResponse += `${subgoal.content}\n`;
        
        if (subgoal.preConditions && subgoal.preConditions.length > 0) {
          formattedResponse += `  REQUIRES:\n`;
          subgoal.preConditions.forEach(precondition => {
            formattedResponse += `  - ${precondition}\n`;
          });
        }
        
        formattedResponse += `\n`;
      });
    } else {
      // If no explicit subgoals, try to extract from paragraphs
      const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
      
      // Skip first paragraph (assume it's the goal state)
      if (paragraphs.length > 1) {
        formattedResponse += `REQUIRED PRECONDITIONS:\n\n`;
        
        paragraphs.slice(1).forEach((paragraph, index) => {
          formattedResponse += `SUBGOAL ${index + 1}: Precondition ${index + 1}\n`;
          formattedResponse += `${paragraph.trim()}\n\n`;
        });
      }
    }
    
    // Extract initial state
    const initialState = this.extractInitialState(content);
    if (initialState) {
      formattedResponse += `INITIAL STATE:\n${initialState}\n\n`;
    }
    
    // Extract solution path
    const solutionPath = this.extractSolutionPath(content);
    if (solutionPath) {
      formattedResponse += `SOLUTION PATH:\n${solutionPath}\n\n`;
    }
    
    formattedResponse += `🔄 ${THINK_TOOLS_CONFIG.HEADERS.BACKWARD_CHAINING_END} 🔄`;
    
    return formattedResponse;
  }
  
  private extractGoalState(content: string): string | null {
    // Look for explicit goal state section
    const goalMatch = content.match(/goal state[:]*\s*(.*?)(?=subgoal|precondition|initial state|solution path|$)/is);
    if (goalMatch && goalMatch[1].trim()) {
      return goalMatch[1].trim();
    }
    
    // If no explicit goal section, use first paragraph
    const paragraphs = content.split('\n\n');
    if (paragraphs.length > 0) {
      return paragraphs[0].trim();
    }
    
    return null;
  }
  
  private extractSubgoals(content: string): Array<{
    title: string;
    content: string;
    preConditions?: string[];
  }> | null {
    const subgoals = [];
    
    // Look for explicit subgoal markers
    const subgoalMatches = [...content.matchAll(/subgoal\s*(\d+|[a-z])[:]*\s*(.*?)(?=subgoal\s*\d+|subgoal\s*[a-z]|initial state|solution path|$)/gis)];
    
    for (const match of subgoalMatches) {
      const subgoalId = match[1];
      const subgoalContent = match[2].trim();
      
      // Extract title from first line if possible
      const titleMatch = subgoalContent.match(/^(.*?)(?:\n|$)/);
      const title = titleMatch ? titleMatch[1] : `Subgoal ${subgoalId}`;
      
      // Look for preconditions
      const preConditions = [];
      const preConditionMatches = subgoalContent.match(/requires[:]*\s*(.*?)(?=subgoal|initial state|solution path|$)/is);
      
      if (preConditionMatches) {
        // Split by bullet points or new lines
        const preConditionsList = preConditionMatches[1]
          .split(/[\n-]+/)
          .map(item => item.trim())
          .filter(Boolean);
        preConditions.push(...preConditionsList);
      }
      
      subgoals.push({
        title,
        content: subgoalContent,
        preConditions: preConditions.length > 0 ? preConditions : undefined
      });
    }
    
    return subgoals.length > 0 ? subgoals : null;
  }
  
  private extractInitialState(content: string): string | null {
    // Extract initial state
    const initialMatch = content.match(/initial state[:]*\s*(.*?)(?=solution path|$)/is);
    return initialMatch ? initialMatch[1].trim() : null;
  }
  
  private extractSolutionPath(content: string): string | null {
    // Extract solution path
    const solutionMatch = content.match(/solution path[:]*\s*(.*?)(?=$)/is);
    return solutionMatch ? solutionMatch[1].trim() : null;
  }
}

/**
 * Constraint Satisfaction processor implementation
 */
export class ConstraintSatisfactionProcessor implements IReasoningProcessor {
  canProcess(content: string, context: ReasoningContext): boolean {
    return context.mode === ReasoningMode.CONSTRAINT_SATISFACTION;
  }
  
  process(content: string, context: ReasoningContext): string {
    let formattedResponse = `⚙️ ${THINK_TOOLS_CONFIG.HEADERS.CONSTRAINT_SATISFACTION_START} ⚙️\n\n`;
    
    // Extract problem definition
    const problem = this.extractProblem(content);
    if (problem) {
      formattedResponse += `PROBLEM DEFINITION:\n${problem}\n\n`;
    }
    
    // Extract variables and domains
    const variables = this.extractVariables(content);
    if (variables && variables.length > 0) {
      formattedResponse += `VARIABLES AND DOMAINS:\n`;
      variables.forEach(variable => {
        formattedResponse += `- ${variable.name}: ${variable.domain.join(', ')}\n`;
      });
      formattedResponse += `\n`;
    } else {
      // If no explicit variables found, try to create them from content
      formattedResponse += `VARIABLES AND DOMAINS:\n`;
      formattedResponse += `(Automatically generated from content)\n`;
      
      // Generate variables based on key terms in the content
      const keyTerms = this.extractKeyTerms(content);
      keyTerms.forEach(term => {
        formattedResponse += `- ${term}: [possible values inferred from context]\n`;
      });
      formattedResponse += `\n`;
    }
    
    // Extract constraints
    const constraints = this.extractConstraints(content);
    if (constraints && constraints.length > 0) {
      formattedResponse += `CONSTRAINTS:\n`;
      constraints.forEach((constraint, index) => {
        formattedResponse += `${index + 1}. ${constraint}\n`;
      });
      formattedResponse += `\n`;
    }
    
    // Extract solution process
    const process = this.extractSolutionProcess(content);
    if (process) {
      formattedResponse += `SOLUTION PROCESS:\n${process}\n\n`;
    }
    
    // Extract solution
    const solution = this.extractSolution(content);
    if (solution) {
      formattedResponse += `SOLUTION:\n${solution}\n\n`;
    }
    
    formattedResponse += `⚙️ ${THINK_TOOLS_CONFIG.HEADERS.CONSTRAINT_SATISFACTION_END} ⚙️`;
    
    return formattedResponse;
  }
  
  private extractProblem(content: string): string | null {
    // Extract problem definition
    const problemMatch = content.match(/problem definition[:]*\s*(.*?)(?=variables|domains|constraints|solution process|solution|$)/is);
    if (problemMatch && problemMatch[1].trim()) {
      return problemMatch[1].trim();
    }
    
    // If no explicit problem definition, use first paragraph
    const paragraphs = content.split('\n\n');
    if (paragraphs.length > 0) {
      return paragraphs[0].trim();
    }
    
    return null;
  }
  
  private extractVariables(content: string): Array<{
    name: string;
    domain: string[];
  }> | null {
    const variables = [];
    
    // Look for variables section
    const variablesMatch = content.match(/variables.*?domains[:]*\s*(.*?)(?=constraints|solution process|solution|$)/is);
    
    if (variablesMatch) {
      const variablesContent = variablesMatch[1];
      
      // Look for individual variable definitions
      const variableMatches = variablesContent.match(/[-•]?\s*([^:]+):\s*\[(.*?)\]/g);
      
      if (variableMatches) {
        for (const match of variableMatches) {
          const parts = match.match(/[-•]?\s*([^:]+):\s*\[(.*?)\]/);
          if (parts) {
            const name = parts[1].trim();
            const domain = parts[2].split(',').map(item => item.trim());
            
            variables.push({
              name,
              domain
            });
          }
        }
      }
    }
    
    return variables.length > 0 ? variables : null;
  }
  
  private extractConstraints(content: string): string[] | null {
    // Extract constraints
    const constraintsMatch = content.match(/constraints[:]*\s*(.*?)(?=solution process|solution|$)/is);
    
    if (constraintsMatch) {
      const constraintsContent = constraintsMatch[1];
      
      // Split by numbered or bullet points
      const constraints = constraintsContent
        .split(/\n\s*(?:\d+[.)]|\s*[-•])\s*/)
        .map(item => item.trim())
        .filter(Boolean);
      
      return constraints.length > 0 ? constraints : null;
    }
    
    return null;
  }
  
  private extractSolutionProcess(content: string): string | null {
    // Extract solution process
    const processMatch = content.match(/solution process[:]*\s*(.*?)(?=solution|$)/is);
    return processMatch ? processMatch[1].trim() : null;
  }
  
  private extractSolution(content: string): string | null {
    // Extract solution
    const solutionMatch = content.match(/solution[:]*\s*(.*?)(?=$)/is);
    return solutionMatch ? solutionMatch[1].trim() : null;
  }
  
  private extractKeyTerms(content: string): string[] {
    // Extract key terms that might be variables in a constraint satisfaction problem
    const keyTerms = new Set<string>();
    
    // Find capitalized terms that might represent variables
    const capitalizedTerms = content.match(/\b[A-Z][a-z]+\b/g);
    if (capitalizedTerms) {
      capitalizedTerms.forEach(term => keyTerms.add(term));
    }
    
    // Find terms in quotes that might represent variables
    const quotedTerms = content.match(/"([^"]+)"|'([^']+)'/g);
    if (quotedTerms) {
      quotedTerms.forEach(term => {
        // Remove quotes
        const cleanTerm = term.replace(/['"]/g, '');
        keyTerms.add(cleanTerm);
      });
    }
    
    // If we have fewer than 3 terms, add some generic ones based on content
    if (keyTerms.size < 3) {
      const words = content.split(/\s+/);
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        // Look for nouns (approximated by longer words)
        if (word.length > 6 && /^[a-z]+$/i.test(word)) {
          keyTerms.add(word);
          if (keyTerms.size >= 5) break;
        }
      }
    }
    
    return Array.from(keyTerms);
  }
}

/**
 * Counterfactual processor implementation
 */
export class CounterfactualProcessor implements IReasoningProcessor {
  canProcess(content: string, context: ReasoningContext): boolean {
    return context.mode === ReasoningMode.COUNTERFACTUAL;
  }
  
  process(content: string, context: ReasoningContext): string {
    let formattedResponse = `🔄 ${THINK_TOOLS_CONFIG.HEADERS.COUNTERFACTUAL_START} 🔄\n\n`;
    
    // Extract actual situation
    const actual = this.extractActualSituation(content);
    if (actual) {
      formattedResponse += `ACTUAL SITUATION:\n${actual}\n\n`;
    }
    
    // Extract counterfactual scenarios
    const scenarios = this.extractCounterfactuals(content);
    if (scenarios && scenarios.length > 0) {
      formattedResponse += `COUNTERFACTUAL SCENARIOS:\n\n`;
      
      scenarios.forEach((scenario, index) => {
        formattedResponse += `SCENARIO ${index + 1}: "What if ${scenario.premise}"\n`;
        formattedResponse += `OUTCOME: ${scenario.outcome}\n`;
        
        if (scenario.implications && scenario.implications.length > 0) {
          formattedResponse += `IMPLICATIONS:\n`;
          scenario.implications.forEach(implication => {
            formattedResponse += `- ${implication}\n`;
          });
        }
        
        formattedResponse += `\n`;
      });
    } else {
      // If no explicit scenarios found, generate from paragraphs
      const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
      
      // Skip first paragraph (assume it's the actual situation)
      if (paragraphs.length > 1) {
        formattedResponse += `COUNTERFACTUAL SCENARIOS:\n\n`;
        
        paragraphs.slice(1).forEach((paragraph, index) => {
          // Find "what if" phrases in paragraph
          const whatIfMatch = paragraph.match(/what if\s+(.+?)(?=\?|\.|\n|$)/i);
          const premise = whatIfMatch ? whatIfMatch[1].trim() : `Alternative ${index + 1}`;
          
          formattedResponse += `SCENARIO ${index + 1}: "What if ${premise}"\n`;
          formattedResponse += `OUTCOME: ${paragraph.trim()}\n\n`;
        });
      }
    }
    
    // Extract insights
    const insights = this.extractInsights(content);
    if (insights) {
      formattedResponse += `KEY INSIGHTS:\n${insights}\n\n`;
    }
    
    // Extract decision or recommendation
    const decision = this.extractDecision(content);
    if (decision) {
      formattedResponse += `DECISION/RECOMMENDATION:\n${decision}\n\n`;
    }
    
    formattedResponse += `🔄 ${THINK_TOOLS_CONFIG.HEADERS.COUNTERFACTUAL_END} 🔄`;
    
    return formattedResponse;
  }
  
  private extractActualSituation(content: string): string | null {
    // Extract actual situation
    const actualMatch = content.match(/actual situation[:]*\s*(.*?)(?=scenario|counterfactual|what if|insights|decision|recommendation|$)/is);
    if (actualMatch && actualMatch[1].trim()) {
      return actualMatch[1].trim();
    }
    
    // If no explicit actual situation, use first paragraph
    const paragraphs = content.split('\n\n');
    if (paragraphs.length > 0) {
      return paragraphs[0].trim();
    }
    
    return null;
  }
  
  private extractCounterfactuals(content: string): Array<{
    premise: string;
    outcome: string;
    implications?: string[];
  }> | null {
    const scenarios = [];
    
    // Look for scenarios with "what if" or similar markers
    const scenarioMatches = [
      ...content.matchAll(/(?:scenario\s*(\d+|[a-z])|counterfactual\s*(\d+|[a-z])|what if)[:]*\s*(.*?)(?=scenario\s*\d+|scenario\s*[a-z]|counterfactual\s*\d+|counterfactual\s*[a-z]|what if|insights|decision|recommendation|$)/gis)
    ];
    
    for (const match of scenarioMatches) {
      const scenarioId = match[1] || match[2] || '';
      const scenarioContent = match[3].trim();
      
      // Extract premise/what-if statement
      let premise = scenarioContent;
      let outcome = '';
      
      // Try to separate premise from outcome
      const outcomeMatch = scenarioContent.match(/(.*?)(?:outcome|result|consequences|impact)[:]*\s*(.*?)(?=implications|$)/is);
      
      if (outcomeMatch) {
        premise = outcomeMatch[1].trim();
        outcome = outcomeMatch[2].trim();
      }
      
      // Look for implications
      const implications = [];
      const implicationsMatch = scenarioContent.match(/implications[:]*\s*(.*?)(?=$)/is);
      
      if (implicationsMatch) {
        // Split by bullet points or new lines
        const implicationsList = implicationsMatch[1]
          .split(/[\n-]+/)
          .map(item => item.trim())
          .filter(Boolean);
        implications.push(...implicationsList);
      }
      
      scenarios.push({
        premise,
        outcome,
        implications: implications.length > 0 ? implications : undefined
      });
    }
    
    return scenarios.length > 0 ? scenarios : null;
  }
  
  private extractInsights(content: string): string | null {
    // Extract insights
    const insightsMatch = content.match(/(?:key\s*)?insights[:]*\s*(.*?)(?=decision|recommendation|$)/is);
    return insightsMatch ? insightsMatch[1].trim() : null;
  }
  
  private extractDecision(content: string): string | null {
    // Extract decision/recommendation
    const decisionMatch = content.match(/(?:decision|recommendation)[:]*\s*(.*?)(?=$)/is);
    return decisionMatch ? decisionMatch[1].trim() : null;
  }
}

/**
 * Morphological processor implementation
 */
export class MorphologicalProcessor implements IReasoningProcessor {
  canProcess(content: string, context: ReasoningContext): boolean {
    return context.mode === ReasoningMode.MORPHOLOGICAL;
  }
  
  process(content: string, context: ReasoningContext): string {
    let formattedResponse = `${THINK_TOOLS_CONFIG.EMOJIS.ACTIVATION} ${THINK_TOOLS_CONFIG.HEADERS.MORPHOLOGICAL_START} ${THINK_TOOLS_CONFIG.EMOJIS.ACTIVATION}\n\n`;
    
    // Extract problem framing
    const problemFraming = this.extractProblemFraming(content);
    if (problemFraming) {
      formattedResponse += THINK_TOOLS_CONFIG.TEMPLATES.PROBLEM_FRAMING
        .replace('[current]', problemFraming.current)
        .replace('[desired]', problemFraming.desired)
        .replace('[constraints]', problemFraming.constraints);
    } else {
      formattedResponse += THINK_TOOLS_CONFIG.TEMPLATES.PROBLEM_FRAMING
        .replace('[current]', 'Current situation derived from context')
        .replace('[desired]', 'Desired outcome derived from context')
        .replace('[constraints]', 'Constraints derived from context');
    }
    
    // Extract solution space
    const solutionSpace = this.extractSolutionSpace(content);
    if (solutionSpace) {
      formattedResponse += THINK_TOOLS_CONFIG.TEMPLATES.SOLUTION_SPACE
        .replace('[content]', solutionSpace);
    } else {
      formattedResponse += THINK_TOOLS_CONFIG.TEMPLATES.SOLUTION_SPACE
        .replace('[content]', 'Solution space derived from context');
    }
    
    // Extract constraint analysis
    const constraintAnalysis = this.extractConstraintAnalysis(content);
    if (constraintAnalysis) {
      formattedResponse += THINK_TOOLS_CONFIG.TEMPLATES.CONSTRAINT_ANALYSIS
        .replace('[content]', constraintAnalysis);
    } else {
      formattedResponse += THINK_TOOLS_CONFIG.TEMPLATES.CONSTRAINT_ANALYSIS
        .replace('[content]', 'Constraint analysis derived from context');
    }
    
    // Extract counterfactual exploration
    const counterfactuals = this.extractCounterfactuals(content);
    if (counterfactuals) {
      formattedResponse += THINK_TOOLS_CONFIG.TEMPLATES.COUNTERFACTUAL
        .replace('[content]', counterfactuals);
    } else {
      formattedResponse += THINK_TOOLS_CONFIG.TEMPLATES.COUNTERFACTUAL
        .replace('[content]', 'Counterfactual exploration derived from context');
    }
    
    // Extract path selection
    const pathSelection = this.extractPathSelection(content);
    if (pathSelection) {
      formattedResponse += THINK_TOOLS_CONFIG.TEMPLATES.PATH_SELECTION
        .replace('[content]', pathSelection);
    } else {
      formattedResponse += THINK_TOOLS_CONFIG.TEMPLATES.PATH_SELECTION
        .replace('[content]', 'Path selection derived from context');
    }
    
    formattedResponse += `\n${THINK_TOOLS_CONFIG.EMOJIS.ACTIVATION} ${THINK_TOOLS_CONFIG.HEADERS.MORPHOLOGICAL_END} ${THINK_TOOLS_CONFIG.EMOJIS.ACTIVATION}`;
    
    return formattedResponse;
  }
  
  private extractProblemFraming(content: string): { current: string; desired: string; constraints: string } | null {
    // Try to find explicit problem framing section
    const problemFramingMatch = content.match(/(?:problem framing|problem statement)[:]*\s*(.*?)(?=solution space|constraint analysis|counterfactual|path selection|$)/is);
    
    if (problemFramingMatch) {
      const problemFraming = problemFramingMatch[1].trim();
      
      // Extract current state
      const currentMatch = problemFraming.match(/current state[:]*\s*(.*?)(?=desired outcome|key constraints|$)/is);
      const current = currentMatch ? currentMatch[1].trim() : '';
      
      // Extract desired outcome
      const desiredMatch = problemFraming.match(/desired outcome[:]*\s*(.*?)(?=key constraints|$)/is);
      const desired = desiredMatch ? desiredMatch[1].trim() : '';
      
      // Extract key constraints
      const constraintsMatch = problemFraming.match(/key constraints[:]*\s*(.*?)(?=$)/is);
      const constraints = constraintsMatch ? constraintsMatch[1].trim() : '';
      
      if (current || desired || constraints) {
        return { current, desired, constraints };
      }
    }
    
    return null;
  }
  
  private extractSolutionSpace(content: string): string | null {
    // Extract solution space
    const solutionSpaceMatch = content.match(/solution space[:]*\s*(.*?)(?=constraint analysis|counterfactual|path selection|$)/is);
    return solutionSpaceMatch ? solutionSpaceMatch[1].trim() : null;
  }
  
  private extractConstraintAnalysis(content: string): string | null {
    // Extract constraint analysis
    const constraintAnalysisMatch = content.match(/constraint analysis[:]*\s*(.*?)(?=counterfactual|path selection|$)/is);
    return constraintAnalysisMatch ? constraintAnalysisMatch[1].trim() : null;
  }
  
  private extractCounterfactuals(content: string): string | null {
    // Extract counterfactual exploration
    const counterfactualsMatch = content.match(/counterfactual exploration[:]*\s*(.*?)(?=path selection|$)/is);
    return counterfactualsMatch ? counterfactualsMatch[1].trim() : null;
  }
  
  private extractPathSelection(content: string): string | null {
    // Extract path selection
    const pathSelectionMatch = content.match(/path selection[:]*\s*(.*?)(?=$)/is);
    return pathSelectionMatch ? pathSelectionMatch[1].trim() : null;
  }
}