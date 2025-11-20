import React, { useState } from 'react';
import { CategorySelector } from './components/CategorySelector';
import { PromptGenerator } from './components/PromptGenerator';
import { CATEGORIES, PREDEFINED_CATEGORIES } from './constants';
import type { CategoryID } from './types';

const App: React.FC = () => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<CategoryID>(PREDEFINED_CATEGORIES.IMAGE);

  const selectedCategory = CATEGORIES.find(cat => cat.id === selectedCategoryId) || CATEGORIES[0];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans flex flex-col">
      <main className="container mx-auto px-4 pt-[250px] pb-8 flex-grow">
        <CategorySelector 
          categories={CATEGORIES}
          selectedCategoryId={selectedCategoryId}
          setSelectedCategoryId={setSelectedCategoryId}
        />

        <PromptGenerator key={selectedCategoryId} category={selectedCategory} />
      </main>
    </div>
  );
};

export default App;