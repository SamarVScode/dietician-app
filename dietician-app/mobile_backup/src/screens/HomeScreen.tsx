/**
 * HomeScreen — Luminous Vitality / Glassmorphism + Material Expressive
 *
 * ### 🐝 Extended Swarm Active: Rebuilding HomeScreen...
 * - 🗺️ Product Mapper: States = loading / empty / loaded(goal, macros, water, upcomingMeal). Data via fetchActiveDietPlan + fetchTodayWaterLogs.
 * - 📐 Layout Architect: Header (fixed opacity anim) → ScrollView with pull-to-refresh → staggered AnimatedCard sections.
 * - 🎨 Design Systems: Dark nutTileBg tiles with teal accent bar; luminous mealKcal; deep glass meal card.
 * - 🧩 Component Engineer: NutTile, UpcomingMealCard, WaterProgressBar, EmptyPlan as focused inner components.
 * - ⚡ Perf-Tuner: useCallback for loadPlan; staggered delays max 480ms to prevent frame drops.
 * - ✨ Motion Designer: AnimatedCard stagger 60/130/200/270ms; header fades in on mount.
 * - 👁️‍🗨️ a11y Guru: PressableScale wraps cards for 44pt+ targets; waterPct as supplementary text.
 * #### 👑 Director's Verdict: Hero goal card with teal eyebrow, nutrition tiles with dark glass + accent bars, animated water bar.
 */
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Text,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuthStore } from '../store/authStore';
import {
  fetchActiveDietPlan,
  getTodaysDayPlan,
  getTotalMacros,
  formatTime12h,
} from '../services/dietPlanService';
import { fetchTodayWaterLogs } from '../services/reportService';
import type { DietPlan, DayPlan, Meal, FoodItem, WaterLog } from '../types';
import { colors } from '../theme/colors';
import { spacing, radius } from '../theme/spacing';
import { AppBackground } from '../components/AppBackground';
import { Header } from '../components/Header';
import { FrostedCard } from '../components/FrostedCard';
import { SectionTitle } from '../components/SectionTitle';
import { FoodRow } from '../components/FoodRow';
import { MacroTagRow } from '../components/MacroTag';
import { AnimatedCard } from '../components/AnimatedCard';
import { PressableScale } from '../components/PressableScale';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getUpcomingMeal(meals: Meal[]): Meal | null {
  if (!meals.length) return null;
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const sorted = [...meals].sort((a, b) => {
    const [ah = 0, am = 0] = (a.time ?? '').split(':').map(Number);
    const [bh = 0, bm = 0] = (b.time ?? '').split(':').map(Number);
    return ah * 60 + am - (bh * 60 + bm);
  });
  return (
    sorted.find(m => {
      const [h = 0, min = 0] = (m.time ?? '').split(':').map(Number);
      return h * 60 + min >= nowMin;
    }) ?? sorted[sorted.length - 1]
  );
}

/* ─── Nutrition tile ─────────────────────────────────────────────────────── */
function NutTile({ val, unit, label, accent }: { val: string; unit: string; label: string; accent: string }) {
  return (
    <View style={styles.nutTile}>
      <View style={[styles.nutBar, { backgroundColor: accent, shadowColor: accent }]} />
      <View style={styles.nutValueRow}>
        <Text style={styles.nutVal}>{val}</Text>
        <Text style={[styles.nutUnit, { color: accent }]}>{unit}</Text>
      </View>
      <Text style={styles.nutLabel}>{label}</Text>
    </View>
  );
}

function NutritionTiles({
  calories, protein, carbs, fats,
}: {
  calories: number; protein: number; carbs: number; fats: number;
}) {
  return (
    <FrostedCard noPadding overlayColor={colors.nutCardBg} borderColor={colors.nutCardBorder}>
      <View style={styles.nutRow}>
        <NutTile val={String(Math.round(calories))} unit="kcal" label="Calories" accent={colors.accentBlue} />
        <View style={styles.divider} />
        <NutTile val={String(Math.round(protein))} unit="g" label="Protein" accent={colors.accentGreen} />
        <View style={styles.divider} />
        <NutTile val={String(Math.round(carbs))} unit="g" label="Carbs" accent={colors.accentYellow} />
        <View style={styles.divider} />
        <NutTile val={String(Math.round(fats))} unit="g" label="Fats" accent={colors.accentPink} />
      </View>
    </FrostedCard>
  );
}

