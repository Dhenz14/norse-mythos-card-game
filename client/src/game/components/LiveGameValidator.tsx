/**
 * LiveGameValidator.tsx
 * 
 * LIVE GAME TESTING SYSTEM - No separate test environments
 * 
 * This system automatically validates functionality during actual gameplay:
 * - Card interaction performance monitoring
 * - Real-time hover/drag validation
 * - Game mechanics integrity checking
 * - Performance metrics during live play
 * 
 * NO MANUAL TESTING - Everything runs automatically in background
 */

import React, { useEffect, useRef } from 'react';

interface ValidationMetrics {
  cardHoverResponseTime: number;
  dragInitiationTime: number;
  cardPlaySuccess: boolean;
  performanceIssues: string[];
}

const LiveGameValidator: React.FC = () => {
  const metricsRef = useRef<ValidationMetrics>({
    cardHoverResponseTime: 0,
    dragInitiationTime: 0,
    cardPlaySuccess: false,
    performanceIssues: []
  });

  useEffect(() => {
    let hoverStartTime = 0;
    let dragStartTime = 0;

    // LIVE VALIDATION: Card Hover Performance
    const validateCardHover = (e: Event) => {
      const target = e.target as HTMLElement;
      const card = target.closest('.card-with-drag');
      
      if (card) {
        hoverStartTime = performance.now();
        
        // Check cursor change response time
        setTimeout(() => {
          const currentCursor = window.getComputedStyle(card as HTMLElement).cursor;
          const responseTime = performance.now() - hoverStartTime;
          
          metricsRef.current.cardHoverResponseTime = responseTime;
          
          if (responseTime > 50) {
            console.warn(`LIVE VALIDATION: Hover response slow (${responseTime}ms)`);
            metricsRef.current.performanceIssues.push(`Slow hover: ${responseTime}ms`);
          } else {
            console.log(`LIVE VALIDATION: Hover response good (${responseTime}ms)`);
          }
        }, 0);
      }
    };

    // LIVE VALIDATION: Drag Performance
    const validateDragStart = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const card = target.closest('.card-with-drag');
      
      if (card && window.getComputedStyle(card).cursor === 'grab') {
        dragStartTime = performance.now();
      }
    };

    const validateDragMove = (e: MouseEvent) => {
      if (dragStartTime > 0) {
        const dragResponseTime = performance.now() - dragStartTime;
        metricsRef.current.dragInitiationTime = dragResponseTime;
        
        if (dragResponseTime > 100) {
          console.warn(`LIVE VALIDATION: Drag initiation slow (${dragResponseTime}ms)`);
        } else {
          console.log(`LIVE VALIDATION: Drag initiation good (${dragResponseTime}ms)`);
        }
        dragStartTime = 0; // Reset after first measurement
      }
    };

    // LIVE VALIDATION: Card Play Success
    const validateCardPlay = (e: CustomEvent) => {
      const { instanceId } = e.detail;
      
      if (instanceId) {
        metricsRef.current.cardPlaySuccess = true;
        console.log(`LIVE VALIDATION: Card play successful (${instanceId})`);
        
        // Validate no competing systems interfered
        const competingSystems = document.querySelectorAll(
          '[data-hovering], [data-is-hovering], .card-hover, .card-hovered'
        );
        
        if (competingSystems.length > 0) {
          console.warn(`LIVE VALIDATION: ${competingSystems.length} competing hover systems detected`);
          metricsRef.current.performanceIssues.push(`Competing systems: ${competingSystems.length}`);
        }
      }
    };

    // LIVE VALIDATION: Performance Monitoring
    const validatePerformance = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const totalLoadTime = navigation.loadEventEnd - navigation.loadEventStart;
      
      if (totalLoadTime > 3000) {
        console.warn(`LIVE VALIDATION: Page load slow (${totalLoadTime}ms)`);
        metricsRef.current.performanceIssues.push(`Slow load: ${totalLoadTime}ms`);
      }
      
      // Check memory usage
      if ('memory' in performance) {
        const memInfo = (performance as any).memory;
        const memUsage = memInfo.usedJSHeapSize / 1024 / 1024; // MB
        
        if (memUsage > 100) {
          console.warn(`LIVE VALIDATION: High memory usage (${memUsage.toFixed(1)}MB)`);
          metricsRef.current.performanceIssues.push(`High memory: ${memUsage.toFixed(1)}MB`);
        }
      }
    };

    // LIVE VALIDATION: Game State Integrity
    const validateGameState = () => {
      const playerCards = document.querySelectorAll('.player-cards .card-with-drag');
      const battlefieldCards = document.querySelectorAll('.battlefield .card-with-drag');
      
      // Validate card states are consistent
      playerCards.forEach((card, index) => {
        const cardData = card.querySelector('[data-instance-id]');
        if (!cardData) {
          console.warn(`LIVE VALIDATION: Player card ${index} missing instance ID`);
          metricsRef.current.performanceIssues.push(`Missing instance ID: player card ${index}`);
        }
      });
      
      // Report validation summary every 30 seconds
      setTimeout(() => {
        const metrics = metricsRef.current;
        console.log('LIVE VALIDATION SUMMARY:', {
          hoverResponseTime: metrics.cardHoverResponseTime,
          dragTime: metrics.dragInitiationTime,
          cardPlaySuccess: metrics.cardPlaySuccess,
          issues: metrics.performanceIssues.length
        });
        
        // Clear issues for next cycle
        metrics.performanceIssues = [];
      }, 30000);
    };

    // Register live validators
    document.addEventListener('mouseover', validateCardHover);
    document.addEventListener('mousedown', validateDragStart);
    document.addEventListener('mousemove', validateDragMove);
    document.addEventListener('hearthstone-card-play', validateCardPlay as EventListener);
    
    // Start performance monitoring
    const performanceInterval = setInterval(validatePerformance, 10000);
    const gameStateInterval = setInterval(validateGameState, 15000);
    
    console.log('LIVE GAME VALIDATOR: Active - monitoring gameplay in real-time');

    return () => {
      document.removeEventListener('mouseover', validateCardHover);
      document.removeEventListener('mousedown', validateDragStart);
      document.removeEventListener('mousemove', validateDragMove);
      document.removeEventListener('hearthstone-card-play', validateCardPlay as EventListener);
      clearInterval(performanceInterval);
      clearInterval(gameStateInterval);
      
      console.log('LIVE GAME VALIDATOR: Shutdown completed');
    };
  }, []);

  return null; // Invisible background validator
};

export default LiveGameValidator;