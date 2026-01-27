/**
 * Think Tools Context Provider
 * 
 * This module provides codebase context awareness to the Think Tools system,
 * allowing it to access and analyze card definitions, game mechanics,
 * and other relevant code information for more intelligent recommendations.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface CardDefinition {
  id: number;
  name: string;
  class?: string;
  heroClass?: string;
  cost: number;
  attack?: number;
  health?: number;
  type: 'minion' | 'spell' | 'weapon';
  rarity?: string;
  effects?: any[];
  keywords?: string[];
  collectible?: boolean;
  [key: string]: any;
}

interface CodebaseContext {
  cards: CardDefinition[];
  classCounts: Record<string, number>;
  mechanics: string[];
  recentChanges: string[];
}

/**
 * ThinkToolsContext provides access to codebase information
 * for more intelligent and context-aware recommendations
 */
export class ThinkToolsContext {
  private static instance: ThinkToolsContext;
  private context: CodebaseContext;
  private cardFiles: string[] = [];
  private mechanicFiles: string[] = [];
  
  private constructor() {
    this.context = {
      cards: [],
      classCounts: {},
      mechanics: [],
      recentChanges: []
    };
    
    this.initialize();
  }
  
  /**
   * Get the singleton instance of ThinkToolsContext
   */
  public static getInstance(): ThinkToolsContext {
    if (!ThinkToolsContext.instance) {
      ThinkToolsContext.instance = new ThinkToolsContext();
    }
    return ThinkToolsContext.instance;
  }
  
  /**
   * Initialize the context with codebase information
   */
  private initialize(): void {
    try {
      this.findCardFiles();
      this.loadCardDefinitions();
      this.analyzeMechanics();
      this.fetchRecentChanges();
      
      console.log(`ThinkToolsContext initialized with ${this.context.cards.length} cards and ${this.context.mechanics.length} mechanics`);
    } catch (error) {
      console.error('Error initializing ThinkToolsContext:', error);
    }
  }
  
  /**
   * Find all card definition files in the codebase
   */
  private findCardFiles(): void {
    try {
      // Use search filesystem logic to find card files
      const result = execSync('find . -name "*Cards.ts" -o -name "*cards.ts" | grep -v "node_modules"').toString();
      this.cardFiles = result.split('\n').filter(file => file.trim().length > 0);
      
      // Also find mechanic files
      const mechanicsResult = execSync('find . -name "*Effect*.ts" -o -name "*Mechanic*.ts" | grep -v "node_modules"').toString();
      this.mechanicFiles = mechanicsResult.split('\n').filter(file => file.trim().length > 0);
    } catch (error) {
      console.error('Error finding card files:', error);
      this.cardFiles = [];
      this.mechanicFiles = [];
    }
  }
  
  /**
   * Load and parse card definitions from all card files
   */
  private loadCardDefinitions(): void {
    for (const file of this.cardFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // Simple regex to extract card objects
        const cardRegex = /{\s*id:\s*(\d+),\s*name:\s*["']([^"']+)["']/g;
        let match: RegExpExecArray | null;
        
        while ((match = cardRegex.exec(content)) !== null) {
          try {
            // Extract the card object text
            const startIndex = match.index;
            if (startIndex === undefined) continue;
            
            let bracketCount = 1;
            let endIndex = startIndex + 1;
            
            while (bracketCount > 0 && endIndex < content.length) {
              if (content[endIndex] === '{') bracketCount++;
              if (content[endIndex] === '}') bracketCount--;
              endIndex++;
            }
            
            const cardText = content.substring(startIndex, endIndex);
            
            // Extract basic properties using regex
            const id = parseInt(cardText.match(/id:\s*(\d+)/)?.[1] || '0');
            const name = cardText.match(/name:\s*["']([^"']+)["']/)?.[1] || '';
            const classMatch = cardText.match(/class:\s*["']([^"']+)["']/);
            const heroClassMatch = cardText.match(/heroClass:\s*["']([^"']+)["']/);
            const costMatch = cardText.match(/cost:\s*(\d+)/);
            const typeMatch = cardText.match(/type:\s*["']([^"']+)["']/);
            
            const card: CardDefinition = {
              id,
              name,
              cost: costMatch ? parseInt(costMatch[1]) : 0,
              type: (typeMatch?.[1] || 'minion') as 'minion' | 'spell' | 'weapon'
            };
            
            if (classMatch) {
              card.class = classMatch[1];
              this.context.classCounts[card.class] = (this.context.classCounts[card.class] || 0) + 1;
            }
            
            if (heroClassMatch) {
              card.heroClass = heroClassMatch[1];
            }
            
            const attackMatch = cardText.match(/attack:\s*(\d+)/);
            if (attackMatch) {
              card.attack = parseInt(attackMatch[1]);
            }
            
            const healthMatch = cardText.match(/health:\s*(\d+)/);
            if (healthMatch) {
              card.health = parseInt(healthMatch[1]);
            }
            
            const rarityMatch = cardText.match(/rarity:\s*["']([^"']+)["']/);
            if (rarityMatch) {
              card.rarity = rarityMatch[1];
            }
            
            const collectibleMatch = cardText.match(/collectible:\s*(true|false)/);
            if (collectibleMatch) {
              card.collectible = collectibleMatch[1] === 'true';
            }
            
            // Add to cards array
            this.context.cards.push(card);
          } catch (cardError) {
            console.error('Error parsing card:', cardError);
          }
        }
      } catch (fileError) {
        console.error(`Error processing card file ${file}:`, fileError);
      }
    }
  }
  