/* ─── Upcoming meal card ──────────────────────────────────────────────────── */
function UpcomingMealCard({ meal }: { meal: Meal }) {
  return (
    <FrostedCard overlayColor={colors.mealCardBg} borderColor={colors.mealCardBorder}>
      <View style={styles.mealTop}>
        <View style={styles.mealIconCircle}>
          <BlurView intensity={85} tint="light" style={[StyleSheet.absoluteFill, { borderRadius: 24 }]} />
          <MaterialCommunityIcons name="silverware-fork-knife" size={22} color={colors.primary} />
        </View>
        <View style={styles.mealInfo}>
          <Text style={styles.mealName}>{meal.name}</Text>
          <View style={styles.mealKcalRow}>
            <View style={styles.mealDot} />
            <Text style={styles.mealKcal}>{Math.round(meal.calories)} kcal total</Text>
          </View>
        </View>
      </View>

      {meal.items.length > 0 && (
        <View style={styles.foodList}>
          {meal.items.map((item: FoodItem, idx: number) => (
            <View key={idx} style={styles.foodRow}>
              <View style={styles.foodDot} />
              <Text style={styles.foodName} numberOfLines={1}>{item.name}</Text>
              <View style={styles.kcalPill}>
                <Text style={styles.kcalPillText}>{Math.round(item.calories ?? 0)} kcal</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {(meal.protein > 0 || meal.carbs > 0 || meal.fats > 0) && (
        <MacroTagRow protein={meal.protein} carbs={meal.carbs} fats={meal.fats} />
      )}

      {!!meal.notes && <Text style={styles.notesText}>{meal.notes}</Text>}
    </FrostedCard>
  );
}

/* ─── Water progress bar ──────────────────────────────────────────────────── */
function WaterProgressBar({
  consumedMl, targetMl, completedSlots, totalSlots,
}: {
  consumedMl: number; targetMl: number; completedSlots: number; totalSlots: number;
}) {
  const progress = targetMl > 0 ? Math.min(consumedMl / targetMl, 1) : 0;
  const consumedL = (consumedMl / 1000).toFixed(1);
  const targetL = (targetMl / 1000).toFixed(1);
  const pct = Math.round(progress * 100);

  return (
    <FrostedCard>
      <View style={styles.waterHeader}>
        <View style={styles.waterIconWrap}>
          <BlurView intensity={85} tint="light" style={[StyleSheet.absoluteFill, { borderRadius: 20 }]} />
          <View style={styles.waterIconOverlay} />
          <MaterialCommunityIcons name="water" size={22} color={colors.accentBlue} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.waterTitle}>Today's Water</Text>
          <Text style={styles.waterSub}>{completedSlots} of {totalSlots} reminders done</Text>
        </View>
        <View style={styles.waterAmountWrap}>
          <Text style={styles.waterAmountValue}>{consumedL}</Text>
          <Text style={styles.waterAmountTarget}>/{targetL} L</Text>
        </View>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%` as any }]} />
      </View>
      <Text style={styles.waterPct}>{pct}% of daily goal</Text>
    </FrostedCard>
  );
}

/* ─── Empty state ─────────────────────────────────────────────────────────── */
function EmptyPlan() {
  return (
    <FrostedCard style={styles.emptyCard}>
      <View style={styles.emptyIconWrap}>
        <BlurView intensity={40} tint="light" style={[StyleSheet.absoluteFill, { borderRadius: 36 }]} />
        <MaterialCommunityIcons name="food-off-outline" size={40} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>No Diet Plan Yet</Text>
      <Text style={styles.emptySub}>
        Your dietician hasn't assigned a plan yet.{'\n'}Check back soon!
      </Text>
    </FrostedCard>
  );
}

/* ─── Main screen ─────────────────────────────────────────────────────────── */
export default function HomeScreen() {
  const { userProfile } = useAuthStore();
  const [plan, setPlan] = useState<DietPlan | null>(null);
  const [todayPlan, setTodayPlan] = useState<DayPlan | null>(null);
  const [macros, setMacros] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 });
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  const loadPlan = useCallback(async () => {
    if (!userProfile?.id) { setLoading(false); return; }
    try {
      const [activePlan, logs] = await Promise.all([
        fetchActiveDietPlan(userProfile.id),
        fetchTodayWaterLogs(userProfile.id),
      ]);
      if (activePlan) {
        setPlan(activePlan);
        const today = getTodaysDayPlan(activePlan);
        setTodayPlan(today);
        setMacros(getTotalMacros(today));
      } else {
        setPlan(null);
        setTodayPlan(null);
      }
      setWaterLogs(logs);
    } catch (e) {
      console.error('Failed to load diet plan:', e);
    } finally {
      setLoading(false);
    }
  }, [userProfile?.id]);

  useEffect(() => { loadPlan(); }, [loadPlan]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPlan();
    setRefreshing(false);
  };

  const firstName = userProfile?.name?.split(' ')[0] ?? 'there';
  const goal = userProfile?.goal ?? '';
  const upcomingMeal = todayPlan ? getUpcomingMeal(todayPlan.meals) : null;

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const breathAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(headerOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();

    // Breathing loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, {
          toValue: 1.03,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(breathAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <AppBackground>
      <Animated.View style={{ paddingTop: insets.top, opacity: headerOpacity }}>
        <Header
          name={firstName}
          avatarInitial={(userProfile?.name?.[0] ?? '?').toUpperCase()}
        />
      </Animated.View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {loading ? (
          <ActivityIndicator style={styles.loader} color={colors.primary} size="large" />
        ) : !plan || !todayPlan ? (
          <EmptyPlan />
        ) : (
          <>
            {/* Goal hero card */}
            {!!goal && (
              <AnimatedCard delay={60}>
                <PressableScale>
                  <FrostedCard style={styles.goalCard} overlayColor={colors.goalCardBg} borderColor={colors.goalCardBorder}>
                    <View style={styles.goalEyebrow}>
                      <MaterialCommunityIcons name="trending-up" size={11} color={colors.accentTeal} />
                      <Text style={styles.goalEyebrowText}>Current Goal</Text>
                    </View>
                    <Text style={styles.goalText}>{goal}</Text>
                  </FrostedCard>
                </PressableScale>
              </AnimatedCard>
            )}

            <AnimatedCard delay={130}>
              <SectionTitle title="Today's Nutrition" />
              <NutritionTiles
                calories={macros.calories}
                protein={macros.protein}
                carbs={macros.carbs}
                fats={macros.fats}
              />
            </AnimatedCard>

            {!!plan.waterIntakeMl && plan.waterIntakeMl > 0 && (
              <AnimatedCard delay={200}>
                <View style={styles.sectionGap} />
                <SectionTitle title="Hydration" />
                <PressableScale>
                  <WaterProgressBar
                    consumedMl={waterLogs.filter(l => l.completed).reduce((s, l) => s + l.amountMl, 0)}
                    targetMl={plan.waterIntakeMl}
                    completedSlots={waterLogs.filter(l => l.completed).length}
                    totalSlots={plan.waterSchedule?.length ?? 0}
                  />
                </PressableScale>
              </AnimatedCard>
            )}

            <AnimatedCard delay={270}>
              <View style={styles.sectionGap} />
              <SectionTitle title="Upcoming Meal" />
              {upcomingMeal ? (
                <PressableScale>
                  <UpcomingMealCard meal={upcomingMeal} />
                </PressableScale>
              ) : (
                <FrostedCard>
                  <Text style={styles.noMealsText}>No meals planned for today.</Text>
                </FrostedCard>
              )}
            </AnimatedCard>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.screenPadding, paddingTop: 8, paddingBottom: 110 },
  loader: { marginTop: 60 },
  sectionGap: { height: spacing.sectionGap },

  /* Nutrition tiles */
  nutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(0, 163, 255, 0.12)',
  },
  nutTile: {
    flex: 1, alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 4,
    borderRadius: 12,
    // NO BACKGROUND - avoiding "box" artifact inside frosted cards
  },
  nutBar: {
    width: 30,
    height: 4,
    borderRadius: 999,
    marginBottom: 10,
    // Soft glow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  nutValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 1 },
  nutVal: { fontSize: 20, fontWeight: '800', color: colors.onSurface, letterSpacing: -0.5 },
  nutUnit: { fontSize: 10, fontWeight: '600' },
  nutLabel: {
    fontSize: 9, fontWeight: '700',
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 3,
  },

  /* Goal card */
  goalCard: { marginBottom: spacing.sectionGap },
  goalEyebrow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
  goalEyebrowText: { fontSize: 10, fontWeight: '700', letterSpacing: 2.5, textTransform: 'uppercase', color: colors.accentTeal },
  goalText: { fontSize: 50, fontWeight: '300', color: colors.primary, letterSpacing: -2 },

  /* Meal card */
  mealTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  mealIconCircle: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: colors.cardBorder, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  mealIconOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.65)' },
  mealInfo: { flex: 1 },
  mealName: { fontSize: 20, fontWeight: '800', color: colors.onSurface, letterSpacing: -0.3 },
  mealKcalRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  mealDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.mealKcal },
  mealKcal: { fontSize: 12.5, fontWeight: '600', color: colors.mealKcal },
  foodList: { gap: 0 },
  foodRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, gap: 8, borderBottomWidth: 1, borderBottomColor: colors.rowDivider },
  foodDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.primaryDim, flexShrink: 0 },
  foodName: { flex: 1, fontSize: 13, fontWeight: '500', color: colors.onSurface, letterSpacing: 0.1 },
  kcalPill: { backgroundColor: 'rgba(0,163,255,0.06)', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(0,163,255,0.12)' },
  kcalPillText: { fontSize: 11, fontWeight: '800', color: colors.primary },
  notesText: { fontSize: 13, fontWeight: '400', color: colors.onSurfaceVariant, fontStyle: 'italic', marginTop: 10 },

  /* Water */
  waterHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  waterIconWrap: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)' },
  waterIconOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(111,174,255,0.08)' },
  waterTitle: { fontSize: 14, fontWeight: '700', color: colors.onSurface, marginBottom: 2 },
  waterSub: { fontSize: 10, fontWeight: '500', color: colors.onSurfaceVariant },
  waterAmountWrap: { alignItems: 'flex-end' },
  waterAmountValue: { fontSize: 18, fontWeight: '700', color: colors.accentBlue },
  waterAmountTarget: { fontSize: 10, fontWeight: '500', color: colors.onSurfaceVariant },
  progressTrack: { height: 7, borderRadius: 4, backgroundColor: 'rgba(111,174,255,0.15)', overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: 7, borderRadius: 4, backgroundColor: colors.accentBlue, shadowColor: colors.accentBlue, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 6 },
  waterPct: { fontSize: 10, fontWeight: '500', color: colors.onSurfaceVariant, textAlign: 'right' },

  /* Empty */
  emptyCard: { alignItems: 'center', marginTop: 24 },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 16, overflow: 'hidden' },
  emptyIconOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.65)' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.onSurface, marginBottom: 8 },
  emptySub: { fontSize: 14, fontWeight: '400', color: colors.onSurfaceVariant, textAlign: 'center', lineHeight: 22 },
  noMealsText: { color: colors.onSurfaceVariant, textAlign: 'center' },
});
