export interface GenerateRequest {
  idea: string;
  promptType: string;
  platform: string;
  detail: string;
  numVariations: number;
  context?: string;
  image?: {
    base64: string;
    mimeType: string;
  };
}

export interface GeneratedPrompt {
  id: string;
  text: string;
  metadata: {
    tags: string[];
  };
}

/** Quota snapshot returned by both the session and generate endpoints. */
export interface Usage {
  used: number;
  limit: number;
  remaining: number;
  unlimited: boolean;
}

export interface Session {
  loggedIn: boolean;
  user: { name: string; email?: string; avatar?: string } | null;
  usage: Usage | null;
  loginUrl: string;
  registerUrl: string;
  contact: {
    email: string;
    whatsapp: string;
    message: string;
  };
  /** Set when the backend is misconfigured (e.g. no API key saved yet). */
  notice?: string;
}

export interface GenerateResponse {
  requestId: string;
  generatedAt: string;
  prompts: GeneratedPrompt[];
  usage: Usage;
}

export interface ApiError extends Error {
  status: number;
  code: string;
}
