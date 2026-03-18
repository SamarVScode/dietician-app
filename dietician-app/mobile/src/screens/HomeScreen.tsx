import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Text, ActivityIndicator, Divider } from 'react-native-paper';
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
import { Colors, Typography, Spacing, Radius, Shadows } from '../theme/theme';
import { Card } from '../components/Card';
import { SectionLabel } from '../components/SectionLabel';
import { MacroPill } from '../components/MacroPill';

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

/* ─── Macro strip ─────────────────────────────────────── */
function MacroStrip({ calories, protein, carbs, fats }: {
  calories: number; protein: number; carbs: number; fats: number;
}) {
  const items = [
    { label: 'Cal',     value: Math.round(calories), unit: 'kcal', color: Colors.caloriesColor },
    { label: 'Protein', value: Math.round(protein),  unit: 'g',    color: Colors.proteinColor },
    { label: 'Carbs',   value: Math.round(carbs),    unit: 'g',    color: Colors.carbsColor },
    { label: 'Fats',    value: Math.round(fats),     unit: 'g',    color: Colors.fatsColor },
  ];
  return (
    <Card shadow="sm" padding={0} style={styles.macroStrip}>
      {items.map(({ label, value, unit, color }, idx) => (
        <React.Fragment key={label}>
          {idx > 0 && <View style={styles.macroDivider} />}
          <View style={styles.macroItem}>
            <View style={[styles.macroDot, { backgroundColor: color + '22' }]}>
              <View style={[styles.macroDotInner, { backgroundColor: color }]} />
            </View>
            <Text style={[styles.macroVal, { color }]}>{value}</Text>
            <Text style={styles.macroUnit}>{unit}</Text>
            <Text style={styles.macroLbl}>{label}</Text>
          </View>
        </React.Fragment>
      ))}
    </Card>
  );
}

/* ─── Upcoming meal card ─────────────────────────────── */
function UpcomingMealCard({ meal }: { meal: Meal }) {
  return (
    <Card shadow="md" style={styles.upcomingCard} padding={0}>
      {/* Gradient top bar */}
      <LinearGradient
        colors={[Colors.primary, Colors.primaryMid]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.upcomingBar}
      >
        <View style={styles.upcomingBarLeft}>
          <View style={styles.upcomingDot} />
          <Text style={styles.upcomingLabel}>UP NEXT</Text>
        </View>
        {!!meal.time && (
          <View style={styles.upcomingTimeRow}>
            <MaterialCommunityIcons name="clock-outline" size={12} color="rgba(255,255,255,0.8)" />
            <Text style={styles.upcomingBarTime}>{formatTime12h(meal.time)}</Text>
          </View>
        )}
      </LinearGradient>

      <View style={styles.upcomingBody}>
        {/* Meal name + calories */}
        <View style={styles.upcomingHeader}>
          <Text style={styles.upcomingName} numberOfLines={1}>{meal.name}</Text>
          <View style={styles.calBadge}>
            <Text style={styles.calBadgeText}>🔥 {Math.round(meal.calories)}</Text>
            <Text style={styles.calBadgeUnit}>kcal</Text>
          </View>
        </View>

        {/* Macro pills */}
        <View style={styles.pillRow}>
          <MacroPill label="P" value={meal.protein} color={Colors.proteinColor} />
          <MacroPill label="C" value={meal.carbs}   color={Colors.carbsColor} />
          <MacroPill label="F" value={meal.fats}    color={Colors.fatsColor} />
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
      </View>
    </Card>
  );
}

