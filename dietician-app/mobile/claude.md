Redesign the React Native mobile app (dietician patient-facing app) with Material Expressive design. This is a UI-only overhaul — do not touch any business logic, Firebase calls, Zustand state, or navigation structure. Only rewrite styling and UI code.

## Design System

Create these two files first:

**theme/colors.ts**
```ts
export const Colors = {
  primary: '#1565C0',
  onPrimary: '#FFFFFF',
  primaryContainer: '#D6E4FF',
  onPrimaryContainer: '#001848',
  secondary: '#4A90D9',
  surface: '#FFFFFF',
  surfaceVariant: '#E8F0FE',
  background: '#F4F7FD',
  outline: '#C5CAD4',
  outlineVariant: '#E8EAF0',
  error: '#B3261E',
  onBackground: '#1A1C1E',
  onSurface: '#1A1C1E',
  onSurfaceVariant: '#44474F',
  scrim: 'rgba(0,0,0,0.32)',
};
```

**theme/typography.ts**
```ts
export const Typography = {
  displayLarge:  { fontFamily: 'GoogleSans-Medium',  fontSize: 34, lineHeight: 42 },
  displayMedium: { fontFamily: 'GoogleSans-Medium',  fontSize: 28, lineHeight: 36 },
  headlineLarge: { fontFamily: 'GoogleSans-Regular', fontSize: 24, lineHeight: 32 },
  headlineMedium:{ fontFamily: 'GoogleSans-Regular', fontSize: 22, lineHeight: 28 },
  titleLarge:    { fontFamily: 'GoogleSans-Medium',  fontSize: 18, lineHeight: 24 },
  titleMedium:   { fontFamily: 'GoogleSans-Medium',  fontSize: 16, lineHeight: 22 },
  bodyLarge:     { fontFamily: 'GoogleSans-Regular', fontSize: 16, lineHeight: 24 },
  bodyMedium:    { fontFamily: 'GoogleSans-Regular', fontSize: 14, lineHeight: 20 },
  labelLarge:    { fontFamily: 'GoogleSans-Medium',  fontSize: 14, lineHeight: 20 },
  labelMedium:   { fontFamily: 'GoogleSans-Medium',  fontSize: 12, lineHeight: 16 },
};
```

---

## Shared Components to Create

**components/ui/AnimatedCard.tsx**
- borderRadius: 24, backgroundColor: white
- Shadow: shadowColor '#1565C0', shadowOpacity 0.07, shadowRadius 12, elevation 3
- Entry animation on mount: translateY 20→0 + opacity 0→1
- Animated.spring, useNativeDriver: true
- Accepts: style, children, delay (for stagger)

**components/ui/FAB.tsx**
- Extended FAB (icon + label)
- height: 56, borderRadius: 16, paddingHorizontal: 24
- backgroundColor: #1565C0, text/icon: white
- Shadow: elevation 6, shadowColor '#1565C0', shadowOpacity 0.35, shadowRadius 16
- Mount animation: scale 0.7→1 with Animated.spring (delay: 350ms)
- Press animation: scale spring to 0.95 → release to 1.0, useNativeDriver: true
- Accepts: icon, label, onPress, style, delay

**components/ui/SkeletonCard.tsx**
- Pulsing opacity animation (1→0.35→1, loop, duration 900ms)
- Accepts: width, height, borderRadius, style
- Use for loading states on all screens

---

## Animation Rules (use only built-in Animated API unless Reanimated 2 is already in package.json)

- Screen entry: staggered, each AnimatedCard gets delay prop (0, 80, 160, 240ms...)
- Header/greeting: opacity 0→1, duration 300ms on mount
- FAB: scale spring on mount, after 350ms delay
- Press feedback on cards and buttons: Animated.spring scale to 0.97 → release, useNativeDriver: true
- NO layout animations in native driver (no height/width). Use opacity + translate only for useNativeDriver: true
- One entrance animation sequence per screen — calm and purposeful, not busy

---

## Screen Designs

### 1. LoginScreen

Layout:
- Top 45% — solid #1565C0 background with app logo/icon centered + app name in white (displayMedium)
- Curved bottom edge on blue section (use a View with borderBottomLeftRadius: 40, borderBottomRightRadius: 40 or an SVG wave)
- Bottom section — white background, card-style form

