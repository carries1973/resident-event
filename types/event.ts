export type EventStatus = "Draft" | "Published";
export type EventCategory = "Social" | "Sports" | "Educational" | "Entertainment" | "Other";

export interface Event {
  id: string;
  name: string;
  description: string;
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  location: string;
  category: EventCategory;
  organizer: string;
  attendees?: number;
  status: EventStatus;
  createdAt: string;
}
