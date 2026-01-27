/**
 * EnhancedThinkToolsIntegration.ts
 * 
 * This module integrates all the enhanced components of the Think Tools system
 * including AST parsing, advanced Replit tools integration, and interactive UI.
 */

import { ThinkToolsContext } from './ThinkToolsContext';
import { EnhancedThinkTools } from './EnhancedThinkTools';
import EnhancedResponseFormatter from './EnhancedResponseFormatter';
import { EnhancedReplitToolsAdapter } from './EnhancedReplitToolsAdapter';
import { ASTAnalyzer } from './ASTAnalyzer';
import { InteractiveResponseComponents } from './InteractiveResponseComponents';

// Configuration options for the enhanced Think Tools integration
interface EnhancedThinkToolsOptions {
  codebaseContext?: boolean;
  allowToolExecution?: boolean;
  interactiveComponents?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  astAnalysis?: boolean;
  maxInteractiveComponents?: number;
}

// Query result interface
interface QueryResult {
  success: boolean;
  result: string;
  error?: string;
  metadata?: any;
}

// Component for a specific query
interface QueryComponent {
  id: string;
  type: 'button' | 'select' | 'table' | 'chart' | 'codeBlock' | 'cardList';
  label: string;
  description?: string;
  action?: string;
  data?: any;
  options?: any[];
}

/**
 * Enhanced Think Tools Integration
 * 
 * This class integrates all the enhanced components of the Think Tools system
 * to provide a unified API for analyzing queries and generating responses.
 */
export class EnhancedThinkToolsIntegration {
  private thinkToolsContext: ThinkToolsContext;
  private enhancedThinkTools: EnhancedThinkTools;
  private responseFormatter: EnhancedResponseFormatter;
  private replitTools: EnhancedReplitToolsAdapter;
  private astAnalyzer: ASTAnalyzer;
  private interactiveComponents: InteractiveResponseComponents;
  
  constructor() {
    console.log('Initializing Enhanced Think Tools Integration');
    this.replitTools = new EnhancedReplitToolsAdapter();
    this.thinkToolsContext = ThinkToolsContext.getInstance();
    this.enhancedThinkTools = new EnhancedThinkTools(this.thinkToolsContext);
    this.responseFormatter = new EnhancedResponseFormatter();
    this.astAnalyzer = new ASTAnalyzer(this.replitTools);
    this.interactiveComponents = new InteractiveResponseComponents();
  }

