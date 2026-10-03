import { GoogleGenAI, Type } from '@google/genai';
import { AUTO, AUTO_ID, DEFAULTS, MASTER_CONFIG, findCategory, type Filter } from '../masterConfig';

/**
 * Server-side helpers shared by the dev API routes.
 *
 * The production backend is the WordPress plugin in `wordpress-plugin/`,
 * which mirrors this logic in PHP and reads the same
 * `shared/master-config.json`. Keep the two in step.
 */

const { detailLevels, masterTemplate, model } = MASTER_CONFIG;

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const REQUEST_TIMEOUT_MS = 60_000;
const MAX_ATTEMPTS = 3;

export class BadRequest extends Error {}

export const json = (body: unknown, status = 200, headers: Record<string, string> = {}): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...headers },
  });

export const fail = (message: string, status: number, code?: string): Response =>
  json({ error: { message, code: code ?? String(status) } }, status);

/** Literal, single-pass replacement so user text can never inject a placeholder. */
export function renderTemplate(template: string, data: Record<string, string | number | boolean>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(data, key) ? String(data[key]) : match,
  );
}

export interface ValidatedInput {
  idea: string;
  categoryId: string;
  subtype: string;
  platform: string;
  platformLabel: string;
  filters: Record<string, string | boolean>;
  detail: string;
  numVariations: number;
  context: string;
  image?: { base64: string; mimeType: string };
}

function str(value: unknown, field: string, max: number): string {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') throw new BadRequest(`"${field}" must be text.`);
  const trimmed = value.trim();
  if (trimmed.length > max) throw new BadRequest(`${field} must be ${max} characters or fewer.`);
  return trimmed;
}

/**
 * Validate one of a category's own filters against its original definition.
 * Omitted values fall back to the filter's default rather than erroring.
 */
function validateFilter(filter: Filter, raw: unknown): string | boolean {
  switch (filter.type) {
    case 'select': {
      const options = filter.options ?? [];
      const allowed = options.map((option) => option.value);
      if (raw === undefined || raw === null || raw === '') {
        const preset = filter.defaultValue;
        return typeof preset === 'string' && allowed.includes(preset) ? preset : (options[0]?.value ?? '');
      }
      if (typeof raw !== 'string' || !allowed.includes(raw)) {
        throw new BadRequest(`Invalid value for "${filter.label}".`);
      }
      return raw;
    }
    case 'toggle':
      return raw === undefined ? Boolean(filter.defaultValue) : Boolean(raw);
    case 'textarea':
      return str(raw, filter.label, DEFAULTS.maxContextChars);
    case 'file':
    default:
      return '';
  }
}

export function validateInput(body: any): ValidatedInput {
  if (!body || typeof body !== 'object') throw new BadRequest('Request body must be a JSON object.');

  const idea = str(body.idea, 'Your idea', DEFAULTS.maxInputChars);
  if (idea.length < 3) throw new BadRequest('Describe what you want a prompt for (at least 3 characters).');

  const categoryId = str(body.category, 'category', 60) || AUTO_ID;
  const category = categoryId === AUTO_ID ? undefined : findCategory(categoryId);
  if (categoryId !== AUTO_ID && !category) throw new BadRequest('Unknown category.');

  // Subtype and platform must come from the selected category's own lists.
  let subtype = '';
  if (category) {
    subtype = str(body.subtype, 'subtype', 120) || category.subtypes[0];
    if (!category.subtypes.includes(subtype)) throw new BadRequest('Unknown type for this category.');
  }

  const platformOptions = category
    ? category.platform.options
    : AUTO.platforms.map((platform) => ({ value: platform.value, label: platform.label }));
  const platform = str(body.platform, 'platform', 120) || platformOptions[0]?.value || 'auto';
  const platformMatch = platformOptions.find((option) => option.value === platform);
  if (!platformMatch) throw new BadRequest('Unknown platform for this category.');

  const filters: Record<string, string | boolean> = {};
  if (category) {
    const raw = (body.filters ?? {}) as Record<string, unknown>;
    for (const filter of category.filters) {
      filters[filter.id] = validateFilter(filter, raw[filter.id]);
    }
  }

  const detail = str(body.detail, 'detail', 60) || 'balanced';
  if (!detailLevels.some((level) => level.value === detail)) throw new BadRequest('Unknown detail level.');

  const requested = Number.parseInt(String(body.numVariations ?? DEFAULTS.numVariations), 10);
  const numVariations = Math.min(
    DEFAULTS.maxVariations,
    Math.max(1, Number.isFinite(requested) ? requested : DEFAULTS.numVariations),
  );

  const context = str(body.context, 'Extra context', DEFAULTS.maxContextChars);

  let image: ValidatedInput['image'];
  if (body.image) {
    const { base64, mimeType } = body.image;
    if (typeof base64 !== 'string' || typeof mimeType !== 'string') {
      throw new BadRequest('Malformed image upload.');
    }
    if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) {
      throw new BadRequest('Unsupported image type. Use JPG, PNG or WebP.');
    }
    if ((base64.length * 3) / 4 > DEFAULTS.maxImageBytes) {
      throw new BadRequest('Image is too large. The maximum size is 4MB.');
    }
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64)) throw new BadRequest('Malformed image upload.');
    image = { base64, mimeType };
  }

  return {
    idea,
    categoryId,
    subtype,
    platform,
    platformLabel: platformMatch.label,
    filters,
    detail,
    numVariations,
    context,
    image,
  };
}

