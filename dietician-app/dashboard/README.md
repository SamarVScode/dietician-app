# Dietician Admin Dashboard

A web-based admin dashboard for dieticians to manage patients, assign diet plans, and track health reports.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build tool | Vite |
| Routing | React Router v7 |
| Server state | TanStack Query v5 |
| Auth state | Zustand |
| Backend / DB | Firebase Auth + Firestore |
| Styling | Tailwind CSS v4 + inline styles + `responsive.css` (breakpoints: ≤1024px, ≤640px, ≤400px) |
| Charts | Recharts |
| Icons | Lucide React |
| Toast notifications | React Hot Toast |
| AI Macros | OpenRouter API (`google/gemma-3n-e2b-it:free`) with Firestore caching |

---

## Project Structure

```
dashboard/
  src/
    pages/                   # Route-level page components
    components/
      layout/                # PageWrapper, Header, Sidebar, ProtectedRoute
      dietplan/              # MealBuilder, TemplateForm, mealUtils, AIPlanGenerator, etc.
        mealUtils.ts         # Shared types (Meal, FoodItem, DayPlan), helpers, formatTime12h
        MealBuilder.tsx      # Visual meal editor with time picker, food items, macros
        TemplateForm.tsx     # Template editor with duration-aware day tabs
        aiService.ts         # OpenRouter AI integration for food macro lookup
      reports/               # AIInsights, ReportDetail, charts
      users/                 # CreateUserForm, EditUserForm, UserCard, etc.
      ui/                    # Shared UI primitives (Button, Modal, Toast, etc.)
    services/
      firebase.ts            # App, Auth, Firestore initialisation
      aiService.ts           # OpenRouter API + Firestore foods cache for macro detection
      settingsService.ts     # CRUD for settings/{category}/items
    hooks/
      useSettings.ts         # Fetches + mutates settings dropdown options
    store/
      authStore.ts           # Zustand — Firebase user + isAuthenticated
    utils/
      bmi.ts                 # BMI calculation + category
      generateCredentials.ts # userId / password generators
      createAuthUser.ts      # Secondary Firebase app for safe user creation
      validators.ts          # Field validators
    constants/               # Routes, dropdowns
    types/                   # Shared TypeScript interfaces
    responsive.css           # All media-query overrides (imported in index.css)
```

---

## Routes

| Path | Page | Description |
|---|---|---|
| `/` | Redirect | Redirects to `/dashboard` |
| `/login` | Login | Admin email/password login |
| `/dashboard` | Dashboard | Patient list with stats and search |
| `/users/new` | CreateUser | 5-step form to add a patient |
| `/users/:id` | UserProfile | Patient detail — Profile, Diet Plan, Reports, Credentials tabs |
| `/users/:id/plan` | AssignDietPlan | Assign a saved template to a patient |
| `/users/:id/reports` | UserReports | Patient daily reports (stub) |
| `/templates` | Templates | Create, edit, delete diet plan templates |
| `/settings` | Settings | Manage dropdown options used across the app |

All routes except `/login` are wrapped in `ProtectedRoute`, which listens to Firebase `onAuthStateChanged` and redirects unauthenticated users to `/login`.

---

## Authentication Flow

1. Admin opens the app — `ProtectedRoute` subscribes to `onAuthStateChanged`.
2. While Firebase resolves the session, a loading spinner is shown.
3. If authenticated, the admin is forwarded to the requested route.
4. If not authenticated, the admin is redirected to `/login`.
5. On login, `signInWithEmailAndPassword` is called — on success React Router navigates to `/dashboard`.
6. Auth state is stored in `useAuthStore` (`user`, `isLoading`, `isAuthenticated`).

---

## Creating a Patient

`/users/new` — `CreateUser.tsx`

1. Admin fills a 5-section form: Personal Info, Body Metrics, Diet Info, Health Info, Body Composition.
2. BMI is calculated automatically from weight + height.
3. All dropdown options (goals, preferences, allergies, conditions, body types) are loaded from Firestore via `useSettings`.
4. On submit:
   - A unique `userId` (e.g. `john2026abc`) and random `password` are generated.
   - A **secondary Firebase app instance** (`createAuthUser`) calls `createUserWithEmailAndPassword` — this keeps the admin session active.
   - The secondary app is immediately deleted.
   - A Firestore document is written to `users/` with all profile + credential data.
5. A modal shows the generated credentials for the admin to copy and share.

> **Why a secondary app?**
> Firebase automatically signs in the newly created account on the primary app instance, which would log out the admin. A temporary secondary `initializeApp` isolates the creation so the admin session is never replaced.

