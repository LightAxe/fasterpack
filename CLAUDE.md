# Coach's Corner (Faster Pack) - Claude Code Context

A team training management platform for cross country/track coaches, athletes, and parents. The product is branded as **"Faster Pack"** in the UI.

## Quick Reference

```bash
npm run dev        # Start dev server (port 8080)
npm run build      # Production build
npm run build:dev  # Dev build (includes source maps)
npm run lint       # ESLint
npm run test       # Run tests (vitest)
npm run test:watch # Watch mode
npx tsc --noEmit   # Type check
```

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite (SWC compiler)
- **Styling:** Tailwind CSS + shadcn/ui (Radix primitives) + next-themes (dark mode)
- **State:** TanStack Query v5 (server state), React Context (auth)
- **Forms:** React Hook Form + Zod validation
- **Charts:** Recharts
- **Backend:** Supabase (PostgreSQL + Auth + Edge Functions)
- **Email/SMS:** Resend (email) + Twilio (SMS) via Edge Functions
- **PWA:** vite-plugin-pwa with Workbox caching

## Project Structure

```
src/
├── components/
│   ├── ui/               # shadcn/ui components (do NOT modify directly)
│   ├── layout/           # AppLayout (sidebar + mobile header)
│   ├── athletes/         # Athlete management, ACWR, workout history
│   ├── announcements/    # Create/edit/delete announcement dialogs
│   ├── calendar/         # AddWorkoutDialog, AddCalendarItemDialog, CalendarSubscribeDialog
│   ├── dashboard/        # Dashboard widgets (QuickStats, WeekPreview, etc.)
│   ├── workouts/         # WorkoutLogDialog, PersonalWorkoutDialog, RPESlider, etc.
│   ├── races/            # Race management dialogs and cards
│   ├── records/          # AddOffseasonResultDialog
│   ├── seasons/          # SeasonSelector
│   ├── journal/          # JournalEntry, RaceEntry, MyRecords
│   ├── ProtectedRoute.tsx    # Auth guard (handles all roles + onboarding)
│   ├── CoachOnlyRoute.tsx    # Coach-only route guard
│   ├── ExportDataDialog.tsx  # Data export UI
│   ├── PaginationControls.tsx
│   ├── RoleSwitcher.tsx      # Dev tool: switch between roles
│   └── ThemeToggle.tsx       # Dark/light mode toggle
├── pages/                # Route components (21 total)
├── hooks/                # Custom hooks (24 total)
├── contexts/
│   └── AuthContext.tsx   # Global auth state, OTP flows, roles
├── integrations/supabase/
│   ├── client.ts         # Supabase client initialization
│   └── types.ts          # Auto-generated DB types (do NOT edit manually)
└── lib/
    ├── types.ts           # App types extending DB types + utility functions
    ├── utils.ts           # cn() helper for Tailwind classes
    └── phone.ts           # US phone normalization utilities (E.164)

supabase/
├── functions/
│   ├── send-otp/         # Generate & send OTP (email via Resend, SMS via Twilio)
│   ├── verify-otp/       # Verify OTP, create profile on signup
│   ├── calendar-feed/    # iCal feed for calendar subscription
│   └── export-data/      # Export team data as JSON/CSV
└── migrations/           # 30+ SQL migration files (yyyy-mm-dd prefix)
```

## Pages & Routes

| Page | Route | Auth Required | Role |
|------|-------|--------------|------|
| `Landing` | `/` (no auth) | No | All |
| `Login` | `/login` | No | All |
| `Signup` | `/signup` | No | All |
| `VerifyOtp` | `/verify-otp` | No | All |
| `VerifyPhone` | `/verify-phone` | Yes | All |
| `Privacy` | `/privacy` | No | All |
| `CreateTeam` | `/create-team` | Yes | Coach |
| `JoinTeam` | `/join-team` | Yes | Athlete |
| `LinkChild` | `/link-child` | Yes | Parent |
| `AccountSettings` | `/account-settings` | Yes | All |
| `Dashboard` | `/` | Yes + Team | All |
| `Calendar` | `/calendar` | Yes + Team | Coach/Athlete |
| `Athletes` | `/athletes` | Yes + Team | Coach |
| `AthleteDetail` | `/athletes/:id` | Yes + Team | Coach |
| `Records` | `/records` | Yes + Team | Coach/Athlete |
| `TrainingJournal` | `/journal` | Yes + Team | Athlete |
| `ParentAccess` | `/parent-access` | Yes + Team | Athlete |
| `Attendance` | `/attendance` | Yes + Team | Coach/Athlete |
| `AuditLog` | `/audit-log` | Yes + Team | Coach |
| `TeamSettings` | `/team-settings` | Yes + Team | Coach |

