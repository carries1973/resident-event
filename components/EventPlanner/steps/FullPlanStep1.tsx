"use client";

import { useState } from "react";

interface FullPlanStep1Props {
  onNext: (data: { startDate: string; endDate: string; budget: string }) => void;
}

export default function FullPlanStep1({ onNext }: FullPlanStep1Props) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Fix for Issue #1: Proper date validation
    // Ensure dates are in YYYY-MM-DD format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      alert("Please enter valid dates in YYYY-MM-DD format");
      return;
    }
    
    onNext({ startDate, endDate, budget });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Step 1: Plan Details</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium mb-2">
            Start Date
          </label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            required
          />
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium mb-2">
            End Date
          </label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            required
          />
        </div>
        <div>
          <label htmlFor="budget" className="block text-sm font-medium mb-2">
            Budget
          </label>
          <input
            type="text"
            id="budget"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="e.g., $5000"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          Next
        </button>
      </form>
    </div>
  );
}