/**
 * Compose the prompt sent to Gemini.
 *
 * A chosen category uses its own original template (so all the existing
 * prompt engineering is preserved verbatim); "Auto-detect" uses the master
 * template. Detail level, extra context and any reference image are appended
 * as additional requirements in both cases.
 */
export function buildMasterPrompt(input: ValidatedInput): string {
  const detail = detailLevels.find((level) => level.value === input.detail)!;
  const category = findCategory(input.categoryId);

  let composed: string;

  if (category) {
    composed = renderTemplate(category.template, {
      ...input.filters,
      numVariations: input.numVariations,
      platform: input.platformLabel,
      subtype: input.subtype,
      inputText: input.idea,
    });
  } else {
    const platform = AUTO.platforms.find((option) => option.value === input.platform);
    composed = renderTemplate(masterTemplate, {
      inputText: input.idea,
      promptType: AUTO.label,
      platform: input.platform === 'auto' ? 'any modern AI tool' : input.platformLabel,
      detail: detail.label,
      numVariations: input.numVariations,
      typeGuidance: AUTO.guidance,
      platformGuidance: platform?.guidance ?? '',
      detailGuidance: detail.guidance,
      extraContext: input.context ? `- Extra context from the user: ${input.context}\n` : '',
      imageNote: input.image
        ? '- A reference image is attached. Study it and ground every prompt in what it actually shows.\n'
        : '',
    });
  }

  const extras: string[] = [];
  if (category) extras.push(detail.guidance);
  if (category && input.context) extras.push(`Extra context from the user: ${input.context}`);
  if (category && input.image) {
    extras.push('A reference image is attached. Study it and ground every prompt in what it actually shows.');
  }

  if (extras.length > 0) {
    composed += `\n\nADDITIONAL REQUIREMENTS\n${extras.map((line) => `- ${line}`).join('\n')}`;
  }

  return composed;
}

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  required: ['prompts'],
  properties: {
    prompts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ['prompt_text', 'tags'],
        properties: {
          prompt_text: {
            type: Type.STRING,
            description: 'The complete, ready-to-paste prompt. Use **bold labels** for sections.',
          },
          tags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: '3-5 lowercase tags describing style, medium and platform.',
          },
        },
      },
    },
  },
} as const;

export interface UpstreamResult {
  prompts: { text: string; tags: string[] }[];
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryable = (error: unknown): boolean => {
  const raw = error instanceof Error ? error.message : String(error);
  return (
    raw.includes('429') ||
    raw.includes('500') ||
    raw.includes('502') ||
    raw.includes('503') ||
    raw.includes('504') ||
    /overloaded|unavailable|timeout|timed out|ECONNRESET|fetch failed/i.test(raw)
  );
};

/**
 * Calls Gemini, retrying transient failures with exponential backoff.
 * Transient overload is the single most common cause of a failed generation,
 * so retrying here is what makes the feature feel reliable.
 */
export async function callGemini(
  apiKey: string,
  composedPrompt: string,
  image?: { base64: string; mimeType: string },
): Promise<UpstreamResult> {
  const ai = new GoogleGenAI({ apiKey });

  const contents = image
    ? { parts: [{ text: composedPrompt }, { inlineData: { mimeType: image.mimeType, data: image.base64 } }] }
    : composedPrompt;

  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: contents as any,
        config: {
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA as any,
          abortSignal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        } as any,
      });

      const parsed = parseUpstream(response.text ?? '');
      if (parsed.prompts.length === 0) throw new Error('Model returned no usable prompts (503)');
      return parsed;
    } catch (error) {
      lastError = error;
      if (attempt === MAX_ATTEMPTS || !isRetryable(error)) break;
      await sleep(600 * 2 ** (attempt - 1));
    }
  }

  throw lastError;
}

/** Tolerant parsing: models occasionally wrap JSON in prose or code fences. */
export function parseUpstream(text: string): UpstreamResult {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('Empty response from the model (503)');

  const candidates = [
    trimmed,
    trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''),
    trimmed.slice(trimmed.indexOf('{'), trimmed.lastIndexOf('}') + 1),
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      const parsed = JSON.parse(candidate) as { prompts?: { prompt_text?: string; tags?: string[] }[] };
      if (!Array.isArray(parsed.prompts)) continue;
      return {
        prompts: parsed.prompts
          .filter((p) => typeof p?.prompt_text === 'string' && p.prompt_text.trim().length > 0)
          .map((p) => ({
            text: (p.prompt_text as string).trim(),
            tags: Array.isArray(p.tags) ? p.tags.filter((t) => typeof t === 'string').slice(0, 6) : [],
          })),
      };
    } catch {
      // Try the next candidate.
    }
  }

  throw new Error('Malformed response from the model (502)');
}

/** Map upstream failures onto safe, user-facing copy. Details stay in the log. */
export function describeUpstreamError(error: unknown): { message: string; status: number } {
  const raw = error instanceof Error ? error.message : String(error);
  if (raw.includes('429') || /quota|rate limit/i.test(raw)) {
    return { message: 'The prompt service is busy right now. Please wait a moment and try again.', status: 429 };
  }
  if (raw.includes('403') || raw.includes('401') || /api key|permission denied/i.test(raw)) {
    return { message: 'The prompt service is not configured correctly. Please contact support.', status: 502 };
  }
  if (/safety|blocked|recitation/i.test(raw)) {
    return { message: 'That idea was blocked by the content filter. Try rewording it.', status: 422 };
  }
  if (/timeout|timed out|abort/i.test(raw)) {
    return { message: 'The request took too long. Please try again.', status: 504 };
  }
  return { message: 'Could not generate prompts just now. Please try again in a moment.', status: 502 };
}
