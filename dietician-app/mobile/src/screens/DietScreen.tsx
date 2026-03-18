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
  Chip,
  Surface,
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
import { Colors } from '../theme/theme';

/* ─── Types ──────────────────────────────────────────── */
type FilterMode = 'today' | 'tomorrow' | 'day' | 'date';

/* ─── Date helpers ───────────────────────────────────── */
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/* 29-day window centred on today (-7 … +21) */
function buildDateStrip(): Date[] {
  const today = startOfDay(new Date());
  return Array.from({ length: 29 }, (_, i) => addDays(today, i - 7));
}

/* ─── Macro summary ──────────────────────────────────── */
function MacroRow({
  calories, protein, carbs, fats,
}: {
  calories: number; protein: number; carbs: number; fats: number;
}) {
  const items = [
    { label: 'Calories', value: Math.round(calories), unit: 'kcal', color: Colors.caloriesColor, icon: 'fire' },
    { label: 'Protein',  value: Math.round(protein),  unit: 'g',    color: Colors.proteinColor,  icon: 'arm-flex' },
    { label: 'Carbs',    value: Math.round(carbs),    unit: 'g',    color: Colors.carbsColor,    icon: 'bread-slice' },
    { label: 'Fats',     value: Math.round(fats),     unit: 'g',    color: Colors.fatsColor,     icon: 'water' },
  ];
  return (
    <View style={styles.macroRow}>
      {items.map(({ label, value, unit, color, icon }) => (
        <Surface key={label} style={styles.macroTile} elevation={1}>
          <View style={[styles.macroIcon, { backgroundColor: color + '1A' }]}>
            <MaterialCommunityIcons name={icon as never} size={20} color={color} />
          </View>
          <Text style={[styles.macroValue, { color }]}>{value}</Text>
          <Text style={styles.macroUnit}>{unit}</Text>
          <Text style={styles.macroLabel}>{label}</Text>
        </Surface>
      ))}
    </View>
  );
}

/* ─── Macro pill ─────────────────────────────────────── */
function MacroPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[styles.pill, { borderColor: color + '55', backgroundColor: color + '14' }]}>
      <Text style={[styles.pillText, { color }]}>
        {label}: {Math.round(value)}g
      </Text>
    </View>
  );
}

/* ─── Meal card ──────────────────────────────────────── */
function MealCard({ meal, index }: { meal: Meal; index: number }) {
  const accent = [
    Colors.primary,
    Colors.proteinColor,
    Colors.carbsColor,
    Colors.fatsColor,
    Colors.caloriesColor,
  ][index % 5];

  return (
    /* Surface with overflow:hidden ensures the accent bar is clipped by borderRadius */
    <Surface style={styles.mealCard} elevation={2}>
      <View style={styles.mealInner}>
        {/* Left accent bar — clipped cleanly by overflow:hidden on Surface */}
        <View style={[styles.mealAccent, { backgroundColor: accent }]} />

        <View style={styles.mealBody}>
          {/* Header row */}
          <View style={styles.mealHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.mealName}>{meal.name}</Text>
              {!!meal.time && (
                <View style={styles.mealTimeRow}>
                  <MaterialCommunityIcons name="clock-outline" size={12} color={Colors.textSecondary} />
                  <Text style={styles.mealTime}>{formatTime12h(meal.time)}</Text>
                </View>
              )}
            </View>
            <View style={styles.calBadge}>
              <Text style={styles.calBadgeText}>🔥 {Math.round(meal.calories)} kcal</Text>
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

          {/* Notes */}
          {!!meal.notes && (
            <View style={styles.notesBg}>
              <Text style={styles.notesText}>📝 {meal.notes}</Text>
            </View>
          )}
        </View>
      </View>
    </Surface>
  );
}

