import { useEffect, useState } from 'react';
import { getApiUrl } from '../config/spotify';
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
  loopStart: number | null;
  loopEnd: number | null;
  loopEnabled: boolean;
  setLoopEnabled: (enabled: boolean) => void;
  setLoopStartValue: (value: number | null) => void;
  setLoopEndValue: (value: number | null) => void;
  setLoopStartPoint: () => void;
  setLoopEndPoint: () => void;
  clearLoop: () => void;
  handleLoopStartChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleLoopEndChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  initializeLoopForTrack: (trackId: string) => Promise<void>;
};

export const useLoopControls = ({
  progress,
  duration,
  playing,
  onSeekToMs,
  selectedTrackId,
  spotifyUserId,
}: UseLoopControlsArgs): LoopControlsState => {
  const [loopStart, setLoopStart] = useState<number | null>(null);
  const [loopEnd, setLoopEnd] = useState<number | null>(null);
  const [loopEnabled, setLoopEnabled] = useState<boolean>(false);

  useEffect(() => {
    if (!playing || !loopEnabled || loopStart === null || loopEnd === null) return;
    if (loopStart >= loopEnd) return;

    if (progress >= loopEnd) {
      onSeekToMs(loopStart);
    }
  }, [progress, playing, loopEnabled, loopStart, loopEnd, onSeekToMs]);

  useEffect(() => {
    if (selectedTrackId && spotifyUserId) {
      const timeoutId = setTimeout(() => {
        void saveLoopData(selectedTrackId, loopStart, loopEnd, loopEnabled);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [selectedTrackId, loopStart, loopEnd, loopEnabled, spotifyUserId]);

  const saveLoopData = async (
    trackId: string,
    start: number | null,
    end: number | null,
    enabled: boolean
  ) => {
    if (!spotifyUserId) return;

    try {
      await fetch(`${getApiUrl()}/api/loop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spotifyUserId,
          trackId,
          loopStart: start,
          loopEnd: end,
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
      const response = await fetch(`${getApiUrl()}/api/loop/${spotifyUserId}/${trackId}`);

      if (!response.ok) return null;

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error loading loop data:', err);
      return null;
    }
  };

  const initializeLoopForTrack = async (trackId: string) => {
    setLoopStart(null);
    setLoopEnd(null);
    setLoopEnabled(false);

    if (spotifyUserId) {
      const savedLoopData = await loadLoopData(trackId);
      if (savedLoopData) {
        setLoopStart(savedLoopData.loopStart);
        setLoopEnd(savedLoopData.loopEnd);
        setLoopEnabled(savedLoopData.loopEnabled);
      }
    }
  };

  const setLoopStartPoint = () => {
    if (loopEnd !== null && progress > loopEnd) {
      setLoopStart(loopEnd);
    } else {
      setLoopStart(progress);
    }
  };

  const setLoopEndPoint = () => {
    if (loopStart !== null && progress < loopStart) {
      setLoopEnd(loopStart);
    } else {
      setLoopEnd(progress);
    }
  };

  const clearLoop = () => {
    setLoopStart(null);
    setLoopEnd(null);
    setLoopEnabled(false);
  };

  const handleLoopStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setLoopStart(null);
      return;
    }
    const ms = parseTimeInput(value);
    if (ms !== null && ms >= 0 && ms <= duration) {
      if (loopEnd !== null && ms > loopEnd) {
        setLoopStart(loopEnd);
      } else {
        setLoopStart(ms);
      }
    }
  };

  const handleLoopEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setLoopEnd(null);
      return;
    }
    const ms = parseTimeInput(value);
    if (ms !== null && ms >= 0 && ms <= duration) {
      if (loopStart !== null && ms < loopStart) {
        setLoopEnd(loopStart);
      } else {
        setLoopEnd(ms);
      }
    }
  };

  return {
    loopStart,
    loopEnd,
    loopEnabled,
    setLoopEnabled,
    setLoopStartValue: setLoopStart,
    setLoopEndValue: setLoopEnd,
    setLoopStartPoint,
    setLoopEndPoint,
    clearLoop,
    handleLoopStartChange,
    handleLoopEndChange,
    initializeLoopForTrack,
  };
};

