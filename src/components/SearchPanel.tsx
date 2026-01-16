import { ExternalLink, Music } from 'lucide-react';
import type { Track } from '../types/spotify';

type SearchPanelProps = {
  className?: string;
  query: string;
  onQueryChange: (value: string) => void;
  onSearch: () => void;
  loading: boolean;
  error: string;
  results: Track[];
  selected: Track | null;
  usingPreview: boolean;
  deviceId: string;
  onSelectTrack: (track: Track) => void;
};

export const SearchPanel = ({
  className,
  query,
  onQueryChange,
  onSearch,
  loading,
  error,
  results,
  selected,
  usingPreview,
  deviceId,
  onSelectTrack,
}: SearchPanelProps) => {
  return (
    <div className={className ?? 'flex-1 max-w-xl'}>
      <div className="flex items-center justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
        <Music className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-500" />
        <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          Spotify Loop Trainer
        </h1>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search for a song..."
          className="w-full bg-gray-800/80 backdrop-blur-sm text-white px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-gray-700/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none text-sm sm:text-base transition-all"
        />
      </div>

      {error && <p className="text-red-400 text-sm mb-4 px-1">{error}</p>}

      {!selected && !loading && results.length === 0 && !query && (
        <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm rounded-xl p-6 border border-gray-700/30 text-center space-y-4">
          <div className="text-5xl">🎵</div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white">Welcome to Spotify Loop Trainer!</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Perfect for practicing music, dance choreography, or learning lyrics. Create custom loops to repeat any section of a song.
            </p>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50 space-y-3">
            <p className="text-emerald-400 font-semibold text-sm">How to use:</p>
            <ol className="text-left text-xs text-gray-300 space-y-2 leading-relaxed">
              <li className="flex gap-2">
                <span className="text-emerald-400 font-bold flex-shrink-0">1.</span>
                <span><strong className="text-white">Search</strong> for any track using the search bar above</span>
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-400 font-bold flex-shrink-0">2.</span>
                <span><strong className="text-white">Play</strong> the track and listen for the section you want to loop</span>
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-400 font-bold flex-shrink-0">3.</span>
                <span><strong className="text-white">Set points</strong> by pressing <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-[10px] font-mono mx-0.5">S</kbd> for start and <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-[10px] font-mono mx-0.5">E</kbd> for end</span>
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-400 font-bold flex-shrink-0">4.</span>
                <span><strong className="text-white">Add loop</strong> in the left panel, then enable it to start repeating</span>
              </li>
            </ol>
          </div>
          <p className="text-xs text-gray-500 pt-2">
            💡 Tip: You can create multiple loops per track and fine-tune them with keyboard shortcuts!
          </p>
        </div>
      )}

      {results.length > 0 && (
        <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl overflow-hidden mb-4 max-h-72 sm:max-h-80 overflow-y-auto border border-gray-700/30">
          {results.map((track) => (
            <button
              key={track.id}
              onClick={() => onSelectTrack(track)}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-700/50 transition-all text-left active:bg-gray-700"
            >
              <img src={track.album.images[2]?.url || track.album.images[0]?.url} alt="" className="w-12 h-12 rounded shadow-md flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate text-sm sm:text-base">{track.name}</p>
                <p className="text-gray-400 text-xs sm:text-sm truncate">{track.artists.map((a) => a.name).join(', ')}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm rounded-xl p-3 sm:p-4 flex items-center gap-3 mb-4 shadow-xl border border-gray-700/50">
          <img src={selected.album.images[0]?.url} alt="" className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg shadow-lg flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-white truncate">{selected.name}</h2>
            <p className="text-gray-400 text-xs sm:text-sm truncate">{selected.artists.map((a) => a.name).join(', ')}</p>
            <p className="text-gray-500 text-xs truncate">{selected.album.name}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <a
                href={selected.external_urls.spotify}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-emerald-500 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </a>
              {usingPreview && <span className="text-gray-500 text-xs">30s preview</span>}
              {!deviceId && !selected.preview_url && <span className="text-yellow-500 text-xs">Premium required</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

