import {
  BadRequest,
  buildMasterPrompt,
  callGemini,
  describeUpstreamError,
  fail,
  json,
  validateInput,
} from './_shared';
import { incrementUsage, usageFor, userFromRequest } from './_devStore';

/**
 * DEVELOPMENT ONLY generation endpoint.
 *
 * In production the WordPress plugin (`wordpress-plugin/napnox-prompt-generator`)
 * serves `napnox/v1/generate` with the same contract: login required, quota
 * enforced server-side, API key read from the server.
 */
export async function handleGenerate(request: Request): Promise<Response> {
  if (request.method !== 'POST') return fail('Method not allowed.', 405);

  // 1. Authentication: only registered, signed-in users may generate.
  const user = userFromRequest(request);
  if (!user) {
    return fail('Please sign in to generate prompts.', 401, 'not_logged_in');
  }

  // 2. Quota: enforced server-side, against the account - not the browser.
  const usage = usageFor(user);
  if (!usage.unlimited && usage.remaining <= 0) {
    return json(
      {
        error: {
          message: `You have used all ${usage.limit} free generations. Contact NapNox for unlimited access.`,
          code: 'limit_reached',
        },
        usage,
      },
      402,
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not set; refusing to call the Gemini API.');
    return fail('The prompt service is not configured. Set GEMINI_API_KEY in .env.local.', 503);
  }

  let input;
  try {
    input = validateInput(await request.json());
  } catch (error) {
    if (error instanceof BadRequest) return fail(error.message, 400, 'invalid_input');
    return fail('Could not read the request body.', 400, 'invalid_input');
  }

  try {
    const result = await callGemini(apiKey, buildMasterPrompt(input), input.image);

    // 3. Only a successful generation is charged against the quota.
    const updated = incrementUsage(user.id);
    const now = Date.now();

    return json({
      requestId: `gen-${now}`,
      generatedAt: new Date(now).toISOString(),
      prompts: result.prompts.map((p, i) => ({
        id: `gen-${now}-${i}`,
        text: p.text,
        metadata: { tags: p.tags },
      })),
      usage: updated ? usageFor(updated) : usage,
    });
  } catch (error) {
    console.error('Gemini request failed:', error);
    const { message, status } = describeUpstreamError(error);
    return fail(message, status, 'upstream_error');
  }
}

export default handleGenerate;
