export const formatTime = (ms: number): string => {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

export const formatTimeInput = (ms: number | null): string => {
  if (ms === null) return '';
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const millis = Math.floor(ms % 1000);
  return `${mins}:${secs.toString().padStart(2, '0')}.${millis.toString().padStart(3, '0')}`;
};

export const parseTimeInput = (timeStr: string): number | null => {
  const parts = timeStr.split(':');
  if (parts.length !== 2) return null;
  const mins = parseInt(parts[0], 10);
  if (isNaN(mins) || mins < 0) return null;

  const [secPart, msPart = ''] = parts[1].split('.');
  const secs = parseInt(secPart, 10);
  if (isNaN(secs) || secs < 0 || secs >= 60) return null;

  const msNormalized = msPart.trim();
  if (msNormalized.length > 0 && !/^\d{1,3}$/.test(msNormalized)) return null;
  const millis = msNormalized.length > 0 ? parseInt(msNormalized.padEnd(3, '0'), 10) : 0;
  if (isNaN(millis) || millis < 0 || millis >= 1000) return null;

  return (mins * 60 + secs) * 1000 + millis;
};