## Key Patterns

### Data Fetching
All data fetching uses custom hooks with TanStack Query:
```typescript
// Pattern: src/hooks/use{Domain}.ts
export function useTeamAthletes(teamId?: string) {
  return useQuery({
    queryKey: ['team-athletes', teamId],
    queryFn: async () => { /* supabase query */ },
    enabled: !!teamId,
  });
}
```

### Mutations
Mutations invalidate related queries on success:
```typescript
export function useCreateWorkoutLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => { /* insert */ },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-log'] });
      queryClient.invalidateQueries({ queryKey: ['team-athlete-all-logs'] });
    },
  });
}
```

### Types
Database types are auto-generated in `src/integrations/supabase/types.ts`. App types extend them in `src/lib/types.ts`:
```typescript
export type WorkoutLog = Database['public']['Tables']['workout_logs']['Row'];
export type TeamAthleteWithProfile = TeamAthlete & { profiles?: Profile | null };
```

### Forms
Use React Hook Form + Zod:
```typescript
const formSchema = z.object({ /* ... */ });
const form = useForm<z.infer<typeof formSchema>>({
  resolver: zodResolver(formSchema),
  defaultValues: { /* ... */ },
});
```

## Hooks Reference

| Hook | Purpose |
|------|---------|
| `useACWR(teamAthleteId)` | ACWR (Acute:Chronic Workload Ratio) via EWMA; loads 35 days |
| `useAnnouncements(teamId)` | Team announcements + create/update/delete mutations |
| `useAttendanceByDate(teamId, date)` | Attendance records for a specific date |
| `useAttendanceRange(teamId, start, end)` | Attendance records over a date range |
| `useAthleteAttendance(teamAthleteId)` | All attendance for one athlete |
| `useUpsertAttendance()` | Upsert single attendance record |
| `useBulkUpsertAttendance()` | Bulk upsert for entire roster |
| `useAuditLogs(teamId)` | Team audit trail (INSERT/UPDATE/DELETE) |
| `useCalendarFeed(teamId)` | Calendar feed token + iCal URL |
| `useCurrentAthlete(teamId, profileId)` | Current user's `team_athletes` record |
| `useDashboardData(teamId, weekStart, weekEnd)` | Scheduled workouts for current week |
| `useDistances()` | Global distance definitions (1600m, mile, 5k, etc.) |
| `useExportData()` | Export mutation via `export-data` Edge Function |
| `usePagination(totalCount, pageSize?)` | Pagination state (page, offset, pageSize) |
| `useParentData()` | Linked children for parents; `useLinkedChildren()` |
| `useRaces(teamId)` | Team races + add/update/delete mutations |
| `useRaceResults(raceId)` | Results for a race + mutations |
| `useRecords(teamId, athleteId)` | PRs & leaderboards |
| `useScheduledWorkouts(teamId, from, to)` | Calendar workouts + create mutation |
| `useSeasonMileage(teamId, seasonId)` | Miles/km per athlete for a season |
| `useSeasons(teamId)` | All seasons; `useActiveSeason(teamId)` for current |
| `useTeamAthleteStats(teamAthleteId)` | EWMA training load stats |
| `useTeamAthletes(teamId, seasonId?)` | Roster; `useTeamAthleteAllLogs(teamAthleteId)` |
| `useTeamSettings(teamId)` | Team + join/invite codes |
| `useUpdateProfile()` | Profile update mutation |
| `useWorkoutLogs(...)` | Workout logs + create/update/delete mutations |
| `use-mobile` | `useIsMobile()` – mobile breakpoint (768px) |

## User Roles & Auth

Access auth state via `useAuth()` hook from `AuthContext`:

```typescript
const { user, profile, currentTeam, isCoach, isAthlete, isParent } = useAuth();
```

