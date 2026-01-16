import { ExternalLink, Music, Search } from 'lucide-react';
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
      <div className="flex items-center justify-center gap-2 mb-8">
        <Music className="w-8 h-8 text-green-500" />
        <h1 className="text-2xl font-bold text-white">Spotify Search</h1>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          placeholder="Search for a song..."
          className="flex-1 bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-green-500 focus:outline-none"
        />
        <button
          onClick={onSearch}
          disabled={loading}
          className="bg-green-500 hover:bg-green-400 text-black p-3 rounded-lg transition-all disabled:opacity-50"
        >
          <Search className="w-6 h-6" />
        </button>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {results.length > 0 && (
        <div className="bg-gray-800/50 rounded-lg overflow-hidden mb-4 max-h-80 overflow-y-auto">
          {results.map((track) => (
            <button
              key={track.id}
              onClick={() => onSelectTrack(track)}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-700/50 transition-all text-left"
            >
              <img src={track.album.images[2]?.url || track.album.images[0]?.url} alt="" className="w-12 h-12 rounded" />
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{track.name}</p>
                <p className="text-gray-400 text-sm truncate">{track.artists.map((a) => a.name).join(', ')}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="bg-gray-800/80 rounded-lg p-3 flex items-center gap-3 mb-4">
          <img src={selected.album.images[0]?.url} alt="" className="w-24 h-24 rounded shadow-lg flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-white truncate">{selected.name}</h2>
            <p className="text-gray-400 text-sm truncate">{selected.artists.map((a) => a.name).join(', ')}</p>
            <p className="text-gray-500 text-xs truncate">{selected.album.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <a
                href={selected.external_urls.spotify}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-green-500 transition-all"
              >
                <ExternalLink className="w-4 h-4" />
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

