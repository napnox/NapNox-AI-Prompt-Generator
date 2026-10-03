import rawConfig from './shared/master-config.json';

/**
 * Single source of truth for the master prompt generator.
 *
 * `shared/master-config.json` is read by BOTH this TypeScript client and the
 * WordPress plugin's PHP backend, so the prompt template, limits and option
 * lists can never drift apart between the two.
 */

export interface PromptTypeOption {
  value: string;
  label: string;
  description: string;
  guidance: string;
}

export interface PlatformOption {
  value: string;
  label: string;
  /** Prompt types this platform suits. Empty means "all". */
  types: string[];
  guidance: string;
}

export interface DetailLevelOption {
  value: string;
  label: string;
  guidance: string;
}

export interface MasterConfig {
  version: number;
  model: string;
  defaults: {
    freeLimit: number;
    numVariations: number;
    maxVariations: number;
    maxInputChars: number;
    maxContextChars: number;
    maxImageBytes: number;
  };
  detailLevels: DetailLevelOption[];
  promptTypes: PromptTypeOption[];
  platforms: PlatformOption[];
  masterTemplate: string;
}

export const MASTER_CONFIG = rawConfig as MasterConfig;

export const PROMPT_TYPES = MASTER_CONFIG.promptTypes;
export const PLATFORMS = MASTER_CONFIG.platforms;
export const DETAIL_LEVELS = MASTER_CONFIG.detailLevels;
export const DEFAULTS = MASTER_CONFIG.defaults;

/** Platforms worth showing for a given prompt type, "Any" always first. */
export const platformsForType = (typeValue: string): PlatformOption[] => {
  if (typeValue === 'auto') return PLATFORMS;
  return PLATFORMS.filter((p) => p.types.length === 0 || p.types.includes(typeValue));
};

export const findPromptType = (value: string): PromptTypeOption | undefined =>
  PROMPT_TYPES.find((t) => t.value === value);

export const findPlatform = (value: string): PlatformOption | undefined =>
  PLATFORMS.find((p) => p.value === value);
