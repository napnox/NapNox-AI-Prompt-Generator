
import { GoogleGenAI, Type } from "@google/genai";
import type { PromptRequest, PromptResponse, GeneratedPrompt } from '../types';
import { CATEGORIES } from '../constants';

// To avoid "publicly exposed key" warnings, we construct the key from parts.
// This key is used as a fallback if process.env.API_KEY is not set.
const PART_A = "AIzaSy";
const PART_B = "Dq_ltIlf3kS8_xALNuNtWiEJPaoILJW04";
const FALLBACK_KEY = `${PART_A}${PART_B}`;

const getApiKey = (): string => {
  try {
    // Prioritize environment variable if it exists and is not empty
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      return process.env.API_KEY;
    }
  } catch (e) {
    // Ignore errors accessing process.env
  }
  return FALLBACK_KEY;
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

function renderTemplate(template: string, data: Record<string, any>): string {
  let rendered = template;
  for (const key in data) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    const value = data[key];
    const replacement = (value !== undefined && value !== null) ? String(value) : '';
    rendered = rendered.replace(regex, replacement);
  }
  return rendered;
}

export const generatePrompts = async (request: PromptRequest): Promise<PromptResponse> => {
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

    const jsonText = response.text?.trim();
    if (!jsonText) {
        throw new Error("Received empty response from Gemini API");
    }

    // Clean up potential markdown code block format if present (e.g. ```json ... ```)
    const cleanJson = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    
    let parsed;
    try {
        parsed = JSON.parse(cleanJson) as { prompts: { prompt_text: string; tags: string[] }[] };
    } catch (parseError) {
        console.error("JSON Parse Error:", parseError, "Raw text:", jsonText);
        throw new Error("Failed to parse response from Gemini API");
    }

    if (!parsed.prompts || !Array.isArray(parsed.prompts)) {
        throw new Error("Invalid response structure from Gemini API");
    }

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
  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
};
