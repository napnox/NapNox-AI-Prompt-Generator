
import React from 'react';
import type { GeneratedPrompt } from '../types';
import { PromptCard } from './PromptCard';
import { SparkleIcon, DownloadIcon } from './icons/ActionIcons';
import { Tooltip } from './Tooltip';

interface PromptResultsProps {
  prompts: GeneratedPrompt[];
  isLoading: boolean;
  error: string | null;
}

const SkeletonCard: React.FC = () => (
    <div className="bg-white p-5 rounded-xl shadow-md border border-gray-200">
        <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
                 <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
        </div>
    </div>
);

export const PromptResults: React.FC<PromptResultsProps> = ({ prompts, isLoading, error }) => {

    const handleDownload = () => {
        if (prompts.length === 0) return;

        const jsonString = JSON.stringify(prompts, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'napnox-prompts.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Container style that defines the fixed window for scrolling
    // Increased height by 200px as requested: h-[calc(100vh+200px)]
    const containerClass = "relative h-[calc(100vh+200px)] sticky top-4 bg-gray-50/50 rounded-2xl border border-gray-200/80 shadow-inner overflow-hidden flex flex-col";

    // Applied pt-[50px] for top spacing and pb-[50px] for bottom spacing as requested
    const scrollContainerClass = "flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pt-[50px] px-4 pb-[50px] scroll-smooth";

    if (isLoading) {
        return (
            <div className={containerClass}>
                 <div className="absolute top-0 left-0 right-0 z-20 bg-white/90 backdrop-blur-sm p-4 border-b border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-800">Generating...</h3>
                </div>
                <div className={scrollContainerClass}>
                    <div className="space-y-4">
                        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-[600px] bg-red-50 border border-red-200 rounded-2xl p-8 text-center sticky top-4">
                <h3 className="text-xl font-semibold text-red-800 mb-2">An Error Occurred</h3>
                <p className="text-red-600 max-w-md">{error}</p>
            </div>
        );
    }
    
    if (prompts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[600px] bg-white border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center sticky top-4">
                <div className="bg-gradient-to-r from-green-100 to-emerald-100 p-4 rounded-full mb-4">
                   <SparkleIcon className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">Your Prompts Will Appear Here</h3>
                <p className="text-gray-500 max-w-sm mt-2">Fill out the form on the left and click "Generate" to see the magic happen!</p>
            </div>
        );
    }

    return (
        <>
            <style>
                {`
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 6px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: linear-gradient(180deg, #34d399 0%, #059669 100%);
                        border-radius: 10px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: linear-gradient(180deg, #10b981 0%, #047857 100%);
                    }
                `}
            </style>
            <div className={containerClass}>
                {/* Fixed Header */}
                <div className="absolute top-0 left-0 right-0 z-20 bg-gray-50/95 backdrop-blur-md p-4 border-b border-gray-200 flex justify-between items-center shadow-sm">
                    <h3 className="text-xl font-semibold text-gray-800">Generated Prompts</h3>
                    <Tooltip content="Download all prompts as a JSON file">
                        <button
                            onClick={handleDownload}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors shadow-sm"
                            aria-label="Download JSON"
                        >
                            <DownloadIcon className="h-4 w-4" />
                            <span>Download JSON</span>
                        </button>
                    </Tooltip>
                </div>

                {/* Scrollable Content */}
                <div className={scrollContainerClass}>
                    <div className="space-y-6">
                        {prompts.map((prompt, index) => <PromptCard key={prompt.id} prompt={prompt} index={index} />)}
                    </div>
                </div>
            </div>
        </>
    );
};