| Property | Type | Description |
|----------|------|-------------|
| `user` | `User \| null` | Supabase auth user |
| `profile` | `Profile \| null` | App profile with role |
| `currentTeam` | `{id, name} \| null` | Active team context |
| `teamMemberships` | `TeamMembership[]` | All teams the user belongs to |
| `isCoach` | `boolean` | Full team management |
| `isAthlete` | `boolean` | Personal logging + team view |
| `isParent` | `boolean` | Read-only, accessed via linked athlete |

### Auth Flow
- **Login/Signup:** Passwordless OTP via email or SMS
- **OTP methods:** `sendOtp(identifier, method)` → `verifyOtp(identifier, token, method)`
- **Phone verification:** Required for new accounts with phone numbers; `sendPhoneVerificationOtp()` + `verifyPhoneOtp()`
- **Multi-step signup:** `pendingSignupData` stored in sessionStorage during OTP verification
- **Parent flow:** After login, parents are redirected to `/link-child` if no linked athletes

## Database Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User accounts with role (coach/athlete/parent) |
| `teams` | Teams with 6-char join codes + coach invite codes |
| `team_athletes` | Roster (can be "shell" athletes without profile) |
| `team_memberships` | User-to-team links |
| `seasons` | Training seasons (one active at a time per team) |
| `scheduled_workouts` | Calendar entries (linked to seasons) |
| `workout_logs` | Athlete completions (scheduled or personal) |
| `workout_templates` | Reusable workout definitions |
| `races` | Race events |
| `race_results` | Individual race results with distance + time |
| `distances` | Distance type definitions (mile, 5k, 3200m, etc.) |
| `announcements` | Team announcements with priority |
| `attendance` | Daily attendance records (present/absent/excused/late) |
| `audit_logs` | DB change tracking (table, operation, old/new values) |
| `parent_athlete_links` | Parent-to-athlete relationships |
| `parent_link_codes` | Temporary codes for parents linking to athletes |
| `otp_codes` | Stored OTP codes (internal, managed by Edge Functions) |
| `otp_rate_limits` | Rate limiting for OTP (5 send/10 verify per hour) |

### Database Views
- `profiles_secure` - Profiles without PII (email/phone hidden from non-owners)
- `teams_secure` - Teams without sensitive join codes

### DB Functions (RLS helpers)
- `is_team_coach(profile_id, team_id)` / `is_team_coach_by_uid(team_id)`
- `is_team_member(profile_id, team_id)`
- `is_parent_of_athlete(athlete_id, parent_id)`
- `can_view_athlete(athlete_id)`
- `get_linked_athlete_ids(parent_id)`
- `lookup_team_by_code(code)` - resolves join or coach invite code
- `generate_parent_link_code(team_athlete_id)`
- `generate_coach_invite_code(team_id)`

### Shell Athletes
Athletes on roster without app accounts. `team_athletes.profile_id` is null. Coaches log workouts for them using `team_athlete_id`.

### Workout Logs
Two types in the same table:
- **Scheduled:** `scheduled_workout_id` is set, `workout_date` is null
- **Personal:** `scheduled_workout_id` is null, `workout_date` is set

### Seasons
Teams have multiple seasons. Only one is active at a time. Athletes, scheduled workouts, and mileage are all season-scoped.

## Database Enums

| Enum | Values |
|------|--------|
| `workout_type` | `easy` \| `tempo` \| `interval` \| `long` \| `rest` \| `race` \| `other` |
| `completion_status` | `none` \| `partial` \| `complete` |
| `attendance_status` | `present` \| `absent` \| `excused` \| `late` |
| `user_role` | `coach` \| `athlete` \| `parent` |
| `distance_type` | `1600m` \| `3000m` \| `5000m` \| `3200m` \| `mile` \| `2mile` \| `other` |

## Utility Functions (src/lib/types.ts)

```typescript
// Workout type badge Tailwind classes
getWorkoutTypeBadgeClass(type: WorkoutType): string

// Time formatting
formatTime(seconds: number): string          // → "4:32.15" or "1:04:32.15"
parseTimeToSeconds(time: string): number     // "4:32.15" → 272.15

// Distance label
getDistanceLabel(distance: Distance): string  // → distance.name
```

## Utility Functions (src/lib/phone.ts)

