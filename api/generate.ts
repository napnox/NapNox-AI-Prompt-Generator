import { GoogleGenAI, Type } from '@google/genai';
import { CATEGORIES } from '../constants';
import type { Category, Filter } from '../types';

/**
 * Server-side prompt generation endpoint.
 *
 * The Gemini API key is read from the environment at request time and never
 * leaves this process -- the browser only ever talks to `/api/generate`.
 *
 * This is a standard Web Fetch handler, so it runs as-is on Vercel, Netlify
 * Functions, Cloudflare Workers and Deno Deploy, and is wired into the Vite
 * dev server by the `devApiPlugin` in `vite.config.ts`.
 */

const MODEL = 'gemini-2.5-flash';
const MAX_INPUT_TEXT = 2000;
const MAX_TEXTAREA = 1000;
const MAX_VARIATIONS = 5;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

const fail = (message: string, status: number, code?: string): Response =>
  json({ error: { message, code: code ?? String(status) } }, status);

class BadRequest extends Error {}

function renderTemplate(template: string, data: Record<string, unknown>): string {
  let rendered = template;
  for (const key of Object.keys(data)) {
    const value = data[key];
    const replacement = value !== undefined && value !== null ? String(value) : '';
    // Replace literally so that user-supplied values can never inject a
    // `{{placeholder}}` that gets expanded on a later pass.
    rendered = rendered.split(`{{${key}}}`).join(replacement);
  }
  return rendered;
}

function asString(value: unknown, field: string, max: number): string {
  if (typeof value !== 'string') {
    throw new BadRequest(`"${field}" must be a string.`);
  }
  const trimmed = value.trim();
  if (trimmed.length > max) {
    throw new BadRequest(`"${field}" must be ${max} characters or fewer.`);
  }
  return trimmed;
}

/**
 * Only values that the UI could legitimately have produced are accepted, so
 * this endpoint cannot be repurposed as an open proxy to the Gemini API.
 */
function validateFilter(filter: Filter, raw: unknown): string | boolean {
  switch (filter.type) {
    case 'select': {
      const options = filter.options ?? [];
      const allowed = options.map((o) => o.value);
      if (raw === undefined || raw === null || raw === '') {
        // Mirror the form's defaulting so an omitted filter is not an error.
        const fallback = filter.defaultValue;
        return typeof fallback === 'string' && allowed.includes(fallback)
          ? fallback
          : (options[0]?.value ?? '');
      }
      if (typeof raw !== 'string' || !allowed.includes(raw)) {
        throw new BadRequest(`Invalid value for "${filter.id}".`);
      }
      return raw;
    }
    case 'toggle':
      return raw === undefined ? Boolean(filter.defaultValue) : Boolean(raw);
    case 'textarea':
      return raw === undefined ? '' : asString(raw, filter.id, MAX_TEXTAREA);
    case 'file':
      return '';
    default:
      return '';
  }
}

interface ValidatedRequest {
  category: Category;
  composedPrompt: string;
  image?: { base64: string; mimeType: string };
}

