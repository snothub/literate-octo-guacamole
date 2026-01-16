import type { LyricLine } from '../types/spotify';

type LyricsDisplayProps = {
  lyrics: LyricLine[];
  lyricsLoading: boolean;
  progress: number;
  containerRef: React.RefObject<HTMLDivElement>;
  className?: string;
  heightClassName?: string;
};

export const LyricsDisplay = ({
  lyrics,
  lyricsLoading,
  progress,
  containerRef,
  className,
  heightClassName,
}: LyricsDisplayProps) => {
  const containerClassName = className ?? 'max-w-4xl mx-auto';
  const heightClass = heightClassName ?? 'h-32';
  if (lyricsLoading) {
    return (
      <div className={`${containerClassName} px-4 py-3 ${heightClass} flex items-center justify-center`}>
        <p className="text-gray-400 text-sm">Loading lyrics...</p>
      </div>
    );
  }

  if (!lyricsLoading && lyrics.length === 0) {
    return (
      <div className={`${containerClassName} px-4 py-3 ${heightClass} flex items-center justify-center`}>
        <p className="text-gray-500 text-sm">No synced lyrics available</p>
      </div>
    );
  }

  return (
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
                  ? 'text-white font-bold text-xl scale-105 drop-shadow'
                  : 'text-gray-400 text-sm font-medium'
              }`}
            >
              {line.text}
            </p>
          );
        })}
      </div>
    </div>
  );
};

