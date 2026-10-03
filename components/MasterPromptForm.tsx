import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AUTO_ID,
  DEFAULTS,
  DETAIL_LEVELS,
  categoryOptions,
  defaultForFilter,
  findCategory,
  platformOptionsFor,
  type Filter,
} from '../masterConfig';
import type { GenerateRequest, Usage } from '../types';
import { SparkleIcon } from './icons/ActionIcons';
import { CATEGORY_ICONS } from './icons/categoryIconMap';
import { Tooltip } from './Tooltip';

interface MasterPromptFormProps {
  onGenerate: (request: GenerateRequest) => void;
  isLoading: boolean;
  usage: Usage | null;
}

const EXAMPLES = [
  'A cosy bookshop cafe on a rainy evening in Kyoto',
  'A LinkedIn post announcing our Series A funding round',
  'A React hook that debounces an async search input',
  'A 15 second product reveal video for a smart water bottle',
];

const labelClass = 'block text-sm font-semibold text-gray-700 mb-1.5';
const controlClass =
  'w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 ' +
  'focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition';

/** Initial values for a category's own filters. */
const initialFilterState = (filters: Filter[]): Record<string, string | boolean> => {
  const state: Record<string, string | boolean> = {};
  for (const filter of filters) {
    if (filter.type !== 'file') state[filter.id] = defaultForFilter(filter);
  }
  return state;
};

