import type { Track } from '../types/spotify';

type RecentTracksPaneProps = {
  tracks: Track[];
  onSelectTrack: (track: Track) => void;
};

export const RecentTracksPane = ({ tracks, onSelectTrack }: RecentTracksPaneProps) => {
  return (
    <div className="w-full">
      <div className="px-4 py-3">
            {tracks.length === 0 ? (
              <div className="flex items-center justify-center px-4 py-6">
                <p className="text-gray-500 text-sm text-center">No recent tracks yet.<br />Search and select a song to get started!</p>
              </div>
            ) : (
              <div className="px-4 py-3 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                <div className="space-y-2">
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
            )}
        </div>
      </div>
    </div>
  );
};

