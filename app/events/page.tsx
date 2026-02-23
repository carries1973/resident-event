"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Event } from "@/types/event";
import EventPlanner from "@/components/EventPlanner/EventPlanner";

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPlanner, setShowPlanner] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "Published" | "Draft">("Published");

  useEffect(() => {
    fetchEvents();
  }, [statusFilter]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const url = statusFilter === "all"
        ? "/api/events"
        : `/api/events?status=${statusFilter}`;
      
      const response = await fetch(url);
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Group events by date for calendar view
  const eventsByDate = events.reduce((acc, event) => {
    if (!acc[event.date]) {
      acc[event.date] = [];
    }
    acc[event.date].push(event);
    return acc;
  }, {} as Record<string, Event[]>);

  const sortedDates = Object.keys(eventsByDate).sort();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <Link href="/" className="text-sm text-blue-600 hover:text-blue-800 mb-2 block">
                ← Back to Home
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Community Events</h1>
            </div>
            <button
              onClick={() => setShowPlanner(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
            >
              Plan Events
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Status Filter */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setStatusFilter("Published")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === "Published"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            Published Events
          </button>
          <button
            onClick={() => setStatusFilter("Draft")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === "Draft"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            Draft Events
          </button>
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === "all"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            All Events
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">
              No {statusFilter !== "all" ? statusFilter.toLowerCase() : ""} events found.
            </p>
            <button
              onClick={() => setShowPlanner(true)}
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
            >
              Create Your First Event
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {sortedDates.map((date) => (
              <div key={date} className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {formatDate(date)}
                </h2>
                <div className="space-y-4">
                  {eventsByDate[date].map((event) => (
                    <div
                      key={event.id}
                      className="border-l-4 border-blue-500 pl-4 py-2"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-gray-900">
                              {event.name}
                            </h3>
                            <span
                              className={`px-2 py-1 text-xs rounded ${
                                event.status === "Published"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {event.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {event.description}
                          </p>
                          <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                            <span>🕐 {formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
                            <span>📍 {event.location}</span>
                            <span>🏷️ {event.category}</span>
                            <span>👤 {event.organizer}</span>
                            {event.attendees !== undefined && (
                              <span>👥 {event.attendees} attending</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showPlanner && <EventPlanner onClose={() => setShowPlanner(false)} />}
    </div>
  );
}