---

## Firebase Collections & Schema

The app uses **4 top-level collections** and **1 subcollection**.

---

### Collection: `users`

One document per patient. Auto-generated document ID used as the patient's internal `id`.

```
users/
  {auto-id}/
```

#### Full field list

```typescript
{
  // ── Identity ───────────────────────────────────────────────────
  id:           string          // Same as the Firestore document ID
  name:         string          // Full name, e.g. "Priya Sharma"
  age:          number          // e.g. 28
  gender:       string          // "Male" | "Female" | "Other"
  phone:        string          // e.g. "9876543210" (optional)

  // ── Body Metrics ───────────────────────────────────────────────
  weight:       number          // kg, e.g. 72.5
  height:       number          // cm, e.g. 168
  bmi:          number          // auto-calculated, e.g. 25.7
  bmiCategory:  string          // "Underweight" | "Normal" | "Overweight" | "Obese"
  bodyType:     string          // "Ectomorph" | "Mesomorph" | "Endomorph"

  // ── Body Composition (smart scale — all nullable) ──────────────
  bodyFatPercent:   number | null   // % body fat,      e.g. 22.5
  muscleMass:       number | null   // kg muscle mass,  e.g. 34.2
  boneMass:         number | null   // kg bone mass,    e.g. 2.8
  bodyWaterPercent: number | null   // % body water,    e.g. 55.0
  visceralFat:      number | null   // level 1–59,      e.g. 8
  bmr:              number | null   // kcal/day (BMR),  e.g. 1680
  metabolicAge:     number | null   // years,           e.g. 30

  // ── Diet Information ───────────────────────────────────────────
  goal:         string          // e.g. "Weight Loss" (from settings)
  preference:   string          // e.g. "Vegetarian" (from settings)
  allergies:    string[]        // e.g. ["Gluten", "Dairy"]
  conditions:   string[]        // e.g. ["Diabetes", "Hypertension"]
  medications:  string          // free text, e.g. "Metformin 500mg"
  notes:        string          // free text

  // ── Login Credentials (for mobile app) ────────────────────────
  userId:       string          // generated, e.g. "priya2026abc"
  userEmail:    string          // generated, e.g. "priya2026abc@dietapp.com"
  password:     string          // generated 8-char mixed-case + special char

  // ── Status & Timestamps ────────────────────────────────────────
  status:       "active" | "no-plan" | "inactive"
  createdAt:    string          // ISO 8601, e.g. "2026-03-16T10:30:00.000Z"
  updatedAt:    string          // ISO 8601
}
```

**Status transitions:**
- `no-plan` → `active` when a diet plan is assigned
- `active` → `no-plan` when the active diet plan is removed

---

### Subcollection: `users/{userId}/dietPlans`

One document per assigned plan. The most recently assigned plan (ordered by `assignedAt desc`) is treated as the active plan.

```
users/
  {auto-id}/
    dietPlans/
      {auto-id}/
```

#### Schema

```typescript
{
  templateId:    string | null   // ID of the source template, or null if custom
  templateName:  string          // Display name, e.g. "Weight Loss Plan — Week 1"

  days: [                        // 7, 15, or 30 entries depending on plan duration
    {
      day:       number          // 1-based index (1 = first day)
      dayName:   string          // "Monday"–"Sunday" for 7-day, "Day 1"–"Day N" for 15/30-day
      isOverride: boolean        // legacy field — always false in new plans
      meals: [
        {
          id:       string       // random alphanumeric, e.g. "k3f9az"
          name:     string       // e.g. "Breakfast"
          time:     string       // 24h format, e.g. "08:00" (used for notifications)
          items: [
            {
              name:     string   // food item name, e.g. "Oats with milk"
              calories?: number  // auto-fetched via AI on save
              protein?:  number
              carbs?:    number
              fats?:     number
            }
          ]
          calories: number       // kcal (auto-summed from items on save)
          protein:  number       // grams
          carbs:    number       // grams
          fats:     number       // grams
          notes:    string       // optional instructions
        }
      ]
    }
  ]

  assignedAt:  string            // ISO 8601 timestamp
  assignedBy:  string            // "admin"
  status:      string            // "active"
}
```

---

### Collection: `templates`

Reusable diet plan templates created by the admin. Each template supports 7-day (weekly), 15-day, or 30-day (monthly) durations.

```
templates/
  {auto-id}/
```

#### Schema

