import React from 'react';
import NewCardFramePreview from '../game/components/NewCardFramePreview';

/**
 * CardFramePreview Page
 * 
 * This is a simple wrapper for our NewCardFramePreview component.
 * It allows us to use the route defined in the App.tsx file.
 */
const CardFramePreview: React.FC = () => {
  return <NewCardFramePreview />;
};

export default CardFramePreview;