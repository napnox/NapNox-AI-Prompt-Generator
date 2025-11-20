import React from 'react';
import type { Category, CategoryID } from '../types';
import { Tooltip } from './Tooltip';

interface CategorySelectorProps {
  categories: Category[];
  selectedCategoryId: CategoryID;
  setSelectedCategoryId: (id: CategoryID) => void;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({ categories, selectedCategoryId, setSelectedCategoryId }) => {
  return (
    <div className="mb-8">
      <div className="flex justify-center flex-wrap gap-2 md:gap-3">
        {categories.map((category) => (
          <Tooltip key={category.id} content={category.description}>
            <button
              onClick={() => setSelectedCategoryId(category.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2
                ${selectedCategoryId === category.id
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md focus:ring-green-400'
                  : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-800 border border-gray-200 focus:ring-cyan-400'
                }`
              }
            >
              <category.icon className="h-5 w-5" />
              <span>{category.name}</span>
            </button>
          </Tooltip>
        ))}
      </div>
    </div>
  );
};