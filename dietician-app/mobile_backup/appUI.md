# UI DESIGN SYSTEM — Dietician Mobile App

You are building a React Native / Expo mobile app. Every screen must strictly follow these rules. Do not deviate.

---

## FONT
- **Google Sans** everywhere. No system fonts, no Inter, no Roboto.
- Import via `@expo-google-fonts/dev` or `useFonts`.
- Weights: 400, 500, 600, 700, 800, 900.

---

## BACKGROUND
Every screen uses this exact gradient. No white, no dark, no plain color backgrounds.

```ts
// Base: expo-linear-gradient
colors: ['#4040c0', '#7755bb', '#9966cc', '#55b8cc']
start: { x: 0, y: 0 } end: { x: 1, y: 1 }

// Overlay blob 1 — top right teal
position: absolute, top: 0, right: 0
width: 280, height: 280, borderRadius: 140
backgroundColor: 'rgba(126,200,227,0.45)'

// Overlay blob 2 — bottom left green
position: absolute, bottom: 0, left: 0
width: 240, height: 240, borderRadius: 120
backgroundColor: 'rgba(56,217,169,0.35)'
```

---

## FROSTED GLASS CARDS
All cards, panels and containers use frosted glass. Use `expo-blur` `BlurView`.

```ts
backgroundColor: 'rgba(255,255,255,0.18)'
borderRadius: 22
borderWidth: 1
borderColor: 'rgba(255,255,255,0.28)'
overflow: 'hidden'
// BlurView: intensity={60} tint="light" style={StyleSheet.absoluteFill}
```

Padding: `18` horizontal, `16–20` vertical.

---

## TYPOGRAPHY

| Element | Size | Weight | Color |
|---|---|---|---|
| Greeting eyebrow | 13 | 700 | `#f5c842` |
| User name | 36 | 900 | `rgba(220,235,255,0.95)` |
| Page / section title | 20 | 900 | `#ffffff` |
| Goal title | 34 | 900 | gradient clip `#e0eaff → #a5c8ff → #c4b5fd` |
| Card heading | 20–22 | 800 | `#ffffff` |
| Sub / label text | 12–14 | 500 | `rgba(255,255,255,0.65)` |
| Food item name | 15 | 700 | `#111111` |
| kcal badge text | 13 | 700 | `#111111` |
| Info row label | 14 | 500 | `rgba(255,255,255,0.65)` |
| Info row value | 14 | 700 | `#ffffff` |

---

## COLORS

```ts
export const colors = {
  // Gradient
  gradientStart: '#4040c0',
  gradientMid1: '#7755bb',
  gradientMid2: '#9966cc',
  gradientEnd: '#55b8cc',
  blobTeal: 'rgba(126,200,227,0.45)',
  blobGreen: 'rgba(56,217,169,0.35)',

  // Text
  gold: '#f5c842',
  nameText: 'rgba(220,235,255,0.95)',
  white: '#ffffff',
  blackText: '#111111',
  mutedText: 'rgba(255,255,255,0.65)',

  // Cards
  cardBg: 'rgba(255,255,255,0.18)',
  cardBorder: 'rgba(255,255,255,0.28)',
  foodRowBg: 'rgba(255,255,255,0.45)',
  foodRowBorder: 'rgba(255,255,255,0.55)',
  kcalBadgeBg: 'rgba(255,255,255,0.55)',

  // Accents (nutrition / stats)
  accentBlue: '#6faeff',
  accentGreen: '#4ddba0',
  accentYellow: '#ffc84a',
  accentPink: '#ff7096',

  // Macro tags
  proteinBg: 'rgba(60,210,110,0.22)',
  proteinText: '#5dffaa',
  proteinBorder: 'rgba(60,210,110,0.3)',
  carbBg: 'rgba(255,190,50,0.22)',
  carbText: '#ffd46e',
  carbBorder: 'rgba(255,190,50,0.3)',
  fatBg: 'rgba(255,80,110,0.22)',
  fatText: '#ff9ab0',
  fatBorder: 'rgba(255,80,110,0.3)',

  // UI elements
  mealKcal: '#7dd4f8',
  onlineDot: '#3dd68c',
  bellIcon: '#5544aa',
  bellBg: 'rgba(255,255,255,0.9)',
  navBg: 'rgba(255,255,255,0.22)',
  navBorder: 'rgba(255,255,255,0.4)',
  activePillBg: 'rgba(255,255,255,0.55)',
  activePillBorder: 'rgba(255,255,255,0.6)',
  rowDivider: 'rgba(255,255,255,0.12)',
};
```

---

## SPACING & RADIUS

