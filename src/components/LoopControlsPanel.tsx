import type { LoopSegment } from '../types/ui';
import { formatTimeInput, formatTime } from '../utils/time';

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
  onUpdateLabel: (value: string) => void;
  onSeekLoop?: (loop: LoopSegment) => void;
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
  onUpdateLabel,
  onSeekLoop,
}: LoopControlsPanelProps) => {
  const activeLoop = loops.find((loop) => loop.id === activeLoopId) || null;
  const canAddLoop = loopStart !== null && loopEnd !== null && loopStart < loopEnd;

  return (
    <div className="w-full">
      <div className="space-y-2.5 px-4 sm:px-5 py-3">
          <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-emerald-300 flex-shrink-0 min-w-fit">Start</label>
            <input
              type="text"
              value={formatTimeInput(loopStart)}
              onChange={onLoopStartChange}
              placeholder="0:00.000"
              className="flex-1 bg-gray-900/60 text-white px-2 py-1 rounded border border-gray-600/50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none text-xs transition-all font-mono"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-emerald-300 flex-shrink-0 min-w-fit">End</label>
            <input
              type="text"
              value={formatTimeInput(loopEnd)}
              onChange={onLoopEndChange}
              placeholder="0:00.000"
              className="flex-1 bg-gray-900/60 text-white px-2 py-1 rounded border border-gray-600/50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none text-xs transition-all font-mono"
            />
          </div>

          {activeLoop && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-emerald-300 flex-shrink-0 min-w-fit">Label</label>
              <input
                type="text"
                value={activeLoop.label}
                onChange={(e) => onUpdateLabel(e.target.value)}
                placeholder="Loop name"
                className="flex-1 bg-gray-900/60 text-white px-2 py-1 rounded border border-gray-600/50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none text-xs transition-all"
              />
            </div>
          )}

          <div className="flex items-center gap-3 pt-2 pb-1">
            <input
              type="checkbox"
              id="loopEnabled"
              checked={loopEnabled}
              onChange={(e) => onLoopEnabledChange(e.target.checked)}
              disabled={!activeLoop || loopStart === null || loopEnd === null || loopStart >= loopEnd}
              className="w-5 h-5 rounded-md border-2 border-gray-600 bg-gray-900/60 text-emerald-500 focus:ring-2 focus:ring-emerald-500/40 focus:ring-offset-0 focus:border-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all checked:bg-gradient-to-br checked:from-emerald-500 checked:to-emerald-600 checked:border-emerald-500 checked:shadow-lg checked:shadow-emerald-500/20"
            />
            <label htmlFor="loopEnabled" className="text-sm font-medium text-white select-none cursor-pointer">
              Enable Loop
            </label>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={onAddLoop}
              disabled={!canAddLoop}
              className={`flex-1 px-3 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-medium rounded-lg transition-all text-xs shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none relative ${
                canAddLoop && !activeLoop ? 'animate-pulse' : ''
              }`}
            >
              Add Loop
              {canAddLoop && !activeLoop && (
                <span className="absolute -top-2 -right-2 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              )}
            </button>
            {activeLoop && (
              <button
                onClick={() => onRemoveLoop(activeLoop.id)}
                className="flex-1 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium rounded-lg transition-all text-xs border border-red-500/20"
              >
                Remove Loop
              </button>
            )}
          </div>

          <div className="mt-2 p-2.5 bg-gray-900/40 rounded-lg text-[11px] text-gray-400 border border-gray-700/30">
            {loopStart === null && loopEnd === null && (
              <div className="space-y-1">
                <p className="text-emerald-400 font-semibold">📍 Step 1: Set Loop Points</p>
                <p>Click the green <span className="inline-flex items-center px-1 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-medium">● Start</span> and <span className="inline-flex items-center px-1 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-medium">○ End</span> buttons below while playing, or press <kbd className="px-1 py-0.5 bg-gray-700 rounded text-[9px] font-mono">S</kbd> and <kbd className="px-1 py-0.5 bg-gray-700 rounded text-[9px] font-mono">E</kbd> keys.</p>
              </div>
            )}
            {loopStart !== null && loopEnd === null && (
              <div className="space-y-1">
                <p className="text-emerald-400 font-semibold">📍 Step 2: Set End Point</p>
                <p>⏱️ Loop start is set! Now click the <span className="inline-flex items-center px-1 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-medium">○ End</span> button or press <kbd className="px-1 py-0.5 bg-gray-700 rounded text-[9px] font-mono">E</kbd>. The loop will be created automatically!</p>
              </div>
            )}
            {loopStart !== null && loopEnd !== null && !loopEnabled && activeLoop && (
              <div className="space-y-1">
                <p className="text-emerald-400 font-semibold">📍 Step 3: Enable Looping</p>
                <p>✅ Loop created! Check the "Enable Loop" box above to start repeating this segment.</p>
              </div>
            )}
            {loopEnabled && loopStart !== null && loopEnd !== null && activeLoop && (
              <div className="space-y-1">
                <p className="text-emerald-400 font-semibold">🔁 Loop Active!</p>
                <p>The segment will repeat continuously. Create more loops or adjust this one!</p>
              </div>
            )}
          </div>

          <div className="hidden md:block mt-2 p-2.5 bg-gradient-to-br from-gray-800/40 to-gray-900/40 rounded-lg text-[10px] text-gray-400 space-y-0.5 border border-gray-700/30">
            <p className="text-gray-300 font-semibold text-[11px] mb-1">⌨️ Keyboard Shortcuts</p>
            <div className="space-y-0.5 leading-relaxed">
              <p><kbd className="px-1 py-0.5 bg-gray-700/50 rounded text-[9px] font-mono">S</kbd> Set start · <kbd className="px-1 py-0.5 bg-gray-700/50 rounded text-[9px] font-mono">E</kbd> Set end · <kbd className="px-1 py-0.5 bg-gray-700/50 rounded text-[9px] font-mono">L</kbd> Toggle loop</p>
              <p><kbd className="px-1 py-0.5 bg-gray-700/50 rounded text-[9px] font-mono">P</kbd> Play from start · <kbd className="px-1 py-0.5 bg-gray-700/50 rounded text-[9px] font-mono">⌥←/→</kbd> Prev/next loop</p>
              <p><kbd className="px-1 py-0.5 bg-gray-700/50 rounded text-[9px] font-mono">⇧←/→</kbd> Nudge start ±250ms (±50ms w/o Shift)</p>
              <p><kbd className="px-1 py-0.5 bg-gray-700/50 rounded text-[9px] font-mono">⌘←/→</kbd> Nudge end ±250ms (±50ms w/o Shift)</p>
            </div>
            </div>

          {/* Saved Loops Section */}
          {loops.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-700/30 space-y-2">
              <h4 className="text-sm font-semibold text-emerald-300 flex items-center gap-2">
                <span className="w-1 h-4 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-full"></span>
                Saved Loops ({loops.length})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {loops.map((loop) => {
                  const isActive = loop.id === activeLoopId;
                  return (
                    <button
                      key={loop.id}
                      type="button"
                      onClick={() => onSeekLoop?.(loop)}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border transition-all text-left active:scale-98 ${
                        isActive
                          ? 'border-emerald-500/40 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                          : 'border-transparent bg-gray-800/50 hover:bg-gray-700/70 hover:border-gray-600/30'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="inline-flex w-3 h-3 rounded-full flex-shrink-0 shadow-md"
                          style={{ backgroundColor: loop.color }}
                        />
                        <span className={`text-sm truncate ${isActive ? 'text-white font-medium' : 'text-gray-300'}`}>
                          {loop.label}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0 font-mono">
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
  );
};

