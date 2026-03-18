# Dietician App

A full-stack dietician management platform with a web dashboard for dieticians and a mobile app for patients.

## Project Structure

```
dietician-app/
├── dashboard/     React (Vite) admin web app
├── mobile/        React Native (Expo) patient app
├── functions/     Firebase Cloud Functions
├── shared/        Shared types and constants
└── package.json   Monorepo root (npm workspaces)
```

## Tech Stack

### Dashboard (Web)
- **React 19** + **TypeScript** + **Vite 7**
- **Tailwind CSS v4** for styling
- **React Router v7** for navigation
- **TanStack React Query** for data fetching & caching
- **Firebase** (Firestore, Auth)
- **Recharts** for reports/charts
- **Lucide React** for icons
- **OpenRouter AI** for food macro auto-detection

### Mobile
- **React Native 0.76** + **Expo SDK 52**
- **React Navigation** (bottom tabs + native stack)
- **React Native Paper** for UI components
- **expo-linear-gradient** for gradient headers
- **Firebase** (Firestore, Auth)
- **Zustand** for auth state management

### Backend
- **Firebase Cloud Functions** (auth, diet plans, notifications, reports)
- **Firestore** as primary database

## Dashboard Features

| Feature | Description |
|---------|-------------|
| **Patient Management** | Create, edit, delete patients with health profiles (BMI, body composition, allergies, conditions) |
| **Diet Plan Templates** | Create reusable templates with 7/15/30-day duration options |
| **Meal Builder** | Visual meal builder with food items, time picker, macro inputs, and copy-to-days |
| **AI Macro Detection** | Auto-fetch calories/protein/carbs/fats per food item via OpenRouter API on save; cached in Firestore `foods` collection |
| **Assign Diet Plans** | Assign templates or custom plans to patients with allergen warnings |
| **Custom Plans** | Create one-off plans directly on a patient's profile |
| **Reports** | Patient progress tracking with charts |
| **Settings** | Clinic info, branding, and app configuration |
| **Responsive UI** | Mobile-friendly dashboard layout |

### Dashboard Pages

- `Login.tsx` — Admin authentication
- `Dashboard.tsx` — Overview/home
- `Patients.tsx` — Patient list
- `CreateUser.tsx` — New patient form
- `UserProfile.tsx` — Patient detail (profile, diet plan, reports, credentials)
- `Templates.tsx` — Diet plan template CRUD with duration picker
- `AssignDietPlan.tsx` — Template selection & assignment flow
- `Setting.tsx` — App settings
- `UserReports.tsx` — Patient reports

### Key Components

- `MealBuilder` — Add/remove meals, food items, time picker, macro display, copy meals across days
- `TemplateForm` — Template editor with info section + day-by-day plan builder
- `mealUtils.ts` — Shared types (`Meal`, `FoodItem`, `DayPlan`, `TemplateFormData`), helpers, styles
- `aiService.ts` — OpenRouter AI integration for food macro lookup with Firestore caching

## Mobile Features

| Feature | Description |
|---------|-------------|
| **Login** | Firebase Auth via email or User ID; dark gradient UI with animated brand + form card |
| **Home** | Greeting header, goal card, today's macro strip, upcoming meal card with food items |
| **Diet Plan** | Full plan view with Today/Tomorrow/By Day/Pick Date filters; meal cards with macros; date strip |
| **Profile** | Body stats, personal info, diet preferences, allergies, conditions, body composition |
| **Animated Navigation** | Floating glass pill tab bar with per-tab animated label width + background |
| **Screen transitions** | 90ms fade-in on every tab switch via `FadeScreen` wrapper |

### Mobile Screens

- `LoginScreen.tsx` — Dark gradient login with extended FAB sign-in button
- `HomeScreen.tsx` — Dashboard: greeting, goal, macros, upcoming meal
- `DietScreen.tsx` — Full diet plan with filters and meal breakdown
- `ProfileScreen.tsx` — Patient profile with health stats and sign out

### Mobile Architecture

- **`authService.ts`** — Firebase sign-in with email OR userId (Firestore lookup)
- **`dietPlanService.ts`** — Fetch active plan, compute today's day index, macro totals
- **`authStore.ts`** — Zustand store: `firebaseUser`, `userProfile`, `isAuthenticated`, `isLoading`
- **`AppNavigator.tsx`** — Root stack (Login → MainTabs) with custom glass pill tab bar
- **`metro.config.js`** — Custom `resolveRequest` to fix React version conflict in monorepo

### Monorepo React Version Fix

The dashboard uses React 19 while the mobile app uses React 18. A custom Metro resolver (`mobile/metro.config.js`) forces all `react` and `react-native` imports to resolve from `mobile/node_modules` to prevent hook call errors.

## Firestore Data Model

```
users/{userId}
  ├── name, age, gender, phone, weight, height, bmi, ...
  ├── status: 'active' | 'no-plan' | 'inactive'
  └── dietPlans/{planId}
        ├── templateId, templateName
        ├── days: [{ day, dayName, meals: [...], isOverride }]
        ├── assignedAt, assignedBy, status

templates/{templateId}
  ├── name, description, targetGoal, duration
  ├── days: [{ dayIndex, dayName, meals: [...] }]
  └── createdAt, updatedAt

foods/{foodId}  (AI macro cache)
  ├── name (lowercase, trimmed)
  ├── calories, protein, carbs, fats
  └── createdAt
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+
- Firebase project with Firestore + Auth enabled

### Install

```bash
# Install all workspaces
npm install

# Or individually
cd dashboard && npm install
cd mobile && npm install
cd functions && npm install
```

### Run

```bash
# Dashboard (web)
npm run dashboard:dev
# or: cd dashboard && npm run dev

# Mobile (Expo)
npm run mobile:start
# or: cd mobile && npx expo start

# Cloud Functions (local)
npm run functions:serve
# or: cd functions && npm run serve
```

### Build

```bash
# Dashboard production build
cd dashboard && npm run build

# Mobile APK
cd mobile && npm run build:apk
# Download APK from Expo dashboard
```

## Environment Setup

1. Copy `.env.example` to `.env` in each workspace
2. Fill in your Firebase project credentials
3. Configure API keys in the appropriate service files
