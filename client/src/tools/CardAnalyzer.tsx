import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { CardData } from '../game/types';
import { ScrollArea } from '../components/ui/scroll-area';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { Select } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Progress } from '../components/ui/progress';
import { CircleDot, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

// Analysis criteria values
const BALANCE_CRITERIA = {
  STATS_PER_MANA: {
    MINION: {
      LOW: 1.5, // Combined stats per mana is suspiciously low
      IDEAL: 2.0, // Baseline value (e.g., a 2/2 for 2 mana)
      HIGH: 2.5, // Higher than average value
      VERY_HIGH: 3.0, // Potentially overpowered
    },
    SPELL_DAMAGE: {
      LOW: 0.5, // Damage per mana is low
      IDEAL: 1.0, // Baseline value (e.g., 3 damage for 3 mana)
      HIGH: 1.5, // Higher than average value
      VERY_HIGH: 2.0, // Potentially overpowered
    },
    SPELL_HEAL: {
      LOW: 1.0, // Healing per mana is low
      IDEAL: 1.5, // Baseline value
      HIGH: 2.0, // Higher than average value
      VERY_HIGH: 3.0, // Potentially overpowered
    },
  },
  KEYWORD_VALUES: {
    taunt: 0.5,
    divine_shield: 1.0,
    charge: 1.5,
    rush: 0.5,
    windfury: 1.0,
    lifesteal: 1.0,
    poisonous: 1.5,
    stealth: 0.7,
    battlecry: 0.3, // Base value, actual effect is analyzed separately
    deathrattle: 0.3, // Base value, actual effect is analyzed separately
  },
};

interface CardAnalyzerProps {
  cards: CardData[];
}

interface AnalysisResult {
  id: number;
  cardName: string;
  manaCost: number;
  heroClass: string;
  type: string;
  rarity: string;
  score: number;
  rating: 'underpowered' | 'balanced' | 'strong' | 'overpowered';
  issues: string[];
  recommendations: string[];
}

interface StatDistribution {
  byClass: Record<string, number>;
  byType: Record<string, number>;
  byRarity: Record<string, number>;
  byManaCost: Record<number, number>;
}

export default function CardAnalyzer({ cards }: CardAnalyzerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<AnalysisResult[]>([]);
  const [statisticsData, setStatisticsData] = useState<any>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [filters, setFilters] = useState({
    heroClass: '',
    rarity: '',
    rating: '',
    minManaCost: '',
    maxManaCost: '',
  });
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
  const [selectedResult, setSelectedResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    let filtered = [...analysisResults];

    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((result) =>
        result.cardName.toLowerCase().includes(term) ||
        result.issues.some((issue) => issue.toLowerCase().includes(term)) ||
        result.recommendations.some((rec) => rec.toLowerCase().includes(term))
      );
    }

    // Apply filters
    if (filters.heroClass) {
      filtered = filtered.filter((result) => result.heroClass === filters.heroClass);
    }

    if (filters.rarity) {
      filtered = filtered.filter((result) => result.rarity === filters.rarity);
    }

    if (filters.rating) {
      filtered = filtered.filter((result) => result.rating === filters.rating);
    }

    if (filters.minManaCost) {
      filtered = filtered.filter((result) => result.manaCost >= parseInt(filters.minManaCost));
    }

    if (filters.maxManaCost) {
      filtered = filtered.filter((result) => result.manaCost <= parseInt(filters.maxManaCost));
    }

    setFilteredResults(filtered);
  }, [analysisResults, searchTerm, filters]);

  const handleSelectResult = (result: AnalysisResult) => {
    setSelectedResult(result);
    setSelectedCardId(result.id);
    setSelectedCard(cards.find((card) => card.id === result.id) || null);
  };

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setProgress(0);

    // Create a copy to avoid state mutations during analysis
    const cardsToAnalyze = [...cards];
    const results: AnalysisResult[] = [];
    
    // Collect card statistics for balance analysis
    const statistics = {
      totalCards: cardsToAnalyze.length,
      minions: cardsToAnalyze.filter((card) => card.type === 'minion').length,
      spells: cardsToAnalyze.filter((card) => card.type === 'spell').length,
      weapons: cardsToAnalyze.filter((card) => card.type === 'weapon').length,
      heroes: cardsToAnalyze.filter((card) => card.type === 'hero').length,
      keywordCounts: {} as Record<string, number>,
      manaDistribution: {} as Record<number, number>,
      classDistribution: {} as Record<string, number>,
      rarityDistribution: {} as Record<string, number>,
      averageStats: {
        minion: Array(11).fill(0).map(() => ({ count: 0, attack: 0, health: 0 })),
        spellDamage: Array(11).fill(0).map(() => ({ count: 0, value: 0 })),
        spellHeal: Array(11).fill(0).map(() => ({ count: 0, value: 0 })),
      },
    };

    // Perform the actual analysis
    for (let i = 0; i < cardsToAnalyze.length; i++) {
      const card = cardsToAnalyze[i];
      
      // Update progress
      setProgress(Math.round((i / cardsToAnalyze.length) * 100));
      
      // Only analyze collectible cards
      if (!card.collectible) continue;
      
      // Collect statistics
      updateStatistics(card, statistics);
      
      // Analyze the card
      const result = analyzeCard(card, statistics);
      results.push(result);
      
      // Simulate processing delay if needed
      // await new Promise(resolve => setTimeout(resolve, 1));
    }

    setAnalysisResults(results);
    setFilteredResults(results);
    
    // Process statistics
    const processedStats = processStatistics(statistics);
    setStatisticsData(processedStats);
    
    setIsAnalyzing(false);
    setProgress(100);
  };

  const updateStatistics = (card: CardData, statistics: any) => {
    // Update mana distribution
    if (!statistics.manaDistribution[card.manaCost]) {
      statistics.manaDistribution[card.manaCost] = 0;
    }
    statistics.manaDistribution[card.manaCost]++;

    // Update class distribution
    if (!statistics.classDistribution[card.heroClass]) {
      statistics.classDistribution[card.heroClass] = 0;
    }
    statistics.classDistribution[card.heroClass]++;

    // Update rarity distribution
    if (!statistics.rarityDistribution[card.rarity]) {
      statistics.rarityDistribution[card.rarity] = 0;
    }
    statistics.rarityDistribution[card.rarity]++;

    // Update keyword statistics
    if (card.keywords) {
      card.keywords.forEach((keyword) => {
        if (!statistics.keywordCounts[keyword]) {
          statistics.keywordCounts[keyword] = 0;
        }
        statistics.keywordCounts[keyword]++;
      });
    }

    // Update average stats based on card type
    if (card.type === 'minion' && typeof card.attack === 'number' && typeof card.health === 'number') {
      // Ensure mana cost index is valid
      const manaCostIndex = Math.min(card.manaCost, 10);
      statistics.averageStats.minion[manaCostIndex].count++;
      statistics.averageStats.minion[manaCostIndex].attack += card.attack;
      statistics.averageStats.minion[manaCostIndex].health += card.health;
    } else if (card.type === 'spell' && card.spellEffect) {
      const manaCostIndex = Math.min(card.manaCost, 10);
      
      if (card.spellEffect.type === 'damage' && typeof card.spellEffect.value === 'number') {
        statistics.averageStats.spellDamage[manaCostIndex].count++;
        statistics.averageStats.spellDamage[manaCostIndex].value += card.spellEffect.value;
      } else if (card.spellEffect.type === 'heal' && typeof card.spellEffect.value === 'number') {
        statistics.averageStats.spellHeal[manaCostIndex].count++;
        statistics.averageStats.spellHeal[manaCostIndex].value += card.spellEffect.value;
      }
    }
  };

  const processStatistics = (statistics: any) => {
    const processedStats = {
      ...statistics,
      averageMinionStats: statistics.averageStats.minion.map((statInfo: any, mana: number) => {
        if (statInfo.count === 0) return { mana, avgAttack: 0, avgHealth: 0, total: 0 };
        return {
          mana,
          avgAttack: statInfo.attack / statInfo.count,
          avgHealth: statInfo.health / statInfo.count,
          total: (statInfo.attack + statInfo.health) / statInfo.count,
        };
      }),
      averageSpellDamage: statistics.averageStats.spellDamage.map((statInfo: any, mana: number) => {
        if (statInfo.count === 0) return { mana, avgValue: 0 };
        return {
          mana,
          avgValue: statInfo.value / statInfo.count,
        };
      }),
      averageSpellHeal: statistics.averageStats.spellHeal.map((statInfo: any, mana: number) => {
        if (statInfo.count === 0) return { mana, avgValue: 0 };
        return {
          mana,
          avgValue: statInfo.value / statInfo.count,
        };
      }),
    };

    return processedStats;
  };

  const analyzeCard = (card: CardData, statistics: any): AnalysisResult => {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 5.0; // Start with a neutral score
    
    // Basic card info for the result
    const result: AnalysisResult = {
      id: card.id,
      cardName: card.name,
      manaCost: card.manaCost,
      heroClass: card.heroClass,
      type: card.type,
      rarity: card.rarity,
      score: 5.0,
      rating: 'balanced',
      issues: [],
      recommendations: [],
    };
    
    // Analyze minion stats
    if (card.type === 'minion' && typeof card.attack === 'number' && typeof card.health === 'number') {
      const totalStats = card.attack + card.health;
      const statsPerMana = card.manaCost > 0 ? totalStats / card.manaCost : totalStats;
      
      // Add keyword values to the evaluation
      let keywordValue = 0;
      if (card.keywords) {
        card.keywords.forEach((keyword) => {
          if (BALANCE_CRITERIA.KEYWORD_VALUES[keyword as keyof typeof BALANCE_CRITERIA.KEYWORD_VALUES]) {
            keywordValue += BALANCE_CRITERIA.KEYWORD_VALUES[keyword as keyof typeof BALANCE_CRITERIA.KEYWORD_VALUES];
          }
        });
      }
      
      // Adjusted stats value including keywords
      const adjustedStatsPerMana = statsPerMana + keywordValue / card.manaCost;
      
      // Compare to criteria
      const { LOW, IDEAL, HIGH, VERY_HIGH } = BALANCE_CRITERIA.STATS_PER_MANA.MINION;
      
      if (adjustedStatsPerMana < LOW) {
        score -= 1.5;
        issues.push(`Underpowered: Combined stats (${totalStats}) plus keyword value (${keywordValue}) are too low for ${card.manaCost} mana.`);
        recommendations.push(`Consider increasing stats to at least ${Math.ceil(LOW * card.manaCost)} combined points.`);
      } else if (adjustedStatsPerMana < IDEAL) {
        score -= 0.5;
        issues.push(`Slightly weak: Combined stats (${totalStats}) plus keyword value (${keywordValue}) are below average for ${card.manaCost} mana.`);
      } else if (adjustedStatsPerMana > VERY_HIGH) {
        score += 2.0;
        issues.push(`Potentially overpowered: Combined stats (${totalStats}) plus keyword value (${keywordValue}) are very high for ${card.manaCost} mana.`);
        recommendations.push(`Consider reducing stats or increasing mana cost.`);
      } else if (adjustedStatsPerMana > HIGH) {
        score += 1.0;
        issues.push(`Strong: Combined stats (${totalStats}) plus keyword value (${keywordValue}) are above average for ${card.manaCost} mana.`);
      }
      
      // Check for extreme stat distributions
      if (card.attack > 2 * card.health) {
        issues.push(`Extreme stat distribution: Attack (${card.attack}) is more than twice the Health (${card.health}).`);
      } else if (card.health > 2 * card.attack && card.attack > 0) {
        issues.push(`Extreme stat distribution: Health (${card.health}) is more than twice the Attack (${card.attack}).`);
      }
    }
    
    // Analyze spell effects
    if (card.type === 'spell' && card.spellEffect) {
      // Analyze damage spells
      if (card.spellEffect.type === 'damage' && typeof card.spellEffect.value === 'number') {
        const damagePerMana = card.manaCost > 0 ? card.spellEffect.value / card.manaCost : card.spellEffect.value;
        const { LOW, IDEAL, HIGH, VERY_HIGH } = BALANCE_CRITERIA.STATS_PER_MANA.SPELL_DAMAGE;
        
        // Adjust based on targeting
        let targetingMultiplier = 1.0;
        if (card.spellEffect.targetType === 'all_enemy_minions' || card.spellEffect.targetType === 'all_minions') {
          targetingMultiplier = 0.7; // AOE damage should be less efficient per target
        } else if (card.spellEffect.targetType === 'enemy_hero') {
          targetingMultiplier = 0.8; // Direct face damage should be less efficient
        }
        
        const adjustedDamagePerMana = damagePerMana * targetingMultiplier;
        
        if (adjustedDamagePerMana < LOW) {
          score -= 1.0;
          issues.push(`Weak damage: ${card.spellEffect.value} damage is low for ${card.manaCost} mana.`);
          recommendations.push(`Consider increasing damage to at least ${Math.ceil(LOW * card.manaCost / targetingMultiplier)}.`);
        } else if (adjustedDamagePerMana < IDEAL) {
          score -= 0.5;
          issues.push(`Slightly inefficient damage: ${card.spellEffect.value} damage is slightly below average for ${card.manaCost} mana.`);
        } else if (adjustedDamagePerMana > VERY_HIGH) {
          score += 2.0;
          issues.push(`Very high damage: ${card.spellEffect.value} damage is potentially too efficient for ${card.manaCost} mana.`);
          recommendations.push(`Consider reducing damage or increasing mana cost.`);
        } else if (adjustedDamagePerMana > HIGH) {
          score += 1.0;
          issues.push(`Strong damage: ${card.spellEffect.value} damage is above average for ${card.manaCost} mana.`);
        }
      }
      
      // Analyze healing spells
      if (card.spellEffect.type === 'heal' && typeof card.spellEffect.value === 'number') {
        const healPerMana = card.manaCost > 0 ? card.spellEffect.value / card.manaCost : card.spellEffect.value;
        const { LOW, IDEAL, HIGH, VERY_HIGH } = BALANCE_CRITERIA.STATS_PER_MANA.SPELL_HEAL;
        
        if (healPerMana < LOW) {
          score -= 1.0;
          issues.push(`Weak healing: ${card.spellEffect.value} healing is low for ${card.manaCost} mana.`);
          recommendations.push(`Consider increasing healing to at least ${Math.ceil(LOW * card.manaCost)}.`);
        } else if (healPerMana < IDEAL) {
          score -= 0.5;
          issues.push(`Slightly inefficient healing: ${card.spellEffect.value} healing is slightly below average for ${card.manaCost} mana.`);
        } else if (healPerMana > VERY_HIGH) {
          score += 1.5;
          issues.push(`Very high healing: ${card.spellEffect.value} healing is potentially too efficient for ${card.manaCost} mana.`);
          recommendations.push(`Consider reducing healing or increasing mana cost.`);
        } else if (healPerMana > HIGH) {
          score += 0.5;
          issues.push(`Strong healing: ${card.spellEffect.value} healing is above average for ${card.manaCost} mana.`);
        }
      }
      
      // Analyze card draw
      if (card.spellEffect.type === 'draw' && typeof card.spellEffect.value === 'number') {
        // Base cost for card draw: roughly 1.5 mana per card
        const expectedManaCost = card.spellEffect.value * 1.5;
        
        if (card.manaCost < expectedManaCost - 1) {
          score += 1.5;
          issues.push(`Efficient card draw: Drawing ${card.spellEffect.value} cards for ${card.manaCost} mana is potentially too efficient.`);
          recommendations.push(`Consider increasing mana cost to ${Math.ceil(expectedManaCost)}.`);
        } else if (card.manaCost > expectedManaCost + 1) {
          score -= 1.0;
          issues.push(`Inefficient card draw: Drawing ${card.spellEffect.value} cards for ${card.manaCost} mana is overcosted.`);
          recommendations.push(`Consider reducing mana cost to ${Math.floor(expectedManaCost)}.`);
        }
      }
    }
    
    // Analyze complexity
    if (
      (card.battlecry && Object.keys(card.battlecry).length > 3) ||
      (card.deathrattle && Object.keys(card.deathrattle).length > 3) ||
      (card.spellEffect && Object.keys(card.spellEffect).length > 4)
    ) {
      issues.push('High complexity: This card has many effect properties which may make it difficult to understand.');
      recommendations.push('Consider simplifying the card effect or splitting it into multiple cards.');
    }
    
    // Check for rarity-appropriate complexity
    if (card.rarity === 'common' && card.keywords && card.keywords.length > 2) {
      issues.push(`Unusual for rarity: Common cards typically have fewer keywords (${card.keywords.length} found).`);
      recommendations.push('Consider reducing the number of keywords or increasing the rarity.');
    }
    
    // Set final score and rating
    result.score = Math.max(0, Math.min(10, score));
    
    if (result.score < 4.0) {
      result.rating = 'underpowered';
    } else if (result.score < 6.0) {
      result.rating = 'balanced';
    } else if (result.score < 8.0) {
      result.rating = 'strong';
    } else {
      result.rating = 'overpowered';
    }
    
    result.issues = issues;
    result.recommendations = recommendations;
    
    // If no issues found, add a positive note
    if (issues.length === 0) {
      result.issues.push('No balance issues detected.');
    }
    
    return result;
  };

  return (
    <div className="grid grid-cols-12 gap-4 p-4 h-screen">
      {/* Left sidebar - Controls and filters */}
      <div className="col-span-3 bg-gray-100 rounded-lg p-4 flex flex-col">
        <h2 className="text-lg font-bold mb-2">Card Analyzer</h2>
        
        {isAnalyzing ? (
          <div className="text-center py-6">
            <h3 className="mb-2">Analyzing {cards.length} cards...</h3>
            <Progress value={progress} className="mb-2" />
            <p className="text-sm text-gray-500">{progress}% complete</p>
          </div>
        ) : (
          <>
            <Button onClick={runAnalysis} className="mb-4" variant="default">
              Run Balance Analysis
            </Button>
            
            {analysisResults.length > 0 && (
              <div className="space-y-4">
                <Input
                  placeholder="Search results..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mb-2"
                />
                
                <div className="space-y-2">
                  <Label>Hero Class</Label>
                  <Select
                    value={filters.heroClass}
                    onValueChange={(value) => setFilters({ ...filters, heroClass: value })}
                  >
                    <option value="">All Classes</option>
                    <option value="neutral">Neutral</option>
                    <option value="warrior">Warrior</option>
                    <option value="mage">Mage</option>
                    <option value="hunter">Hunter</option>
                    <option value="paladin">Paladin</option>
                    <option value="priest">Priest</option>
                    <option value="rogue">Rogue</option>
                    <option value="shaman">Shaman</option>
                    <option value="warlock">Warlock</option>
                    <option value="druid">Druid</option>
                    <option value="demonhunter">Demon Hunter</option>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Rarity</Label>
                  <Select
                    value={filters.rarity}
                    onValueChange={(value) => setFilters({ ...filters, rarity: value })}
                  >
                    <option value="">All Rarities</option>
                    <option value="common">Common</option>
                    <option value="rare">Rare</option>
                    <option value="epic">Epic</option>
                    <option value="legendary">Legendary</option>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Balance Rating</Label>
                  <Select
                    value={filters.rating}
                    onValueChange={(value) => setFilters({ ...filters, rating: value })}
                  >
                    <option value="">All Ratings</option>
                    <option value="underpowered">Underpowered</option>
                    <option value="balanced">Balanced</option>
                    <option value="strong">Strong</option>
                    <option value="overpowered">Overpowered</option>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>Min Mana</Label>
                    <Select
                      value={filters.minManaCost}
                      onValueChange={(value) => setFilters({ ...filters, minManaCost: value })}
                    >
                      <option value="">Any</option>
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                        <option key={`min-${value}`} value={value.toString()}>
                          {value}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Max Mana</Label>
                    <Select
                      value={filters.maxManaCost}
                      onValueChange={(value) => setFilters({ ...filters, maxManaCost: value })}
                    >
                      <option value="">Any</option>
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                        <option key={`max-${value}`} value={value.toString()}>
                          {value}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
                
                <div className="border-t pt-2 mt-4">
                  <h3 className="font-semibold mb-2">Analysis Summary</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Total analyzed:</span>
                      <span>{analysisResults.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Underpowered:</span>
                      <span>{analysisResults.filter((r) => r.rating === 'underpowered').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Balanced:</span>
                      <span>{analysisResults.filter((r) => r.rating === 'balanced').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Strong:</span>
                      <span>{analysisResults.filter((r) => r.rating === 'strong').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Overpowered:</span>
                      <span>{analysisResults.filter((r) => r.rating === 'overpowered').length}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Middle content - Results list */}
      <div className="col-span-4 bg-white rounded-lg p-4 flex flex-col">
        <h2 className="text-lg font-bold mb-2">Analysis Results</h2>
        
        {analysisResults.length > 0 ? (
          <ScrollArea className="flex-1 -mx-2">
            <div className="space-y-2 p-2">
              {filteredResults.map((result) => (
                <div
                  key={result.id}
                  className={`p-3 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedResult?.id === result.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => handleSelectResult(result)}
                >
                  <div className="flex justify-between items-center">
                    <div className="font-medium">{result.cardName}</div>
                    <div className="text-sm text-gray-500">
                      {result.manaCost} Mana {result.type}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-2">
                    <div className="text-sm">
                      {result.heroClass}, {result.rarity}
                    </div>
                    <Badge
                      variant={
                        result.rating === 'underpowered'
                          ? 'destructive'
                          : result.rating === 'balanced'
                          ? 'outline'
                          : result.rating === 'strong'
                          ? 'secondary'
                          : 'default'
                      }
                    >
                      {result.rating.charAt(0).toUpperCase() + result.rating.slice(1)}
                    </Badge>
                  </div>
                  
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`rounded-full h-1.5 ${
                          result.rating === 'underpowered'
                            ? 'bg-red-500'
                            : result.rating === 'balanced'
                            ? 'bg-green-500'
                            : result.rating === 'strong'
                            ? 'bg-yellow-500'
                            : 'bg-purple-500'
                        }`}
                        style={{ width: `${(result.score / 10) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredResults.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No results match your current filters.
                </div>
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <p className="text-xl mb-2">No analysis results yet</p>
            <p className="text-sm">Click "Run Balance Analysis" to start</p>
          </div>
        )}
      </div>

      {/* Right content - Detailed result view */}
      <div className="col-span-5 bg-gray-100 rounded-lg p-4 flex flex-col">
        <h2 className="text-lg font-bold mb-2">Detailed Analysis</h2>
        
        {selectedResult ? (
          <Tabs defaultValue="balance" className="flex-1 flex flex-col">
            <TabsList className="mb-4">
              <TabsTrigger value="balance">Balance Analysis</TabsTrigger>
              <TabsTrigger value="card">Card Details</TabsTrigger>
              <TabsTrigger value="suggestions">Improvement Suggestions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="balance" className="flex-1 overflow-auto">
              <Card className="p-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold">{selectedResult.cardName}</h3>
                    <div className="flex items-center">
                      <span className="mr-2">Score: {selectedResult.score.toFixed(1)}/10</span>
                      {selectedResult.rating === 'underpowered' && (
                        <XCircle className="text-red-500" size={20} />
                      )}
                      {selectedResult.rating === 'balanced' && (
                        <CheckCircle className="text-green-500" size={20} />
                      )}
                      {selectedResult.rating === 'strong' && (
                        <AlertCircle className="text-yellow-500" size={20} />
                      )}
                      {selectedResult.rating === 'overpowered' && (
                        <CircleDot className="text-purple-500" size={20} />
                      )}
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`rounded-full h-2.5 ${
                        selectedResult.rating === 'underpowered'
                          ? 'bg-red-500'
                          : selectedResult.rating === 'balanced'
                          ? 'bg-green-500'
                          : selectedResult.rating === 'strong'
                          ? 'bg-yellow-500'
                          : 'bg-purple-500'
                      }`}
                      style={{ width: `${(selectedResult.score / 10) * 100}%` }}
                    ></div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="bg-white p-2 rounded">
                      <div className="text-gray-500">Mana Cost</div>
                      <div className="font-semibold">{selectedResult.manaCost}</div>
                    </div>
                    <div className="bg-white p-2 rounded">
                      <div className="text-gray-500">Type</div>
                      <div className="font-semibold">{selectedResult.type}</div>
                    </div>
                    <div className="bg-white p-2 rounded">
                      <div className="text-gray-500">Class</div>
                      <div className="font-semibold">{selectedResult.heroClass}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Balance Issues</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedResult.issues.map((issue, index) => (
                        <li key={index} className="text-sm">
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {selectedResult.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Recommendations</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {selectedResult.recommendations.map((recommendation, index) => (
                          <li key={index} className="text-sm">
                            {recommendation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500 mt-4">
                    <p>
                      This analysis is based on statistical averages and established game design
                      patterns. Individual cards may have unique synergies or contexts that
                      affect their actual balance.
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>
            
            <TabsContent value="card" className="flex-1 overflow-auto">
              {selectedCard && (
                <Card className="p-4">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <h3 className="text-xl font-bold">{selectedCard.name}</h3>
                      <div>
                        <Badge variant="outline">{selectedCard.manaCost} Mana</Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-sm text-gray-500">Type</h4>
                        <div>{selectedCard.type}</div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-gray-500">Class</h4>
                        <div>{selectedCard.heroClass}</div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-gray-500">Rarity</h4>
                        <div>{selectedCard.rarity}</div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-gray-500">Collectible</h4>
                        <div>{selectedCard.collectible ? 'Yes' : 'No'}</div>
                      </div>
                    </div>
                    
                    {selectedCard.type === 'minion' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-sm text-gray-500">Attack</h4>
                          <div>{selectedCard.attack}</div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-gray-500">Health</h4>
                          <div>{selectedCard.health}</div>
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="font-semibold text-sm text-gray-500">Description</h4>
                      <div className="bg-gray-100 p-2 rounded mt-1">{selectedCard.description}</div>
                    </div>
                    
                    {selectedCard.keywords && selectedCard.keywords.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm text-gray-500">Keywords</h4>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedCard.keywords.map((keyword) => (
                            <Badge key={keyword} variant="secondary">
                              {keyword
                                .split('_')
                                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                                .join(' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Card effect details */}
                    {selectedCard.battlecry && (
                      <div>
                        <h4 className="font-semibold text-sm text-gray-500">Battlecry</h4>
                        <pre className="bg-gray-100 p-2 rounded mt-1 text-xs overflow-auto max-h-40">
                          {JSON.stringify(selectedCard.battlecry, null, 2)}
                        </pre>
                      </div>
                    )}
                    
                    {selectedCard.deathrattle && (
                      <div>
                        <h4 className="font-semibold text-sm text-gray-500">Deathrattle</h4>
                        <pre className="bg-gray-100 p-2 rounded mt-1 text-xs overflow-auto max-h-40">
                          {JSON.stringify(selectedCard.deathrattle, null, 2)}
                        </pre>
                      </div>
                    )}
                    
                    {selectedCard.spellEffect && (
                      <div>
                        <h4 className="font-semibold text-sm text-gray-500">Spell Effect</h4>
                        <pre className="bg-gray-100 p-2 rounded mt-1 text-xs overflow-auto max-h-40">
                          {JSON.stringify(selectedCard.spellEffect, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="suggestions" className="flex-1 overflow-auto">
              <Card className="p-4">
                <div className="space-y-4">
                  <h3 className="font-semibold">Balance Improvement Suggestions</h3>
                  
                  {selectedResult.recommendations.length > 0 ? (
                    <>
                      <div className="space-y-2">
                        {selectedResult.recommendations.map((recommendation, index) => (
                          <div
                            key={index}
                            className="bg-white border-l-4 border-blue-500 p-3 rounded shadow-sm"
                          >
                            {recommendation}
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-6">
                        <h4 className="font-semibold mb-2">Balance Adjustment Options</h4>
                        <div className="space-y-2">
                          {selectedResult.rating === 'underpowered' && (
                            <>
                              <div className="p-2 border border-gray-200 rounded">
                                <div className="font-medium">Option 1: Improve Stats</div>
                                <p className="text-sm text-gray-600 mt-1">
                                  Increase the stats or effect values to match the mana cost.
                                </p>
                              </div>
                              <div className="p-2 border border-gray-200 rounded">
                                <div className="font-medium">Option 2: Reduce Mana Cost</div>
                                <p className="text-sm text-gray-600 mt-1">
                                  Lower the mana cost to better align with the card's power level.
                                </p>
                              </div>
                              <div className="p-2 border border-gray-200 rounded">
                                <div className="font-medium">Option 3: Add Keywords or Effects</div>
                                <p className="text-sm text-gray-600 mt-1">
                                  Add useful keywords or additional effects to increase the card's value.
                                </p>
                              </div>
                            </>
                          )}
                          
                          {selectedResult.rating === 'overpowered' && (
                            <>
                              <div className="p-2 border border-gray-200 rounded">
                                <div className="font-medium">Option 1: Reduce Stats</div>
                                <p className="text-sm text-gray-600 mt-1">
                                  Decrease the stats or effect values to better balance the card.
                                </p>
                              </div>
                              <div className="p-2 border border-gray-200 rounded">
                                <div className="font-medium">Option 2: Increase Mana Cost</div>
                                <p className="text-sm text-gray-600 mt-1">
                                  Raise the mana cost to better reflect the card's power level.
                                </p>
                              </div>
                              <div className="p-2 border border-gray-200 rounded">
                                <div className="font-medium">Option 3: Add Drawbacks</div>
                                <p className="text-sm text-gray-600 mt-1">
                                  Add limitations or negative effects to balance the strong benefits.
                                </p>
                              </div>
                            </>
                          )}
                          
                          {selectedResult.rating === 'strong' && (
                            <div className="p-2 border border-gray-200 rounded">
                              <div className="font-medium">Consider Minor Adjustments</div>
                              <p className="text-sm text-gray-600 mt-1">
                                This card is strong but may not need significant changes. Minor tweaks could
                                bring it closer to the ideal balance point without making it uninteresting.
                              </p>
                            </div>
                          )}
                          
                          {selectedResult.rating === 'balanced' && (
                            <div className="p-2 border border-green-100 rounded bg-green-50">
                              <div className="font-medium">Well Balanced</div>
                              <p className="text-sm text-gray-600 mt-1">
                                This card appears to be well balanced and doesn't require significant changes.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <p>No specific recommendations - this card appears to be well balanced.</p>
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <p className="text-xl">Select a card from the results list</p>
            <p className="text-sm mt-2">
              Run analysis and click on a result to view detailed information
            </p>
          </div>
        )}
      </div>
    </div>
  );
}