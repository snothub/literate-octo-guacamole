import { Music } from 'lucide-react';

type LoginScreenProps = {
  onLogin: () => void;
};

export const LoginScreen = ({ onLogin }: LoginScreenProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 flex items-center justify-center p-4">
      <div className="text-center">
        <Music className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-white mb-2">Music Man</h1>
        <p className="text-gray-400 mb-6">Connect your Spotify account to search and play music</p>
        <button
          onClick={onLogin}
          className="bg-green-500 hover:bg-green-400 text-black font-semibold py-3 px-8 rounded-full transition-all"
        >
          Connect with Spotify
        </button>
      </div>
    </div>
  );
};

