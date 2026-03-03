# CouplePlan

A comprehensive planning application for couples to manage goals, budgets, events, and tasks together.

## Features

- **Partner Connection**: Invite and connect with your partner
- **Goals**: Track and achieve shared goals
- **Budgets**: Manage shared finances
- **Events**: Plan special occasions together
- **Tasks**: Collaborate on daily tasks

## Tech Stack

- React + TypeScript
- Tailwind CSS
- Supabase (Auth & Database)
- Playwright (E2E Testing)

## Bug Fixes

### All 7 Critical Bugs Fixed

1. **Partner Linking**: Both users are now properly linked when invitation is accepted
2. **Profile Display**: Profile page now shows partner name/email when connected
3. **Invite Button**: "Invite my partner" button in profile menu now works
4. **Invitation URL**: Uses configurable `VITE_APP_URL` environment variable
5. **Invitation Rejection**: Rejected invitations are properly marked and hidden
6. **Disconnect Message**: Shows partner name instead of "undefined"
7. **Color Palette**: Updated with research-based romantic theme (Rose, Coral, Amber)

## Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_APP_URL=https://your-deployment-url.com
```

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run E2E tests
npm run test:e2e
```

## Deployment

The application is deployed at: https://n2fkzysalkbbm.ok.kimi.link/