```typescript
{
  name:        string    // e.g. "Keto Weight Loss Plan"
  description: string    // optional free-text description
  targetGoal:  string    // e.g. "Weight Loss" — used for recommendation matching
  duration:    number    // 7 | 15 | 30

  days: [                // 7, 15, or 30 entries
    {
      dayIndex: number   // 0-based index
      dayName:  string   // "Monday"–"Sunday" for 7-day, "Day 1"–"Day N" for 15/30-day
      meals: [
        {
          id:       string       // random alphanumeric
          name:     string       // e.g. "Lunch"
          time:     string       // 24h format, e.g. "13:00"
          items: [
            {
              name:     string   // food item name
              calories?: number  // auto-fetched via AI
              protein?:  number
              carbs?:    number
              fats?:     number
            }
          ]
          calories: number       // kcal (auto-summed from items)
          protein:  number       // grams
          carbs:    number       // grams
          fats:     number       // grams
          notes:    string
        }
      ]
    }
  ]

  createdAt:  string     // ISO 8601
  updatedAt:  string     // ISO 8601
}
```

> **Note:** `templates[].days[].dayIndex` is 0-based. When a template is assigned to a patient, each day is mapped to `dietPlans[].days[].day` which is 1-based (`dayIndex + 1`). Old templates without `duration` default to 7.

---

### Collection: `settings`

Stores custom dropdown options added by the admin. The document ID is the category name.

```
settings/
  goals/
    items/
      {auto-id}/  { name: string }
  allergies/
    items/
      {auto-id}/  { name: string }
  conditions/
    items/
      {auto-id}/  { name: string }
  preferences/
    items/
      {auto-id}/  { name: string }
  bodyTypes/
    items/
      {auto-id}/  { name: string }
```

#### Schema per item document

```typescript
{
  name: string    // e.g. "Keto", "Lactose Intolerance"
}
```

**Default items** are hardcoded in `settingsService.ts` and never written to Firestore. Only **custom items** added by the admin are stored. Both are merged and returned by `useSettings(category)`.

| Category | Default items |
|---|---|
| `goals` | Weight Loss, Weight Gain, Maintenance, Muscle Gain, General Health |
| `allergies` | Gluten, Dairy, Nuts, Eggs, Soy, Shellfish |
| `conditions` | Diabetes, Hypertension, PCOS, Thyroid, Obesity |
| `preferences` | Vegetarian, Vegan, Non-Vegetarian, Eggetarian, Gluten-Free |
| `bodyTypes` | Ectomorph, Mesomorph, Endomorph |

---

### Collection: `foods`

AI macro cache. One document per unique food name. Prevents repeated API calls for the same food item.

```
foods/
  {auto-id}/
```

#### Schema

```typescript
{
  name:      string   // lowercase, trimmed, e.g. "chicken breast"
  calories:  number   // kcal, e.g. 165
  protein:   number   // grams, e.g. 31
  carbs:     number   // grams, e.g. 0
  fats:      number   // grams, e.g. 3
  createdAt: string   // ISO 8601
}
```

When a diet plan is saved, each food item without macros triggers a lookup:
1. Check `foods` collection for a matching `name`
2. If found → use cached macros
3. If not → call OpenRouter API (`google/gemma-3n-e2b-it:free`) → parse JSON response → save to `foods` → return macros

---

### Firebase Auth

The admin account is a standard Firebase Auth user (email + password).

Patient accounts are created using a **temporary secondary Firebase app instance** so the admin session is not replaced. Each patient gets:

| Field | Format | Example |
|---|---|---|
| `email` | `{userId}@dietapp.com` | `priya2026abc@dietapp.com` |
| `password` | 8 chars: uppercase + lowercase + digit + special | `@bX3kR9z` |

Patient credentials are stored in plain text in the `users` Firestore document so the admin can view and share them from the Credentials tab.

---

## Diet Plan Templates

`/templates` — `Templates.tsx`

- Templates are reusable plans stored in `templates/`.
- **Duration picker** — when creating a template, the admin first picks a duration: Weekly (7 days), 15 Days, or Monthly (30 days).
- Each template has independent day entries, each with its own meals array.
- The dietician edits each day via scrollable day tabs — no base-meals/override layers.
- **Meal time** — each meal has a proper time picker (`<input type="time">`) stored in 24h format (e.g. `"08:00"`, `"13:30"`), displayed as 12h (e.g. `8:00 AM`). Used for future notification scheduling.
- **AI macro enrichment** — on save, all food items without macros are auto-enriched via OpenRouter API. Macros are cached in Firestore `foods` collection. Meal-level macros are auto-summed from food items.
- **Copy helpers:**
  - "Apply to all days" — copies current day's meals to all days.
  - "Copy from" — pastes another day's meals into the current day.
  - Per-meal "Copy to days" — appends a single meal to any chosen subset of days.
