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
import { NutCircle } from '../components/NutStat';
import { FoodRow } from '../components/FoodRow';
import { MacroTagColumn } from '../components/MacroTag';
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

/* ─── Circular nutrition row ──────────────────────────── */
function NutritionCircles({ calories, protein, carbs, fats }: {
  calories: number; protein: number; carbs: number; fats: number;
}) {
  return (
    <FrostedCard>
      <View style={styles.circleRow}>
        <NutCircle
          val={String(Math.round(calories))}
          label="Calories"
          accent={colors.accentBlue}
          bgTint="rgba(111,174,255,0.18)"
        />
        <NutCircle
          val={`${Math.round(protein)}g`}
          label="Protein"
          accent={colors.accentGreen}
          bgTint="rgba(77,219,160,0.18)"
        />
        <NutCircle
          val={`${Math.round(carbs)}g`}
          label="Carbs"
          accent={colors.accentYellow}
          bgTint="rgba(255,200,74,0.18)"
        />
        <NutCircle
          val={`${Math.round(fats)}g`}
          label="Fats"
          accent={colors.accentPink}
          bgTint="rgba(255,112,150,0.18)"
        />
      </View>
    </FrostedCard>
  );
}

/* ─── Upcoming meal card ─────────────────────────────── */
function UpcomingMealCard({ meal }: { meal: Meal }) {
  return (
    <FrostedCard>
      {/* Header row: icon + name/kcal + macro tags */}
      <View style={styles.mealTop}>
        <View style={styles.mealIcon}>
          <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
          <View style={styles.mealIconOverlay} />
          <MaterialCommunityIcons name="silverware-fork-knife" size={22} color="rgba(255,255,255,0.85)" />
        </View>
        <View style={styles.mealInfo}>
          <Text style={styles.mealName}>{meal.name}</Text>
          <View style={styles.mealKcalRow}>
            <View style={styles.mealDot} />
            <Text style={styles.mealKcal}>{Math.round(meal.calories)} kcal total</Text>
          </View>
        </View>
        {(meal.protein > 0 || meal.carbs > 0 || meal.fats > 0) && (
          <MacroTagColumn protein={meal.protein} carbs={meal.carbs} fats={meal.fats} />
        )}
      </View>

      {/* Food items */}
      {meal.items.length > 0 && (
        <View style={styles.foodList}>
          {meal.items.map((item: FoodItem, idx: number) => (
            <FoodRow key={idx} name={item.name} kcal={item.calories} />
          ))}
        </View>
      )}

      {!!meal.notes && <Text style={styles.notesText}>{meal.notes}</Text>}
    </FrostedCard>
  );
}

