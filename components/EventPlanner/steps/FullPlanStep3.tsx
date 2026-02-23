"use client";

import { useState, useEffect } from "react";
import { Event, EventCategory } from "@/types/event";

interface GeneratedEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  category: EventCategory;
  selected: boolean;
}

interface FullPlanStep3Props {
  planData: {
    startDate: string;
    endDate: string;
    budget: string;
    preferences: string[];
  };
  onBack: () => void;
  onComplete: () => void;
}

export default function FullPlanStep3({ planData, onBack, onComplete }: FullPlanStep3Props) {
  const [generatedEvents, setGeneratedEvents] = useState<GeneratedEvent[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Generate event suggestions based on preferences
    const suggestions: GeneratedEvent[] = [];
    const categories = planData.preferences as EventCategory[];
    
    const eventTemplates: Record<EventCategory, Array<{ title: string; description: string; location: string }>> = {
      Social: [
        { title: "Community Potluck Dinner", description: "Bring your favorite dish to share with neighbors", location: "Community Hall" },
        { title: "Neighborhood Coffee Morning", description: "Casual coffee meetup to connect with neighbors", location: "Community Center" },
      ],
      Sports: [
        { title: "Morning Yoga Session", description: "All-levels yoga class in the park", location: "Central Park" },
        { title: "Community Sports Day", description: "Fun sports activities for all ages", location: "Sports Field" },
      ],
      Educational: [
        { title: "Workshop: Home Gardening", description: "Learn sustainable gardening techniques", location: "Community Library" },
        { title: "Tech Skills Workshop", description: "Introduction to digital tools for seniors", location: "Computer Lab" },
      ],
      Entertainment: [
        { title: "Movie Night Under Stars", description: "Outdoor movie screening with popcorn", location: "Park Lawn" },
        { title: "Live Music Evening", description: "Local band performance", location: "Community Stage" },
      ],
      Other: [
        { title: "Community Clean-up Day", description: "Help beautify our neighborhood", location: "Various Locations" },
        { title: "Pet Adoption Fair", description: "Meet adoptable pets from local shelter", location: "Community Center" },
      ],
    };

    categories.forEach((category) => {
      const templates = eventTemplates[category] || [];
      templates.forEach((template, index) => {
        suggestions.push({
          id: `${category}-${index}`,
          title: template.title,
          description: template.description,
          location: template.location,
          category,
          selected: false,
        });
      });
    });

    setGeneratedEvents(suggestions);
  }, [planData.preferences]);

  const toggleEventSelection = (eventId: string) => {
    setGeneratedEvents(
      generatedEvents.map((event) =>
        event.id === eventId ? { ...event, selected: !event.selected } : event
      )
    );
  };

  const saveGeneratedEvents = async () => {
    setIsSaving(true);
    
    const selectedEvents = generatedEvents.filter((e) => e.selected);
    
    if (selectedEvents.length === 0) {
      alert("Please select at least one event to save");
      setIsSaving(false);
      return;
    }

    // FIX for Issues #1, #2, #3:
    // 1. Properly parse start date (avoiding 202603-01-dd format)
    // 2. Include date, startTime, endTime fields
    // 3. Auto-publish events so they appear on calendar
    
    const startDate = new Date(planData.startDate);
    const endDate = new Date(planData.endDate);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysBetweenEvents = Math.max(1, Math.floor(totalDays / selectedEvents.length));

    try {
      for (let i = 0; i < selectedEvents.length; i++) {
        const event = selectedEvents[i];
        const eventDate = new Date(startDate);
        eventDate.setDate(eventDate.getDate() + (i * daysBetweenEvents));
        
        // Ensure date is in proper YYYY-MM-DD format
        const formattedDate = eventDate.toISOString().split('T')[0];
        
        const eventData: Partial<Event> = {
          name: event.title,
          description: event.description,
          location: event.location,
          category: event.category,
          date: formattedDate, // FIX #2: Include date field
          startTime: "18:00", // FIX #2: Include startTime field
          endTime: "20:00", // FIX #2: Include endTime field
          organizer: "Event Planner",
          status: "Published", // FIX #3: Auto-publish so events appear on calendar
        };

        const response = await fetch("/api/events", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(eventData),
        });

        if (!response.ok) {
          throw new Error("Failed to create event");
        }
      }

      alert(`Successfully created ${selectedEvents.length} events!`);
      onComplete();
    } catch (error) {
      console.error("Error creating events:", error);
      alert("Failed to create events. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Step 3: Select Events</h2>
      <p className="text-sm text-gray-600">
        Based on your preferences, here are some suggested events. Select the ones you&apos;d like to create:
      </p>
      
      <div className="space-y-3">
        {generatedEvents.map((event) => (
          <div
            key={event.id}
            onClick={() => toggleEventSelection(event.id)}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              event.selected
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-900">{event.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                <div className="flex gap-4 mt-2 text-sm text-gray-500">
                  <span>📍 {event.location}</span>
                  <span>🏷️ {event.category}</span>
                </div>
              </div>
              <div
                className={`ml-4 w-6 h-6 rounded border-2 flex items-center justify-center ${
                  event.selected
                    ? "border-blue-500 bg-blue-500"
                    : "border-gray-300"
                }`}
              >
                {event.selected && (
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={onBack}
          disabled={isSaving}
          className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={saveGeneratedEvents}
          disabled={isSaving}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
        >
          {isSaving ? "Creating Events..." : "Create Selected Events"}
        </button>
      </div>
    </div>
  );
}
