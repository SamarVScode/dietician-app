import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Text, Surface, ActivityIndicator, Divider } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuthStore } from '../store/authStore';
import {
  fetchActiveDietPlan,
  getTodaysDayPlan,
  getTotalMacros,
  formatTime12h,
} from '../services/dietPlanService';
import type { DietPlan, DayPlan, Meal, FoodItem } from '../types';
import { Colors } from '../theme/theme';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/* Find the next upcoming meal by time; fallback to last meal if all passed */
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

/* ─── Compact macro strip ────────────────────────────── */
function MacroStrip({
  calories, protein, carbs, fats,
}: {
  calories: number; protein: number; carbs: number; fats: number;
}) {
  const items = [
    { label: 'Calories', value: Math.round(calories), unit: 'kcal', color: Colors.caloriesColor },
    { label: 'Protein',  value: Math.round(protein),  unit: 'g',    color: Colors.proteinColor },
    { label: 'Carbs',    value: Math.round(carbs),    unit: 'g',    color: Colors.carbsColor },
    { label: 'Fats',     value: Math.round(fats),     unit: 'g',    color: Colors.fatsColor },
  ];
  return (
    <Surface style={styles.macroStrip} elevation={1}>
      {items.map(({ label, value, unit, color }, idx) => (
        <React.Fragment key={label}>
          {idx > 0 && <View style={styles.macroDivider} />}
          <View style={styles.macroItem}>
            <Text style={[styles.macroVal, { color }]}>{value}</Text>
            <Text style={styles.macroUnit}>{unit}</Text>
            <Text style={styles.macroLbl}>{label}</Text>
          </View>
        </React.Fragment>
      ))}
    </Surface>
  );
}

/* ─── Upcoming meal card ─────────────────────────────── */
function UpcomingMealCard({ meal }: { meal: Meal }) {
  return (
    <Surface style={styles.upcomingCard} elevation={2}>
      {/* Top label */}
      <View style={styles.upcomingLabelRow}>
        <View style={styles.upcomingDot} />
        <Text style={styles.upcomingLabel}>UP NEXT</Text>
      </View>

      {/* Meal name + time + calories */}
      <View style={styles.upcomingHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.upcomingName}>{meal.name}</Text>
          {!!meal.time && (
            <View style={styles.upcomingTimeRow}>
              <MaterialCommunityIcons name="clock-outline" size={13} color={Colors.textSecondary} />
              <Text style={styles.upcomingTime}>{formatTime12h(meal.time)}</Text>
            </View>
          )}
        </View>
        <View style={styles.calBadge}>
          <Text style={styles.calBadgeText}>🔥 {Math.round(meal.calories)} kcal</Text>
        </View>
      </View>

      {/* Macro pills */}
      <View style={styles.pillRow}>
        {[
          { label: 'P', value: meal.protein, color: Colors.proteinColor },
          { label: 'C', value: meal.carbs,   color: Colors.carbsColor },
          { label: 'F', value: meal.fats,    color: Colors.fatsColor },
        ].map(({ label, value, color }) => (
          <View key={label} style={[styles.pill, { borderColor: color + '55', backgroundColor: color + '14' }]}>
            <Text style={[styles.pillText, { color }]}>{label}: {Math.round(value)}g</Text>
          </View>
        ))}
      </View>

      {/* Food items */}
      {meal.items.length > 0 && (
        <>
          <Divider style={styles.divider} />
          <View style={styles.foodList}>
            {meal.items.map((item: FoodItem, idx: number) => (
              <View key={idx} style={styles.foodRow}>
                <View style={styles.foodDot} />
                <Text style={styles.foodName} numberOfLines={1}>{item.name}</Text>
                {item.calories != null && (
                  <Text style={styles.foodCal}>{item.calories} kcal</Text>
                )}
              </View>
            ))}
          </View>
        </>
      )}

      {!!meal.notes && (
        <View style={styles.notesBg}>
          <Text style={styles.notesText}>📝 {meal.notes}</Text>
        </View>
      )}
    </Surface>
  );
}

/* ─── Empty state ────────────────────────────────────── */
function EmptyPlan() {
  return (
    <Surface style={styles.emptyCard} elevation={1}>
      <MaterialCommunityIcons name="food-off-outline" size={56} color={Colors.surfaceVariant} />
      <Text style={styles.emptyTitle}>No Diet Plan Yet</Text>
      <Text style={styles.emptySub}>
        Your dietician hasn't assigned a plan yet.{'\n'}Check back soon!
      </Text>
    </Surface>
  );
}

