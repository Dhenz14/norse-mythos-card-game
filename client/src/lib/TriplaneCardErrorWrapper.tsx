/**
 * TriplaneCardErrorWrapper.tsx
 * 
 * A specialized error boundary specifically designed for handling 3D card rendering errors.
 * This component provides detailed error diagnostics and ensures that card rendering
 * failures do not crash the entire application.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import SimpleCard3D from '../game/components/3D/SimpleCard3D';
import { CardData } from '../game/types';

interface Props {
  children: ReactNode;
  fallbackCard?: CardData;
  position?: [number, number, number];
  scale?: [number, number, number];
  hoverable?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorType: 'shader' | 'texture' | 'geometry' | 'unknown';
}

// Default fallback card if none provided
const defaultCard: CardData = {
  id: 10004,
  name: 'Error Card',
  manaCost: 0,
  attack: 0,
  health: 0,
  type: 'Minion',
  rarity: 'common',
  class: 'Neutral',
  description: 'An error occurred while rendering this card.',
  collectible: false
};

class TriplaneCardErrorWrapper extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorType: 'unknown'
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Analyze error type for better handling
    let errorType: State['errorType'] = 'unknown';
    
    if (error.message?.includes('shader') || error.message?.includes('uniform') || error.message?.includes('attribute')) {
      errorType = 'shader';
    } else if (error.message?.includes('texture') || error.message?.includes('image')) {
      errorType = 'texture';
    } else if (error.message?.includes('geometry') || error.message?.includes('mesh')) {
      errorType = 'geometry';
    }
    
    return {
      hasError: true,
      error,
      errorType
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    console.error('TriplaneCard rendering error:', error);
    console.error('Component stack:', errorInfo.componentStack);
  }

  render(): ReactNode {
    const { hasError, error, errorType } = this.state;
    const { children, fallbackCard = defaultCard, position = [0, 0, 0], scale = [1, 1, 1], hoverable = false } = this.props;

    if (hasError) {
      console.log(`Rendering fallback card due to ${errorType} error`);
      
      // Return fallback simple card
      return (
        <SimpleCard3D
          card={fallbackCard}
          position={position}
          scale={scale}
          hoverable={hoverable}
        />
      );
    }

    return children;
  }
}

export default TriplaneCardErrorWrapper;