```typescript
normalizeUSPhone(value: string): string | null   // → "+1XXXXXXXXXX" or null
looksLikePhone(value: string): boolean
isEmail(value: string): boolean
detectIdentifierType(value: string)              // → { method: 'email'|'sms', identifier }
maskPhone(e164: string): string                  // → "(•••) •••-7890"
```

## ACWR (Acute:Chronic Workload Ratio)

Used in `useACWR(teamAthleteId)` to gauge injury risk:
- **Training load** = RPE × Distance (in miles)
- **Acute load** = 7-day EWMA (λ = 0.25)
- **Chronic load** = 28-day EWMA (λ ≈ 0.069)
- **ACWR** = Acute ÷ Chronic

| Zone | ACWR Range |
|------|-----------|
| `insufficient` | < 7 days of data |
| `undertraining` | < 0.8 |
| `optimal` | 0.8 – 1.3 |
| `caution` | 1.3 – 1.5 |
| `danger` | 1.5 – 2.0 |
| `critical` | > 2.0 |

## Common Components

### Dialogs
- `WorkoutLogDialog` - Log scheduled workout completion
- `PersonalWorkoutDialog` - Log personal workout (supports `teamAthleteId` for coach logging)
- `EditWorkoutDialog` - Edit logged workout
- `WorkoutDetailDialog` - View workout log details
- `AddWorkoutDialog` - Add scheduled workout to calendar
- `AddCalendarItemDialog` - Add race or workout to calendar
- `AddRaceDialog` / `EditRaceDialog` - Race management
- `RaceDetailDialog` - View race + results
- `AddAthleteDialog` / `EditAthleteDialog` / `RemoveAthleteDialog`
- `CreateAnnouncementDialog` / `EditAnnouncementDialog` / `DeleteAnnouncementDialog`

### Workout Components
- `RPESlider` - Rate of Perceived Exertion 1–10
- `FeelingSelector` - Post-workout feeling selector

### Layout
- `AppLayout` - Main shell (desktop sidebar + mobile header)
  - Desktop: 64px sidebar with `SeasonSelector` at bottom
  - Mobile: sticky header + hamburger menu
  - `RoleSwitcher` in sidebar for switching roles (dev/testing)

### Route Guards
- `ProtectedRoute` - Handles auth + profile + team + parent onboarding logic
- `CoachOnlyRoute` - Redirects non-coaches

## Tailwind Custom Colors

```css
workout-easy      /* Easy run */
workout-tempo     /* Tempo run */
workout-interval  /* Interval workout */
workout-long      /* Long run */
workout-rest      /* Rest day */
success / warning / info   /* Status colors */
sidebar-*         /* Sidebar theme tokens */
```

Custom animations: `fade-in`, `slide-in-right`, `accordion-down/up`

## Edge Functions

All functions are Deno-based Supabase Edge Functions:

| Function | Endpoint | Purpose |
|----------|----------|---------|
| `send-otp` | `POST /functions/v1/send-otp` | Send OTP via email (Resend) or SMS (Twilio) |
| `verify-otp` | `POST /functions/v1/verify-otp` | Verify code, create profile on new signup |
| `calendar-feed` | `GET /functions/v1/calendar-feed?token=...` | Return iCal feed for subscriptions |
| `export-data` | `POST /functions/v1/export-data` | Export team data as JSON or CSV |

Edge functions are called from the frontend with:
```typescript
fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/{function-name}`, {
  headers: {
    'Content-Type': 'application/json',
    'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    // + Authorization: Bearer {token} for authenticated calls
  }
})
```

## Environment

```env
VITE_SUPABASE_PROJECT_ID=xxx
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=xxx
```

## Testing

Vitest + React Testing Library + jsdom. Test files in `src/test/`.

```bash
npm run test        # Single run
npm run test:watch  # Watch mode
```

## Conventions

- Hooks return `{ data, isLoading, error }` from TanStack Query
- Page components in `src/pages/`, exported as default
- Use `cn()` utility for conditional Tailwind classes
- Prefer editing existing files over creating new ones
- Keep components focused; extract to separate files when > 150 lines
- Don't modify `src/components/ui/` (shadcn managed)
- Don't edit `src/integrations/supabase/types.ts` (auto-generated)
- Use `@/` path alias for imports (maps to `src/`)
- Date utilities use `date-fns` (not native Date manipulation)
- Multi-select queries use Supabase `.select('*, relation(field1, field2)')`