Form card:
- borderRadius: 28, backgroundColor white, padding 28
- Floats slightly over the blue section (marginTop: -32, marginHorizontal: 24)
- Shadow: elevation 8, shadowColor '#1565C0', shadowOpacity 0.12

Inputs:
- backgroundColor: #F0F4FF, borderRadius: 14, height: 56, paddingHorizontal: 16
- On focus: borderWidth 2, borderColor #1565C0
- Floating label animation: Animated.timing on focus/blur (translateY, fontSize)

Primary button:
- backgroundColor: #1565C0, borderRadius: 20, height: 52, full width
- Label: white, labelLarge typography
- Press scale feedback

---

### 2. HomeScreen

Layout (ScrollView, no nested scroll issues):
- Top section (non-scrolling header area or part of scroll):
  - Greeting: "Good morning," in bodyLarge, patient name in displayMedium, color onBackground
  - Date subtitle in labelMedium, color onSurfaceVariant
- Stat chips row — horizontal ScrollView, no scrollbar visible:
  - Each chip: AnimatedCard variant, borderRadius 20, backgroundColor primaryContainer, paddingHorizontal 16, paddingVertical 12
  - Icon (small, primaryColor) + label above + value below in titleMedium
  - Show: Weight, Height, BMI, Goal
- Section header "Today's Diet Plan" with titleLarge + optional "View All" text button in primary color
- Diet plan meal cards in vertical list — each as AnimatedCard with stagger delay
  - Meal name (titleMedium), description (bodyMedium, onSurfaceVariant), meal time chip (labelMedium, primaryContainer bg)

FAB (position: absolute, bottom: 96, right: 20):
- Label: "Log Meal", icon: add or edit icon
- Use FAB component from above

Bottom area: enough paddingBottom (120) so content doesn't hide behind tab bar + FAB

---

### 3. DietPlanScreen

Layout:
- Header: screen title "My Diet Plan" in headlineMedium, subtitle (plan name or date range) in bodyMedium onSurfaceVariant
- Day selector: horizontal chip row (Mon–Sun), active chip has primaryColor bg + white text, inactive has surfaceVariant bg
  - Animated.spring on active chip indicator position change
- Selected day's meals in vertical AnimatedCard list:
  - Each card: meal type label (Breakfast/Lunch etc.) as chip in top-left, meal name titleMedium, food items as bodyMedium list, calories as labelMedium in top-right
  - Expand/collapse on tap: Animated.timing height animation (without useNativeDriver) + chevron rotation (useNativeDriver: true)

Empty state:
- Centered illustration placeholder (simple SVG circle + icon or emoji), bodyLarge text "No plan assigned yet", bodyMedium subtext in onSurfaceVariant

---

### 4. ProfileScreen

Layout:
- Top section: full-width card (no border radius on top, radius 32 on bottom) with primaryContainer background
  - Avatar circle (64px, backgroundColor primary, initials in white, headlineMedium)
  - Patient name in titleLarge, userId/email in bodyMedium onSurfaceVariant below
  - Edit FAB (small, 40px, icon only) in top-right corner of header card
- Info section: AnimatedCard list with stagger
  - Each row: icon (primary color) + label (bodyMedium, onSurfaceVariant) + value (bodyMedium, onSurface) in a row
  - Rows: Age, Weight, Height, Goal, Allergies, Health Conditions
  - Tappable rows get scale press feedback
