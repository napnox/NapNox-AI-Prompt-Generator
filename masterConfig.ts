import rawConfig from './shared/master-config.json';

/**
 * Single source of truth for the generator.
 *
 * `shared/master-config.json` is read by BOTH this TypeScript client and the
 * WordPress plugin's PHP backend, so templates, categories, filters and
 * limits can never drift apart between the two.
 *
 * Every original category, subtype, filter, platform option and prompt
 * template from the old `constants.ts` is preserved here verbatim. The UI is
 * now a single master generator that switches its filters to match whichever
 * category is selected, plus an "Auto-detect" mode driven by `masterTemplate`.
 */

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
  id: string;
  name: string;
  description: string;
  subtypes: string[];
  filters: Filter[];
  platform: {
    id: string;
    label: string;
    options: FilterOption[];
  };
  template: string;
}

export interface PlatformOption {
  value: string;
  label: string;
  /** Category ids this platform suits. Empty means "all". */
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
  auto: {
    label: string;
    description: string;
    guidance: string;
    platforms: PlatformOption[];
  };
  masterTemplate: string;
  categories: Category[];
}

export const MASTER_CONFIG = rawConfig as MasterConfig;

export const CATEGORIES = MASTER_CONFIG.categories;
export const DETAIL_LEVELS = MASTER_CONFIG.detailLevels;
export const DEFAULTS = MASTER_CONFIG.defaults;
export const AUTO = MASTER_CONFIG.auto;

/** Sentinel id for the "let the AI decide" mode. */
export const AUTO_ID = 'auto';

export const findCategory = (id: string): Category | undefined =>
  CATEGORIES.find((category) => category.id === id);

/** Options for the single category dropdown: Auto-detect, then all 14. */
export const categoryOptions = (): { value: string; label: string; description: string }[] => [
  { value: AUTO_ID, label: AUTO.label, description: AUTO.description },
  ...CATEGORIES.map((category) => ({
    value: category.id,
    label: category.name,
    description: category.description,
  })),
];

/** Platform choices for a category, or the generic list in auto mode. */
export const platformOptionsFor = (categoryId: string): FilterOption[] => {
  if (categoryId === AUTO_ID) {
    return AUTO.platforms.map((platform) => ({ value: platform.value, label: platform.label }));
  }
  return findCategory(categoryId)?.platform.options ?? [];
};

/** The default value the form should start a filter at. */
export const defaultForFilter = (filter: Filter): string | boolean => {
  if (filter.type === 'toggle') return Boolean(filter.defaultValue ?? false);
  if (filter.options && filter.options.length > 0) {
    const preset = filter.options.find((option) => option.value === filter.defaultValue);
    return preset ? preset.value : filter.options[0].value;
  }
  return typeof filter.defaultValue === 'string' ? filter.defaultValue : '';
};