  /**
   * Process a Think Tools query with enhanced capabilities
   */
  public async processQuery(
    query: string,
    options: EnhancedThinkToolsOptions = {}
  ): Promise<QueryResult> {
    try {
      console.log(`Processing enhanced Think Tools query: ${query}`);
      
      // Default options
      const {
        codebaseContext = false,
        allowToolExecution = false,
        interactiveComponents = true,
        theme = 'light',
        astAnalysis = false,
        maxInteractiveComponents = 5
      } = options;

      // Step 1: Get codebase context if requested
      let contextData: any = {};
      if (codebaseContext) {
        contextData = await this.thinkToolsContext.getRelevantContext(query);
      }

      // Step 2: Perform AST analysis if requested
      let astInsights: any = {};
      if (astAnalysis) {
        // Find relevant files based on query
        const relevantFiles = await this.replitTools.findFilesAdvanced(
          '*.ts',
          { contentPattern: query.split(' ').filter(w => w.length > 4).join('|') }
        );
        
        // Analyze files with AST
        const entities: any[] = [];
        for (const file of relevantFiles.slice(0, 5)) { // Limit to 5 files for performance
          const fileEntities = await this.astAnalyzer.analyzeFile(file);
          entities.push(...fileEntities);
        }
        
        astInsights = {
          entities,
          relationships: await this.astAnalyzer.analyzeCardRelationships(
            contextData.relevantCards?.map((card: any) => card.id) || []
          ),
          mechanics: await this.astAnalyzer.analyzeMechanics()
        };
      }

      // Step 3: Generate Think Tools analysis
      const thinkToolsResponse = await this.enhancedThinkTools.analyzeQuery(
        query,
        {
          context: contextData,
          astInsights,
          allowToolExecution
        }
      );

      // Step 4: Create interactive components if requested
      const components: QueryComponent[] = [];
      if (interactiveComponents) {
        components.push(...this.generateInteractiveComponents(query, thinkToolsResponse, contextData));
      }

      // Step 5: Format the response with interactive components
      const formattedResponse = this.responseFormatter.formatResponse(
        thinkToolsResponse,
        {
          includeFollowUpQuestions: true,
          includeSuggestedActions: true,
          includeCodeSnippets: true
        }
      );

      // Step 6: Add interactive UI components if requested
      let finalResponse = formattedResponse;
      if (interactiveComponents && components.length > 0) {
        finalResponse = this.interactiveComponents.formatResponse(
          formattedResponse,
          components,
          {
            includeComponents: true,
            allowExecutableComponents: allowToolExecution,
            theme: theme as 'light' | 'dark',
            maxComponents: maxInteractiveComponents
          }
        );
      }

      return {
        success: true,
        result: finalResponse,
        metadata: {
          contextData,
          components,
          astInsights: astAnalysis ? {
            entitiesCount: astInsights.entities?.length,
            relationshipsCount: astInsights.relationships?.length,
            mechanicsCount: astInsights.mechanics?.size
          } : undefined
        }
      };
    } catch (error) {
      console.error('Error in Enhanced Think Tools Integration:', error);
      return {
        success: false,
        result: 'Error processing Think Tools query',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Generate interactive components based on the query and context
   */
  private generateInteractiveComponents(
    query: string,
    response: string,
    context: any
  ): QueryComponent[] {
    const components: QueryComponent[] = [];
    
    // Add code block for relevant card definitions if available
    if (context.relevantCards && context.relevantCards.length > 0) {
      const cardData = context.relevantCards.slice(0, 3);
      const codeString = JSON.stringify(cardData, null, 2);
      
      components.push({
        id: 'relevant-cards',
        type: 'codeBlock',
        label: 'Relevant Cards',
        data: codeString
      });
    }
    
    // Add card list component for visual card display
    if (context.relevantCards && context.relevantCards.length > 0) {
      const cardListData = context.relevantCards.slice(0, 6).map((card: any) => ({
        title: card.name || 'Card',
        description: card.description || card.text || 'No description',
        action: 'view_card',
        actionLabel: 'View Card'
      }));
      
      components.push({
        id: 'card-list',
        type: 'cardList',
        label: 'Card Gallery',
        data: cardListData
      });
    }
    
    // Add buttons for common actions
    components.push({
      id: 'search-button',
      type: 'button',
      label: 'Search Related Code',
      action: 'search_code',
      description: 'Find code related to this query'
    });
    
    components.push({
      id: 'analyze-button',
      type: 'button',
      label: 'Analyze Card Balance',
      action: 'analyze_balance',
      description: 'Analyze the balance of cards mentioned in the query'
    });
    
    // Add a select for filtering options
    components.push({
      id: 'filter-select',
      type: 'select',
      label: 'Filter Results',
      options: [
        { value: 'all', label: 'All Results' },
        { value: 'cards', label: 'Cards Only' },
        { value: 'mechanics', label: 'Mechanics Only' },
        { value: 'code', label: 'Code Only' }
      ]
    });
    
    return components;
  }

  /**
   * Execute an action from an interactive component
   */
  public async executeAction(
    action: string,
    params: any
  ): Promise<any> {
    try {
      console.log(`Executing action ${action} with params:`, params);
      
      switch (action) {
        case 'search_code':
          return await this.replitTools.enhancedSearchFilesystem({
            query_description: params.query,
            includeContent: true
          });
          
        case 'analyze_balance':
          return await this.thinkToolsContext.analyzeCardBalance(params.cardIds);
          
        case 'view_card':
          return await this.thinkToolsContext.getCardDetails(params.cardId);
          
        case 'generate_code':
          return await this.replitTools.generateCode(params.template, params.replacements);
          
        default:
          return { error: `Unknown action: ${action}` };
      }
    } catch (error) {
      console.error(`Error executing action ${action}:`, error);
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }
}

// Singleton instance for global use
let enhancedThinkToolsIntegration: EnhancedThinkToolsIntegration | null = null;

/**
 * Get the singleton instance of EnhancedThinkToolsIntegration
 */
export function getEnhancedThinkToolsIntegration(): EnhancedThinkToolsIntegration {
  if (!enhancedThinkToolsIntegration) {
    enhancedThinkToolsIntegration = new EnhancedThinkToolsIntegration();
  }
  return enhancedThinkToolsIntegration;
}

/**
 * Process an enhanced Think Tools query
 * This is the main entry point for the enhanced Think Tools API
 */
export async function processEnhancedThinkToolsQuery(
  query: string,
  options: EnhancedThinkToolsOptions = {}
): Promise<string> {
  const integration = getEnhancedThinkToolsIntegration();
  const result = await integration.processQuery(query, options);
  
  if (!result.success) {
    return `Error processing Think Tools query: ${result.error}`;
  }
  
  return result.result;
}