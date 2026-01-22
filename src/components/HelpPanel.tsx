import { ChevronDown, HelpCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

export const HelpPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const response = await fetch('/version.json');
        if (response.ok) {
          const data = await response.json();
          setVersion(data.version);
        }
      } catch (err) {
        // Version file not found or error reading it - silently fail
        console.debug('Version file not available');
      }
    };
    fetchVersion();
  }, []);

  return (
    <>
      {/* Help Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-gray-800/60 hover:bg-gray-700/60 text-emerald-400 border border-gray-700/50 hover:border-emerald-500/50 transition-all mb-4"
        aria-expanded={isOpen}
      >
        <HelpCircle className="w-4 h-4" />
        <span>Help</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Expandable Help Content */}
      {isOpen && (
        <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm rounded-xl p-4 sm:p-5 border border-gray-700/30 space-y-3 mb-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="text-center space-y-2">
            <div className="text-4xl">🎵</div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">Spotify Loop Trainer</h3>
              {version && <p className="text-xs text-gray-500 mt-1">v{version}</p>}
            </div>
            <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
              Perfect for practicing music, dance choreography, or learning lyrics. Create custom loops to repeat any section of a song.
            </p>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700/50 space-y-2.5">
            <p className="text-emerald-400 font-semibold text-xs sm:text-sm">How to use:</p>
            <ol className="text-left text-xs text-gray-300 space-y-1.5 leading-relaxed">
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
                <span><strong className="text-white">Enable loop</strong> to start repeating your segment</span>
              </li>
            </ol>
          </div>
          <p className="text-xs text-gray-500 pt-1">
            💡 Tip: Create multiple loops per track and fine-tune with keyboard shortcuts!
          </p>
        </div>
      )}
    </>
  );
};
