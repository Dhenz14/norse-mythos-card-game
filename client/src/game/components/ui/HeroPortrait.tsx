import React from 'react';

interface HeroPortraitProps {
  heroId?: string;
  name: string;
  portrait?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  borderColor?: string;
}

const SIZE_CLASSES = {
  xs: 'w-8 h-8 text-sm',
  sm: 'w-12 h-12 text-xl',
  md: 'w-16 h-16 text-2xl',
  lg: 'w-20 h-20 text-3xl',
  xl: 'w-28 h-28 text-4xl',
};

export function HeroPortrait({
  heroId,
  name,
  portrait,
  size = 'md',
  className = '',
  borderColor = 'border-gray-500',
}: HeroPortraitProps) {
  const sizeClasses = SIZE_CLASSES[size];
  const initial = name?.charAt(0) || '?';

  return (
    <div
      className={`
        ${sizeClasses}
        rounded-full
        flex items-center justify-center
        font-bold
        border-2 ${borderColor}
        overflow-hidden
        bg-gradient-to-br from-gray-700 to-gray-900
        ${className}
      `}
    >
      {portrait ? (
        <img
          src={portrait}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
          }}
        />
      ) : null}
      <span className={portrait ? 'hidden' : 'text-gray-300'}>{initial}</span>
    </div>
  );
}

export function getHeroPortraitPath(heroId: string): string | undefined {
  const PORTRAIT_MAP: Record<string, string> = {
    'king-ymir': '/portraits/kings/ymir.png',
    'hero-thor': '/portraits/heroes/thor.png',
  };
  return PORTRAIT_MAP[heroId];
}
