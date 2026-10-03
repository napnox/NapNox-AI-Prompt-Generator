import React from 'react';
import type { Session } from '../types';
import { NapNoxLogo } from './icons/NapNoxLogo';

interface HeaderProps {
  user: Session['user'];
  onLogout: () => void;
}

/**
 * Standalone-mode header only. When the app is embedded in WordPress the
 * theme supplies its own header, so App.tsx hides this.
 */
export const Header: React.FC<HeaderProps> = ({ user, onLogout }) => (
  <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-200">
    <div className="mx-auto w-full max-w-6xl px-4">
      <div className="flex items-center justify-between h-16">
        <div className="flex items-center space-x-2">
          <NapNoxLogo className="h-8 w-8" />
          <span className="text-xl font-bold text-gray-800">NapNox Prompts</span>
        </div>
        {user && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 hidden sm:inline">{user.name}</span>
            <button
              onClick={onLogout}
              className="text-sm font-semibold text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  </header>
);