/* ─── Main screen ────────────────────────────────────── */
export default function HomeScreen() {
  const { userProfile } = useAuthStore();
  const [plan, setPlan]           = useState<DietPlan | null>(null);
  const [todayPlan, setTodayPlan] = useState<DayPlan | null>(null);
  const [macros, setMacros]       = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 });
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  const loadPlan = useCallback(async () => {
    if (!userProfile?.id) { setLoading(false); return; }
    try {
      const activePlan = await fetchActiveDietPlan(userProfile.id);
      if (activePlan) {
        setPlan(activePlan);
        const today = getTodaysDayPlan(activePlan);
        setTodayPlan(today);
        setMacros(getTotalMacros(today));
      } else {
        setPlan(null);
        setTodayPlan(null);
      }
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <LinearGradient
        colors={['#001D36', '#003870', '#0061A4']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerDecor} />
        <Text style={styles.greeting}>{getGreeting()},</Text>
        <Text style={styles.headerName}>{firstName}</Text>
      </LinearGradient>

      {/* ── Content ── */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {loading ? (
          <ActivityIndicator style={styles.loader} color={Colors.primary} size="large" />
        ) : !plan || !todayPlan ? (
          <EmptyPlan />
        ) : (
          <View>
            {/* Goal card */}
            {!!goal && (
              <View style={styles.goalCard}>
                <Text style={styles.goalCardLabel}>YOUR GOAL</Text>
                <Text style={styles.goalCardText}>{goal}</Text>
              </View>
            )}

            {/* Today's Nutrition — compact strip */}
            <Text style={styles.sectionTitle}>Today's Nutrition</Text>
            <MacroStrip
              calories={macros.calories}
              protein={macros.protein}
              carbs={macros.carbs}
              fats={macros.fats}
            />

            {/* Upcoming meal */}
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Upcoming Meal</Text>
            {upcomingMeal ? (
              <UpcomingMealCard meal={upcomingMeal} />
            ) : (
              <Surface style={styles.noMeals} elevation={0}>
                <Text style={styles.noMealsText}>No meals planned for today.</Text>
              </Surface>
            )}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.background },
  header:      { paddingHorizontal: 20, paddingBottom: 30, paddingTop: 16, overflow: 'hidden' },
  headerDecor: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.05)', top: -60, right: -40 },
  greeting:   { color: 'rgba(255,255,255,0.72)', fontSize: 14, fontWeight: '500' },
  headerName: { color: '#FFFFFF', fontSize: 36, fontWeight: '800', marginTop: 2, letterSpacing: -0.5 },

  body:        { flex: 1, marginTop: -14, borderTopLeftRadius: 22, borderTopRightRadius: 22, backgroundColor: Colors.background },
  bodyContent: { paddingHorizontal: 16, paddingTop: 22, paddingBottom: 110 },

  /* Goal card */
  goalCard: {
    borderRadius: 20,
    backgroundColor: '#EDF2FF',
    borderWidth: 1,
    borderColor: '#C5D5FF',
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginBottom: 20,
  },
  goalCardLabel: { fontSize: 10, fontWeight: '800', color: Colors.primary, letterSpacing: 1.4, marginBottom: 8, opacity: 0.7 },
  goalCardText:  { fontSize: 34, fontWeight: '900', color: Colors.primaryDark, letterSpacing: -0.5, lineHeight: 38 },
  loader:      { marginTop: 60 },
  sectionTitle: { fontWeight: '800', color: Colors.text, fontSize: 15, marginBottom: 10 },

  /* Compact macro strip */
  macroStrip:  { flexDirection: 'row', borderRadius: 18, backgroundColor: Colors.surface, paddingVertical: 14, paddingHorizontal: 8 },
  macroItem:   { flex: 1, alignItems: 'center' },
  macroDivider: { width: 1, backgroundColor: Colors.surfaceVariant, marginVertical: 4 },
  macroVal:    { fontSize: 17, fontWeight: '800', lineHeight: 20 },
  macroUnit:   { fontSize: 10, color: Colors.textSecondary, fontWeight: '500', marginTop: 1 },
  macroLbl:    { fontSize: 10, color: Colors.textSecondary, fontWeight: '600', marginTop: 2 },

  /* Upcoming meal card */
  upcomingCard:     { borderRadius: 20, backgroundColor: Colors.surface, padding: 16 },
  upcomingLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  upcomingDot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  upcomingLabel:    { fontSize: 11, fontWeight: '800', color: Colors.primary, letterSpacing: 1.1 },
  upcomingHeader:   { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  upcomingName:     { fontSize: 17, fontWeight: '800', color: Colors.text },
  upcomingTimeRow:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  upcomingTime:     { color: Colors.textSecondary, fontSize: 12 },
  calBadge:         { backgroundColor: Colors.primaryLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
  calBadgeText:     { color: Colors.primaryDark, fontSize: 12, fontWeight: '700' },
  pillRow:          { flexDirection: 'row', gap: 6, marginBottom: 4 },
  pill:             { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  pillText:         { fontSize: 11, fontWeight: '700' },
  divider:          { marginVertical: 10, backgroundColor: Colors.surfaceVariant },
  foodList:         { gap: 5 },
  foodRow:          { flexDirection: 'row', alignItems: 'center', gap: 8 },
  foodDot:          { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary + '66', flexShrink: 0 },
  foodName:         { flex: 1, color: Colors.text, fontSize: 13 },
  foodCal:          { color: Colors.textSecondary, fontSize: 11, fontWeight: '500' },
  notesBg:          { marginTop: 10, padding: 10, borderRadius: 12, backgroundColor: Colors.primaryLight + '55' },
  notesText:        { color: Colors.textSecondary, fontStyle: 'italic', fontSize: 12, lineHeight: 18 },

  /* Empty */
  emptyCard:  { borderRadius: 22, padding: 40, alignItems: 'center', marginTop: 24, backgroundColor: Colors.surface },
  emptyTitle: { fontWeight: '800', color: Colors.text, marginTop: 16, marginBottom: 6, fontSize: 17 },
  emptySub:   { color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, fontSize: 14 },
  noMeals:    { padding: 20, alignItems: 'center', borderRadius: 14, backgroundColor: Colors.surfaceVariant + '55' },
  noMealsText: { color: Colors.textSecondary },
});