export const MasterPromptForm: React.FC<MasterPromptFormProps> = ({ onGenerate, isLoading, usage }) => {
  const [idea, setIdea] = useState('');
  const [categoryId, setCategoryId] = useState(AUTO_ID);
  const [subtype, setSubtype] = useState('');
  const [platform, setPlatform] = useState('auto');
  const [filters, setFilters] = useState<Record<string, string | boolean>>({});
  const [detail, setDetail] = useState('balanced');
  const [numVariations, setNumVariations] = useState(DEFAULTS.numVariations);
  const [context, setContext] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [image, setImage] = useState<{ base64: string; mimeType: string; name: string } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const category = useMemo(() => findCategory(categoryId), [categoryId]);
  const platforms = useMemo(() => platformOptionsFor(categoryId), [categoryId]);
  const options = useMemo(() => categoryOptions(), []);
  const Icon = CATEGORY_ICONS[categoryId];

  // Categories such as the Portrait Transformer declare their own file input;
  // when present it drives the reference image instead of the optional one.
  const fileFilter = category?.filters.find((filter) => filter.type === 'file');
  const visibleFilters = category?.filters.filter((filter) => filter.type !== 'file') ?? [];

  // Switching category swaps in that category's own subtypes, filters and platforms.
  useEffect(() => {
    setSubtype(category?.subtypes[0] ?? '');
    setFilters(category ? initialFilterState(category.filters) : {});
    setPlatform(platformOptionsFor(categoryId)[0]?.value ?? 'auto');
  }, [categoryId, category]);

  const setFilter = (id: string, value: string | boolean) =>
    setFilters((current) => ({ ...current, [id]: value }));

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = event.target.files?.[0];
    if (!file) {
      setImage(null);
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setFileError('Use a JPG, PNG or WebP image.');
      event.target.value = '';
      return;
    }
    if (file.size > DEFAULTS.maxImageBytes) {
      setFileError('That image is larger than 4MB.');
      event.target.value = '';
      return;
    }
    const base64 = await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });

    if (!base64) {
      setFileError('Could not read that file. Try another image.');
      return;
    }
    setImage({ base64, mimeType: file.type, name: file.name });
  };

  const clearImage = () => {
    setImage(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const trimmedIdea = idea.trim();
  const outOfCredit = Boolean(usage && !usage.unlimited && usage.remaining <= 0);
  const canSubmit = trimmedIdea.length >= 3 && !isLoading;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    onGenerate({
      idea: trimmedIdea,
      category: categoryId,
      subtype: subtype || undefined,
      platform,
      filters: Object.keys(filters).length > 0 ? filters : undefined,
      detail,
      numVariations,
      context: context.trim() || undefined,
      image: image ? { base64: image.base64, mimeType: image.mimeType } : undefined,
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && canSubmit) {
      event.preventDefault();
      handleSubmit(event);
    }
  };

  /** Render one of the category's own filters, honouring its original type. */
  const renderFilter = (filter: Filter) => {
    const id = `napnox-filter-${filter.id}`;
    const value = filters[filter.id];

    if (filter.type === 'toggle') {
      return (
        <label key={filter.id} htmlFor={id} className="flex items-center gap-2.5 cursor-pointer sm:col-span-2">
          <input
            id={id}
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => setFilter(filter.id, event.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-400"
          />
          <span className="text-sm font-semibold text-gray-700">{filter.label}</span>
        </label>
      );
    }

    if (filter.type === 'textarea') {
      return (
        <div key={filter.id} className="sm:col-span-2">
          <label htmlFor={id} className={labelClass}>
            {filter.label}
          </label>
          <textarea
            id={id}
            rows={2}
            value={String(value ?? '')}
            placeholder={filter.placeholder}
            maxLength={DEFAULTS.maxContextChars}
            onChange={(event) => setFilter(filter.id, event.target.value)}
            className={`${controlClass} resize-y`}
          />
        </div>
      );
    }

    return (
      <div key={filter.id}>
        <label htmlFor={id} className={labelClass}>
          {filter.label}
        </label>
        <select
          id={id}
          value={String(value ?? '')}
          onChange={(event) => setFilter(filter.id, event.target.value)}
          className={controlClass}
        >
          {(filter.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  };

  const imageUpload = (label: string, hint: string) => (
    <div>
      <label htmlFor="napnox-image" className={labelClass}>
        {label}
      </label>
      {image ? (
        <div className="flex items-center justify-between gap-3 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
          <span className="text-sm text-emerald-800 truncate">{image.name}</span>
          <button
            type="button"
            onClick={clearImage}
            className="text-sm font-semibold text-emerald-700 hover:text-emerald-900 shrink-0"
          >
            Remove
          </button>
        </div>
      ) : (
        <input
          ref={fileInputRef}
          id="napnox-image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFile}
          className={controlClass}
        />
      )}
      {fileError && <p className="mt-1 text-xs text-red-600">{fileError}</p>}
      <p className="mt-1 text-xs text-gray-500">{hint}</p>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-md border border-gray-200 space-y-5">
      <div>
        <div className="flex items-baseline justify-between mb-1.5">
          <label htmlFor="napnox-idea" className="text-sm font-semibold text-gray-700">
            What do you want a prompt for?
          </label>
          <span className="text-xs text-gray-400">
            {trimmedIdea.length}/{DEFAULTS.maxInputChars}
          </span>
        </div>
        <textarea
          id="napnox-idea"
          value={idea}
          onChange={(event) => setIdea(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={4}
          maxLength={DEFAULTS.maxInputChars}
          autoFocus
          placeholder="Describe your idea in plain language. One line is enough."
          className={`${controlClass} resize-y`}
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="text-xs text-gray-400 py-1">Try:</span>
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setIdea(example)}
              className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
            >
              {example.length > 34 ? `${example.slice(0, 34)}...` : example}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="napnox-category" className={labelClass}>
            Category
          </label>
          <div className="relative">
            {Icon && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none">
                <Icon className="h-5 w-5" />
              </span>
            )}
            <select
              id="napnox-category"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className={`${controlClass} ${Icon ? 'pl-10' : ''}`}
            >
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {category ? (
          <div>
            <label htmlFor="napnox-subtype" className={labelClass}>
              Type
            </label>
            <select
              id="napnox-subtype"
              value={subtype}
              onChange={(event) => setSubtype(event.target.value)}
              className={controlClass}
            >
              {category.subtypes.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label htmlFor="napnox-platform-auto" className={labelClass}>
              Target AI
            </label>
            <select
              id="napnox-platform-auto"
              value={platform}
              onChange={(event) => setPlatform(event.target.value)}
              className={controlClass}
            >
              {platforms.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <p className="-mt-2 text-xs text-gray-500">
        {category ? category.description : 'Let the AI work out which kind of prompt fits your idea.'}
      </p>

      {/* The selected category's own filters, exactly as originally defined. */}
      {category && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
          <div>
            <label htmlFor="napnox-platform" className={labelClass}>
              {category.platform.label}
            </label>
            <select
              id="napnox-platform"
              value={platform}
              onChange={(event) => setPlatform(event.target.value)}
              className={controlClass}
            >
              {platforms.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          {visibleFilters.map(renderFilter)}
          {fileFilter && (
            <div className="sm:col-span-2">
              {imageUpload(fileFilter.label, 'JPG, PNG or WebP, up to 4MB.')}
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowAdvanced((value) => !value)}
        className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
      >
        <span className={`transition-transform duration-200 ${showAdvanced ? 'rotate-90' : ''}`}>›</span>
        {showAdvanced ? 'Hide options' : 'More options'}
      </button>

      {showAdvanced && (
        <div className="space-y-4 animate-fade-in border-t border-gray-100 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="napnox-detail" className={labelClass}>
                Detail level
              </label>
              <select
                id="napnox-detail"
                value={detail}
                onChange={(event) => setDetail(event.target.value)}
                className={controlClass}
              >
                {DETAIL_LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="napnox-count" className={labelClass}>
                How many prompts
              </label>
              <select
                id="napnox-count"
                value={numVariations}
                onChange={(event) => setNumVariations(Number(event.target.value))}
                className={controlClass}
              >
                {Array.from({ length: DEFAULTS.maxVariations }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? 'prompt' : 'prompts'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="napnox-context" className={labelClass}>
              Extra context <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              id="napnox-context"
              value={context}
              onChange={(event) => setContext(event.target.value)}
              rows={2}
              maxLength={DEFAULTS.maxContextChars}
              placeholder="Brand voice, audience, things to avoid..."
              className={`${controlClass} resize-y`}
            />
          </div>

          {!fileFilter && imageUpload('Reference image (optional)', 'JPG, PNG or WebP, up to 4MB.')}
        </div>
      )}

      <Tooltip content={outOfCredit ? 'Your free generations are used up' : 'Ctrl + Enter also works'}>
        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-white shadow-lg transition-all
            bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 hover:shadow-xl hover:-translate-y-0.5
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Generating...
            </>
          ) : (
            <>
              <SparkleIcon className="h-5 w-5" />
              Generate prompts
            </>
          )}
        </button>
      </Tooltip>
    </form>
  );
};
