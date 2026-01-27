import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { CardData } from '../game/types';
import { ScrollArea } from '../components/ui/scroll-area';
import { Slider } from '../components/ui/slider';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { Badge } from '../components/ui/badge';

interface CardCollectionEditorProps {
  onSave: (cards: CardData[]) => void;
  initialCards: CardData[];
}

const HERO_CLASSES = [
  'neutral',
  'warrior',
  'mage',
  'hunter',
  'paladin',
  'priest',
  'rogue',
  'shaman',
  'warlock',
  'druid',
  'demonhunter'
];

const CARD_TYPES = ['minion', 'spell', 'weapon', 'hero', 'secret'];
const CARD_RARITIES = ['common', 'rare', 'epic', 'legendary'];
const CARD_KEYWORDS = [
  'taunt',
  'divine_shield',
  'charge',
  'rush',
  'lifesteal',
  'poisonous',
  'battlecry',
  'deathrattle',
  'combo',
  'choose_one',
  'discover',
  'enrage',
  'overload',
  'windfury',
  'secret'
];

export default function CardCollectionEditor({ onSave, initialCards }: CardCollectionEditorProps) {
  const [cards, setCards] = useState<CardData[]>(initialCards || []);
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCards, setFilteredCards] = useState<CardData[]>([]);
  const [filters, setFilters] = useState({
    heroClass: '',
    type: '',
    rarity: '',
    keyword: '',
    collectible: null as boolean | null,
    hideNeutral: false,
    minMana: 0,
    maxMana: 10,
  });

  useEffect(() => {
    let filtered = [...cards];

    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (card) =>
          card.name.toLowerCase().includes(term) ||
          (card.description ? card.description.toLowerCase().includes(term) : false) ||
          (card.flavorText && card.flavorText.toLowerCase().includes(term))
      );
    }

    // Apply filters
    if (filters.heroClass) {
      filtered = filtered.filter((card) => card.heroClass === filters.heroClass);
    } else if (filters.hideNeutral) {
      // If no class is selected but hideNeutral is true, exclude neutral cards
      filtered = filtered.filter((card) => card.heroClass !== 'neutral');
    }

    if (filters.type) {
      filtered = filtered.filter((card) => card.type === filters.type);
    }

    if (filters.rarity) {
      filtered = filtered.filter((card) => card.rarity === filters.rarity);
    }

    if (filters.keyword) {
      filtered = filtered.filter(
        (card) => card.keywords && card.keywords.includes(filters.keyword)
      );
    }

    if (filters.collectible !== null) {
      filtered = filtered.filter((card) => !!card.collectible === filters.collectible);
    }

    // Apply mana cost filter
    filtered = filtered.filter(
      (card) => card.manaCost >= filters.minMana && card.manaCost <= filters.maxMana
    );

    setFilteredCards(filtered);
  }, [cards, searchTerm, filters]);

  const handleCardSelect = (card: CardData) => {
    setSelectedCard({ ...card });
  };

  const handleSaveCard = () => {
    if (!selectedCard) return;

    const updatedCards = cards.map((card) =>
      card.id === selectedCard.id ? selectedCard : card
    );
    setCards(updatedCards);
    onSave(updatedCards);
  };

  const handleCreateCard = () => {
    // Generate a new ID that doesn't clash with existing cards
    const highestId = Math.max(...cards.map((card) => card.id), 0);
    const newId = highestId + 1;

    const newCard: CardData = {
      id: newId,
      name: 'New Card',
      manaCost: 1,
      type: 'minion',
      rarity: 'common',
      description: 'Card description',
      keywords: [],
      heroClass: 'neutral',
      collectible: true,
    };

    // Add attack and health for minions
    if (newCard.type === 'minion') {
      (newCard as any).attack = 1;
      (newCard as any).health = 1;
    }

    setCards([...cards, newCard]);
    setSelectedCard(newCard);
  };

  const handleDeleteCard = () => {
    if (!selectedCard) return;
    
    if (!confirm('Are you sure you want to delete this card?')) return;

    const updatedCards = cards.filter((card) => card.id !== selectedCard.id);
    setCards(updatedCards);
    setSelectedCard(null);
    onSave(updatedCards);
  };

  const handleDuplicateCard = () => {
    if (!selectedCard) return;

    // Generate a new ID that doesn't clash with existing cards
    const highestId = Math.max(...cards.map((card) => card.id), 0);
    const newId = highestId + 1;

    const duplicatedCard = {
      ...selectedCard,
      id: newId,
      name: `${selectedCard.name} (Copy)`,
    };

    setCards([...cards, duplicatedCard]);
    setSelectedCard(duplicatedCard);
  };

  const handleFieldChange = (field: string, value: any) => {
    if (!selectedCard) return;

    setSelectedCard({
      ...selectedCard,
      [field]: value,
    });
  };

  const handleKeywordToggle = (keyword: string) => {
    if (!selectedCard) return;

    const keywords = selectedCard.keywords || [];
    const updatedKeywords = keywords.includes(keyword)
      ? keywords.filter((k) => k !== keyword)
      : [...keywords, keyword];

    setSelectedCard({
      ...selectedCard,
      keywords: updatedKeywords,
    });
  };

  const handleEffectChange = (effectType: string, field: string, value: any) => {
    if (!selectedCard) return;

    const effect = selectedCard[effectType] || {};
    const updatedEffect = {
      ...effect,
      [field]: value,
    };

    setSelectedCard({
      ...selectedCard,
      [effectType]: updatedEffect,
    });
  };

  return (
    <div className="grid grid-cols-12 gap-4 p-4 h-screen">
      {/* Left sidebar - Card list */}
      <div className="col-span-3 bg-gray-100 rounded-lg p-4 flex flex-col">
        <h2 className="text-lg font-bold mb-2">Card Collection</h2>
        
        <div className="mb-4">
          <Input
            placeholder="Search cards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-2"
          />
          
          <div className="grid grid-cols-2 gap-2 mb-2">
            <Select
              value={filters.heroClass}
              onValueChange={(value) => setFilters({ ...filters, heroClass: value })}
            >
              <option value="">All Classes</option>
              {HERO_CLASSES.map((heroClass) => (
                <option key={heroClass} value={heroClass}>
                  {heroClass.charAt(0).toUpperCase() + heroClass.slice(1)}
                </option>
              ))}
            </Select>
            
            <Select
              value={filters.type}
              onValueChange={(value) => setFilters({ ...filters, type: value })}
            >
              <option value="">All Types</option>
              {CARD_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mb-2">
            <Select
              value={filters.rarity}
              onValueChange={(value) => setFilters({ ...filters, rarity: value })}
            >
              <option value="">All Rarities</option>
              {CARD_RARITIES.map((rarity) => (
                <option key={rarity} value={rarity}>
                  {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                </option>
              ))}
            </Select>
            
            <Select
              value={filters.keyword}
              onValueChange={(value) => setFilters({ ...filters, keyword: value })}
            >
              <option value="">All Keywords</option>
              {CARD_KEYWORDS.map((keyword) => (
                <option key={keyword} value={keyword}>
                  {keyword
                    .split('_')
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(' ')}
                </option>
              ))}
            </Select>
          </div>
          
          <div className="mb-2">
            <Label>Mana Cost Range: {filters.minMana} - {filters.maxMana}</Label>
            <div className="flex items-center gap-2">
              <span>0</span>
              <Slider
                defaultValue={[filters.minMana, filters.maxMana]}
                min={0}
                max={10}
                step={1}
                onValueChange={(value) => 
                  setFilters({ 
                    ...filters, 
                    minMana: value[0], 
                    maxMana: value[1] 
                  })
                }
                className="flex-1"
              />
              <span>10</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 mb-2">
            <Switch
              id="collectible-switch"
              checked={filters.collectible === true}
              onCheckedChange={(checked) => 
                setFilters({ 
                  ...filters, 
                  collectible: filters.collectible === null 
                    ? true 
                    : (filters.collectible === true ? false : null) 
                })
              }
            />
            <Label htmlFor="collectible-switch">
              {filters.collectible === null 
                ? 'All Cards' 
                : (filters.collectible ? 'Collectible Only' : 'Non-collectible Only')}
            </Label>
          </div>
          
          <div className="flex items-center space-x-2 mb-4">
            <Switch
              id="hide-neutral-switch"
              checked={filters.hideNeutral}
              onCheckedChange={(checked) => 
                setFilters({ 
                  ...filters, 
                  hideNeutral: checked 
                })
              }
            />
            <Label htmlFor="hide-neutral-switch">
              {filters.hideNeutral ? 'Hide Neutral Cards' : 'Show Neutral Cards'}
            </Label>
          </div>
        </div>
        
        <ScrollArea className="flex-1 -mx-2">
          <div className="space-y-1">
            {filteredCards.map((card) => (
              <div
                key={card.id}
                className={`px-3 py-2 rounded cursor-pointer hover:bg-gray-200 ${
                  selectedCard?.id === card.id ? 'bg-blue-100 border-l-4 border-blue-500' : ''
                }`}
                onClick={() => handleCardSelect(card)}
              >
                <div className="flex justify-between">
                  <span className="font-medium">{card.name}</span>
                  <span className="text-sm text-gray-500">{card.manaCost}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-600">
                  <span>{card.type}</span>
                  <span>{card.heroClass}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <div className="flex gap-2 mt-4">
          <Button onClick={handleCreateCard} variant="outline" className="flex-1">
            Create New
          </Button>
          <Button onClick={() => onSave(cards)} variant="default" className="flex-1">
            Save All
          </Button>
        </div>
      </div>

      {/* Main content - Card editor */}
      <div className="col-span-6 bg-white rounded-lg p-4 flex flex-col">
        {selectedCard ? (
          <>
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold">Edit Card</h2>
              <div className="space-x-2">
                <Button onClick={handleDuplicateCard} variant="outline" size="sm">
                  Duplicate
                </Button>
                <Button onClick={handleDeleteCard} variant="destructive" size="sm">
                  Delete
                </Button>
                <Button onClick={handleSaveCard} variant="default" size="sm">
                  Save Changes
                </Button>
              </div>
            </div>

            <Tabs defaultValue="basic">
              <TabsList className="mb-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="effects">Effects</TabsTrigger>
                <TabsTrigger value="appearance">Appearance</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Card Name</Label>
                    <Input
                      id="name"
                      value={selectedCard.name}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="manaCost">Mana Cost</Label>
                    <Input
                      id="manaCost"
                      type="number"
                      min="0"
                      max="10"
                      value={selectedCard.manaCost}
                      onChange={(e) => handleFieldChange('manaCost', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Card Type</Label>
                    <Select
                      value={selectedCard.type}
                      onValueChange={(value) => handleFieldChange('type', value)}
                    >
                      {CARD_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="heroClass">Hero Class</Label>
                    <Select
                      value={selectedCard.heroClass}
                      onValueChange={(value) => handleFieldChange('heroClass', value)}
                    >
                      {HERO_CLASSES.map((heroClass) => (
                        <option key={heroClass} value={heroClass}>
                          {heroClass.charAt(0).toUpperCase() + heroClass.slice(1)}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rarity">Rarity</Label>
                    <Select
                      value={selectedCard.rarity}
                      onValueChange={(value) => handleFieldChange('rarity', value)}
                    >
                      {CARD_RARITIES.map((rarity) => (
                        <option key={rarity} value={rarity}>
                          {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2 mt-6">
                    <Switch
                      id="collectible-edit"
                      checked={!!selectedCard.collectible}
                      onCheckedChange={(checked) => handleFieldChange('collectible', checked)}
                    />
                    <Label htmlFor="collectible-edit">Collectible</Label>
                  </div>
                </div>

                {selectedCard.type === 'minion' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="attack">Attack</Label>
                      <Input
                        id="attack"
                        type="number"
                        min="0"
                        value={selectedCard.attack || 0}
                        onChange={(e) => handleFieldChange('attack', parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="health">Health</Label>
                      <Input
                        id="health"
                        type="number"
                        min="1"
                        value={selectedCard.health || 1}
                        onChange={(e) => handleFieldChange('health', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                )}

                {selectedCard.type === 'weapon' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="attack">Attack</Label>
                      <Input
                        id="attack"
                        type="number"
                        min="0"
                        value={selectedCard.attack || 0}
                        onChange={(e) => handleFieldChange('attack', parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="durability">Durability</Label>
                      <Input
                        id="durability"
                        type="number"
                        min="1"
                        value={selectedCard.durability || 1}
                        onChange={(e) => handleFieldChange('durability', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    className="w-full p-2 border rounded"
                    rows={3}
                    value={selectedCard.description}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="flavorText">Flavor Text</Label>
                  <textarea
                    id="flavorText"
                    className="w-full p-2 border rounded"
                    rows={2}
                    value={selectedCard.flavorText || ''}
                    onChange={(e) => handleFieldChange('flavorText', e.target.value)}
                  />
                </div>

                <div>
                  <Label>Keywords</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {CARD_KEYWORDS.map((keyword) => (
                      <Badge
                        key={keyword}
                        variant={
                          selectedCard.keywords && selectedCard.keywords.includes(keyword)
                            ? 'default'
                            : 'outline'
                        }
                        className="cursor-pointer"
                        onClick={() => handleKeywordToggle(keyword)}
                      >
                        {keyword
                          .split('_')
                          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                          .join(' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="effects" className="space-y-4">
                <Accordion type="single" collapsible>
                  {selectedCard.keywords?.includes('battlecry') && (
                    <AccordionItem value="battlecry">
                      <AccordionTrigger>Battlecry Effect</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 p-2">
                          <div>
                            <Label htmlFor="battlecry-type">Effect Type</Label>
                            <Select
                              value={selectedCard.battlecry?.type || ''}
                              onValueChange={(value) => handleEffectChange('battlecry', 'type', value)}
                            >
                              <option value="">Select Type</option>
                              <option value="draw">Draw Cards</option>
                              <option value="damage">Deal Damage</option>
                              <option value="heal">Heal</option>
                              <option value="buff">Buff</option>
                              <option value="summon">Summon</option>
                              <option value="transform">Transform</option>
                              <option value="discover">Discover</option>
                              <option value="armor">Gain Armor</option>
                              <option value="conditional_buff">Conditional Buff</option>
                              <option value="gain_armor_equal_to_attack">Gain Armor Equal to Attack</option>
                              <option value="gain_armor_conditional_draw">Gain Armor, Conditional Draw</option>
                              <option value="buff_weapon">Buff Weapon</option>
                              <option value="equip_weapon_from_deck_gain_armor">Equip Weapon From Deck</option>
                            </Select>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="battlecry-target">Requires Target</Label>
                              <div className="flex items-center space-x-2 mt-2">
                                <Switch
                                  id="battlecry-target"
                                  checked={!!selectedCard.battlecry?.requiresTarget}
                                  onCheckedChange={(checked) =>
                                    handleEffectChange('battlecry', 'requiresTarget', checked)
                                  }
                                />
                                <Label htmlFor="battlecry-target">
                                  {selectedCard.battlecry?.requiresTarget ? 'Yes' : 'No'}
                                </Label>
                              </div>
                            </div>

                            {selectedCard.battlecry?.requiresTarget && (
                              <div>
                                <Label htmlFor="battlecry-target-type">Target Type</Label>
                                <Select
                                  value={selectedCard.battlecry?.targetType || 'any'}
                                  onValueChange={(value) =>
                                    handleEffectChange('battlecry', 'targetType', value)
                                  }
                                >
                                  <option value="any">Any Character</option>
                                  <option value="minion">Any Minion</option>
                                  <option value="friendly_minion">Friendly Minion</option>
                                  <option value="enemy_minion">Enemy Minion</option>
                                  <option value="hero">Any Hero</option>
                                  <option value="friendly_hero">Friendly Hero</option>
                                  <option value="enemy_hero">Enemy Hero</option>
                                </Select>
                              </div>
                            )}
                          </div>

                          {selectedCard.battlecry?.type === 'damage' && (
                            <div>
                              <Label htmlFor="battlecry-value">Damage Amount</Label>
                              <Input
                                id="battlecry-value"
                                type="number"
                                min="0"
                                value={selectedCard.battlecry?.value || 0}
                                onChange={(e) =>
                                  handleEffectChange(
                                    'battlecry',
                                    'value',
                                    parseInt(e.target.value)
                                  )
                                }
                              />
                            </div>
                          )}

                          {selectedCard.battlecry?.type === 'heal' && (
                            <div>
                              <Label htmlFor="battlecry-value">Heal Amount</Label>
                              <Input
                                id="battlecry-value"
                                type="number"
                                min="0"
                                value={selectedCard.battlecry?.value || 0}
                                onChange={(e) =>
                                  handleEffectChange(
                                    'battlecry',
                                    'value',
                                    parseInt(e.target.value)
                                  )
                                }
                              />
                            </div>
                          )}

                          {selectedCard.battlecry?.type === 'draw' && (
                            <div>
                              <Label htmlFor="battlecry-value">Cards to Draw</Label>
                              <Input
                                id="battlecry-value"
                                type="number"
                                min="0"
                                max="10"
                                value={selectedCard.battlecry?.value || 0}
                                onChange={(e) =>
                                  handleEffectChange(
                                    'battlecry',
                                    'value',
                                    parseInt(e.target.value)
                                  )
                                }
                              />
                            </div>
                          )}

                          {selectedCard.battlecry?.type === 'buff' && (
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="battlecry-buff-attack">Attack Buff</Label>
                                <Input
                                  id="battlecry-buff-attack"
                                  type="number"
                                  value={selectedCard.battlecry?.buffAttack || 0}
                                  onChange={(e) =>
                                    handleEffectChange(
                                      'battlecry',
                                      'buffAttack',
                                      parseInt(e.target.value)
                                    )
                                  }
                                />
                              </div>
                              <div>
                                <Label htmlFor="battlecry-buff-health">Health Buff</Label>
                                <Input
                                  id="battlecry-buff-health"
                                  type="number"
                                  value={selectedCard.battlecry?.buffHealth || 0}
                                  onChange={(e) =>
                                    handleEffectChange(
                                      'battlecry',
                                      'buffHealth',
                                      parseInt(e.target.value)
                                    )
                                  }
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {selectedCard.keywords?.includes('deathrattle') && (
                    <AccordionItem value="deathrattle">
                      <AccordionTrigger>Deathrattle Effect</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 p-2">
                          <div>
                            <Label htmlFor="deathrattle-type">Effect Type</Label>
                            <Select
                              value={selectedCard.deathrattle?.type || ''}
                              onValueChange={(value) => handleEffectChange('deathrattle', 'type', value)}
                            >
                              <option value="">Select Type</option>
                              <option value="draw">Draw Cards</option>
                              <option value="damage">Deal Damage</option>
                              <option value="summon">Summon</option>
                              <option value="buff">Buff</option>
                            </Select>
                          </div>

                          {selectedCard.deathrattle?.type === 'summon' && (
                            <>
                              <div>
                                <Label htmlFor="deathrattle-value">Number to Summon</Label>
                                <Input
                                  id="deathrattle-value"
                                  type="number"
                                  min="1"
                                  max="7"
                                  value={selectedCard.deathrattle?.value || 1}
                                  onChange={(e) =>
                                    handleEffectChange(
                                      'deathrattle',
                                      'value',
                                      parseInt(e.target.value)
                                    )
                                  }
                                />
                              </div>
                              <div>
                                <Label htmlFor="deathrattle-summon-card">Card ID to Summon</Label>
                                <Input
                                  id="deathrattle-summon-card"
                                  type="number"
                                  value={selectedCard.deathrattle?.summonCardId || 0}
                                  onChange={(e) =>
                                    handleEffectChange(
                                      'deathrattle',
                                      'summonCardId',
                                      parseInt(e.target.value)
                                    )
                                  }
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {selectedCard.type === 'spell' && (
                    <AccordionItem value="spellEffect">
                      <AccordionTrigger>Spell Effect</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 p-2">
                          <div>
                            <Label htmlFor="spell-type">Effect Type</Label>
                            <Select
                              value={selectedCard.spellEffect?.type || ''}
                              onValueChange={(value) => handleEffectChange('spellEffect', 'type', value)}
                            >
                              <option value="">Select Type</option>
                              <option value="damage">Deal Damage</option>
                              <option value="heal">Heal</option>
                              <option value="draw">Draw Cards</option>
                              <option value="armor">Gain Armor</option>
                              <option value="buff">Buff</option>
                              <option value="transform">Transform</option>
                              <option value="destroy">Destroy</option>
                              <option value="summon">Summon</option>
                              <option value="discover">Discover</option>
                              <option value="aoe_damage">AOE Damage</option>
                              <option value="set_health">Set Health</option>
                              <option value="gain_armor_reduce_cost">Gain Armor, Reduce Cost</option>
                              <option value="damage_with_self_damage">Damage with Self Damage</option>
                              <option value="damage_based_on_armor">Damage Based on Armor</option>
                              <option value="buff_damaged_minions">Buff Damaged Minions</option>
                              <option value="draw_weapon_gain_armor">Draw Weapon, Gain Armor</option>
                              <option value="gain_armor_reduce_hero_power">Gain Armor, Reduce Hero Power</option>
                              <option value="cleave_damage">Cleave Damage</option>
                              <option value="armor_based_on_missing_health">Armor Based on Missing Health</option>
                              <option value="equip_special_weapon">Equip Special Weapon</option>
                            </Select>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="spell-target">Requires Target</Label>
                              <div className="flex items-center space-x-2 mt-2">
                                <Switch
                                  id="spell-target"
                                  checked={!!selectedCard.spellEffect?.requiresTarget}
                                  onCheckedChange={(checked) =>
                                    handleEffectChange('spellEffect', 'requiresTarget', checked)
                                  }
                                />
                                <Label htmlFor="spell-target">
                                  {selectedCard.spellEffect?.requiresTarget ? 'Yes' : 'No'}
                                </Label>
                              </div>
                            </div>

                            {selectedCard.spellEffect?.requiresTarget && (
                              <div>
                                <Label htmlFor="spell-target-type">Target Type</Label>
                                <Select
                                  value={selectedCard.spellEffect?.targetType || 'any'}
                                  onValueChange={(value) =>
                                    handleEffectChange('spellEffect', 'targetType', value)
                                  }
                                >
                                  <option value="any">Any Character</option>
                                  <option value="minion">Any Minion</option>
                                  <option value="friendly_minion">Friendly Minion</option>
                                  <option value="enemy_minion">Enemy Minion</option>
                                  <option value="hero">Any Hero</option>
                                  <option value="friendly_hero">Friendly Hero</option>
                                  <option value="enemy_hero">Enemy Hero</option>
                                  <option value="all_enemy_minions">All Enemy Minions</option>
                                  <option value="all_friendly_minions">All Friendly Minions</option>
                                </Select>
                              </div>
                            )}
                          </div>

                          {(selectedCard.spellEffect?.type === 'damage' || 
                            selectedCard.spellEffect?.type === 'heal' || 
                            selectedCard.spellEffect?.type === 'draw' || 
                            selectedCard.spellEffect?.type === 'armor') && (
                            <div>
                              <Label htmlFor="spell-value">
                                {selectedCard.spellEffect?.type === 'damage' ? 'Damage Amount' :
                                 selectedCard.spellEffect?.type === 'heal' ? 'Heal Amount' :
                                 selectedCard.spellEffect?.type === 'draw' ? 'Cards to Draw' :
                                 'Armor Amount'}
                              </Label>
                              <Input
                                id="spell-value"
                                type="number"
                                min="0"
                                value={selectedCard.spellEffect?.value || 0}
                                onChange={(e) =>
                                  handleEffectChange(
                                    'spellEffect',
                                    'value',
                                    parseInt(e.target.value)
                                  )
                                }
                              />
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                </Accordion>
              </TabsContent>

              <TabsContent value="appearance" className="space-y-4">
                <div>
                  <Label htmlFor="card-art">Card Art URL</Label>
                  <Input
                    id="card-art"
                    value={selectedCard.cardArtUrl || ''}
                    onChange={(e) => handleFieldChange('cardArtUrl', e.target.value)}
                    placeholder="URL to card artwork (optional)"
                  />
                </div>

                {selectedCard.type === 'minion' && (
                  <div>
                    <Label htmlFor="race">Minion Race/Type</Label>
                    <Select
                      value={selectedCard.race || ''}
                      onValueChange={(value) => handleFieldChange('race', value)}
                    >
                      <option value="">None</option>
                      <option value="beast">Beast</option>
                      <option value="demon">Demon</option>
                      <option value="dragon">Dragon</option>
                      <option value="elemental">Elemental</option>
                      <option value="mech">Mech</option>
                      <option value="murloc">Murloc</option>
                      <option value="pirate">Pirate</option>
                      <option value="totem">Totem</option>
                    </Select>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <div>
                  <Label htmlFor="card-id">Card ID</Label>
                  <Input
                    id="card-id"
                    type="number"
                    value={selectedCard.id}
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    The card ID is used as a unique identifier and cannot be changed after creation.
                  </p>
                </div>

                <div>
                  <Label htmlFor="json-view">Card JSON</Label>
                  <textarea
                    id="json-view"
                    className="w-full p-2 border rounded font-mono text-sm"
                    rows={12}
                    value={JSON.stringify(selectedCard, null, 2)}
                    readOnly
                  />
                </div>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p className="text-xl">Select a card from the list to edit</p>
            <p className="mt-2">or</p>
            <Button onClick={handleCreateCard} variant="outline" className="mt-2">
              Create New Card
            </Button>
          </div>
        )}
      </div>

      {/* Right sidebar - Card preview */}
      <div className="col-span-3 bg-gray-100 rounded-lg p-4">
        <h2 className="text-lg font-bold mb-4">Card Preview</h2>
        
        {selectedCard && (
          <div className="card-preview">
            <div className="relative w-64 h-96 mx-auto bg-amber-100 rounded-xl overflow-hidden shadow-lg border-4 border-amber-800">
              {/* Card frame */}
              <div className="absolute inset-0 bg-gradient-to-b from-amber-200 to-amber-100 z-0" />
              
              {/* Card header */}
              <div className="relative z-10 p-3 flex justify-between items-center bg-amber-800 text-white">
                <h3 className="font-bold">{selectedCard.name}</h3>
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold">
                  {selectedCard.manaCost}
                </div>
              </div>
              
              {/* Card image placeholder */}
              <div className="relative z-10 h-36 bg-gray-300 flex items-center justify-center">
                {selectedCard.cardArtUrl ? (
                  <img
                    src={selectedCard.cardArtUrl}
                    alt={selectedCard.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-500">Card Art</span>
                )}
              </div>
              
              {/* Card type and class */}
              <div className="relative z-10 p-2 bg-amber-700 text-white flex justify-between text-xs">
                <span>
                  {selectedCard.type.charAt(0).toUpperCase() + selectedCard.type.slice(1)}
                  {selectedCard.race ? ` - ${selectedCard.race}` : ''}
                </span>
                <span>
                  {selectedCard.heroClass.charAt(0).toUpperCase() + selectedCard.heroClass.slice(1)}
                </span>
              </div>
              
              {/* Card stats for minions/weapons */}
              {(selectedCard.type === 'minion' || selectedCard.type === 'weapon') && (
                <div className="relative z-10 p-2 flex justify-between">
                  <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center font-bold text-white">
                    {selectedCard.attack || 0}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center font-bold text-white">
                    {selectedCard.type === 'minion' ? selectedCard.health || 1 : selectedCard.durability || 1}
                  </div>
                </div>
              )}
              
              {/* Card description */}
              <div className="relative z-10 p-3 text-center">
                {selectedCard.keywords && selectedCard.keywords.length > 0 && (
                  <div className="mb-2">
                    {selectedCard.keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="inline-block bg-amber-800 text-white text-xs px-2 py-1 rounded mr-1 mb-1"
                      >
                        {keyword
                          .split('_')
                          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                          .join(' ')}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-sm">{selectedCard.description}</p>
              </div>
              
              {/* Card rarity indicator */}
              <div
                className={`absolute bottom-2 right-2 w-4 h-4 rounded-full z-20 ${
                  selectedCard.rarity === 'common' ? 'bg-gray-400' :
                  selectedCard.rarity === 'rare' ? 'bg-blue-500' :
                  selectedCard.rarity === 'epic' ? 'bg-purple-600' :
                  'bg-orange-500' // legendary
                }`}
              />
            </div>
            
            {/* Card stats summary */}
            <div className="mt-4 p-3 bg-white rounded shadow">
              <h4 className="font-bold mb-2">Card Stats</h4>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
                <div className="text-gray-600">ID:</div>
                <div>{selectedCard.id}</div>
                
                <div className="text-gray-600">Type:</div>
                <div>{selectedCard.type}</div>
                
                <div className="text-gray-600">Class:</div>
                <div>{selectedCard.heroClass}</div>
                
                <div className="text-gray-600">Rarity:</div>
                <div>{selectedCard.rarity}</div>
                
                <div className="text-gray-600">Collectible:</div>
                <div>{selectedCard.collectible ? 'Yes' : 'No'}</div>
                
                {selectedCard.race && (
                  <>
                    <div className="text-gray-600">Race:</div>
                    <div>{selectedCard.race}</div>
                  </>
                )}
                
                {selectedCard.type === 'minion' && (
                  <>
                    <div className="text-gray-600">Stats:</div>
                    <div>{selectedCard.attack || 0}/{selectedCard.health || 0}</div>
                  </>
                )}
                
                {selectedCard.type === 'weapon' && (
                  <>
                    <div className="text-gray-600">Stats:</div>
                    <div>{selectedCard.attack || 0}/{selectedCard.durability || 0}</div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}