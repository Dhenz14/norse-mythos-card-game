/**
 * Automated Drag System Diagnosis
 * 
 * This script automatically tests the drag system and reports issues.
 * Run this in browser console to get comprehensive diagnosis.
 */

function diagnoseDragSystem() {
  console.log('=== DRAG SYSTEM DIAGNOSTIC ===');
  
  // Test 1: Check if Hand component is rendered
  const handContainer = document.querySelector('.hand-container');
  console.log('1. Hand container found:', !!handContainer);
  
  // Test 2: Count cards in hand
  const cardElements = document.querySelectorAll('.hand-card-container');
  console.log('2. Cards in hand:', cardElements.length);
  
  // Test 3: Check card playability attributes
  cardElements.forEach((card, index) => {
    const canPlay = card.getAttribute('data-can-play');
    const cardName = card.getAttribute('data-card-name');
    console.log(`3.${index + 1} Card "${cardName}": canPlay=${canPlay}`);
  });
  
  // Test 4: Check game state in React DevTools
  const gameBoard = document.querySelector('.game-board, [data-testid="game-board"]');
  console.log('4. Game board found:', !!gameBoard);
  
  // Test 5: Test pointer events on first card
  const firstCard = cardElements[0];
  if (firstCard) {
    const computedStyle = window.getComputedStyle(firstCard);
    console.log('5. First card pointer events:', computedStyle.pointerEvents);
    console.log('5. First card cursor:', computedStyle.cursor);
  }
  
  // Test 6: Check for drag animation component
  const dragComponents = document.querySelectorAll('[class*="drag"]');
  console.log('6. Drag-related elements found:', dragComponents.length);
  
  console.log('=== END DIAGNOSTIC ===');
  
  return {
    hasHand: !!handContainer,
    cardCount: cardElements.length,
    firstCardPlayable: cardElements[0]?.getAttribute('data-can-play') === 'true'
  };
}

// Auto-run diagnosis
diagnoseDragSystem();