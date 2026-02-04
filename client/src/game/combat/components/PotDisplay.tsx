import React from 'react';
import type { PokerPosition } from '../../types/PokerCombatTypes';

type PotVariant = 'foe' | 'pot' | 'you';

interface PotSectionProps {
  label: string;
  value: string | number;
  variant: PotVariant;
}

const variantStyles: Record<PotVariant, string> = {
  foe: 'bg-red-950/60 border-red-500/40',
  pot: 'bg-amber-950/50 border-amber-400/50',
  you: 'bg-blue-950/60 border-blue-500/40',
};

const labelColors: Record<PotVariant, string> = {
  foe: 'text-red-300 drop-shadow-[0_0_6px_rgba(248,113,113,0.7)]',
  pot: 'text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]',
  you: 'text-blue-300 drop-shadow-[0_0_6px_rgba(96,165,250,0.7)]',
};

const valueColors: Record<PotVariant, string> = {
  foe: 'text-red-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] drop-shadow-[0_0_8px_rgba(248,113,113,0.9)]',
  pot: 'text-yellow-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] drop-shadow-[0_0_12px_rgba(251,191,36,1)]',
  you: 'text-blue-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] drop-shadow-[0_0_8px_rgba(96,165,250,0.9)]',
};

function PotSection({ label, value, variant }: PotSectionProps) {
  return (
    <div className={`
      flex flex-col items-center justify-center
      px-3 py-2 min-w-[70px]
      rounded-md border
      ${variantStyles[variant]}
    `}>
      <span className={`
        font-serif text-[0.6rem] font-bold uppercase tracking-wider
        ${labelColors[variant]}
      `}>
        {label}
      </span>
      <span className={`
        font-sans text-base font-black
        ${valueColors[variant]}
      `}>
        {value}
      </span>
    </div>
  );
}

function formatPosition(position: PokerPosition): string {
  return position === 'small_blind' ? 'SB' : 'BB';
}

interface PotDisplayProps {
  playerHpCommitted: number;
  opponentHpCommitted: number;
  playerPosition: PokerPosition;
  opponentPosition: PokerPosition;
  pot: number;
  hidden?: boolean;
}

export function PotDisplay({
  playerHpCommitted,
  opponentHpCommitted,
  playerPosition,
  opponentPosition,
  pot,
  hidden = false,
}: PotDisplayProps) {
  const totalPot = pot || (playerHpCommitted + opponentHpCommitted);

  if (hidden) return null;

  return (
    <div className="
      absolute left-[var(--zone-pot-unified-left,15%)] bottom-[var(--zone-pot-unified-bottom,30%)]
      z-[var(--z-pot,35)]
      flex items-center gap-3
      px-4 py-2
      rounded-xl
      bg-gradient-to-b from-slate-950/95 via-slate-900/95 to-slate-950/95
      border border-amber-500/50
      shadow-xl shadow-black/60
      backdrop-blur-sm
    ">
      <PotSection
        label={`FOE (${formatPosition(opponentPosition)})`}
        value={`${opponentHpCommitted} HP`}
        variant="foe"
      />
      <PotSection
        label="POT"
        value={totalPot}
        variant="pot"
      />
      <PotSection
        label={`YOU (${formatPosition(playerPosition)})`}
        value={`${playerHpCommitted} HP`}
        variant="you"
      />
    </div>
  );
}
