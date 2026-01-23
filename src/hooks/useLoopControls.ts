import { useEffect, useMemo, useRef, useState } from 'react';
import type { LoopSegment } from '../types/ui';
import { parseTimeInput } from '../utils/time';

type UseLoopControlsArgs = {
  progress: number;
  duration: number;
  playing: boolean;
  onSeekToMs: (positionMs: number) => void;
  selectedTrackId: string | null;
  spotifyUserId: string;
};

type LoopControlsState = {
  loops: LoopSegment[];
  activeLoopId: string | null;
  loopStart: number | null;
  loopEnd: number | null;
  loopEnabled: boolean;
  selectLoop: (loopId: string) => void;
  clearSelection: () => void;
  addLoop: () => void;
  removeLoop: (loopId: string) => void;
  clearLoop: () => void;
  setLoopEnabled: (enabled: boolean) => void;
  setLoopStartValue: (value: number | null) => void;
  setLoopEndValue: (value: number | null) => void;
  updateLoopRange: (loopId: string, start: number, end: number) => void;
  setLoopStartPoint: () => void;
  setLoopEndPoint: () => void;
  handleLoopStartChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleLoopEndChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  updateLoopLabel: (value: string) => void;
  initializeLoopForTrack: (trackId: string) => Promise<void>;
};

const LOOP_COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#14b8a6'];

