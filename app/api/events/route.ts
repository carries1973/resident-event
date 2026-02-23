import { Event } from "@/types/event";

// In-memory storage for events (in production, this would be a database)
let events: Event[] = [
  {
    id: "1",
    name: "Community BBQ",
    description: "Join us for a fun community barbecue in the park. Bring your family and friends for an afternoon of great food, games, and socializing with your neighbors.",
    date: "2026-03-15",
    startTime: "17:00",
    endTime: "20:00",
    location: "Community Park",
    category: "Social",
    organizer: "John Smith",
    attendees: 45,
    status: "Published",
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Book Club Meeting",
    description: "Monthly book club discussion. This month we're reading 'The Great Gatsby'. All residents are welcome to join our lively discussions.",
    date: "2026-03-20",
    startTime: "18:30",
    endTime: "20:00",
    location: "Community Library",
    category: "Educational",
    organizer: "Sarah Johnson",
    attendees: 12,
    status: "Published",
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Yoga in the Park",
    description: "Free yoga session for all skill levels. Bring your own mat and enjoy a peaceful morning of stretching and mindfulness in nature.",
    date: "2026-03-25",
    startTime: "09:00",
    endTime: "10:30",
    location: "Riverside Park",
    category: "Sports",
    organizer: "Emily Davis",
    attendees: 28,
    status: "Published",
    createdAt: new Date().toISOString(),
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  
  // Filter by status if provided (to support Draft/Published filtering)
  const filteredEvents = status
    ? events.filter((event) => event.status === status)
    : events;
  
  return Response.json(filteredEvents);
}

export async function POST(request: Request) {
  const body = await request.json();
  
  const newEvent: Event = {
    id: Date.now().toString(),
    name: body.name,
    description: body.description,
    date: body.date,
    startTime: body.startTime,
    endTime: body.endTime,
    location: body.location,
    category: body.category,
    organizer: body.organizer,
    attendees: 0,
    status: body.status || "Published", // Auto-publish by default
    createdAt: new Date().toISOString(),
  };

  events.push(newEvent);
  
  return Response.json(newEvent, { status: 201 });
}
