import type { PromptRequest, PromptResponse } from '../types';

/**
 * Prompt generation runs on the server (`/api/generate`) so that the Gemini
 * API key is never shipped to, or reachable from, the browser.
 */
export const generatePrompts = async (request: PromptRequest): Promise<PromptResponse> => {
  let response: Response;
  try {
    response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(request),
    });
  } catch {
    throw new Error('Network error: could not reach the prompt service. Check your connection.');
  }

  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    // Fall through to the generic error below.
  }

  if (!response.ok) {
    throw new Error(payload?.error?.message ?? 'Failed to generate prompts. Please try again.');
  }

  if (!payload || !Array.isArray(payload.prompts)) {
    throw new Error('Received an unexpected response from the prompt service.');
  }

  return payload as PromptResponse;
};
