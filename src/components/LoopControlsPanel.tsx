import type { LoopSegment } from '../types/ui';
import { formatTime, formatTimeInput } from '../utils/time';

type LoopControlsPanelProps = {
  loops: LoopSegment[];
  activeLoopId: string | null;
  loopStart: number | null;
  loopEnd: number | null;
  loopEnabled: boolean;
  onLoopStartChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onLoopEndChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onLoopEnabledChange: (enabled: boolean) => void;
  onAddLoop: () => void;
  onRemoveLoop: (loopId: string) => void;
  onSelectLoop: (loopId: string) => void;
  onSeekLoop: (loop: LoopSegment) => void;
  onUpdateLabel: (value: string) => void;
  onClearSelection: () => void;
};

export const LoopControlsPanel = ({
  loops,
  activeLoopId,
  loopStart,
  loopEnd,
  loopEnabled,
  onLoopStartChange,
  onLoopEndChange,
  onLoopEnabledChange,
  onAddLoop,
  onRemoveLoop,
  onSelectLoop,
  onSeekLoop,
  onUpdateLabel,
  onClearSelection,
}: LoopControlsPanelProps) => {
  const activeLoop = loops.find((loop) => loop.id === activeLoopId) || null;
  const canAddLoop = loopStart !== null && loopEnd !== null && loopStart < loopEnd;
  return (
    <div className="w-80 flex-shrink-0">
      <div className="bg-gray-800/80 rounded-lg p-4 sticky top-12">
        <h3 className="text-lg font-bold text-white mb-4">Loop Controls</h3>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-300 w-20 flex-shrink-0">Start Time</label>
            <input
              type="text"
              value={formatTimeInput(loopStart)}
              onChange={onLoopStartChange}
              placeholder="0:00"
              className="flex-1 bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-green-500 focus:outline-none text-sm"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-300 w-20 flex-shrink-0">End Time</label>
            <input
              type="text"
              value={formatTimeInput(loopEnd)}
              onChange={onLoopEndChange}
              placeholder="0:00"
              className="flex-1 bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-green-500 focus:outline-none text-sm"
            />
          </div>

          {activeLoop && (
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-300 w-20 flex-shrink-0">Label</label>
              <input
                type="text"
                value={activeLoop.label}
                onChange={(e) => onUpdateLabel(e.target.value)}
                placeholder="Loop name"
                className="flex-1 bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-green-500 focus:outline-none text-sm"
              />
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="loopEnabled"
              checked={loopEnabled}
              onChange={(e) => onLoopEnabledChange(e.target.checked)}
              disabled={!activeLoop || loopStart === null || loopEnd === null || loopStart >= loopEnd}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-green-500 focus:ring-green-500 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <label htmlFor="loopEnabled" className="text-sm text-gray-300 select-none">
              Enable Loop
            </label>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={onAddLoop}
              disabled={!canAddLoop}
              className="flex-1 px-3 py-2 bg-green-500 hover:bg-green-400 text-black rounded transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Loop
            </button>
            <button
              onClick={onClearSelection}
              className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-all text-sm"
            >
              New Loop
            </button>
          </div>

          {activeLoop && (
            <button
              onClick={() => onRemoveLoop(activeLoop.id)}
              className="w-full mt-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-all text-sm"
            >
              Remove Active Loop
            </button>
          )}

          <div className="mt-4 p-3 bg-gray-700/50 rounded text-xs text-gray-400 space-y-2">
            {loopStart === null && loopEnd === null && (
              <p>Set start/end with the buttons below or type times, then add the loop.</p>
            )}
            {loopStart !== null && loopEnd === null && <p>Loop start set. Set an end time to finish the loop.</p>}
            {loopStart !== null && loopEnd !== null && !loopEnabled && activeLoop && (
              <p>Loop points set. Enable the checkbox to activate looping.</p>
            )}
            {loopEnabled && loopStart !== null && loopEnd !== null && activeLoop && (
              <p className="text-green-400">Loop is active! The segment will repeat continuously.</p>
            )}
          </div>

          {loops.length > 0 && (
            <div className="pt-4">
              <h4 className="text-sm font-semibold text-gray-300 mb-2">Saved Loops</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {loops.map((loop) => {
                  const isActive = loop.id === activeLoopId;
                  return (
                    <button
                      key={loop.id}
                      type="button"
                      onClick={() => onSeekLoop(loop)}
                      className={`w-full flex items-center justify-between gap-2 px-2 py-2 rounded border transition-all text-left ${
                        isActive ? 'border-white/40 bg-gray-700' : 'border-transparent bg-gray-800/50 hover:bg-gray-700/70'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="inline-flex w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: loop.color }}
                        />
                        <span className="text-sm text-white truncate">{loop.label}</span>
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {formatTime(loop.start)} - {formatTime(loop.end)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

