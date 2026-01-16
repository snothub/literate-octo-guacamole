import { useEffect, useRef, useState } from 'react';
import type { LoopSegment, MagnifierState } from '../types/ui';

type UseProgressInteractionArgs = {
  duration: number;
  selectedId: string | null;
  loopStart: number | null;
  loopEnd: number | null;
  loops: LoopSegment[];
  onSeekToMs: (positionMs: number) => void;
  onSetLoopStart: (positionMs: number) => void;
  onSetLoopEnd: (positionMs: number) => void;
  onSelectLoop: (loopId: string) => void;
  onUpdateLoopRange: (loopId: string, start: number, end: number) => void;
};

type ProgressInteractionState = {
  isDragging: boolean;
  draggingMarker: 'start' | 'end' | null;
  segmentWasDragged: boolean;
  magnifier: MagnifierState;
  progressBarRef: React.RefObject<HTMLDivElement>;
  handleMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleMarkerMouseDown: (e: React.MouseEvent, marker: 'start' | 'end') => void;
  handleSegmentMouseDown: (e: React.MouseEvent, loop: LoopSegment) => void;
};

export const useProgressInteraction = ({
  duration,
  selectedId,
  loopStart,
  loopEnd,
  loops,
  onSeekToMs,
  onSetLoopStart,
  onSetLoopEnd,
  onSelectLoop,
  onUpdateLoopRange,
}: UseProgressInteractionArgs): ProgressInteractionState => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [draggingMarker, setDraggingMarker] = useState<'start' | 'end' | null>(null);
  const [isDraggingSegment, setIsDraggingSegment] = useState<boolean>(false);
  const [segmentWasDragged, setSegmentWasDragged] = useState<boolean>(false);
  const [magnifier, setMagnifier] = useState<MagnifierState>({
    leftPercent: 0,
    timeSec: 0,
    visible: false,
  });
  const progressBarRef = useRef<HTMLDivElement>(null);
  const magnifierTimeout = useRef<number | null>(null);
  const draggingLoopRef = useRef<{
    id: string;
    start: number;
    end: number;
    startX: number;
  } | null>(null);

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
    if (draggingLoopRef.current && progressBarRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const deltaPx = e.clientX - draggingLoopRef.current.startX;
      
      // Only mark as dragged if mouse moved more than 3 pixels
      if (Math.abs(deltaPx) > 3) {
        setSegmentWasDragged(true);
      }
      
      const deltaMs = (deltaPx / rect.width) * duration;
      const length = draggingLoopRef.current.end - draggingLoopRef.current.start;
      const maxStart = Math.max(0, duration - length);
      const nextStart = Math.max(0, Math.min(maxStart, draggingLoopRef.current.start + deltaMs));
      const nextEnd = nextStart + length;
      onUpdateLoopRange(draggingLoopRef.current.id, nextStart, nextEnd);
      return;
    }
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
    setIsDraggingSegment(false);
    // Don't reset segmentWasDragged immediately - let it persist briefly for onClick to check
    setTimeout(() => {
      setSegmentWasDragged(false);
    }, 50);
    draggingLoopRef.current = null;
  };

  const handleMarkerMouseDown = (e: React.MouseEvent, marker: 'start' | 'end') => {
    e.stopPropagation();
    e.preventDefault();
    setDraggingMarker(marker);
  };

  const handleSegmentMouseDown = (e: React.MouseEvent, loop: LoopSegment) => {
    if (!progressBarRef.current) return;
    e.stopPropagation();
    e.preventDefault();
    onSelectLoop(loop.id);
    draggingLoopRef.current = {
      id: loop.id,
      start: loop.start,
      end: loop.end,
      startX: e.clientX,
    };
    setIsDraggingSegment(true);
  };

  useEffect(() => {
    if (isDragging || draggingMarker || isDraggingSegment) {
      document.body.style.userSelect = 'none';
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, draggingMarker, isDraggingSegment, duration, loopStart, loopEnd, loops]);

  useEffect(() => {
    return () => {
      if (magnifierTimeout.current) window.clearTimeout(magnifierTimeout.current);
    };
  }, []);

  return {
    isDragging,
    draggingMarker,
    segmentWasDragged,
    magnifier,
    progressBarRef,
    handleMouseDown,
    handleMarkerMouseDown,
    handleSegmentMouseDown,
  };
};