const buildLoopId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const useLoopControls = ({
  progress,
  duration,
  playing,
  onSeekToMs,
  selectedTrackId,
  spotifyUserId,
}: UseLoopControlsArgs): LoopControlsState => {
  const [loops, setLoops] = useState<LoopSegment[]>([]);
  const [activeLoopId, setActiveLoopId] = useState<string | null>(null);
  const [loopStart, setLoopStart] = useState<number | null>(null);
  const [loopEnd, setLoopEnd] = useState<number | null>(null);
  const [loopEnabled, setLoopEnabled] = useState<boolean>(false);
  const lastLoopTriggerTime = useRef<number>(0);

  const activeLoop = useMemo(() => {
    if (!activeLoopId) return null;
    return loops.find((loop) => loop.id === activeLoopId) || null;
  }, [loops, activeLoopId]);

  useEffect(() => {
    if (activeLoopId && activeLoop) {
      setLoopStart(activeLoop.start);
      setLoopEnd(activeLoop.end);
    }
  }, [activeLoopId, activeLoop]);

  useEffect(() => {
    if (!playing || !loopEnabled || !activeLoopId || loopStart === null || loopEnd === null) return;
    if (loopStart >= loopEnd) return;

    if (progress >= loopEnd) {
      // Increment loop counter when we hit the end
      const now = Date.now();
      if (now - lastLoopTriggerTime.current > 500) {
        setLoops((prev) =>
          prev.map((loop) =>
            loop.id === activeLoopId
              ? { ...loop, repetitions: (loop.repetitions || 0) + 1 }
              : loop
          )
        );
        lastLoopTriggerTime.current = now;
      }
      onSeekToMs(loopStart);
    }
  }, [progress, playing, loopEnabled, loopStart, loopEnd, activeLoopId, onSeekToMs]);

  useEffect(() => {
    if (selectedTrackId && spotifyUserId) {
      const timeoutId = setTimeout(() => {
        void saveLoopData(selectedTrackId, loops, activeLoopId, loopEnabled);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [selectedTrackId, loops, loopEnabled, spotifyUserId, activeLoopId]);

  const saveLoopData = async (
    trackId: string,
    segments: LoopSegment[],
    activeId: string | null,
    enabled: boolean
  ) => {
    if (!spotifyUserId) return;

    try {
      await fetch('/api/loop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spotifyUserId,
          trackId,
          segments: segments.length > 0 ? segments : null,
          activeLoopId: activeId,
          loopEnabled: enabled,
        }),
      });
    } catch (err) {
      console.error('Error saving loop data:', err);
    }
  };

  const loadLoopData = async (trackId: string) => {
    if (!spotifyUserId) return null;

    try {
      const response = await fetch(`/api/loop/${spotifyUserId}/${trackId}`);

      if (!response.ok) return null;

      const data = await response.json();
      if (!data) return null;

      // Return data with segments, handling both new and old format
      return {
        segments: data.segments || null,
        activeLoopId: data.activeLoopId || null,
        loopEnabled: data.loopEnabled || false,
        // For backward compatibility, also include old fields
        loopStart: data.loopStart,
        loopEnd: data.loopEnd,
      };
    } catch (err) {
      console.error('Error loading loop data:', err);
      return null;
    }
  };

  const initializeLoopForTrack = async (trackId: string) => {
    setLoops([]);
    setLoopStart(null);
    setLoopEnd(null);
    setLoopEnabled(false);
    setActiveLoopId(null);

    if (spotifyUserId) {
      const savedLoopData = await loadLoopData(trackId);
      if (savedLoopData) {
        // Load new format (segments array)
        if (savedLoopData.segments && Array.isArray(savedLoopData.segments)) {
          const segments = savedLoopData.segments as LoopSegment[];
          setLoops(segments);
          if (savedLoopData.activeLoopId) {
            setActiveLoopId(savedLoopData.activeLoopId);
          } else if (segments.length > 0) {
            setActiveLoopId(segments[0].id);
          }
          setLoopEnabled(savedLoopData.loopEnabled);
        }
        // Fallback to old format (single loop from loopStart/loopEnd)
        else if (savedLoopData.loopStart !== null && savedLoopData.loopEnd !== null) {
          const loop: LoopSegment = {
            id: buildLoopId(),
            start: savedLoopData.loopStart,
            end: savedLoopData.loopEnd,
            color: LOOP_COLORS[0],
            label: 'Loop 1',
          };
          setLoops([loop]);
          setActiveLoopId(loop.id);
          setLoopEnabled(savedLoopData.loopEnabled);
        }
      }
    }
  };

  const selectLoop = (loopId: string) => {
    setActiveLoopId(loopId);
  };

  const clearSelection = () => {
    setActiveLoopId(null);
    setLoopStart(progress);
    setLoopEnd(null);
    setLoopEnabled(false);
  };

  const addLoop = () => {
    // Use existing loopStart if set, otherwise use current progress
    const start = loopStart !== null ? loopStart : progress;
    let end = loopEnd;
    if (end === null || end <= start) {
      end = Math.min(start + 5000, duration);
      setLoopEnd(end);
    }
    if (end <= start) return;
    const loop: LoopSegment = {
      id: buildLoopId(),
      start,
      end,
      color: LOOP_COLORS[loops.length % LOOP_COLORS.length],
      label: `Loop ${loops.length + 1}`,
    };
    setLoops((prev) => [...prev, loop]);
    setActiveLoopId(loop.id);
  };

  const removeLoop = (loopId: string) => {
    setLoops((prev) => {
      const updated = prev.filter((loop) => loop.id !== loopId);
      if (loopId === activeLoopId) {
        const nextLoop = updated[0] || null;
        setActiveLoopId(nextLoop?.id ?? null);
        setLoopStart(nextLoop?.start ?? null);
        setLoopEnd(nextLoop?.end ?? null);
        setLoopEnabled(false);
      }
      return updated;
    });
  };

  const clearLoop = () => {
    if (activeLoopId) {
      removeLoop(activeLoopId);
      return;
    }
    setLoopStart(null);
    setLoopEnd(null);
    setLoopEnabled(false);
  };

  const setLoopStartValue = (value: number | null) => {
    setLoopStart(value);
    if (!activeLoopId || value === null) return;
    setLoops((prev) =>
      prev.map((loop) => (loop.id === activeLoopId ? { ...loop, start: value } : loop))
    );
  };

  const setLoopEndValue = (value: number | null) => {
    setLoopEnd(value);
    if (!activeLoopId || value === null) return;
    setLoops((prev) => prev.map((loop) => (loop.id === activeLoopId ? { ...loop, end: value } : loop)));
  };

  const updateLoopRange = (loopId: string, start: number, end: number) => {
    setLoops((prev) =>
      prev.map((loop) => (loop.id === loopId ? { ...loop, start, end } : loop))
    );
    if (loopId === activeLoopId) {
      setLoopStart(start);
      setLoopEnd(end);
    }
  };

  const setLoopStartPoint = () => {
    if (loopEnd !== null && progress > loopEnd) {
      setLoopStartValue(loopEnd);
    } else {
      setLoopStartValue(progress);
    }
  };

  const setLoopEndPoint = () => {
    if (loopStart !== null && progress < loopStart) {
      setLoopEndValue(loopStart);
    } else {
      setLoopEndValue(progress);
    }
  };

  const handleLoopStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      if (!activeLoopId) {
        setLoopStart(null);
      }
      return;
    }
    const ms = parseTimeInput(value);
    if (ms !== null && ms >= 0 && ms <= duration) {
      if (loopEnd !== null && ms > loopEnd) {
        setLoopStartValue(loopEnd);
      } else {
        setLoopStartValue(ms);
      }
    }
  };

  const handleLoopEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      if (!activeLoopId) {
        setLoopEnd(null);
      }
      return;
    }
    const ms = parseTimeInput(value);
    if (ms !== null && ms >= 0 && ms <= duration) {
      if (loopStart !== null && ms < loopStart) {
        setLoopEndValue(loopStart);
      } else {
        setLoopEndValue(ms);
      }
    }
  };

  const updateLoopLabel = (value: string) => {
    if (!activeLoopId) return;
    setLoops((prev) => prev.map((loop) => (loop.id === activeLoopId ? { ...loop, label: value } : loop)));
  };

  return {
    loops,
    activeLoopId,
    loopStart,
    loopEnd,
    loopEnabled,
    selectLoop,
    clearSelection,
    addLoop,
    removeLoop,
    clearLoop,
    setLoopEnabled,
    setLoopStartValue,
    setLoopEndValue,
    updateLoopRange,
    setLoopStartPoint,
    setLoopEndPoint,
    handleLoopStartChange,
    handleLoopEndChange,
    updateLoopLabel,
    initializeLoopForTrack,
  };
};