- Template cards show meals/day, kcal/day, and target goal.
- Delete button on each template card opens a confirmation modal.

---

## Assigning a Diet Plan

Plans can be assigned via two entry points:

### Via `/users/:id/plan` — `AssignDietPlan.tsx`

1. Lists all saved templates; highlights the one matching the patient's goal as "Recommended".
2. Allergen check scans all 7 days × all meals × all food items for ingredient names matching the patient's allergies.
3. On confirm: writes a `dietPlans` document and sets `users/{id}.status = "active"`.

### Via `/users/:id` Diet Plan tab — `UserProfile.tsx`

The Diet Plan tab has four modes:

| Mode | Trigger | What it does |
|---|---|---|
| **Template** | "Use a Template" button | Pick a saved template; shows allergen warnings; assigns directly |
| **Custom** | "Create Custom Plan" button | Pick duration (7/15/30 days), then build plan from scratch with day tabs + MealBuilder. AI macro enrichment on save. |
| **Edit** | "Edit Plan" on active plan | Edit any day of the active plan in place |
| **Remove** | "Remove" on active plan | Deletes the `dietPlans` document; resets `status` to `no-plan` |

The **Edit / Cancel / Save** buttons in the patient profile header are only shown when the **Profile Info** tab is active. The **Delete Patient** button is always visible.

---

## Settings Page

`/settings` — `Setting.tsx`

Lets the admin add or remove dropdown options used across patient forms. Default items cannot be deleted. Custom items are stored in `settings/{category}/items/` and can be deleted.

---

## Responsive Layout

| Breakpoint | Behaviour |
|---|---|
| > 1024px (desktop) | Full sidebar always visible |
| ≤ 1024px (tablet) | Sidebar becomes a fixed-position drawer; hamburger button in header toggles it |
| ≤ 640px (mobile) | Compact padding, stacked grids, reduced font sizes, stat cards go horizontal |
| ≤ 400px (xs) | Further padding reduction, single-column grids |

Responsive overrides live in `src/responsive.css` (imported via `index.css`). All overrides use `!important` because page components use inline styles.

---

## Environment Variables

Create a `.env` file in the `dashboard/` directory:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

---

## Setup & Running

```bash
cd dashboard
npm install
npm run dev       # dev server at http://localhost:5173
npm run build     # production build
npm run preview   # preview production build locally
```

---

## What Works Today

- Admin login / logout / session persistence
- Dashboard patient list with search and stats (total, active plans, new this month, no-plan)
- Create patient — full 5-step form + Firebase Auth creation + Firestore write
- Patient profile — view, edit (Profile Info tab only), delete
- Body composition data — entry on create form, display and edit on profile
- Diet plan — assign from template, build custom plan (7/15/30 days), edit active plan, remove plan
- Diet plan templates — full CRUD with duration picker (7/15/30 days), day editor, and copy helpers
- AI macro auto-detection — food item macros fetched via OpenRouter API on save, cached in Firestore `foods` collection
- Proper time picker for meal times (24h storage, 12h display)
- Settings — manage custom dropdown options
- Credentials tab — view, copy userId/password/email
- Fully responsive (hamburger sidebar, compact mobile layouts)

---

## Known Incomplete Areas

These files exist as stubs and are not yet implemented:

### Services
| File | Purpose |
|---|---|
| `src/services/authService.ts` | Auth helper functions |
| `src/services/userService.ts` | Users CRUD helpers |
| `src/services/reportService.ts` | Daily health reports read/write |

### Hooks
| File | Purpose |
|---|---|
| `src/hooks/useAuth.ts` | Auth logic hook |
| `src/hooks/useUsers.ts` | Users list + mutations |
| `src/hooks/useDietPlan.ts` | Diet plan fetch + assign |
| `src/hooks/useReports.ts` | Daily reports fetch + filtering |
| `src/hooks/useAIGenerate.ts` | AI plan generation |

### Stores
| File | Purpose |
|---|---|
| `src/store/userStore.ts` | Global user list cache |
| `src/store/dietPlanStore.ts` | Active diet plan state |

### Pages
| File | Status |
|---|---|
| `src/pages/UserReports.tsx` | Returns "coming soon" — full reports UI not built |
