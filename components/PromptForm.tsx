import React, { useState, useMemo } from 'react';
import type { Category } from '../types';
import { SparkleIcon } from './icons/ActionIcons';

interface PromptFormProps {
  category: Category;
  onGenerate: (formState: Record<string, any>) => void;
  isLoading: boolean;
}

const SelectInput: React.FC<{label: string, id: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, options: {value: string, label: string}[]}> = ({ label, id, value, onChange, options }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
        <select id={id} name={id} value={value} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition duration-150 ease-in-out bg-white text-gray-900 appearance-none">
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </div>
);

const TextAreaInput: React.FC<{label: string, id: string, value: string, onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void, placeholder?: string, rows?: number}> = ({ label, id, value, onChange, placeholder, rows = 4 }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
        <textarea id={id} name={id} value={value} onChange={onChange} rows={rows} placeholder={placeholder} className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition duration-150 ease-in-out bg-white text-gray-900 resize-vertical" />
    </div>
);

export const PromptForm: React.FC<PromptFormProps> = ({ category, onGenerate, isLoading }) => {
    const initialFormState = useMemo(() => {
        const state: Record<string, any> = {
            inputText: '',
            subtype: category.subtypes[0] || '',
            platform: category.platform.options[0]?.value || '',
        };
        category.filters.forEach(filter => {
            state[filter.id] = filter.options ? filter.options[0].value : (filter.defaultValue ?? '');
        });
        return state;
    }, [category]);
    
    const [formState, setFormState] = useState(initialFormState);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        const checked = (e.target as HTMLInputElement).checked;

        setFormState(prev => ({ ...prev, [name]: isCheckbox ? checked : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onGenerate(formState);
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200 sticky top-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{category.name} Generator</h2>
            <p className="text-sm text-gray-500 mb-6">{category.description}</p>
            
            <form onSubmit={handleSubmit} className="space-y-5">
                <TextAreaInput label="Your Core Idea" id="inputText" value={formState.inputText} onChange={handleChange} placeholder={`e.g., A futuristic cityscape at sunset for ${category.name}`} />

                <SelectInput label="Subtype" id="subtype" value={formState.subtype} onChange={handleChange} options={category.subtypes.map(s => ({ value: s, label: s }))} />

                <SelectInput label={category.platform.label} id="platform" value={formState.platform} onChange={handleChange} options={category.platform.options} />

                {category.filters.length > 0 && <hr className="border-gray-200" />}

                {category.filters.map(filter => {
                    const rows = filter.id.includes('Keyword') ? 1 : 2;
                    if (filter.type === 'select') {
                        return <SelectInput key={filter.id} label={filter.label} id={filter.id} value={formState[filter.id]} onChange={handleChange} options={filter.options!} />;
                    }
                    if (filter.type === 'textarea') {
                        return <TextAreaInput key={filter.id} label={filter.label} id={filter.id} value={formState[filter.id]} onChange={handleChange} placeholder={filter.placeholder} rows={rows} />;
                    }
                    return null;
                })}

                <button type="submit" disabled={isLoading || !formState.inputText.trim()} className="w-full flex justify-center items-center gap-2 px-4 py-3 border border-transparent text-base font-semibold rounded-lg text-white bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg">
                    {isLoading ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Generating...</span>
                        </>
                    ) : (
                        <>
                            <SparkleIcon className="h-5 w-5" />
                            <span>Generate Prompts</span>
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};