import { useEffect, useRef, useState } from 'react';
import type { MagnifierState } from '../types/ui';

type UseProgressInteractionArgs = {
  duration: number;
  selectedId: string | null;
  loopStart: number | null;
  loopEnd: number | null;
  onSeekToMs: (positionMs: number) => void;
  onSetLoopStart: (positionMs: number) => void;
  onSetLoopEnd: (positionMs: number) => void;
};

type ProgressInteractionState = {
  isDragging: boolean;
  draggingMarker: 'start' | 'end' | null;
  magnifier: MagnifierState;
  progressBarRef: React.RefObject<HTMLDivElement>;
  handleMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleMarkerMouseDown: (e: React.MouseEvent, marker: 'start' | 'end') => void;
};

export const useProgressInteraction = ({
  duration,
  selectedId,
  loopStart,
  loopEnd,
  onSeekToMs,
  onSetLoopStart,
  onSetLoopEnd,
}: UseProgressInteractionArgs): ProgressInteractionState => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [draggingMarker, setDraggingMarker] = useState<'start' | 'end' | null>(null);
  const [magnifier, setMagnifier] = useState<MagnifierState>({
    leftPercent: 0,
    timeSec: 0,
    visible: false,
  });
  const progressBarRef = useRef<HTMLDivElement>(null);
  const magnifierTimeout = useRef<number | null>(null);

  const seekToPosition = (clientX: number) => {
    if (!selectedId || !progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const seekPos = percent * duration;
    onSeekToMs(seekPos);
  };

  const showMagnifier = (clientX: number) => {
    if (!progressBarRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const seekPos = percent * duration;
    const timeSec = Math.floor(seekPos / 1000);

    setMagnifier({ leftPercent: percent * 100, timeSec, visible: true });
    if (magnifierTimeout.current) window.clearTimeout(magnifierTimeout.current);
    magnifierTimeout.current = window.setTimeout(() => {
      setMagnifier((prev) => ({ ...prev, visible: false }));
    }, 1200);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    seekToPosition(e.clientX);
    showMagnifier(e.clientX);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      seekToPosition(e.clientX);
      showMagnifier(e.clientX);
    } else if (draggingMarker && progressBarRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const newPos = percent * duration;

      if (draggingMarker === 'start') {
        if (loopEnd !== null) {
          onSetLoopStart(Math.min(newPos, loopEnd));
        } else {
          onSetLoopStart(newPos);
        }
      } else if (draggingMarker === 'end') {
        if (loopStart !== null) {
          onSetLoopEnd(Math.max(newPos, loopStart));
        } else {
          onSetLoopEnd(newPos);
        }
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggingMarker(null);
  };

  const handleMarkerMouseDown = (e: React.MouseEvent, marker: 'start' | 'end') => {
    e.stopPropagation();
    e.preventDefault();
    setDraggingMarker(marker);
  };

  useEffect(() => {
    if (isDragging || draggingMarker) {
      document.body.style.userSelect = 'none';
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, draggingMarker, duration, loopStart, loopEnd]);

  useEffect(() => {
    return () => {
      if (magnifierTimeout.current) window.clearTimeout(magnifierTimeout.current);
    };
  }, []);

  return {
    isDragging,
    draggingMarker,
    magnifier,
    progressBarRef,
    handleMouseDown,
    handleMarkerMouseDown,
  };
};

