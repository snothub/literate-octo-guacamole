import type { Track } from '../types/spotify';

type RecentTracksPaneProps = {
  tracks: Track[];
  onSelectTrack: (track: Track) => void;
};

export const RecentTracksPane = ({ tracks, onSelectTrack }: RecentTracksPaneProps) => {
  if (tracks.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-700/30">
      <h4 className="text-sm font-semibold text-emerald-300 mb-3 flex items-center gap-2">
        <span className="w-1 h-4 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-full"></span>
        Recently Played
      </h4>
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {tracks.map((track) => (
          <button
            key={track.id}
            type="button"
            onClick={() => onSelectTrack(track)}
            className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-transparent bg-gray-800/50 hover:bg-gray-700/70 hover:border-gray-600/30 transition-all text-left active:scale-98"
          >
            <img
              src={track.album.images[2]?.url || track.album.images[0]?.url}
              alt=""
              className="w-10 h-10 rounded shadow-md flex-shrink-0"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{track.name}</p>
              <p className="text-xs text-gray-400 truncate">{track.artists.map((a) => a.name).join(', ')}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

