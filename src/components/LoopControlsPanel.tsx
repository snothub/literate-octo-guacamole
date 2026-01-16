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
  onUpdateLabel,
  onClearSelection,
}: LoopControlsPanelProps) => {
  const activeLoop = loops.find((loop) => loop.id === activeLoopId) || null;
  const canAddLoop = loopStart !== null && loopEnd !== null && loopStart < loopEnd;
  
  return (
    <div className="w-full h-[calc(100vh-12rem)] flex flex-col">
      <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm rounded-xl shadow-xl border border-gray-700/50 flex flex-col h-full">
        <div className="p-4 sm:p-5 flex-shrink-0">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-full"></span>
            Loop Controls
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-5 pb-4 sm:pb-5">
          <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            <label className="text-sm font-medium text-emerald-300 w-full sm:w-20 flex-shrink-0">Start Time</label>
            <input
              type="text"
              value={formatTimeInput(loopStart)}
              onChange={onLoopStartChange}
              placeholder="0:00.000"
              className="w-full flex-1 bg-gray-900/60 text-white px-3 py-2.5 rounded-lg border border-gray-600/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none text-sm transition-all"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            <label className="text-sm font-medium text-emerald-300 w-full sm:w-20 flex-shrink-0">End Time</label>
            <input
              type="text"
              value={formatTimeInput(loopEnd)}
              onChange={onLoopEndChange}
              placeholder="0:00.000"
              className="w-full flex-1 bg-gray-900/60 text-white px-3 py-2.5 rounded-lg border border-gray-600/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none text-sm transition-all"
            />
          </div>

          {activeLoop && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
              <label className="text-sm font-medium text-emerald-300 w-full sm:w-20 flex-shrink-0">Label</label>
              <input
                type="text"
                value={activeLoop.label}
                onChange={(e) => onUpdateLabel(e.target.value)}
                placeholder="Loop name"
                className="w-full flex-1 bg-gray-900/60 text-white px-3 py-2.5 rounded-lg border border-gray-600/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none text-sm transition-all"
              />
            </div>
          )}

          {activeLoop && (
            <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 rounded-xl p-4 text-center border border-emerald-500/20">
              <div className="text-xs font-medium text-emerald-300 mb-2 uppercase tracking-wide">Repetitions</div>
              <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-br from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
                {activeLoop.repetitions || 0}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="loopEnabled"
              checked={loopEnabled}
              onChange={(e) => onLoopEnabledChange(e.target.checked)}
              disabled={!activeLoop || loopStart === null || loopEnd === null || loopStart >= loopEnd}
              className="w-5 h-5 rounded border-gray-600 bg-gray-900/60 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            />
            <label htmlFor="loopEnabled" className="text-sm font-medium text-gray-200 select-none cursor-pointer">
              Enable Loop
            </label>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              onClick={onAddLoop}
              disabled={!canAddLoop}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-medium rounded-lg transition-all text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              Add Loop
            </button>
            <button
              onClick={onClearSelection}
              className="flex-1 px-4 py-2.5 bg-gray-700/80 hover:bg-gray-600/80 text-white font-medium rounded-lg transition-all text-sm"
            >
              New Loop
            </button>
          </div>

          {activeLoop && (
            <button
              onClick={() => onRemoveLoop(activeLoop.id)}
              className="w-full mt-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium rounded-lg transition-all text-sm border border-red-500/20"
            >
              Remove Active Loop
            </button>
          )}

          <div className="mt-4 p-3 bg-gray-900/40 rounded-lg text-xs text-gray-400 space-y-2 border border-gray-700/30">
            {loopStart === null && loopEnd === null && (
              <p>💡 Set start/end with the buttons below or type times, then add the loop.</p>
            )}
            {loopStart !== null && loopEnd === null && <p>⏱️ Loop start set. Set an end time to finish the loop.</p>}
            {loopStart !== null && loopEnd !== null && !loopEnabled && activeLoop && (
              <p>✅ Loop points set. Enable the checkbox to activate looping.</p>
            )}
            {loopEnabled && loopStart !== null && loopEnd !== null && activeLoop && (
              <p className="text-emerald-400 font-medium">🔁 Loop is active! The segment will repeat continuously.</p>
            )}
          </div>

          <div className="mt-3 p-3 bg-gradient-to-br from-gray-800/40 to-gray-900/40 rounded-lg text-[11px] text-gray-400 space-y-1.5 border border-gray-700/30">
            <p className="text-gray-300 font-semibold text-xs mb-1">⌨️ Keyboard Shortcuts</p>
            <div className="space-y-1">
              <p><kbd className="px-1.5 py-0.5 bg-gray-700/50 rounded text-[10px] font-mono">S</kbd> Set start · <kbd className="px-1.5 py-0.5 bg-gray-700/50 rounded text-[10px] font-mono">E</kbd> Set end · <kbd className="px-1.5 py-0.5 bg-gray-700/50 rounded text-[10px] font-mono">L</kbd> Toggle loop</p>
              <p><kbd className="px-1.5 py-0.5 bg-gray-700/50 rounded text-[10px] font-mono">P</kbd> Play from start · <kbd className="px-1.5 py-0.5 bg-gray-700/50 rounded text-[10px] font-mono">⌥←/→</kbd> Prev/next loop</p>
              <p><kbd className="px-1.5 py-0.5 bg-gray-700/50 rounded text-[10px] font-mono">⇧←/→</kbd> Nudge start ±250ms (±50ms without Shift)</p>
              <p><kbd className="px-1.5 py-0.5 bg-gray-700/50 rounded text-[10px] font-mono">⌘←/→</kbd> Nudge end ±250ms (±50ms without Shift)</p>
            </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

