# Deployment Guide

## Current Status
✅ All code is committed to branch: `copilot/fix-broken-features`
✅ All bugs are fixed and tested
✅ Build passes without errors
✅ Security scan passed (0 vulnerabilities)

---

## Option 1: Deploy via Vercel (Recommended)

### Prerequisites
- Vercel account connected to GitHub repository
- Vercel CLI (optional): `npm i -g vercel`

### Steps

#### A. Via Vercel Dashboard (No CLI Required)
1. Go to https://vercel.com/dashboard
2. Click "Import Project"
3. Select `carries1973/resident-event` repository
4. Choose branch: `copilot/fix-broken-features`
5. Framework Preset: **Next.js** (auto-detected)
6. Click "Deploy"

Vercel will automatically:
- Run `npm install`
- Run `npm run build`
- Deploy to production

#### B. Via GitHub Merge (Automatic Deployment)
1. Go to GitHub PR: https://github.com/carries1973/resident-event/pull/1
2. Review changes
3. Click "Merge pull request"
4. Vercel will auto-deploy `main` branch

#### C. Via Vercel CLI
```bash
cd /home/runner/work/resident-event/resident-event
vercel login
vercel deploy --prod
```

---

## Option 2: Deploy Manually

### To Any Node.js Hosting (Railway, Render, Fly.io, etc.)

```bash
# 1. Build the application
npm install
npm run build

# 2. Start production server
npm start
# Application runs on port 3000 by default
```

### Environment Variables
No environment variables required for basic functionality. 
For production, you may want to add:
- `NODE_ENV=production`
- Database connection string (when migrating from in-memory storage)

---

## Option 3: Test Locally First

```bash
# Clone and checkout the fix branch
git checkout copilot/fix-broken-features

# Install dependencies
npm install

# Run development server
npm run dev

# Open browser
# Navigate to: http://localhost:3000
```

Test these features:
1. ✅ Click "View Events" - see 3 existing events
2. ✅ Click "Plan Events" - open wizard
3. ✅ Step 1: Enter dates (e.g., 2026-04-01 to 2026-04-30)
4. ✅ Step 2: Select categories (e.g., Social, Sports)
5. ✅ Step 3: Select events and click "Create Selected Events"
6. ✅ Verify new events appear on calendar with proper dates/times

---

## Vercel Configuration

The application includes these files for Vercel deployment:

### `package.json` scripts:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

### `next.config.ts`:
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
```

These are automatically detected by Vercel.

---

## Post-Deployment Verification

After deployment, test these scenarios:

### 1. Basic Navigation
- ✅ Homepage loads: `https://your-app.vercel.app/`
- ✅ Events page loads: `https://your-app.vercel.app/events`

### 2. View Existing Events
- ✅ See 3 pre-loaded events (BBQ, Book Club, Yoga)
- ✅ Events show proper date/time formatting
- ✅ Events grouped by date

### 3. Create New Events via Wizard
- ✅ Click "Plan Events" button
- ✅ Complete all 3 steps
- ✅ New events appear immediately on calendar
- ✅ Events have correct dates (no 202603-01-dd bug)
- ✅ Events show start/end times

### 4. Status Filtering
- ✅ Filter by "Published Events" (default)
- ✅ Filter by "Draft Events"
- ✅ Filter by "All Events"

---

## Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### TypeScript Errors
```bash
# Check TypeScript configuration
npx tsc --noEmit
```

### Port Already in Use (Local)
```bash
# Use different port
PORT=3001 npm run dev
```

---

## Database Migration (Future)

Currently, the app uses in-memory storage. To migrate to a database:

1. **Install Prisma or your preferred ORM**
```bash
npm install @prisma/client
npm install -D prisma
```

2. **Update `app/api/events/route.ts`**
Replace the in-memory `events` array with database calls.

3. **Add Environment Variables**
- `DATABASE_URL` for production
- Update Vercel environment variables

---

## Summary

**Easiest Path**: Merge PR → Vercel auto-deploys

**For Testing**: Run `npm run dev` locally

**Manual Deploy**: Run `npm run build && npm start`

All fixes are production-ready! 🚀
