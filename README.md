# Resident Event Ideas

A Next.js application for managing and planning community events.

## Features

- **Events Calendar**: View all published community events organized by date
- **Full Plan Wizard**: 3-step wizard to generate and create multiple events
  - Step 1: Set date range and budget
  - Step 2: Select event categories
  - Step 3: Choose from generated event suggestions
- **Event Status Management**: Filter between Published and Draft events
- **Auto-Publishing**: Events created through the wizard are automatically published

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Build

```bash
npm run build
```

### Production

```bash
npm start
```

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## Bug Fixes Implemented

This application was built with proper handling for common event management bugs:

1. **Date Input Parsing**: Dates are properly validated and formatted in YYYY-MM-DD format
2. **Complete Event Data**: All events include required fields: date, startTime, endTime, location, category, status
3. **Auto-Publishing**: Events generated through the Full Plan wizard are automatically published so they appear on the calendar immediately

## License

ISC
