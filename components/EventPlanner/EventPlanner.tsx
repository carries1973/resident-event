"use client";

import { useState } from "react";
import FullPlanStep1 from "./steps/FullPlanStep1";
import FullPlanStep2 from "./steps/FullPlanStep2";
import FullPlanStep3 from "./steps/FullPlanStep3";

interface EventPlannerProps {
  onClose: () => void;
}

export default function EventPlanner({ onClose }: EventPlannerProps) {
  const [step, setStep] = useState(1);
  const [planData, setPlanData] = useState({
    startDate: "",
    endDate: "",
    budget: "",
    preferences: [] as string[],
  });

  const handleStep1Next = (data: { startDate: string; endDate: string; budget: string }) => {
    setPlanData({ ...planData, ...data });
    setStep(2);
  };

  const handleStep2Next = (data: { preferences: string[] }) => {
    setPlanData({ ...planData, ...data });
    setStep(3);
  };

  const handleComplete = () => {
    onClose();
    // Refresh the page to show new events
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Full Plan Wizard</h1>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    step >= num
                      ? "bg-blue-600 text-white"
                      : "bg-gray-300 text-gray-600"
                  }`}
                >
                  {num}
                </div>
                {num < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      step > num ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {step === 1 && <FullPlanStep1 onNext={handleStep1Next} />}
        {step === 2 && (
          <FullPlanStep2
            onNext={handleStep2Next}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <FullPlanStep3
            planData={planData}
            onBack={() => setStep(2)}
            onComplete={handleComplete}
          />
        )}
      </div>
    </div>
  );
}