function validate(body: any): ValidatedRequest {
  if (!body || typeof body !== 'object') {
    throw new BadRequest('Request body must be a JSON object.');
  }

  const category = CATEGORIES.find((c) => c.id === body.category);
  if (!category) {
    throw new BadRequest('Unknown category.');
  }

  const subtype = asString(body.subtype, 'subtype', 120);
  if (!category.subtypes.includes(subtype)) {
    throw new BadRequest('Unknown subtype for this category.');
  }

  const platform = asString(body.platform, 'platform', 120);
  if (!category.platform.options.some((o) => o.value === platform)) {
    throw new BadRequest('Unknown platform for this category.');
  }

  const inputText = asString(body.inputText ?? '', 'inputText', MAX_INPUT_TEXT);
  if (!inputText) {
    throw new BadRequest('Please describe what you want a prompt for.');
  }

  const numVariations = Math.min(
    MAX_VARIATIONS,
    Math.max(1, Number.parseInt(String(body.numVariations ?? MAX_VARIATIONS), 10) || MAX_VARIATIONS),
  );

  const rawFilters = (body.filters ?? {}) as Record<string, unknown>;
  const filters: Record<string, string | boolean> = {};
  for (const filter of category.filters) {
    filters[filter.id] = validateFilter(filter, rawFilters[filter.id]);
  }

  let image: ValidatedRequest['image'];
  if (body.image) {
    const { base64, mimeType } = body.image;
    if (typeof base64 !== 'string' || typeof mimeType !== 'string') {
      throw new BadRequest('Malformed image payload.');
    }
    if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) {
      throw new BadRequest('Unsupported image type. Use JPG, PNG or WebP.');
    }
    // base64 inflates bytes by ~4/3.
    if ((base64.length * 3) / 4 > MAX_IMAGE_BYTES) {
      throw new BadRequest('Image is too large. The maximum size is 4MB.');
    }
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64)) {
      throw new BadRequest('Malformed image payload.');
    }
    image = { base64, mimeType };
  }

  const composedPrompt = renderTemplate(category.template, {
    ...filters,
    numVariations,
    platform,
    subtype,
    inputText,
  });

  return { category, composedPrompt, image };
}

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    prompts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          prompt_text: {
            type: Type.STRING,
            description:
              'The full, detailed text of the generated prompt. Use markdown formatting (bold keys) for readability.',
          },
          tags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Relevant tags for the prompt (e.g., style, platform).',
          },
        },
      },
    },
  },
} as const;

/** Map upstream failures onto safe, user-facing copy. */
function describeUpstreamError(error: unknown): { message: string; status: number } {
  const raw = error instanceof Error ? error.message : String(error);
  if (raw.includes('429') || /quota/i.test(raw)) {
    return { message: 'Quota exceeded: too many requests. Please try again later.', status: 429 };
  }
  if (raw.includes('503') || /overloaded|unavailable/i.test(raw)) {
    return { message: 'The AI model is currently busy. Please try again in a moment.', status: 503 };
  }
  if (raw.includes('403') || raw.includes('401') || /api key|permission/i.test(raw)) {
    // Deliberately vague: never tell the client anything about the key itself.
    return { message: 'The prompt service is not configured correctly. Please contact support.', status: 502 };
  }
  if (/safety|blocked/i.test(raw)) {
    return { message: 'That request was blocked by the safety filter. Try rephrasing it.', status: 422 };
  }
  return { message: 'Failed to generate prompts. Please try again.', status: 502 };
}

export async function handleGenerate(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return fail('Method not allowed.', 405);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not set; refusing to call the Gemini API.');
    return fail('The prompt service is not configured. Set GEMINI_API_KEY on the server.', 503);
  }

  let validated: ValidatedRequest;
  try {
    validated = validate(await request.json());
  } catch (error) {
    if (error instanceof BadRequest) {
      return fail(error.message, 400);
    }
    return fail('Could not read the request body.', 400);
  }

  const { category, composedPrompt, image } = validated;

  const contents = image
    ? {
        parts: [
          { text: composedPrompt },
          { inlineData: { mimeType: image.mimeType, data: image.base64 } },
        ],
      }
    : composedPrompt;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: contents as any,
      config: {
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA as any,
      },
    });

    const text = response.text?.trim();
    if (!text) {
      return fail('The model returned an empty response. Please try again.', 502);
    }

    const cleaned = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    let parsed: { prompts?: { prompt_text?: string; tags?: string[] }[] };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error('Failed to parse Gemini response as JSON.');
      return fail('The model returned a malformed response. Please try again.', 502);
    }

    if (!Array.isArray(parsed.prompts) || parsed.prompts.length === 0) {
      return fail('The model returned no prompts. Please try again.', 502);
    }

    const now = Date.now();
    return json({
      requestId: `gen-${now}`,
      category: category.id,
      generatedAt: new Date(now).toISOString(),
      prompts: parsed.prompts
        .filter((p) => typeof p?.prompt_text === 'string' && p.prompt_text.trim())
        .map((p, i) => ({
          id: `gen-${now}-${i}`,
          text: p.prompt_text as string,
          metadata: { tags: Array.isArray(p.tags) ? p.tags : [] },
        })),
    });
  } catch (error) {
    // Full detail stays in the server log; the client gets the safe version.
    console.error('Gemini request failed:', error);
    const { message, status } = describeUpstreamError(error);
    return fail(message, status);
  }
}

export default handleGenerate;
