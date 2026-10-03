import React, { useEffect, useState } from 'react';
import type { GeneratedPrompt } from '../types';
import { CheckIcon, CopyIcon, DownloadIcon, SparkleIcon } from './icons/ActionIcons';
import { PromptCard } from './PromptCard';
import { Tooltip } from './Tooltip';

interface PromptResultsProps {
  prompts: GeneratedPrompt[];
  isLoading: boolean;
  error: string | null;
}

const SkeletonCard: React.FC = () => (
  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
    <div className="animate-pulse space-y-4">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
      </div>
      <div className="h-4 bg-gray-200 rounded w-1/2" />
    </div>
  </div>
);

const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="lg:sticky lg:top-4">{children}</div>
);

export const PromptResults: React.FC<PromptResultsProps> = ({ prompts, isLoading, error }) => {
  const [openPromptId, setOpenPromptId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  useEffect(() => {
    setOpenPromptId(prompts.length > 0 ? prompts[0].id : null);
  }, [prompts]);

  const handleDownload = () => {
    if (prompts.length === 0) return;
    const text = prompts.map((p, i) => `--- Prompt ${i + 1} ---\n\n${p.text}\n`).join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'napnox-prompts.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(
        prompts.map((p, i) => `--- Prompt ${i + 1} ---\n\n${p.text}`).join('\n\n'),
      );
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      // Clipboard unavailable (insecure context); the download button still works.
    }
  };

  if (isLoading) {
    return (
      <Shell>
        <div className="bg-gray-50/50 rounded-2xl border border-gray-200/80 p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <SparkleIcon className="h-5 w-5 text-emerald-500 animate-pulse" />
            Writing your prompts...
          </h3>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </Shell>
    );
  }

  if (error) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center min-h-[20rem] bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <div className="bg-red-100 p-3 rounded-full mb-4">
            <svg className="h-6 w-6 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">That didn't work</h3>
          <p className="text-red-700 max-w-md text-sm leading-relaxed">{error}</p>
        </div>
      </Shell>
    );
  }

  if (prompts.length === 0) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center min-h-[20rem] bg-white border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center">
          <div className="bg-gradient-to-r from-green-100 to-emerald-100 p-4 rounded-full mb-4">
            <SparkleIcon className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800">Your prompts will appear here</h3>
          <p className="text-gray-500 max-w-sm mt-2">
            Describe your idea on the left and hit Generate.
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="bg-gray-50/50 rounded-2xl border border-gray-200/80 shadow-inner flex flex-col max-h-[calc(100vh-2rem)]">
        <div className="flex justify-between items-center gap-2 p-4 border-b border-gray-200 bg-white/95 backdrop-blur-md rounded-t-2xl">
          <h3 className="text-lg font-semibold text-gray-800">
            {prompts.length} {prompts.length === 1 ? 'prompt' : 'prompts'}
          </h3>
          <div className="flex items-center gap-2">
            <Tooltip content={copiedAll ? 'Copied!' : 'Copy all prompts'}>
              <button
                onClick={handleCopyAll}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors shadow-sm"
              >
                {copiedAll ? <CheckIcon className="h-4 w-4 text-green-600" /> : <CopyIcon className="h-4 w-4" />}
                <span className="hidden sm:inline">Copy all</span>
              </button>
            </Tooltip>
            <Tooltip content="Download all prompts as a text file">
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors shadow-sm"
              >
                <DownloadIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Download</span>
              </button>
            </Tooltip>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-4 space-y-3 scroll-smooth">
          {prompts.map((prompt, index) => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              index={index}
              isOpen={openPromptId === prompt.id}
              onToggle={() => setOpenPromptId((previous) => (previous === prompt.id ? null : prompt.id))}
            />
          ))}
        </div>
      </div>
    </Shell>
  );
};
