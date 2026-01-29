# New Card Management System

## Overview

We've implemented a new card management system to make adding and managing cards more efficient. This document explains the key components and how to use them.

## Key Benefits

1. **Centralized Card Registry**
   - All cards are stored in a single registry, eliminating duplicate definitions
   - Easier to find and fix issues with card data
   - Better performance through optimized lookups

2. **Type-Safe Card Creation**
   - Fluent API for creating cards that enforces required properties
   - Automatic validation to prevent common errors
   - Clear error messages when cards are missing required data

3. **Powerful Card Filtering**
   - Find cards by category, type, class, keywords, or any combination
   - Custom predicates for advanced filtering scenarios
   - Optimized for performance when dealing with hundreds of cards

4. **Automated Effect Management**
   - Generate effect handler templates with a single command
   - Automatic registration of all handlers during game initialization
   - Consistent pattern for implementing effect logic

5. **Import/Export Capabilities**
   - Import cards from external data formats (JSON, CSV, etc.)
   - Move cards between development environments
   - Share card collections with other developers

## How to Use

### Adding a New Card

Use the card builder API to create new cards:

```typescript
// Inside a card set file
createCard()
  .id(10001)                          // Unique ID
  .name("Frost Elemental")            // Card name
  .manaCost(3)                        // Mana cost
  .attack(3)                          // Attack value
  .health(3)                          // Health value
  .description("Battlecry: Freeze a character.")  // Card text
  .rarity("rare")                     // Rarity (common, rare, epic, legendary)
  .type("minion")                     // Card type (minion, spell, weapon, etc.)
  .heroClass("mage")                  // Class (mage, warrior, etc. or neutral)
  .race("elemental")                  // Minion race/tribe if applicable
  .addKeyword("battlecry")            // Add a keyword
  .battlecry({                        // Define battlecry effect
    type: "freeze",                   // Effect type
    targetType: "any",                // Target type
    requiresTarget: true              // Requires a target
  })
  .addCategory("basic")               // Add a custom category
  .build();                           // Build and register the card
```

### Finding Cards

```typescript
// Get a card by ID
const card = getCardById(10001);

// Get a card by name
const card = getCardByName("Frost Elemental");

// Get all mage cards
const mageCards = getCardsByCategory("mage");

// Get all legendary minions
const legendaryMinions = getCardsByCategories(["legendary", "minion"]);

// Get all spells that cost 4 or less
const cheapSpells = getCardsByPredicate(card => 
  card.type === "spell" && card.manaCost <= 4
);
```

### Creating Effect Handlers

To add a new effect handler:

1. Use the generator script:
   ```bash
   node generate_effect_handler.cjs --type battlecry --name freeze
   ```

2. Implement the handler logic in the generated file.

3. The handler will be automatically registered at game startup.

## Migration Guide

To migrate existing cards to the new system:

1. Use the `import_existing_cards.cjs` script to convert cards automatically:
   ```bash
   node import_existing_cards.cjs
   ```

2. Review the generated card set files in the `client/src/game/data/cardSets` directory.

3. Update your game initialization to use the new system:
   ```typescript
   import { initializeGameResources } from './game/data/initializeGame';
   
   // At application startup
   initializeGameResources();
   ```

## Best Practices

1. **Organize cards by set or category** in separate files
2. **Use meaningful categories** to tag cards for easier filtering
3. **Use the card builder exclusively** instead of creating raw objects
4. **Generate effect handlers** using the provided script
5. **Write tests** for complex effect handlers
6. **Keep card definitions clean** by using the builder's methods instead of direct property assignments

## Future Improvements

1. **Card Collection Editor UI** for managing cards visually
2. **Effect Simulator** for testing effects without running the game
3. **Card Analyzer** to detect balance issues or implementation errors
4. **Card Template System** for creating similar cards quickly