  /**
   * Analyze game mechanics from mechanic files
   */
  private analyzeMechanics(): void {
    const mechanics = new Set<string>();
    
    for (const file of this.mechanicFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // Look for effect type definitions
        const effectRegex = /effect(?:Type)?:\s*["']([^"']+)["']/g;
        let effectMatch: RegExpExecArray | null;
        
        while ((effectMatch = effectRegex.exec(content)) !== null) {
          if (effectMatch[1]) {
            mechanics.add(effectMatch[1]);
          }
        }
        
        // Look for mechanic implementations
        const mechanicRegex = /class\s+(\w+(?:Effect|Mechanic))/g;
        let mechanicMatch: RegExpExecArray | null;
        
        while ((mechanicMatch = mechanicRegex.exec(content)) !== null) {
          if (mechanicMatch[1]) {
            mechanics.add(mechanicMatch[1]);
          }
        }
      } catch (error) {
        console.error(`Error analyzing mechanics in ${file}:`, error);
      }
    }
    
    this.context.mechanics = Array.from(mechanics);
  }
  
  /**
   * Fetch recent changes in the codebase
   */
  private fetchRecentChanges(): void {
    try {
      const result = execSync('git log --pretty=format:"%s" -n 10').toString();
      this.context.recentChanges = result.split('\n').filter(line => line.trim().length > 0);
    } catch (error) {
      console.error('Error getting recent changes:', error);
      this.context.recentChanges = [];
    }
  }
  
  /**
   * Get the complete codebase context
   */
  public getContext(): CodebaseContext {
    return this.context;
  }
  
  /**
   * Search for cards by name, class, or other properties
   */
  public searchCards(query: string, options: any = {}): CardDefinition[] {
    const queryLower = query.toLowerCase();
    
    return this.context.cards.filter(card => {
      // Match by name
      if (card.name.toLowerCase().includes(queryLower)) {
        return true;
      }
      
      // Match by class
      if (card.class && card.class.toLowerCase().includes(queryLower)) {
        return true;
      }
      
      // Match by heroClass
      if (card.heroClass && card.heroClass.toLowerCase().includes(queryLower)) {
        return true;
      }
      
      // Match by type
      if (card.type.toLowerCase().includes(queryLower)) {
        return true;
      }
      
      return false;
    });
  }
  
  /**
   * Get cards by class
   */
  public getCardsByClass(className: string): CardDefinition[] {
    return this.context.cards.filter(card => 
      (card.class && card.class.toLowerCase() === className.toLowerCase()) ||
      (card.heroClass && card.heroClass.toLowerCase() === className.toLowerCase())
    );
  }
  
  /**
   * Get class distribution statistics
   */
  public getClassDistribution(): Record<string, number> {
    return this.context.classCounts;
  }
  
  /**
   * Get all mechanics
   */
  public getMechanics(): string[] {
    return this.context.mechanics;
  }
  
  /**
   * Access recent changes
   */
  public getRecentChangesList(): string[] {
    return this.context.recentChanges;
  }
  
  /**
   * Analyze card balance for a given class
   */
  public analyzeClassBalance(className: string): any {
    const cards = this.getCardsByClass(className);
    
    if (cards.length === 0) {
      return { error: `No cards found for class "${className}"` };
    }
    
    // Calculate average stats
    const minions = cards.filter(card => card.type === 'minion');
    const spells = cards.filter(card => card.type === 'spell');
    const weapons = cards.filter(card => card.type === 'weapon');
    
    // Calculate average stats by cost
    const statsByCost: Record<number, { count: number, totalAttack: number, totalHealth: number }> = {};
    
    for (const minion of minions) {
      if (minion.attack === undefined || minion.health === undefined) continue;
      
      const cost = minion.cost;
      if (!statsByCost[cost]) {
        statsByCost[cost] = { count: 0, totalAttack: 0, totalHealth: 0 };
      }
      
      statsByCost[cost].count++;
      statsByCost[cost].totalAttack += minion.attack;
      statsByCost[cost].totalHealth += minion.health;
    }
    
    // Calculate averages
    const averagesByCost: Record<number, { avgAttack: number, avgHealth: number }> = {};
    
    for (const [cost, stats] of Object.entries(statsByCost)) {
      if (stats.count === 0) continue;
      
      averagesByCost[parseInt(cost)] = {
        avgAttack: stats.totalAttack / stats.count,
        avgHealth: stats.totalHealth / stats.count
      };
    }
    
    return {
      className,
      cardCount: cards.length,
      distribution: {
        minions: minions.length,
        spells: spells.length,
        weapons: weapons.length
      },
      averagesByCost
    };
  }
  
  /**
   * Analyze card balance for multiple card IDs
   */
  public analyzeCardBalance(cardIds: number[] | string[]): any {
    const cards = this.context.cards.filter(card => 
      cardIds.includes(card.id.toString()) || cardIds.includes(card.id)
    );
    
    if (cards.length === 0) {
      return { error: 'No matching cards found' };
    }
    
    // Group by class
    const classCounts: Record<string, number> = {};
    const typeDistribution: Record<string, number> = {};
    
    for (const card of cards) {
      // Count by class
      const cardClass = card.class || card.heroClass || 'Neutral';
      classCounts[cardClass] = (classCounts[cardClass] || 0) + 1;
      
      // Count by type
      typeDistribution[card.type] = (typeDistribution[card.type] || 0) + 1;
    }
    
    // Calculate average stats
    const minions = cards.filter(card => card.type === 'minion');
    let totalAttack = 0;
    let totalHealth = 0;
    
    for (const minion of minions) {
      if (minion.attack !== undefined) totalAttack += minion.attack;
      if (minion.health !== undefined) totalHealth += minion.health;
    }
    
    const avgAttack = minions.length > 0 ? totalAttack / minions.length : 0;
    const avgHealth = minions.length > 0 ? totalHealth / minions.length : 0;
    
    return {
      cardCount: cards.length,
      classCounts,
      typeDistribution,
      statsSummary: {
        avgAttack,
        avgHealth,
        avgCost: cards.reduce((sum, card) => sum + card.cost, 0) / cards.length
      }
    };
  }
  
  /**
   * Get card details by ID
   */
  public getCardDetails(cardId: number | string): CardDefinition | null {
    const card = this.context.cards.find(c => 
      c.id.toString() === cardId.toString()
    );
    
    return card || null;
  }
  
  /**
   * Get relevant context based on a query
   */
  public getRelevantContext(query: string): any {
    const queryWords = query.toLowerCase().split(/\s+/);
    
    // Extract class names from the query
    const classNames = [
      'Druid', 'Hunter', 'Mage', 'Paladin', 'Priest',
      'Rogue', 'Shaman', 'Warlock', 'Warrior', 'Neutral',
      // Norse class names
      'Thor', 'Odin', 'Loki', 'Heimdall', 'Freya',
      'Tyr', 'Hel', 'Baldur', 'Njord'
    ].filter(className => 
      queryWords.includes(className.toLowerCase())
    );
    
    // Find relevant cards
    const relevantCards: CardDefinition[] = [];
    
    // Add cards matching the class
    for (const className of classNames) {
      relevantCards.push(...this.getCardsByClass(className));
    }
    
    // Add cards matching keywords in the query
    for (const card of this.context.cards) {
      // Skip if already added
      if (relevantCards.some(c => c.id === card.id)) {
        continue;
      }
      
      // Check if card name matches query words
      const cardNameWords = card.name.toLowerCase().split(/\s+/);
      if (cardNameWords.some(word => queryWords.includes(word))) {
        relevantCards.push(card);
      }
    }
    
    // Limit to a reasonable number
    const limitedCards = relevantCards.slice(0, 20);
    
    // Get class distribution
    const classDistribution = this.getClassDistribution();
    
    // Find mechanics mentioned in the query
    const relevantMechanics = this.context.mechanics.filter(mechanic => 
      queryWords.includes(mechanic.toLowerCase())
    );
    
    return {
      relevantCards: limitedCards,
      classDistribution,
      relevantClasses: classNames,
      relevantMechanics,
      totalCardsInContext: this.context.cards.length
    };
  }
}

export default ThinkToolsContext;