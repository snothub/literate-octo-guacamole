import type { LoopSegment } from '../types/ui';
import { formatTimeInput } from '../utils/time';

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
}: LoopControlsPanelProps) => {
  const activeLoop = loops.find((loop) => loop.id === activeLoopId) || null;
  const canAddLoop = loopStart !== null && loopEnd !== null && loopStart < loopEnd;
  
  return (
    <div className="w-full h-[calc(100vh-12rem)] flex flex-col">
      <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm rounded-xl shadow-xl border border-gray-700/50 flex flex-col h-full">
        <div className="p-4 sm:p-5 flex-shrink-0 border-b border-gray-700/30">
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span className="w-1 h-5 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-full"></span>
            Loop Controls
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-3">
          <div className="space-y-2.5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 sm:gap-2">
            <label className="text-xs font-medium text-emerald-300 w-full sm:w-16 flex-shrink-0">Start</label>
            <input
              type="text"
              value={formatTimeInput(loopStart)}
              onChange={onLoopStartChange}
              placeholder="0:00.000"
              className="w-full flex-1 bg-gray-900/60 text-white px-2 py-1 rounded border border-gray-600/50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none text-xs transition-all font-mono"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 sm:gap-2">
            <label className="text-xs font-medium text-emerald-300 w-full sm:w-16 flex-shrink-0">End</label>
            <input
              type="text"
              value={formatTimeInput(loopEnd)}
              onChange={onLoopEndChange}
              placeholder="0:00.000"
              className="w-full flex-1 bg-gray-900/60 text-white px-2 py-1 rounded border border-gray-600/50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none text-xs transition-all font-mono"
            />
          </div>

          {activeLoop && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 sm:gap-2">
              <label className="text-xs font-medium text-emerald-300 w-full sm:w-16 flex-shrink-0">Label</label>
              <input
                type="text"
                value={activeLoop.label}
                onChange={(e) => onUpdateLabel(e.target.value)}
                placeholder="Loop name"
                className="w-full flex-1 bg-gray-900/60 text-white px-2 py-1 rounded border border-gray-600/50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none text-xs transition-all"
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
                <p>⏱️ Loop start is set! Now click the <span className="inline-flex items-center px-1 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-medium">○ End</span> button or press <kbd className="px-1 py-0.5 bg-gray-700 rounded text-[9px] font-mono">E</kbd> to finish.</p>
              </div>
            )}
            {loopStart !== null && loopEnd !== null && !activeLoop && (
              <div className="space-y-1">
                <p className="text-emerald-400 font-semibold">📍 Step 3: Add the Loop</p>
                <p>✨ Loop points are ready! Click the "Add Loop" button below to save this segment.</p>
              </div>
            )}
            {loopStart !== null && loopEnd !== null && !loopEnabled && activeLoop && (
              <div className="space-y-1">
                <p className="text-emerald-400 font-semibold">📍 Step 4: Enable Looping</p>
                <p>✅ Loop saved! Check the "Enable Loop" box above to start repeating this segment.</p>
              </div>
            )}
            {loopEnabled && loopStart !== null && loopEnd !== null && activeLoop && (
              <div className="space-y-1">
                <p className="text-emerald-400 font-semibold">🔁 Loop Active!</p>
                <p>The segment will repeat continuously. Create more loops or adjust this one!</p>
              </div>
            )}
          </div>

          <div className="mt-2 p-2.5 bg-gradient-to-br from-gray-800/40 to-gray-900/40 rounded-lg text-[10px] text-gray-400 space-y-0.5 border border-gray-700/30">
            <p className="text-gray-300 font-semibold text-[11px] mb-1">⌨️ Keyboard Shortcuts</p>
            <div className="space-y-0.5 leading-relaxed">
              <p><kbd className="px-1 py-0.5 bg-gray-700/50 rounded text-[9px] font-mono">S</kbd> Set start · <kbd className="px-1 py-0.5 bg-gray-700/50 rounded text-[9px] font-mono">E</kbd> Set end · <kbd className="px-1 py-0.5 bg-gray-700/50 rounded text-[9px] font-mono">L</kbd> Toggle loop</p>
              <p><kbd className="px-1 py-0.5 bg-gray-700/50 rounded text-[9px] font-mono">P</kbd> Play from start · <kbd className="px-1 py-0.5 bg-gray-700/50 rounded text-[9px] font-mono">⌥←/→</kbd> Prev/next loop</p>
              <p><kbd className="px-1 py-0.5 bg-gray-700/50 rounded text-[9px] font-mono">⇧←/→</kbd> Nudge start ±250ms (±50ms w/o Shift)</p>
              <p><kbd className="px-1 py-0.5 bg-gray-700/50 rounded text-[9px] font-mono">⌘←/→</kbd> Nudge end ±250ms (±50ms w/o Shift)</p>
            </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