/* ─── Empty state ────────────────────────────────────── */
function EmptyPlan() {
  return (
    <Card shadow="sm" style={styles.emptyCard}>
      <View style={styles.emptyIconWrap}>
        <MaterialCommunityIcons name="food-off-outline" size={40} color={Colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>No Diet Plan Yet</Text>
      <Text style={styles.emptySub}>
        Your dietician hasn't assigned a plan yet.{'\n'}Check back soon!
      </Text>
    </Card>
  );
}

/* ─── Main screen ────────────────────────────────────── */
export default function HomeScreen() {
  const { userProfile } = useAuthStore();
  const [plan, setPlan]             = useState<DietPlan | null>(null);
  const [todayPlan, setTodayPlan]   = useState<DayPlan | null>(null);
  const [macros, setMacros]         = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 });
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
      {/* ── Gradient header ── */}
      <LinearGradient
        colors={Colors.headerGradient}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Background orb */}
        <View style={styles.headerOrb} />

        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.headerName}>{firstName}</Text>
          </View>
          <View style={styles.avatarChip}>
            <Text style={styles.avatarInitial}>
              {(userProfile?.name?.[0] ?? '?').toUpperCase()}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* ── Body ── */}
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
          <>
            {/* Goal card */}
            {!!goal && (
              <Card shadow="sm" style={styles.goalCard} padding={0}>
                <LinearGradient
                  colors={[Colors.primaryLight, '#F5F3FF']}
                  style={styles.goalGrad}
                >
                  <Text style={styles.goalCardLabel}>YOUR GOAL</Text>
                  <Text style={styles.goalCardText}>{goal}</Text>
                </LinearGradient>
              </Card>
            )}

            <SectionLabel title="Today's Nutrition" />
            <MacroStrip
              calories={macros.calories}
              protein={macros.protein}
              carbs={macros.carbs}
              fats={macros.fats}
            />

            <View style={{ height: Spacing.lg }} />
            <SectionLabel title="Upcoming Meal" />

            {upcomingMeal ? (
              <UpcomingMealCard meal={upcomingMeal} />
            ) : (
              <Card shadow="sm" style={styles.noMeals}>
                <Text style={styles.noMealsText}>No meals planned for today.</Text>
              </Card>
            )}
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  /* Header */
  header:        { paddingHorizontal: Spacing.lg, paddingBottom: 36, paddingTop: Spacing.md, overflow: 'hidden' },
  headerOrb:     { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.06)', top: -70, right: -50 },
  headerContent: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  greeting:      { color: 'rgba(255,255,255,0.6)', ...Typography.bodyMd },
  headerName:    { color: '#FFFFFF', ...Typography.displayLg, marginTop: 2 },
  avatarChip:    {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitial: { color: '#FFFFFF', ...Typography.headingMd },

  /* Body */
  body:        { flex: 1, marginTop: -18, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, backgroundColor: Colors.background },
  bodyContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.lg, paddingBottom: 110 },
  loader:      { marginTop: 60 },

  /* Goal card */
  goalCard:      { marginBottom: Spacing.lg, overflow: 'hidden' },
  goalGrad:      { paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, borderRadius: Radius.xl },
  goalCardLabel: { ...Typography.labelSm, color: Colors.primary, marginBottom: 8 },
  goalCardText:  { ...Typography.displayMd, color: Colors.primaryDark },

  /* Macro strip */
  macroStrip:  { flexDirection: 'row', borderRadius: Radius.xl, paddingVertical: 16, paddingHorizontal: Spacing.sm, marginBottom: 0 },
  macroItem:   { flex: 1, alignItems: 'center', gap: 3 },
  macroDivider:{ width: 1, backgroundColor: Colors.surfaceVariant, marginVertical: 6 },
  macroDot:    { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  macroDotInner: { width: 8, height: 8, borderRadius: 4 },
  macroVal:    { ...Typography.headingSm, lineHeight: 20 },
  macroUnit:   { ...Typography.caption, color: Colors.textMuted },
  macroLbl:    { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600' },

  /* Upcoming card */
  upcomingCard:    { overflow: 'hidden' },
  upcomingBar:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: 10 },
  upcomingBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  upcomingDot:     { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.8)' },
  upcomingLabel:   { ...Typography.labelSm, color: 'rgba(255,255,255,0.9)' },
  upcomingTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  upcomingBarTime: { ...Typography.caption, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  upcomingBody:    { padding: Spacing.md },
  upcomingHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  upcomingName:    { ...Typography.headingMd, color: Colors.text, flex: 1, marginRight: 8 },
  calBadge:        { flexDirection: 'row', alignItems: 'baseline', gap: 2, backgroundColor: Colors.primaryLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full },
  calBadgeText:    { ...Typography.labelLg, color: Colors.primaryDark },
  calBadgeUnit:    { ...Typography.caption, color: Colors.primary },
  pillRow:         { flexDirection: 'row', gap: 6, marginBottom: 4 },

  /* Food list */
  divider:  { marginVertical: 10, backgroundColor: Colors.surfaceVariant },
  foodList: { gap: 6 },
  foodRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  foodDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary + '66', flexShrink: 0 },
  foodName: { flex: 1, ...Typography.bodySm, color: Colors.text },
  foodCal:  { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600' },
  notesBg:  { marginTop: 10, padding: 10, borderRadius: Radius.md, backgroundColor: Colors.primaryLight + '55' },
  notesText:{ ...Typography.bodySm, color: Colors.textSecondary, fontStyle: 'italic', lineHeight: 18 },

  /* Empty */
  emptyCard:    { alignItems: 'center', paddingVertical: 40, marginTop: 24 },
  emptyIconWrap:{ width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
  emptyTitle:   { ...Typography.headingMd, color: Colors.text, marginBottom: 8 },
  emptySub:     { ...Typography.bodyMd, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  noMeals:      { alignItems: 'center' },
  noMealsText:  { color: Colors.textSecondary },
});