```ts
export const spacing = {
  screenPadding: 18,
  cardPadding: 18,
  sectionGap: 22,
  rowPadding: 15,
};

export const radius = {
  card: 22,
  navBar: 30,
  activePill: 22,
  field: 16,
  iconBox: 12,
  foodRow: 16,
  kcalBadge: 10,
  macroTag: 7,
  nutTile: 16,
};
```

---

## SHARED COMPONENTS

### `<AppBackground />`
Wraps every screen. LinearGradient base + two absolutely positioned blob Views.

### `<FrostedCard style? />`
BlurView `intensity={60} tint="light"` behind `rgba(255,255,255,0.18)` View with border. Accepts children.

### `<Header />`
Row: avatar (58×58 circle, border `rgba(255,255,255,0.5)` 2.5px, green dot `#3dd68c`) + greeting column (eyebrow gold 13px, name 36px 900 `rgba(220,235,255,0.95)`) + bell button (44×44 frosted white circle, icon `#5544aa`).

### `<SectionTitle title />`
White, 20px, weight 900.

### `<NavBar activeTab />`
- Floating pill: `width:300, height:58, borderRadius:30, bottom:18`, frosted glass
- 3 tabs: home (house), plan (grid), profile (person)
- Active tab: inner frosted pill `rgba(255,255,255,0.55)`, black icon + label, `13px 800 uppercase`
- Inactive: white icon, `opacity:0.5`

### `<NutStat val unit label accent />`
Vertical stack inside frosted tile: accent bar (`width:20, height:3, borderRadius:2`) → value (17px 900 white) → unit (8px 700 muted) → label (9px 700 muted uppercase).

### `<FoodRow name qty kcal />`
Row inside `rgba(255,255,255,0.45)` frosted container: bullet dot → name (15px 700 black) + qty (14px 400 muted black) → kcal badge (frosted white, black text, `borderRadius:10`).

### `<MacroTag type value />`
Stacked vertically. Types: `p` (green), `c` (yellow), `f` (pink). Text: `"P · 8g"` format. `11px 700, borderRadius:7, padding: 3 9`.

### `<InfoRow icon label value />`
Row: icon box (`36×36, borderRadius:12, rgba(255,255,255,0.15)`) → label (14px 500 muted white) → value (14px 700 white). Divider between rows: `rgba(255,255,255,0.12)`.

### `<StatCol accent val unit label />`
Used in body stats. Vertical: accent bar → value (20px 900 white) → unit (10px 600 muted) → label (10px 600 muted uppercase). Divider between cols: `rgba(255,255,255,0.15)`.

### `<GradientButton label onPress align="right" />`
`LinearGradient(#4a3dd8 → #5b4ef5)`, `borderRadius:50`. Right-aligned by default. Contains label + arrow circle (`rgba(255,255,255,0.18)` border `rgba(255,255,255,0.4)`).

### `<DayPill day active />`
Horizontal scroll pill. Active: `rgba(255,255,255,0.55)` frosted, black text. Inactive: `rgba(255,255,255,0.15)`, white text.

---

## FILE STRUCTURE

```
app/
  _layout.tsx                  ← Expo Router root, font loading
  (auth)/
    _layout.tsx
    login.tsx
  (main)/
    _layout.tsx                ← Tab navigator or stack
    home.tsx
    dietplan.tsx
    dailyreport.tsx
    reporthistory.tsx
    profile.tsx

components/
  AppBackground.tsx
  FrostedCard.tsx
  Header.tsx
  NavBar.tsx
  SectionTitle.tsx
  NutStat.tsx
  FoodRow.tsx
  MacroTag.tsx
  InfoRow.tsx
  StatCol.tsx
  GradientButton.tsx
  DayPill.tsx

theme/
  colors.ts
  spacing.ts
  typography.ts
```

---

## STRICT RULES — NEVER BREAK THESE

1. Every screen uses `<AppBackground />` — no plain backgrounds
2. Every card/container uses `<FrostedCard />` with BlurView — no solid fills
3. Font is always Google Sans — no exceptions
4. Nav bar is always the floating frosted pill, `bottom:18`, `width:300`
5. Active nav pill: black icon + black label on frosted white
6. Inactive nav icons: white, `opacity:0.5`
7. Section titles: always white, `20px`, weight `900`
8. Food item names and kcal badges: always black (`#111`)
9. Macro tags: always stacked in a vertical column, never horizontal
10. Buttons: right-aligned compact gradient pill — never full width
11. No `StyleSheet` inline for repeated values — always reference `theme/colors.ts`
12. No Tailwind, no NativeWind, no styled-components — `StyleSheet.create()` only