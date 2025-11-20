
import { GoogleGenAI, Type } from "@google/genai";
import type { PromptRequest, PromptResponse, GeneratedPrompt } from '../types';
import { CATEGORIES } from '../constants';

// Safely access process.env if available, otherwise use the provided fallback key.
// This ensures the app works immediately upon deployment even if env vars aren't set yet.
const getApiKey = () => {
  try {
    return process.env.API_KEY || 'AIzaSyDq_ltIlf3kS8_xALNuNtWiEJPaoILJW04';
  } catch (e) {
    // Fallback for environments where process is not defined
    return 'AIzaSyDq_ltIlf3kS8_xALNuNtWiEJPaoILJW04';
  }
};

const API_KEY = getApiKey();

if (!API_KEY) {
  console.warn("API_KEY not found. Using mock data.");
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

function renderTemplate(template: string, data: Record<string, any>): string {
  let rendered = template;
  for (const key in data) {
    // Create a regex to replace all occurrences of the placeholder
    const regex = new RegExp(`{{${key}}}`, 'g');
    const value = data[key];
    // Use the value if present, otherwise use an empty string to avoid "(not specified)" in the prompt
    const replacement = (value !== undefined && value !== null) ? String(value) : '';
    rendered = rendered.replace(regex, replacement);
  }
  return rendered;
}

const generateMockPrompts = (request: PromptRequest): PromptResponse => {
    const category = CATEGORIES.find(c => c.id === request.category);
    const prompts: GeneratedPrompt[] = Array.from({ length: request.numVariations }).map((_, i) => ({
        id: `mock-${Date.now()}-${i}`,
        text: `[MOCK RESULT] This is a placeholder because the API call failed.\n\nVariation #${i + 1} for a ${request.subtype} about "${request.inputText}".`,
        metadata: { tags: [request.subtype, request.platform, 'mock'] },
    }));

    return {
        requestId: `mock-${Date.now()}`,
        category: request.category,
        prompts: prompts,
        generatedAt: new Date().toISOString(),
    };
};

export const generatePrompts = async (request: PromptRequest): Promise<PromptResponse> => {
  if (!ai) {
    // Simulate network delay for mock
    await new Promise(resolve => setTimeout(resolve, 1000));
    return generateMockPrompts(request);
  }

  const category = CATEGORIES.find(c => c.id === request.category);
  if (!category) {
    throw new Error(`Category not found: ${request.category}`);
  }

  const templateData = {
    ...request.filters,
    numVariations: request.numVariations,
    platform: request.platform,
    subtype: request.subtype,
    inputText: request.inputText,
  };
  
  const composedPrompt = renderTemplate(category.template, templateData);

  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: composedPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    prompts: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                prompt_text: {
                                    type: Type.STRING,
                                    description: 'The full, detailed text of the generated prompt. Use markdown formatting (bold keys) for readability.',
                                },
                                tags: {
                                    type: Type.ARRAY,
                                    items: { type: Type.STRING },
                                    description: 'Relevant tags for the prompt (e.g., style, platform).'
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    const jsonText = response.text.trim();
    const parsed = JSON.parse(jsonText) as { prompts: { prompt_text: string; tags: string[] }[] };

    const prompts: GeneratedPrompt[] = parsed.prompts.map((p, i) => ({
      id: `gen-${Date.now()}-${i}`,
      text: p.prompt_text,
      metadata: { tags: p.tags || [request.subtype, request.platform] },
    }));

    return {
      requestId: `gen-${Date.now()}`,
      category: request.category,
      prompts: prompts,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    // Fallback to mock data on API error
    return generateMockPrompts(request);
  }
};
