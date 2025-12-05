// Fix: Import React type.
import type React from 'react';
import type { PREDEFINED_CATEGORIES } from './constants';

export type CategoryID = (typeof PREDEFINED_CATEGORIES)[keyof typeof PREDEFINED_CATEGORIES];

export interface FilterOption {
  value: string;
  label: string;
}

export interface Filter {
  id: string;
  label: string;
  type: 'select' | 'toggle' | 'textarea' | 'file';
  options?: FilterOption[];
  placeholder?: string;
  defaultValue?: string | boolean;
}

export interface Category {
  id: CategoryID;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  subtypes: string[];
  filters: Filter[];
  platform: {
    id: string;
    label: string;
    options: FilterOption[];
  };
  template: string;
}

export interface PromptRequest {
  category: CategoryID;
  subtype: string;
  inputText: string;
  filters: Record<string, string | boolean | number>;
  platform: string;
  numVariations: number;
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

export interface PromptResponse {
  requestId: string;
  category: string;
  prompts: GeneratedPrompt[];
  generatedAt: string;
}