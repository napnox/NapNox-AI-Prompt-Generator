
import React, { useState, useEffect } from 'react';
import type { GeneratedPrompt } from '../types';
import { CopyIcon, CheckIcon } from './icons/ActionIcons';
import { Tooltip } from './Tooltip';

interface PromptCardProps {
  prompt: GeneratedPrompt;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  categoryId?: string;
}

const FormattedContent: React.FC<{ text: string }> = ({ text }) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return (
    <div className="text-base text-gray-700 leading-relaxed font-sans px-[15px]">
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          const title = part.replace(/\*\*/g, '').replace(/:$/, '').trim();
          return (
            <h4 key={i} className="font-bold text-gray-900 mt-5 mb-2 text-lg border-b border-gray-100 pb-1">
              {title}
            </h4>
          );
        }
        let cleanText = part.replace(/^[\s\-\:]+/, '').trim();
        if (!cleanText) return null;
        return <p key={i} className="mb-4 whitespace-pre-line">{cleanText}</p>;
      })}
    </div>
  );
};

// Helper to generate consistent colorful tags
const getTagColor = (tag: string) => {
    const colors = [
        'bg-red-100 text-red-700 border-red-200',
        'bg-orange-100 text-orange-700 border-orange-200',
        'bg-amber-100 text-amber-700 border-amber-200',
        'bg-green-100 text-green-700 border-green-200',
        'bg-emerald-100 text-emerald-700 border-emerald-200',
        'bg-teal-100 text-teal-700 border-teal-200',
        'bg-cyan-100 text-cyan-700 border-cyan-200',
        'bg-sky-100 text-sky-700 border-sky-200',
        'bg-blue-100 text-blue-700 border-blue-200',
        'bg-indigo-100 text-indigo-700 border-indigo-200',
        'bg-violet-100 text-violet-700 border-violet-200',
        'bg-purple-100 text-purple-700 border-purple-200',
        'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
        'bg-pink-100 text-pink-700 border-pink-200',
        'bg-rose-100 text-rose-700 border-rose-200',
    ];
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
        hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
};

export const PromptCard: React.FC<PromptCardProps> = ({ prompt, index, isOpen, onToggle, categoryId }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [heading, setHeading] = useState(`Prompt ${index + 1}`);

  useEffect(() => {
    // Attempt to extract a short summary heading from the content
    const extractHeading = () => {
        // Look for Concept or Subject lines
        const match = prompt.text.match(/(?:\*\*Concept:\*\*|Concept:|Subject:|Summary:)\s*(.*?)(\.|\n|$)/i);
        if (match && match[1]) {
            let summary = match[1].trim();
            
            // Clean up repetitive prefixes like "Portrait 1 / Variation 1 - "
            // Regex removes: "Word # / Word # -" patterns or just "Variation # -"
            summary = summary.replace(/^((?:Portrait|Prompt|Variation)\s*\d+\s*[\/\-]\s*)+/i, '');
            summary = summary.replace(/^(?:Variation\s*\d+\s*-\s*)/i, '');
            summary = summary.replace(/^\s*-\s*/, ''); // Remove leading dash if left

            if (summary.length > 80) summary = summary.substring(0, 80) + "...";
            return summary;
        }
        
        // Fallback checks
        if (prompt.metadata.tags && prompt.metadata.tags.length > 0) {
             return `${prompt.metadata.tags[0]} Variation`;
        }

        return `Generated Result`;
    };
    setHeading(extractHeading());
  }, [prompt, index]);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent toggling accordion
    try {
      await navigator.clipboard.writeText(prompt.text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className={`border rounded-lg overflow-hidden transition-all duration-300 ${isOpen ? 'border-emerald-400 shadow-md ring-1 ring-emerald-100' : 'border-gray-200 shadow-sm bg-white'}`}>
      {/* Tab Header - Click to open */}
      <div 
        onClick={onToggle}
        className={`px-4 py-4 flex justify-between items-center cursor-pointer select-none transition-colors duration-300 gap-4
            ${isOpen 
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                : 'bg-white hover:bg-gray-50 text-gray-800'
            }`}
      >
        <div className="flex items-center gap-3 w-full">
            {/* Arrow Icon */}
            <div className={`transform transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-90 text-white' : 'text-gray-400'}`}>
                 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </div>
            
            {/* Title Section */}
            <div className="flex-1">
                <h4 className={`text-lg md:text-xl font-semibold leading-tight whitespace-normal break-words ${isOpen ? 'text-white' : 'text-gray-900'}`}>
                    Prompt {index + 1} - {heading}
                </h4>
            </div>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
            {/* Show Copy Button in Header for quick access */}
            <Tooltip content={isCopied ? "Copied!" : "Copy prompt"}>
                <button
                onClick={handleCopy}
                className={`p-2 rounded-lg transition-all duration-200 backdrop-blur-sm ${
                    isOpen
                        ? 'text-white bg-white/20 hover:bg-white/30'
                        : isCopied 
                            ? 'text-green-600 bg-green-50' 
                            : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                }`}
                >
                {isCopied ? <CheckIcon className="h-5 w-5" /> : <CopyIcon className="h-5 w-5" />}
                </button>
            </Tooltip>
        </div>
      </div>

      {/* Tab Content - Collapsible */}
      {isOpen && (
          <div className="bg-white animate-fade-in-up">
             <div className="p-4 md:p-6">
                <FormattedContent text={prompt.text} />
                
                {/* Colorful Tags */}
                {prompt.metadata.tags && prompt.metadata.tags.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-gray-100 px-[15px]">
                    {prompt.metadata.tags.map(tag => (
                        <span 
                            key={tag} 
                            className={`px-3 py-1 text-xs font-bold rounded-full border shadow-sm ${getTagColor(tag)}`}
                        >
                            #{tag}
                        </span>
                    ))}
                </div>
                )}
             </div>
          </div>
      )}
    </div>
  );
};
