import type { Track } from '../types/spotify';

type RecentTracksPaneProps = {
  tracks: Track[];
  onSelectTrack: (track: Track) => void;
};

export const RecentTracksPane = ({ tracks, onSelectTrack }: RecentTracksPaneProps) => {
  if (tracks.length === 0) return null;

  return (
    <div className="bg-gray-800/60 rounded-lg p-4">
      <h4 className="text-sm font-semibold text-gray-200 mb-3">Recently Played</h4>
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {tracks.map((track) => (
          <button
            key={track.id}
            type="button"
            onClick={() => onSelectTrack(track)}
            className="w-full flex items-center gap-3 p-2 rounded border border-transparent bg-gray-800/50 hover:bg-gray-700/70 transition-all text-left"
          >
            <img
              src={track.album.images[2]?.url || track.album.images[0]?.url}
              alt=""
              className="w-10 h-10 rounded"
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

