import { useEffect, useRef, useState } from 'react';
import type { LyricLine } from '../types/spotify';
import { logger } from '../utils/logger';

type LyricsState = {
  lyrics: LyricLine[];
  lyricsLoading: boolean;
  lyricsContainerRef: React.RefObject<HTMLDivElement>;
  fetchLyrics: (trackName: string, artistName: string) => Promise<void>;
  clearLyrics: () => void;
};

export const useLyrics = (progress: number): LyricsState => {
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [lyricsLoading, setLyricsLoading] = useState<boolean>(false);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!lyricsContainerRef.current || lyrics.length === 0) return;

    const currentIndex = lyrics.findIndex((line, index) => {
      return progress >= line.time && (index === lyrics.length - 1 || progress < lyrics[index + 1]?.time);
    });

    if (currentIndex !== -1) {
      const container = lyricsContainerRef.current;
      const lineElements = container.querySelectorAll('p');
      const currentElement = lineElements[currentIndex];

      if (currentElement) {
        const containerHeight = container.clientHeight;
        const elementTop = currentElement.offsetTop;
        const elementHeight = currentElement.clientHeight;
        const scrollPosition = elementTop - containerHeight / 2 + elementHeight / 2;

        container.scrollTo({
          top: scrollPosition,
          behavior: 'smooth',
        });
      }
    }
  }, [progress, lyrics]);

  const parseLRC = (lrcText: string): LyricLine[] => {
    const lines: LyricLine[] = [];
    const lrcLines = lrcText.split('\n');

    for (const line of lrcLines) {
      const match = line.match(/\[(\d{2}):(\d{2}\.\d{2})\](.*)/);
      if (match) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseFloat(match[2]);
        const text = match[3].trim();
        const timeMs = (minutes * 60 + seconds) * 1000;

        if (text) {
          lines.push({ time: timeMs, text });
        }
      }
    }

    return lines.sort((a, b) => a.time - b.time);
  };

  const fetchLyrics = async (trackName: string, artistName: string) => {
    setLyricsLoading(true);
    setLyrics([]);
    logger.info('useLyrics', 'lyrics_fetch_start', { trackName, artistName });

    try {
      const response = await fetch(
        `https://lrclib.net/api/search?track_name=${encodeURIComponent(trackName)}&artist_name=${encodeURIComponent(artistName)}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch lyrics');
      }

      const data = await response.json();

      if (data && data.length > 0 && data[0].syncedLyrics) {
        const parsedLyrics = parseLRC(data[0].syncedLyrics);
        setLyrics(parsedLyrics);
        logger.info('useLyrics', 'lyrics_fetch_success', { trackName, lineCount: parsedLyrics.length });
      } else {
        setLyrics([]);
        logger.info('useLyrics', 'lyrics_not_found', { trackName, artistName });
      }
    } catch (err) {
      logger.error('useLyrics', 'lyrics_fetch_failed', {
        trackName,
        error: err instanceof Error ? err.message : String(err),
      });
      setLyrics([]);
    } finally {
      setLyricsLoading(false);
    }
  };

  const clearLyrics = () => {
    setLyrics([]);
  };

  return { lyrics, lyricsLoading, lyricsContainerRef, fetchLyrics, clearLyrics };
};
