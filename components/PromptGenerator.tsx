
import React, { useState, useCallback } from 'react';
import type { Category, GeneratedPrompt, PromptRequest } from '../types';
import { PromptForm } from './PromptForm';
import { PromptResults } from './PromptResults';
import { generatePrompts } from '../services/geminiService';

interface PromptGeneratorProps {
  category: Category;
}

export const PromptGenerator: React.FC<PromptGeneratorProps> = ({ category }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPrompts, setGeneratedPrompts] = useState<GeneratedPrompt[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async (formState: Record<string, any>) => {
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
    } catch (err) {
        setError('Failed to generate prompts. Please try again.');
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [category]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5">
            <PromptForm 
                category={category} 
                onGenerate={handleGenerate} 
                isLoading={isLoading} 
            />
        </div>
        <div className="lg:col-span-7">
            <PromptResults 
                prompts={generatedPrompts} 
                isLoading={isLoading} 
                error={error}
            />
        </div>
    </div>
  );
};