- Logout button at bottom: outlined style (borderColor primary, borderWidth 1.5, borderRadius 20, height 52), text in error color (#B3261E) with logout icon

---

## Implementation Rules

- All styles in StyleSheet.create — no inline objects except Animated transform arrays
- Animated.Value refs in useRef, initialized outside render
- useNativeDriver: true for all opacity/transform animations
- useNativeDriver: false for height/borderRadius animations
- Keep all existing: navigation props, onPress handlers, data bindings, Zustand selectors, service calls
- Do not install new packages
- After each screen, verify no TypeScript errors before moving on
- Commit after each screen: "feat(ui): redesign [ScreenName] with Material Expressive"

## Order of execution

1. theme/colors.ts
2. theme/typography.ts
3. components/ui/AnimatedCard.tsx
4. components/ui/FAB.tsx
5. components/ui/SkeletonCard.tsx
6. LoginScreen
7. HomeScreen
8. DietPlanScreen
9. ProfileScreen


## Bottom Tab Navigation — Liquid Glass Pill (iOS-style)

Create/rewrite the bottom tab navigator component.

### Pill Container
- Floating pill shape, NOT full-width tab bar
- Width: auto (fits content), centered horizontally
- height: 64, borderRadius: 32
- Position: absolute, bottom: 24, alignSelf: 'center'
- marginHorizontal: 24 (so it floats above screen edges)
- Does NOT span full screen width

### Liquid Glass Effect
- backgroundColor: 'rgba(255, 255, 255, 0.72)'
- Use react-native-blur BlurView if already in package.json:
  blurType: 'light', blurAmount: 20
  If BlurView not available: backgroundColor 'rgba(255,255,255,0.88)' + borderWidth 1, borderColor 'rgba(255,255,255,0.6)'
- Shadow: shadowColor '#1565C0', shadowOpacity 0.18, shadowRadius 24, shadowOffset {x:0, y:8}, elevation 12
- borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)'

### Active Tab Indicator
- Pill-within-pill: backgroundColor #1565C0, borderRadius: 24
- height: 44, paddingHorizontal: 18
- Position shifts with Animated.spring when tab changes:
  tension: 180, friction: 12, useNativeDriver: true
- Active: icon + label both white
- Inactive: icon + label color 'rgba(100,110,130,0.7)', no label shown (icon only when inactive)

### Tab Icons
- Inactive: icon only, size 24, color 'rgba(100,110,130,0.7)'
- Active: icon size 22 + label in labelMedium, both white, inside blue pill
- Icon scale animation on activate: Animated.spring scale 0.8→1.1→1.0, useNativeDriver: true

### Entry animation
- On app load: pill slides up from bottom (translateY 80→0) + opacity 0→1
- Animated.spring, delay 200ms, useNativeDriver: true

---

## Subtle Animations — Global Rules

Add these consistently across all 4 screens:

### Screen Mount Sequence (every screen)
1. Status bar area / header: opacity 0→1, duration 250ms
2. First card/section: translateY 16→0 + opacity 0→1, delay 60ms
3. Each subsequent card: same, stagger +70ms per item
4. FAB (if present): scale 0.6→1 spring, delay 380ms
All with useNativeDriver: true

### Press / Tap Feedback (every tappable element)
- onPressIn: Animated.spring scale → 0.96, tension 200, friction 8
- onPressOut: Animated.spring scale → 1.0
- useNativeDriver: true
- Wrap all cards, buttons, chips, list rows in this behavior
- Create a reusable PressableScale.tsx component that wraps TouchableOpacity with this logic

### Scroll-linked Header (HomeScreen + DietPlanScreen)
- Track ScrollView onScroll (scrollEventThrottle: 16)
- Header title fades in (opacity 0→1) after scrollY > 60
- Header gets subtle shadow elevation 0→6 after scrollY > 40
- Use Animated.Value interpolate for smooth transition

### Chip / Day Selector (DietPlanScreen)
- Active indicator slides horizontally with Animated.spring
- New content fades in (opacity 0→1) + slight translateY 8→0 on day change

### Input Focus (LoginScreen)
- Floating label: translateY 0→-22, fontSize 16→12, color gray→#1565C0
- Input container: borderWidth spring 0→2 on focus
- Animated.timing, duration 180ms

### Loading → Content Transition
- SkeletonCard fades out (opacity 1→0) as real content fades in (opacity 0→1)
- Crossfade duration: 300ms
- Never show abrupt content pop-in

### Card Entrance (AnimatedCard.tsx)
- Already defined above but enforce: every list-rendered card MUST receive a delay prop
- delay = index * 70
- Cap at 5 items animating in (index > 4 gets delay: 280 to avoid long waits)

---

## Additional Shared Component

**components/ui/PressableScale.tsx**
- Wraps children in TouchableOpacity (activeOpacity: 1)
- Animated.spring scale on pressIn (→0.96) / pressOut (→1.0)
- useNativeDriver: true
- Accepts: onPress, style, children, scaleValue (default 0.96)
- Use this wrapper on: every card, every chip, every button, every list row 
IMP:::::: Get the variables and other names from the app itself u just need to update the ui
