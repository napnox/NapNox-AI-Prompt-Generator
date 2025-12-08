
import React, { useState, useCallback, useEffect } from 'react';
import type { Category, GeneratedPrompt, PromptRequest } from '../types';
import { PromptForm } from './PromptForm';
import { PromptResults } from './PromptResults';
import { generatePrompts } from '../services/geminiService';
import { UpgradeModal } from './UpgradeModal';

interface PromptGeneratorProps {
  category: Category;
}

const FREE_LIMIT = 3;
const STORAGE_KEY = 'napnox_generation_count';

export const PromptGenerator: React.FC<PromptGeneratorProps> = ({ category }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPrompts, setGeneratedPrompts] = useState<GeneratedPrompt[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [usageCount, setUsageCount] = useState<number>(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Load usage count from local storage on mount
  useEffect(() => {
    const storedCount = localStorage.getItem(STORAGE_KEY);
    if (storedCount) {
        setUsageCount(parseInt(storedCount, 10));
    }
  }, []);

  const handleGenerate = useCallback(async (formState: Record<string, any>) => {
    // Check limit before generating
    if (usageCount >= FREE_LIMIT) {
        setShowUpgradeModal(true);
        return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedPrompts([]);

    const request: PromptRequest = {
        category: category.id,
        subtype: formState.subtype as string,
        inputText: formState.inputText as string,
        platform: formState.platform as string,
        numVariations: 5,
        filters: {},
    };

    category.filters.forEach(filter => {
        request.filters[filter.id] = formState[filter.id];
    });

    try {
        const response = await generatePrompts(request);
        setGeneratedPrompts(response.prompts);
        
        // Increment usage count on success
        const newCount = usageCount + 1;
        setUsageCount(newCount);
        localStorage.setItem(STORAGE_KEY, newCount.toString());
        
    } catch (err: any) {
        // Provide clear feedback based on common API errors
        let errorMessage = 'Failed to generate prompts. Please try again.';
        
        if (err instanceof Error) {
            // Use the actual error message for debugging
            const rawMessage = err.message;
            errorMessage = rawMessage;
            
            // Map common status codes to user-friendly messages
            if (rawMessage.includes("429")) {
                errorMessage = "Quota Exceeded: You have made too many requests. Please try again later.";
            } else if (rawMessage.includes("503") || rawMessage.includes("Overloaded")) {
                errorMessage = "Service Overloaded: The AI model is currently busy. Please try again in a moment.";
            } else if (rawMessage.includes("400") && rawMessage.includes("API key")) {
                errorMessage = "API Key Error: The API key provided is invalid.";
            } else if (rawMessage.includes("403") || rawMessage.includes("leaked")) {
                errorMessage = "API Key Suspended: Your API key was reported as leaked. Please use another API key.";
            }
        }
        
        setError(errorMessage);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [category, usageCount]);

  return (
    <>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5">
                <PromptForm 
                    category={category} 
                    onGenerate={handleGenerate} 
                    isLoading={isLoading}
                    usageCount={usageCount}
                    maxUsage={FREE_LIMIT}
                />
            </div>
            <div className="lg:col-span-7">
                <PromptResults 
                    prompts={generatedPrompts} 
                    isLoading={isLoading} 
                    error={error}
                    categoryId={category.id}
                />
            </div>
        </div>
        <UpgradeModal 
            isOpen={showUpgradeModal} 
            onClose={() => setShowUpgradeModal(false)} 
        />
    </>
  );
};