/* ─── Date strip item ────────────────────────────────── */
function DateItem({
  date, selected, onPress,
}: {
  date: Date; selected: boolean; onPress: () => void;
}) {
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

/* ─── Empty state ────────────────────────────────────── */
function EmptyPlan() {
  return (
    <Surface style={styles.emptyCard} elevation={1}>
      <MaterialCommunityIcons name="food-off-outline" size={64} color={Colors.surfaceVariant} />
      <Text style={styles.emptyTitle}>No Diet Plan Yet</Text>
      <Text style={styles.emptySub}>
        Your dietician hasn't assigned a plan yet.{'\n'}Check back soon!
      </Text>
    </Surface>
  );
}

/* ─── Main screen ────────────────────────────────────── */
export default function DietScreen() {
  const { userProfile } = useAuthStore();
  const insets = useSafeAreaInsets();

  const [plan, setPlan]           = useState<DietPlan | null>(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [filterMode, setFilterMode]       = useState<FilterMode>('today');
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [selectedDate, setSelectedDate]   = useState<Date>(startOfDay(new Date()));

  const dateStrip = buildDateStrip();
  const dateStripRef = useRef<FlatList>(null);

  /* ── Load plan ─────────────────────────────────────── */
  const loadPlan = useCallback(async () => {
    if (!userProfile?.id) { setLoading(false); return; }
    try {
      const active = await fetchActiveDietPlan(userProfile.id);
      if (active) {
        setPlan(active);
        setSelectedDayIdx(getTodayDayIndex(active));
      } else {
        setPlan(null);
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

  /* ── Auto-scroll date strip to selection ───────────── */
  useEffect(() => {
    if (filterMode !== 'date') return;
    const idx = dateStrip.findIndex(d => isSameDay(d, selectedDate));
    if (idx >= 0) {
      setTimeout(() =>
        dateStripRef.current?.scrollToIndex({ index: idx, viewPosition: 0.5, animated: true }),
        150,
      );
    }
  }, [selectedDate, filterMode]);

  /* ── Resolve active DayPlan ────────────────────────── */
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

  /* ── Badge label ────────────────────────────────────── */
  const filterLabel = (() => {
    if (filterMode === 'today')    return 'Today';
    if (filterMode === 'tomorrow') return 'Tomorrow';
    if (filterMode === 'day' && activeDayPlan) return activeDayPlan.dayName;
    if (filterMode === 'date')
      return `${selectedDate.getDate()} ${MONTH_NAMES[selectedDate.getMonth()].slice(0, 3)}`;
    return '';
  })();

  const isMultiDay = plan && plan.days.length > 1;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Diet Plan</Text>
          {plan && (
            <Text style={styles.headerSub} numberOfLines={1}>
              {plan.templateName}  ·  {plan.days.length} day{plan.days.length !== 1 ? 's' : ''}
            </Text>
          )}
        </View>
        {plan && activeDayPlan && (
          <View style={styles.badge}>
            <MaterialCommunityIcons name="calendar-today" size={12} color={Colors.primary} />
            <Text style={styles.badgeText}>{filterLabel}</Text>
          </View>
        )}
      </View>

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
        ) : !plan ? (
          <EmptyPlan />
        ) : (
          <View>
            {/* ── Filter chips ── */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
              contentContainerStyle={styles.filterContent}
            >
              {(['today', 'tomorrow'] as FilterMode[]).map(mode => (
                <Chip
                  key={mode}
                  selected={filterMode === mode}
                  onPress={() => setFilterMode(mode)}
                  style={[styles.filterChip, filterMode === mode && styles.filterChipActive]}
                  textStyle={[styles.filterChipText, filterMode === mode && styles.filterChipTextActive]}
                  showSelectedCheck={false}
                >
                  {mode === 'today' ? '📅 Today' : '⏭ Tomorrow'}
                </Chip>
              ))}

              {isMultiDay && (
                <Chip
                  selected={filterMode === 'day'}
                  onPress={() => setFilterMode('day')}
                  style={[styles.filterChip, filterMode === 'day' && styles.filterChipActive]}
                  textStyle={[styles.filterChipText, filterMode === 'day' && styles.filterChipTextActive]}
                  showSelectedCheck={false}
                >
                  📋 By Day
                </Chip>
              )}

              <Chip
                selected={filterMode === 'date'}
                onPress={() => setFilterMode('date')}
                style={[styles.filterChip, filterMode === 'date' && styles.filterChipActive]}
                textStyle={[styles.filterChipText, filterMode === 'date' && styles.filterChipTextActive]}
                showSelectedCheck={false}
              >
                🗓 Pick Date
              </Chip>
            </ScrollView>

            {/* ── Day selector strip ── */}
            {filterMode === 'day' && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.subScroll}
                contentContainerStyle={styles.subScrollContent}
              >
                {plan.days.map((d, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.dayChip, selectedDayIdx === idx && styles.dayChipActive]}
                    onPress={() => setSelectedDayIdx(idx)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.dayChipText, selectedDayIdx === idx && styles.dayChipTextActive]}>
                      {d.dayName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* ── Date strip ── */}
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
                  <DateItem
                    date={item}
                    selected={isSameDay(item, selectedDate)}
                    onPress={() => setSelectedDate(startOfDay(item))}
                  />
                )}
              />
            )}

            {/* ── Content ── */}
            {activeDayPlan && (
              <>
                <Text style={styles.sectionTitle}>Nutrition Summary</Text>
                {macros && (
                  <MacroRow
                    calories={macros.calories}
                    protein={macros.protein}
                    carbs={macros.carbs}
                    fats={macros.fats}
                  />
                )}

                <View style={styles.mealsHeader}>
                  <Text style={styles.sectionTitle}>Meals</Text>
                  <View style={styles.mealCountBadge}>
                    <Text style={styles.mealCountText}>{activeDayPlan.meals.length}</Text>
                  </View>
                </View>

                {activeDayPlan.meals.length === 0 ? (
                  <Surface style={styles.noMeals} elevation={0}>
                    <Text style={styles.noMealsText}>No meals planned for this day.</Text>
                  </Surface>
                ) : (
                  activeDayPlan.meals.map((meal, idx) => (
                    <MealCard key={meal.id} meal={meal} index={idx} />
                  ))
                )}
              </>
            )}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

    </View>
  );
}

/* ─── Styles ─────────────────────────────────────────── */
const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.background },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14, backgroundColor: Colors.background },
  headerTitle: { color: Colors.text, fontSize: 22, fontWeight: '800' },
  headerSub:   { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  badge:       { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.primaryLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  badgeText:   { color: Colors.primary, fontSize: 12, fontWeight: '700' },

  body:        { flex: 1, backgroundColor: Colors.background },
  bodyContent: { paddingTop: 18, paddingHorizontal: 16, paddingBottom: 110 },
  loader:      { marginTop: 60 },

  /* Filters */
  filterScroll:           { marginBottom: 4 },
  filterContent:          { gap: 8, paddingVertical: 4 },
  filterChip:             { backgroundColor: Colors.surface, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.surfaceVariant },
  filterChipActive:       { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipText:         { color: Colors.textSecondary, fontWeight: '600', fontSize: 13 },
  filterChipTextActive:   { color: '#FFFFFF', fontWeight: '700' },

  /* Sub-row (day chips / date strip) */
  subScroll:        { marginBottom: 8, marginTop: 4 },
  subScrollContent: { gap: 8, paddingVertical: 4 },

  /* Day chips */
  dayChip:         { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.surfaceVariant },
  dayChipActive:   { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  dayChipText:     { color: Colors.textSecondary, fontWeight: '600', fontSize: 13 },
  dayChipTextActive: { color: Colors.primaryDark, fontWeight: '700' },

  /* Date strip */
  dateStripContent: { paddingHorizontal: 4, gap: 2 },
  dateItem:         { width: 60, alignItems: 'center', paddingVertical: 4 },
  dateWeekDay:      { fontSize: 10, fontWeight: '600', color: Colors.textSecondary, marginBottom: 4 },
  dateBubble:       { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.surfaceVariant },
  dateBubbleActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dateNum:          { fontSize: 15, fontWeight: '700', color: Colors.text },
  dateNumActive:    { color: '#FFFFFF' },
  dateMon:          { fontSize: 10, fontWeight: '500', color: Colors.textSecondary, marginTop: 4 },
  dateActive:       { color: Colors.primary, fontWeight: '700' },

  /* Macro row */
  macroRow:   { flexDirection: 'row', gap: 8, marginBottom: 20 },
  macroTile:  { flex: 1, borderRadius: 16, padding: 12, alignItems: 'center', backgroundColor: Colors.surface },
  macroIcon:  { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  macroValue: { fontSize: 18, fontWeight: '800', lineHeight: 22 },
  macroUnit:  { fontSize: 10, color: Colors.textSecondary, fontWeight: '500', marginTop: 1 },
  macroLabel: { fontSize: 10, color: Colors.textSecondary, fontWeight: '600', marginTop: 2 },

  /* Section */
  sectionTitle:    { fontWeight: '800', color: Colors.text, fontSize: 16, marginBottom: 12, marginTop: 4 },
  mealsHeader:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, marginTop: 4 },
  mealCountBadge:  { backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  mealCountText:   { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },

  /* Meal card — overflow:hidden clips the accent bar to the rounded corners */
  mealCard:      { marginBottom: 12, borderRadius: 18, backgroundColor: Colors.surface, overflow: 'hidden' },
  mealInner:     { flexDirection: 'row' },
  mealAccent:    { width: 5 },
  mealBody:      { flex: 1, paddingHorizontal: 14, paddingVertical: 14 },
  mealHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  mealName:      { fontWeight: '700', color: Colors.text, fontSize: 15 },
  mealTimeRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  mealTime:      { color: Colors.textSecondary, fontSize: 12 },
  calBadge:      { backgroundColor: Colors.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14 },
  calBadgeText:  { color: Colors.primaryDark, fontSize: 11, fontWeight: '700' },
  pillRow:       { flexDirection: 'row', gap: 6, marginBottom: 4 },
  pill:          { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  pillText:      { fontSize: 11, fontWeight: '700' },
  mealDivider:   { marginVertical: 10, backgroundColor: Colors.surfaceVariant },
  foodList:      { gap: 5 },
  foodRow:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  foodDot:       { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
  foodName:      { flex: 1, color: Colors.text, fontSize: 13 },
  foodCal:       { color: Colors.textSecondary, fontSize: 11, fontWeight: '500' },
  notesBg:       { marginTop: 10, padding: 10, borderRadius: 12, backgroundColor: Colors.primaryLight + '55' },
  notesText:     { color: Colors.textSecondary, fontStyle: 'italic', fontSize: 12, lineHeight: 18 },

  /* Empty */
  emptyCard:   { borderRadius: 22, padding: 44, alignItems: 'center', marginTop: 24, backgroundColor: Colors.surface },
  emptyTitle:  { fontWeight: '800', color: Colors.text, marginTop: 18, marginBottom: 8, fontSize: 18 },
  emptySub:    { color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  noMeals:     { padding: 20, alignItems: 'center', borderRadius: 14, backgroundColor: Colors.surfaceVariant + '55' },
  noMealsText: { color: Colors.textSecondary },
});
