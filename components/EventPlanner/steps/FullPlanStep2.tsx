"use client";

import { useState } from "react";
import { EventCategory } from "@/types/event";

interface FullPlanStep2Props {
  onNext: (data: { preferences: string[] }) => void;
  onBack: () => void;
}

const categories: EventCategory[] = ["Social", "Sports", "Educational", "Entertainment", "Other"];

export default function FullPlanStep2({ onNext, onBack }: FullPlanStep2Props) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCategories.length === 0) {
      alert("Please select at least one category");
      return;
    }
    onNext({ preferences: selectedCategories });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Step 2: Event Preferences</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-4">Select event categories you&apos;re interested in:</p>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => toggleCategory(category)}
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                  selectedCategories.includes(category)
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Back
          </button>
          <button
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Next
          </button>
        </div>
      </form>
    </div>
  );
}
