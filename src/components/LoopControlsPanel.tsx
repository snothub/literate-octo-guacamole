import { formatTimeInput } from '../utils/time';

type LoopControlsPanelProps = {
  loopStart: number | null;
  loopEnd: number | null;
  loopEnabled: boolean;
  onLoopStartChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onLoopEndChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onLoopEnabledChange: (enabled: boolean) => void;
  onClearLoop: () => void;
};

export const LoopControlsPanel = ({
  loopStart,
  loopEnd,
  loopEnabled,
  onLoopStartChange,
  onLoopEndChange,
  onLoopEnabledChange,
  onClearLoop,
}: LoopControlsPanelProps) => {
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

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="loopEnabled"
              checked={loopEnabled}
              onChange={(e) => onLoopEnabledChange(e.target.checked)}
              disabled={loopStart === null || loopEnd === null || loopStart >= loopEnd}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-green-500 focus:ring-green-500 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <label htmlFor="loopEnabled" className="text-sm text-gray-300 select-none">
              Enable Loop
            </label>
          </div>

          {(loopStart !== null || loopEnd !== null) && (
            <button
              onClick={onClearLoop}
              className="w-full mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-all text-sm"
            >
              Clear Loop Points
            </button>
          )}

          <div className="mt-4 p-3 bg-gray-700/50 rounded text-xs text-gray-400">
            {loopStart === null && loopEnd === null && (
              <p>Click the start and end buttons while playing to set loop points.</p>
            )}
            {loopStart !== null && loopEnd === null && <p>Loop start set. Click the end button to complete the loop.</p>}
            {loopStart !== null && loopEnd !== null && !loopEnabled && (
              <p>Loop points set. Enable the checkbox to activate looping.</p>
            )}
            {loopEnabled && loopStart !== null && loopEnd !== null && (
              <p className="text-green-400">Loop is active! The segment will repeat continuously.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

