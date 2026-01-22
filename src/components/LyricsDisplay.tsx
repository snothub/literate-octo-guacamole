import { Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import type { LyricLine } from '../types/spotify';

type LyricsDisplayProps = {
  lyrics: LyricLine[];
  lyricsLoading: boolean;
  progress: number;
  containerRef: React.RefObject<HTMLDivElement>;
  className?: string;
  heightClassName?: string;
  onLineClick?: (timeMs: number) => void;
};

export const LyricsDisplay = ({
  lyrics,
  lyricsLoading,
  progress,
  containerRef,
  className,
  heightClassName,
  onLineClick,
}: LyricsDisplayProps) => {
  const [textSize, setTextSize] = useState<-2 | -1 | 0 | 1 | 2>(0);
  const containerClassName = className ?? 'max-w-4xl mx-auto';
  const heightClass = heightClassName ?? 'h-32';
  
  const increaseSize = () => setTextSize((prev) => Math.min(prev + 1, 2));
  const decreaseSize = () => setTextSize((prev) => Math.max(prev - 1, -2));
  
  // Calculate text sizes based on textSize state
  const getCurrentSize = () => {
    const sizes = {
      '-2': 'text-lg',
      '-1': 'text-xl',
      '0': 'text-2xl',
      '1': 'text-3xl',
      '2': 'text-4xl',
    };
    return sizes[textSize as keyof typeof sizes] || 'text-2xl';
  };
  
  const getInactiveSize = () => {
    const sizes = {
      '-2': 'text-xs',
      '-1': 'text-sm',
      '0': 'text-base',
      '1': 'text-lg',
      '2': 'text-xl',
    };
    return sizes[textSize as keyof typeof sizes] || 'text-base';
  };
  
  if (lyricsLoading) {
    return (
      <div className={`${containerClassName} px-4 py-3 ${heightClass} flex items-center justify-center`}>
        <p className="text-gray-400 text-sm font-semibold">Loading lyrics...</p>
      </div>
    );
  }

  if (!lyricsLoading && lyrics.length === 0) {
    return (
      <div className={`${containerClassName} px-4 py-3 ${heightClass} flex items-center justify-center`}>
        <p className="text-gray-500 text-sm font-semibold">No synced lyrics available</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Text Size Controls */}
      <div className="absolute top-2 right-4 z-10 flex gap-1">
        <button
          onClick={decreaseSize}
          disabled={textSize <= -2}
          className="p-1.5 bg-gray-800/90 hover:bg-gray-700/90 text-white rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg border border-gray-700/50"
          title="Decrease text size"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={increaseSize}
          disabled={textSize >= 2}
          className="p-1.5 bg-gray-800/90 hover:bg-gray-700/90 text-white rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg border border-gray-700/50"
          title="Increase text size"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      
      <div
        ref={containerRef}
        className={`${containerClassName} px-4 py-3 ${heightClass} overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-900 scrollbar-track-transparent`}
      >
        <div className="space-y-2">
          {lyrics.map((line, index) => {
            const isCurrentLine =
              progress >= line.time && (index === lyrics.length - 1 || progress < lyrics[index + 1]?.time);

            return (
              <p
                key={index}
                className={`text-center transition-all duration-300 break-words ${
                  isCurrentLine
                    ? `text-white font-extrabold ${getCurrentSize()} scale-105 drop-shadow-lg`
                    : `text-gray-400 ${getInactiveSize()} font-bold`
                } ${onLineClick ? 'cursor-pointer hover:text-white' : ''}`}
                onClick={() => onLineClick?.(line.time)}
              >
                {line.text}
              </p>
            );
          })}
        </div>
      </div>
    </div>
  );
};

