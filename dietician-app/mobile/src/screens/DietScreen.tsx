import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {
  Text,
  ActivityIndicator,
  Divider,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuthStore } from '../store/authStore';
import {
  fetchActiveDietPlan,
  getDayPlanForDate,
  getTodayDayIndex,
  getTotalMacros,
  formatTime12h,
} from '../services/dietPlanService';
import type { DietPlan, DayPlan, Meal, FoodItem } from '../types';
import { Colors, Typography, Spacing, Radius, Shadows } from '../theme/theme';
import { Card } from '../components/Card';
import { ScreenHeader } from '../components/ScreenHeader';
import { SectionLabel } from '../components/SectionLabel';
import { MacroPill } from '../components/MacroPill';

type FilterMode = 'today' | 'tomorrow' | 'day' | 'date';

const DAY_NAMES   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function startOfDay(d: Date): Date { const c = new Date(d); c.setHours(0,0,0,0); return c; }
function addDays(d: Date, n: number): Date { const c = new Date(d); c.setDate(c.getDate() + n); return c; }
function isSameDay(a: Date, b: Date) { return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
function buildDateStrip(): Date[] { const today = startOfDay(new Date()); return Array.from({ length: 29 }, (_,i) => addDays(today, i-7)); }

/* ─── Macro tiles row ────────────────────────────────── */
function MacroRow({ calories, protein, carbs, fats }: { calories: number; protein: number; carbs: number; fats: number }) {
  const items = [
    { label: 'Calories', value: Math.round(calories), unit: 'kcal', color: Colors.caloriesColor, icon: 'fire' },
    { label: 'Protein',  value: Math.round(protein),  unit: 'g',    color: Colors.proteinColor,  icon: 'arm-flex' },
    { label: 'Carbs',    value: Math.round(carbs),    unit: 'g',    color: Colors.carbsColor,    icon: 'bread-slice' },
    { label: 'Fats',     value: Math.round(fats),     unit: 'g',    color: Colors.fatsColor,     icon: 'water' },
  ];
  return (
    <View style={styles.macroRow}>
      {items.map(({ label, value, unit, color, icon }) => (
        <Card key={label} shadow="sm" style={styles.macroTile} padding={12}>
          <View style={[styles.macroIconWrap, { backgroundColor: color + '18' }]}>
            <MaterialCommunityIcons name={icon as never} size={18} color={color} />
          </View>
          <Text style={[styles.macroValue, { color }]}>{value}</Text>
          <Text style={styles.macroUnit}>{unit}</Text>
          <Text style={styles.macroLabel}>{label}</Text>
        </Card>
      ))}
    </View>
  );
}

/* ─── Meal card ──────────────────────────────────────── */
const ACCENT_COLORS = [Colors.primary, Colors.proteinColor, Colors.carbsColor, Colors.fatsColor, Colors.caloriesColor];

function MealCard({ meal, index }: { meal: Meal; index: number }) {
  const accent = ACCENT_COLORS[index % ACCENT_COLORS.length];
  return (
    <Card shadow="sm" style={styles.mealCard} padding={0}>
      <View style={styles.mealInner}>
        {/* Left accent bar */}
        <View style={[styles.mealAccent, { backgroundColor: accent }]} />

        <View style={styles.mealBody}>
          {/* Header */}
          <View style={styles.mealHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.mealName}>{meal.name}</Text>
              {!!meal.time && (
                <View style={styles.mealTimeRow}>
                  <MaterialCommunityIcons name="clock-outline" size={12} color={Colors.textMuted} />
                  <Text style={styles.mealTime}>{formatTime12h(meal.time)}</Text>
                </View>
              )}
            </View>
            <View style={[styles.calBadge, { backgroundColor: accent + '18', borderColor: accent + '44' }]}>
              <Text style={[styles.calBadgeText, { color: accent }]}>🔥 {Math.round(meal.calories)} kcal</Text>
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
              <Divider style={styles.mealDivider} />
              <View style={styles.foodList}>
                {meal.items.map((item: FoodItem, idx: number) => (
                  <View key={idx} style={styles.foodRow}>
                    <View style={[styles.foodDot, { backgroundColor: accent + 'AA' }]} />
                    <Text style={styles.foodName} numberOfLines={2}>{item.name}</Text>
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
      </View>
    </Card>
  );
}

/* ─── Filter pill ────────────────────────────────────── */
function FilterPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[styles.filterPill, active && styles.filterPillActive]}
    >
      <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

/* ─── Date strip item ────────────────────────────────── */
function DateItem({ date, selected, onPress }: { date: Date; selected: boolean; onPress: () => void }) {
  const isToday = isSameDay(date, startOfDay(new Date()));
  return (
    <TouchableOpacity style={styles.dateItem} onPress={onPress} activeOpacity={0.75}>
      <Text style={[styles.dateWeekDay, selected && styles.dateActive]}>
        {isToday ? 'Today' : DAY_NAMES[date.getDay()]}
      </Text>
      <View style={[styles.dateBubble, selected && styles.dateBubbleActive]}>
        <Text style={[styles.dateNum, selected && styles.dateNumActive]}>{date.getDate()}</Text>
      </View>
      <Text style={[styles.dateMon, selected && styles.dateActive]}>
        {MONTH_NAMES[date.getMonth()].slice(0, 3)}
      </Text>
    </TouchableOpacity>
  );
}

/* ─── Empty ──────────────────────────────────────────── */
function EmptyPlan() {
  return (
    <Card shadow="sm" style={styles.emptyCard}>
      <View style={styles.emptyIconWrap}>
        <MaterialCommunityIcons name="food-off-outline" size={40} color={Colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>No Diet Plan Yet</Text>
      <Text style={styles.emptySub}>Your dietician hasn't assigned a plan yet.{'\n'}Check back soon!</Text>
    </Card>
  );
}

/* ─── Main screen ────────────────────────────────────── */
export default function DietScreen() {
  const { userProfile } = useAuthStore();
  const insets = useSafeAreaInsets();

  const [plan, setPlan]               = useState<DietPlan | null>(null);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [filterMode, setFilterMode]   = useState<FilterMode>('today');
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [selectedDate, setSelectedDate]     = useState<Date>(startOfDay(new Date()));

  const dateStrip    = buildDateStrip();
  const dateStripRef = useRef<FlatList>(null);

  const loadPlan = useCallback(async () => {
    if (!userProfile?.id) { setLoading(false); return; }
    try {
      const active = await fetchActiveDietPlan(userProfile.id);
      if (active) { setPlan(active); setSelectedDayIdx(getTodayDayIndex(active)); }
      else         { setPlan(null); }
    } catch (e) { console.error('Failed to load diet plan:', e); }
    finally      { setLoading(false); }
  }, [userProfile?.id]);

  useEffect(() => { loadPlan(); }, [loadPlan]);

  const onRefresh = async () => { setRefreshing(true); await loadPlan(); setRefreshing(false); };

  useEffect(() => {
    if (filterMode !== 'date') return;
    const idx = dateStrip.findIndex(d => isSameDay(d, selectedDate));
    if (idx >= 0) setTimeout(() => dateStripRef.current?.scrollToIndex({ index: idx, viewPosition: 0.5, animated: true }), 150);
  }, [selectedDate, filterMode]);

  const activeDayPlan: DayPlan | null = (() => {
    if (!plan) return null;
    const today = startOfDay(new Date());
    if (filterMode === 'today')    return getDayPlanForDate(plan, today);
    if (filterMode === 'tomorrow') return getDayPlanForDate(plan, addDays(today, 1));
    if (filterMode === 'day')      return plan.days[selectedDayIdx] ?? plan.days[0];
    if (filterMode === 'date')     return getDayPlanForDate(plan, selectedDate);
    return null;
  })();

  const macros = activeDayPlan ? getTotalMacros(activeDayPlan) : null;

  const filterLabel = (() => {
    if (filterMode === 'today')    return 'Today';
    if (filterMode === 'tomorrow') return 'Tomorrow';
    if (filterMode === 'day' && activeDayPlan) return activeDayPlan.dayName;
    if (filterMode === 'date') return `${selectedDate.getDate()} ${MONTH_NAMES[selectedDate.getMonth()].slice(0,3)}`;
    return '';
  })();

  const isMultiDay = plan && plan.days.length > 1;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader
        title="Diet Plan"
        subtitle={plan ? `${plan.templateName}  ·  ${plan.days.length} day${plan.days.length !== 1 ? 's' : ''}` : undefined}
        right={
          plan && activeDayPlan ? (
            <View style={styles.badge}>
              <MaterialCommunityIcons name="calendar-today" size={11} color={Colors.primary} />
              <Text style={styles.badgeText}>{filterLabel}</Text>
            </View>
          ) : undefined
        }
      />

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
      >
        {loading ? (
          <ActivityIndicator style={styles.loader} color={Colors.primary} size="large" />
        ) : !plan ? (
          <EmptyPlan />
        ) : (
          <>
            {/* Filter pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
              <FilterPill label="📅 Today"    active={filterMode === 'today'}    onPress={() => setFilterMode('today')} />
              <FilterPill label="⏭ Tomorrow" active={filterMode === 'tomorrow'} onPress={() => setFilterMode('tomorrow')} />
              {isMultiDay && <FilterPill label="📋 By Day" active={filterMode === 'day'} onPress={() => setFilterMode('day')} />}
              <FilterPill label="🗓 Pick Date" active={filterMode === 'date'}   onPress={() => setFilterMode('date')} />
            </ScrollView>

            {/* Day selector strip */}
            {filterMode === 'day' && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subScroll} contentContainerStyle={styles.subScrollContent}>
                {plan.days.map((d, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.dayChip, selectedDayIdx === idx && styles.dayChipActive]}
                    onPress={() => setSelectedDayIdx(idx)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.dayChipText, selectedDayIdx === idx && styles.dayChipTextActive]}>{d.dayName}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Date strip */}
            {filterMode === 'date' && (
              <FlatList
                ref={dateStripRef}
                data={dateStrip}
                keyExtractor={d => d.toISOString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.subScroll}
                contentContainerStyle={styles.dateStripContent}
                getItemLayout={(_, index) => ({ length: 64, offset: 64 * index, index })}
                renderItem={({ item }) => (
                  <DateItem date={item} selected={isSameDay(item, selectedDate)} onPress={() => setSelectedDate(startOfDay(item))} />
                )}
              />
            )}

            {/* Macro tiles + meals */}
            {activeDayPlan && (
              <>
                <SectionLabel title="Nutrition Summary" />
                {macros && <MacroRow calories={macros.calories} protein={macros.protein} carbs={macros.carbs} fats={macros.fats} />}

                <View style={{ height: Spacing.md }} />
                <SectionLabel
                  title="Meals"
                  right={
                    <View style={styles.mealCountBadge}>
                      <Text style={styles.mealCountText}>{activeDayPlan.meals.length}</Text>
                    </View>
                  }
                />

                {activeDayPlan.meals.length === 0 ? (
                  <Card shadow="sm" style={styles.noMeals}><Text style={styles.noMealsText}>No meals planned for this day.</Text></Card>
                ) : (
                  activeDayPlan.meals.map((meal, idx) => <MealCard key={meal.id} meal={meal} index={idx} />)
                )}
              </>
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
  body:      { flex: 1 },
  bodyContent: { paddingTop: Spacing.sm, paddingHorizontal: Spacing.md, paddingBottom: 110 },
  loader:    { marginTop: 60 },

  badge:     { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.primaryLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full },
  badgeText: { ...Typography.labelMd, color: Colors.primary },

  /* Filter pills */
  filterScroll:         { marginBottom: Spacing.xs },
  filterContent:        { gap: Spacing.sm, paddingVertical: Spacing.xs },
  filterPill:           { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.surfaceVariant, ...Shadows.sm },
  filterPillActive:     { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterPillText:       { ...Typography.labelMd, color: Colors.textSecondary },
  filterPillTextActive: { color: '#FFFFFF', fontWeight: '700' },

  /* Day chips / date strip */
  subScroll:        { marginBottom: Spacing.sm, marginTop: Spacing.xs },
  subScrollContent: { gap: Spacing.sm, paddingVertical: Spacing.xs },
  dayChip:          { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.surfaceVariant },
  dayChipActive:    { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  dayChipText:      { ...Typography.labelMd, color: Colors.textSecondary },
  dayChipTextActive:{ color: Colors.primaryDark, fontWeight: '700' },

  /* Date strip */
  dateStripContent: { paddingHorizontal: Spacing.xs, gap: 2 },
  dateItem:         { width: 60, alignItems: 'center', paddingVertical: Spacing.xs },
  dateWeekDay:      { ...Typography.caption, color: Colors.textMuted, fontWeight: '600', marginBottom: 4 },
  dateBubble:       { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.surfaceVariant },
  dateBubbleActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dateNum:          { ...Typography.headingSm, color: Colors.text },
  dateNumActive:    { color: '#FFFFFF' },
  dateMon:          { ...Typography.caption, color: Colors.textMuted, marginTop: 4 },
  dateActive:       { color: Colors.primary, fontWeight: '700' },

  /* Macro row */
  macroRow:     { flexDirection: 'row', gap: Spacing.sm, marginBottom: 0 },
  macroTile:    { flex: 1, alignItems: 'center', borderRadius: Radius.lg },
  macroIconWrap:{ width: 36, height: 36, borderRadius: Radius.md, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.xs },
  macroValue:   { ...Typography.headingMd, lineHeight: 22 },
  macroUnit:    { ...Typography.caption, color: Colors.textMuted },
  macroLabel:   { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600' },

  /* Meal count */
  mealCountBadge: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  mealCountText:  { color: '#FFFFFF', ...Typography.caption, fontWeight: '800' },

  /* Meal card */
  mealCard:    { marginBottom: 10, overflow: 'hidden' },
  mealInner:   { flexDirection: 'row' },
  mealAccent:  { width: 4 },
  mealBody:    { flex: 1, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md },
  mealHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
  mealName:    { ...Typography.headingSm, color: Colors.text },
  mealTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  mealTime:    { ...Typography.bodySm, color: Colors.textMuted },
  calBadge:    { paddingHorizontal: 9, paddingVertical: 4, borderRadius: Radius.full, borderWidth: 1 },
  calBadgeText:{ fontSize: 11, fontWeight: '700' },
  pillRow:     { flexDirection: 'row', gap: 6, marginBottom: 4 },
  mealDivider: { marginVertical: 10, backgroundColor: Colors.surfaceVariant },
  foodList:    { gap: 5 },
  foodRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  foodDot:     { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
  foodName:    { flex: 1, ...Typography.bodySm, color: Colors.text },
  foodCal:     { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600' },
  notesBg:     { marginTop: 10, padding: 10, borderRadius: Radius.md, backgroundColor: Colors.primaryLight + '55' },
  notesText:   { ...Typography.bodySm, color: Colors.textSecondary, fontStyle: 'italic', lineHeight: 18 },

  /* Empty */
  emptyCard:    { alignItems: 'center', paddingVertical: 44, marginTop: Spacing.lg },
  emptyIconWrap:{ width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
  emptyTitle:   { ...Typography.headingLg, color: Colors.text, marginBottom: Spacing.sm },
  emptySub:     { ...Typography.bodyMd, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  noMeals:      { alignItems: 'center' },
  noMealsText:  { color: Colors.textSecondary },
});
