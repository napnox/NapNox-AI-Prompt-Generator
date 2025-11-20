import React, { useState } from 'react';
import type { GeneratedPrompt } from '../types';
import { CopyIcon, CheckIcon, InfoIcon } from './icons/ActionIcons';
import { Tooltip } from './Tooltip';

interface PromptCardProps {
  prompt: GeneratedPrompt;
  index: number;
}

export const PromptCard: React.FC<PromptCardProps> = ({ prompt, index }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt.text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-200/80 transform transition-transform hover:scale-[1.02] hover:shadow-2xl group">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
           <h4 className="text-sm font-bold text-gray-800">Variation #{index + 1}</h4>
           <Tooltip content="This is a generated prompt tailored to your inputs.">
              <div className="text-gray-400 hover:text-gray-600 cursor-help">
                <InfoIcon className="h-4 w-4" />
              </div>
           </Tooltip>
        </div>
        <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Ready to use
            </span>
            <Tooltip content={isCopied ? "Copied!" : "Copy this prompt to clipboard"}>
                <button
                onClick={handleCopy}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 border ${
                    isCopied 
                    ? 'bg-green-50 text-green-700 border-green-200' 
                    : 'bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-blue-600 border-gray-200 hover:border-blue-200'
                }`}
                aria-label="Copy prompt"
                >
                {isCopied ? (
                    <>
                    <CheckIcon className="h-4 w-4" />
                    <span>Copied</span>
                    </>
                ) : (
                    <>
                    <CopyIcon className="h-4 w-4" />
                    <span>Copy</span>
                    </>
                )}
                </button>
            </Tooltip>
        </div>
      </div>
      <div className="relative">
        <p className="text-gray-700 text-sm md:text-base whitespace-pre-wrap font-mono bg-gray-50 p-4 rounded-lg border border-gray-100">
            {prompt.text}
        </p>
      </div>
      {prompt.metadata.tags && prompt.metadata.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
              {prompt.metadata.tags.map(tag => (
                  <span key={tag} className="px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-100/80 rounded-md cursor-default" title={`Tag: ${tag}`}>
                      {tag}
                  </span>
              ))}
          </div>
      )}
    </div>
  );
};