/* ─── Water progress bar ─────────────────────────────── */
function WaterProgressBar({
  consumedMl, targetMl, completedSlots, totalSlots,
}: {
  consumedMl: number; targetMl: number; completedSlots: number; totalSlots: number;
}) {
  const progress  = targetMl > 0 ? Math.min(consumedMl / targetMl, 1) : 0;
  const consumedL = (consumedMl / 1000).toFixed(1);
  const targetL   = (targetMl  / 1000).toFixed(1);
  const pct       = Math.round(progress * 100);

  return (
    <FrostedCard>
      <View style={styles.waterHeader}>
        <View style={styles.waterIconWrap}>
          <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
          <View style={styles.waterIconOverlay} />
          <MaterialCommunityIcons name="water" size={20} color={colors.accentBlue} />
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

/* ─── Empty state ────────────────────────────────────── */
function EmptyPlan() {
  return (
    <FrostedCard style={styles.emptyCard}>
      <View style={styles.emptyIconWrap}>
        <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
        <View style={styles.emptyIconOverlay} />
        <MaterialCommunityIcons name="food-off-outline" size={40} color={colors.white} />
      </View>
      <Text style={styles.emptyTitle}>No Diet Plan Yet</Text>
      <Text style={styles.emptySub}>
        Your dietician hasn't assigned a plan yet.{'\n'}Check back soon!
      </Text>
    </FrostedCard>
  );
}

/* ─── Main screen ────────────────────────────────────── */
export default function HomeScreen() {
  const { userProfile } = useAuthStore();
  const [plan, setPlan]             = useState<DietPlan | null>(null);
  const [todayPlan, setTodayPlan]   = useState<DayPlan | null>(null);
  const [macros, setMacros]         = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 });
  const [waterLogs, setWaterLogs]   = useState<WaterLog[]>([]);
  const [loading, setLoading]       = useState(true);
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

  const firstName    = userProfile?.name?.split(' ')[0] ?? 'there';
  const goal         = userProfile?.goal ?? '';
  const upcomingMeal = todayPlan ? getUpcomingMeal(todayPlan.meals) : null;

  /* Header fade-in animation */
  const headerOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(headerOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
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
            tintColor={colors.white}
            colors={[colors.white]}
          />
        }
      >
        {loading ? (
          <ActivityIndicator style={styles.loader} color={colors.white} size="large" />
        ) : !plan || !todayPlan ? (
          <EmptyPlan />
        ) : (
          <>
            {/* Goal card */}
            {!!goal && (
              <AnimatedCard delay={60}>
                <PressableScale>
                  <FrostedCard style={styles.goalCard}>
                    <View style={styles.goalEyebrow}>
                      <MaterialCommunityIcons name="trending-up" size={12} color="#5db8d8" />
                      <Text style={styles.goalEyebrowText}>Current Goal</Text>
                    </View>
                    <Text style={styles.goalText}>{goal}</Text>
                  </FrostedCard>
                </PressableScale>
              </AnimatedCard>
            )}

            <AnimatedCard delay={130}>
              <SectionTitle title="Today's Nutrition" />
              <NutritionCircles
                calories={macros.calories}
                protein={macros.protein}
                carbs={macros.carbs}
                fats={macros.fats}
              />
            </AnimatedCard>

            {/* Water progress */}
            {!!plan.waterIntakeMl && plan.waterIntakeMl > 0 && (
              <AnimatedCard delay={200}>
                <View style={styles.sectionGap} />
                <SectionTitle title="Hydration" />
                <PressableScale>
                  <WaterProgressBar
                    consumedMl={waterLogs
                      .filter(l => l.completed)
                      .reduce((s, l) => s + l.amountMl, 0)}
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
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.screenPadding, paddingTop: 8, paddingBottom: 110 },
  loader:        { marginTop: 60 },
  sectionGap:    { height: spacing.sectionGap },

  /* Circular nutrition row */
  circleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },

  /* Goal card — frosted with gradient text feel */
  goalCard:         { marginBottom: spacing.sectionGap },
  goalEyebrow:      { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
  goalEyebrowText:  { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', color: '#5db8d8' },
  goalText:         { fontSize: 34, fontWeight: '900', color: colors.nameText, letterSpacing: -1 },

  /* Meal card — matching homePage.html reference */
  mealTop:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  mealIcon:   {
    width: 48, height: 48, borderRadius: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
  },
  mealIconOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  mealInfo:    { flex: 1 },
  mealName:    { fontSize: 20, fontWeight: '900', color: colors.white, letterSpacing: -0.3 },
  mealKcalRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  mealDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.mealKcal },
  mealKcal:    { fontSize: 12.5, fontWeight: '600', color: colors.mealKcal },
  foodList:    { gap: 0 },
  notesText:   { fontSize: 13, fontWeight: '400', color: colors.mutedText, fontStyle: 'italic', marginTop: 10 },

  /* Water */
  waterHeader:      { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  waterIconWrap:    { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  waterIconOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(111,174,255,0.10)' },
  waterTitle:       { fontSize: 14, fontWeight: '700', color: colors.white, marginBottom: 2 },
  waterSub:         { fontSize: 10, fontWeight: '500', color: colors.mutedText },
  waterAmountWrap:  { alignItems: 'flex-end' },
  waterAmountValue: { fontSize: 18, fontWeight: '700', color: colors.accentBlue },
  waterAmountTarget:{ fontSize: 10, fontWeight: '500', color: colors.mutedText },
  progressTrack:    { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.15)', overflow: 'hidden', marginBottom: 8 },
  progressFill:     { height: 8, borderRadius: 4, backgroundColor: colors.accentBlue },
  waterPct:         { fontSize: 10, fontWeight: '500', color: colors.mutedText, textAlign: 'right' },

  /* Empty */
  emptyCard:    { alignItems: 'center', marginTop: 24 },
  emptyIconWrap:    { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 16, overflow: 'hidden' },
  emptyIconOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.08)' },
  emptyTitle:   { fontSize: 18, fontWeight: '700', color: colors.white, marginBottom: 8 },
  emptySub:     { fontSize: 14, fontWeight: '400', color: colors.mutedText, textAlign: 'center', lineHeight: 22 },
  noMealsText:  { color: colors.mutedText, textAlign: 'center' },
});
