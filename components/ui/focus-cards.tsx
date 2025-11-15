"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

export const Card = React.memo(
  ({
    card,
    index,
    hovered,
    setHovered,
    selected,
    onCardClick,
  }: {
    card: any;
    index: number;
    hovered: number | null;
    setHovered: React.Dispatch<React.SetStateAction<number | null>>;
    selected?: boolean;
    onCardClick?: (index: number) => void;
  }) => (
    <div
      onMouseEnter={() => setHovered(index)}
      onMouseLeave={() => setHovered(null)}
      onClick={() => onCardClick?.(index)}
      className={cn(
        "rounded-lg relative bg-black overflow-hidden h-60 md:h-96 w-full transition-all duration-300 ease-out cursor-pointer",
        hovered !== null && hovered !== index && "blur-sm scale-[0.98]",
        selected && "ring-4 ring-red-600 ring-offset-2 ring-offset-black scale-105"
      )}
    >
      <img
        src={card.src}
        alt={card.title}
        className="object-cover absolute inset-0 w-full h-full"
        style={{ objectFit: 'cover', objectPosition: 'center' }}
      />
      {/* Selected badge in center - positioned absolutely */}
      {selected && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="px-6 py-3 bg-red-600 rounded-full text-white font-bold text-lg uppercase tracking-wider shadow-lg">
            Selected
          </div>
        </div>
      )}
      {/* Title overlay - always visible but subtle when not hovered */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end py-8 px-4 transition-opacity duration-300",
          (hovered === index || selected) ? "opacity-100" : "opacity-60"
        )}
      >
        <div className="text-xl md:text-2xl font-medium bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-200 w-full text-center">
          {card.title}
        </div>
      </div>
      {/* Selection indicator border */}
      {selected && (
        <div className="absolute inset-0 border-4 border-red-600 rounded-lg pointer-events-none shadow-lg shadow-red-600/50" />
      )}
    </div>
  )
);

Card.displayName = "Card";

type Card = {
  title: string;
  src: string;
};

export function FocusCards({ 
  cards, 
  columns, 
  onCardHover,
  selectedIndex,
  onCardClick,
}: { 
  cards: Card[]; 
  columns?: 3 | 4;
  onCardHover?: (index: number | null) => void;
  selectedIndex?: number | null;
  onCardClick?: (index: number) => void;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const gridCols = columns === 4 
    ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4" 
    : "grid-cols-1 md:grid-cols-3";

  const handleHover = (index: number | null) => {
    setHovered(index);
    onCardHover?.(index);
  };

  return (
    <div className={`grid ${gridCols} gap-10 max-w-5xl mx-auto md:px-8 w-full`}>
      {cards.map((card, index) => (
        <Card
          key={card.title}
          card={card}
          index={index}
          hovered={hovered}
          setHovered={handleHover}
          selected={selectedIndex === index}
          onCardClick={onCardClick}
        />
      ))}
    </div>
  );
}
