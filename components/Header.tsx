
import React from 'react';
import { NapNoxLogo } from './icons/NapNoxLogo';

export const Header: React.FC = () => {
  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center h-16">
          <div className="flex items-center space-x-2">
            <NapNoxLogo className="h-8 w-8" />
            <span className="text-xl font-bold text-gray-800">NapNox Prompts</span>
          </div>
        </div>
      </div>
    </header>
  );
};