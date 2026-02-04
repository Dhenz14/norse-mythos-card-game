/**
 * Game Log Component
 * 
 * Displays a scrollable log of game events with auto-scrolling capability.
 * Used to show AI simulation progress and game state changes.
 */

import React, { useRef, useEffect } from 'react';

interface GameLogProps {
  entries: string[];
  maxHeight?: string;
  autoScroll?: boolean;
  className?: string;
}

export const GameLog: React.FC<GameLogProps> = ({
  entries,
  maxHeight = '300px',
  autoScroll = true,
  className = ''
}) => {
  const logRef = useRef<HTMLDivElement>(null);
  
  // Ensure entries is always an array to prevent crashes
  const safeEntries = entries || [];
  
  // Auto-scroll to bottom when entries change
  useEffect(() => {
    if (autoScroll && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [safeEntries, autoScroll]);
  
  return (
    <div 
      className={`game-log ${className}`}
      style={{
        backgroundColor: '#f7f7f7',
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        fontSize: '14px',
        maxHeight,
        overflow: 'auto',
        padding: '12px'
      }}
      ref={logRef}
    >
      {safeEntries.length === 0 ? (
        <div className="empty-log" style={{ color: '#999', fontStyle: 'italic' }}>
          No game events recorded yet
        </div>
      ) : (
        <div className="log-entries">
          {safeEntries.map((entry, index) => (
            <div 
              key={`log-${index}`}
              className="log-entry"
              style={{
                borderBottom: index < entries.length - 1 ? '1px solid #eaeaea' : 'none',
                padding: '4px 0',
                color: entry.includes('Error') || entry.includes('Failed') ? '#d32f2f' : 
                      entry.includes('wins') || entry.includes('Win') ? '#2e7d32' :
                      entry.includes('Analysis') ? '#0288d1' : '#333'
              }}
            >
              {entry}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GameLog;