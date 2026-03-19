import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Text,
  ActivityIndicator,
  Animated as RNAnimated,
} from 'react-native';
import { BlurView } from 'expo-blur';
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
import { fireTestNotifications } from '../services/notificationService';
import { fetchTodayMealLogs } from '../services/reportService';
import type { DietPlan, DayPlan, Meal, FoodItem } from '../types';
import { colors } from '../theme/colors';
import { spacing, radius } from '../theme/spacing';
import { typography } from '../theme/typography';
import { AppBackground } from '../components/AppBackground';
import { FrostedCard } from '../components/FrostedCard';
import { SectionTitle } from '../components/SectionTitle';
import { NutStat } from '../components/NutStat';
import { FoodRow } from '../components/FoodRow';
import { MacroTagColumn } from '../components/MacroTag';
import { DayPill } from '../components/DayPill';
import { AnimatedCard } from '../components/AnimatedCard';
import { PressableScale } from '../components/PressableScale';

type FilterMode = 'today' | 'tomorrow' | 'day' | 'date';

const DAY_NAMES   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function startOfDay(d: Date): Date { const c = new Date(d); c.setHours(0,0,0,0); return c; }
function addDays(d: Date, n: number): Date { const c = new Date(d); c.setDate(c.getDate() + n); return c; }
function isSameDay(a: Date, b: Date) { return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
function buildDateStrip(): Date[] { const today = startOfDay(new Date()); return Array.from({ length: 29 }, (_,i) => addDays(today, i-7)); }

/* ─── Nutrition stat row ──────────────────────────────── */
function NutStatRow({ calories, protein, carbs, fats }: { calories: number; protein: number; carbs: number; fats: number }) {
  return (
    <View style={styles.nutRow}>
      <NutStat val={String(Math.round(calories))} unit="kcal" label="Calories" accent={colors.accentBlue} />
      <NutStat val={String(Math.round(protein))} unit="g" label="Protein" accent={colors.accentGreen} />
      <NutStat val={String(Math.round(carbs))} unit="g" label="Carbs" accent={colors.accentYellow} />
      <NutStat val={String(Math.round(fats))} unit="g" label="Fats" accent={colors.accentPink} />
    </View>
  );
}

/* ─── Meal card ──────────────────────────────────────── */
function MealCard({ meal, completed }: { meal: Meal; completed?: boolean }) {
  return (
    <FrostedCard style={styles.mealCard}>
      {/* Header */}
      <View style={styles.mealHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.mealName}>{meal.name}</Text>
          {!!meal.time && (
            <View style={styles.mealTimeRow}>
              <MaterialCommunityIcons name="clock-outline" size={12} color={colors.mutedText} />
              <Text style={styles.mealTime}>{formatTime12h(meal.time)}</Text>
            </View>
          )}
        </View>
        <View style={styles.mealBadgeRow}>
          {completed && (
            <View style={styles.doneBadge}>
              <MaterialCommunityIcons name="check-circle" size={12} color={colors.accentGreen} />
              <Text style={styles.doneBadgeText}>Done</Text>
            </View>
          )}
          <View style={styles.kcalChip}>
            <Text style={styles.kcalText}>{Math.round(meal.calories)} kcal</Text>
          </View>
        </View>
      </View>

      {/* Body: food rows + macro tags */}
      <View style={styles.mealBody}>
        <View style={styles.foodCol}>
          {meal.items.map((item: FoodItem, idx: number) => (
            <FoodRow key={idx} name={item.name} kcal={item.calories} />
          ))}
        </View>
        {(meal.protein > 0 || meal.carbs > 0 || meal.fats > 0) && (
          <MacroTagColumn protein={meal.protein} carbs={meal.carbs} fats={meal.fats} />
        )}
      </View>

      {!!meal.notes && <Text style={styles.notesText}>{meal.notes}</Text>}
    </FrostedCard>
  );
}

/* ─── Filter pill with BlurView + press feedback ────── */
function FilterPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const scale = React.useRef(new RNAnimated.Value(1)).current;
  const pressIn = () => { RNAnimated.spring(scale, { toValue: 0.93, tension: 200, friction: 8, useNativeDriver: true }).start(); };
  const pressOut = () => { RNAnimated.spring(scale, { toValue: 1, tension: 200, friction: 8, useNativeDriver: true }).start(); };

  return (
    <TouchableOpacity onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} activeOpacity={1}>
      <RNAnimated.View style={{ transform: [{ scale }] }}>
        <View style={[styles.filterPillClip, active && styles.filterPillClipActive]}>
          <BlurView intensity={active ? 80 : 60} tint="light" style={StyleSheet.absoluteFill} />
          <View style={[styles.filterPillOverlay, active && styles.filterPillOverlayActive]} />
          <View style={styles.filterPillInner}>
            <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>{label}</Text>
          </View>
        </View>
      </RNAnimated.View>
    </TouchableOpacity>
  );
}

/* ─── Date strip item with BlurView + press feedback ── */
function DateItem({ date, selected, onPress }: { date: Date; selected: boolean; onPress: () => void }) {
  const isToday = isSameDay(date, startOfDay(new Date()));
  const scale = React.useRef(new RNAnimated.Value(1)).current;
  const pressIn = () => { RNAnimated.spring(scale, { toValue: 0.9, tension: 200, friction: 8, useNativeDriver: true }).start(); };
  const pressOut = () => { RNAnimated.spring(scale, { toValue: 1, tension: 200, friction: 8, useNativeDriver: true }).start(); };

  return (
    <TouchableOpacity style={styles.dateItem} onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} activeOpacity={1}>
      <RNAnimated.View style={{ alignItems: 'center', transform: [{ scale }] }}>
        <Text style={[styles.dateWeekDay, selected && styles.dateActive]}>
          {isToday ? 'Today' : DAY_NAMES[date.getDay()]}
        </Text>
        <View style={[styles.dateBubbleClip, selected && styles.dateBubbleClipActive]}>
          <BlurView intensity={selected ? 80 : 60} tint="light" style={StyleSheet.absoluteFill} />
          <View style={[styles.dateBubbleOverlay, selected && styles.dateBubbleOverlayActive]} />
          <Text style={[styles.dateNum, selected && styles.dateNumActive]}>{date.getDate()}</Text>
        </View>
        <Text style={[styles.dateMon, selected && styles.dateActive]}>
          {MONTH_NAMES[date.getMonth()].slice(0, 3)}
        </Text>
      </RNAnimated.View>
    </TouchableOpacity>
  );
}

/* ─── Empty ──────────────────────────────────────────── */
function EmptyPlan() {
  return (
    <FrostedCard style={styles.emptyCard}>
      <View style={styles.emptyIconWrap}>
        <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
        <View style={styles.emptyIconOverlay} />
        <MaterialCommunityIcons name="food-off-outline" size={40} color={colors.white} />
      </View>
      <Text style={styles.emptyTitle}>No Diet Plan Yet</Text>
      <Text style={styles.emptySub}>Your dietician hasn't assigned a plan yet.{'\n'}Check back soon!</Text>
    </FrostedCard>
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
  const [testingNotifs, setTestingNotifs] = useState(false);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [selectedDate, setSelectedDate]     = useState<Date>(startOfDay(new Date()));
  const [completedMealIds, setCompletedMealIds] = useState<Set<string>>(new Set());

  const dateStrip    = buildDateStrip();
  const dateStripRef = useRef<FlatList>(null);

  const loadPlan = useCallback(async () => {
    if (!userProfile?.id) { setLoading(false); return; }
    try {
      const [active, mealLogs] = await Promise.all([
        fetchActiveDietPlan(userProfile.id),
        fetchTodayMealLogs(userProfile.id),
      ]);
      if (active) { setPlan(active); setSelectedDayIdx(getTodayDayIndex(active)); }
      else         { setPlan(null); }
      const ids = new Set(mealLogs.filter(l => l.completed).map(l => l.mealId));
      setCompletedMealIds(ids);
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

  /* Header fade-in */
  const headerOpacity = useRef(new RNAnimated.Value(0)).current;
  useEffect(() => {
    RNAnimated.timing(headerOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <AppBackground>
      <RNAnimated.View style={[styles.headerArea, { paddingTop: insets.top + 12, opacity: headerOpacity }]}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pageTitle}>Diet Plan</Text>
            {plan && <Text style={styles.pageSub}>{plan.templateName} {'\u00B7'} {plan.days.length} day{plan.days.length !== 1 ? 's' : ''}</Text>}
          </View>
          {plan && activeDayPlan && (
            <View style={styles.badgeClip}>
              <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
              <View style={styles.badgeOverlay} />
              <View style={styles.badgeInner}>
                <Text style={styles.badgeText}>{filterLabel}</Text>
              </View>
            </View>
          )}
        </View>
      </RNAnimated.View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.white} colors={[colors.white]} />}
      >
        {loading ? (
          <ActivityIndicator style={styles.loader} color={colors.white} size="large" />
        ) : !plan ? (
          <EmptyPlan />
        ) : (
          <>
            {/* Filter pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
              <FilterPill label="Today"    active={filterMode === 'today'}    onPress={() => setFilterMode('today')} />
              <FilterPill label="Tomorrow" active={filterMode === 'tomorrow'} onPress={() => setFilterMode('tomorrow')} />
              {isMultiDay && <FilterPill label="By Day" active={filterMode === 'day'} onPress={() => setFilterMode('day')} />}
              <FilterPill label="Pick Date" active={filterMode === 'date'}   onPress={() => setFilterMode('date')} />
            </ScrollView>

            {/* DEV: Notification test panel */}
            <TouchableOpacity
              activeOpacity={0.75}
              disabled={testingNotifs}
              onPress={async () => {
                setTestingNotifs(true);
                try { await fireTestNotifications(plan, userProfile!.id); } catch (e) { console.error(e); }
                finally { setTestingNotifs(false); }
              }}
            >
              <View style={styles.testNotifClip}>
                <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
                <View style={styles.testNotifOverlay} />
                <View style={styles.testNotifInner}>
                  <MaterialCommunityIcons name="bell-ring-outline" size={16} color={colors.gold} />
                  <Text style={styles.testNotifText}>
                    {testingNotifs
                      ? 'Firing notifications\u2026'
                      : `[DEV] Fire all notifications (${(plan.waterSchedule?.length ?? 0) + (plan.wakeUpTime ? 1 : 0) + (plan.sleepTime ? 1 : 0) + Math.min(3, getDayPlanForDate(plan, new Date()).meals.length)} total)`}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Day selector strip */}
            {filterMode === 'day' && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subScroll} contentContainerStyle={styles.subScrollContent}>
                {plan.days.map((d, idx) => (
                  <DayPill
                    key={idx}
                    day={d.dayName}
                    active={selectedDayIdx === idx}
                    onPress={() => setSelectedDayIdx(idx)}
                  />
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
                <AnimatedCard delay={60}>
                  <SectionTitle title="Nutrition Summary" />
                  {macros && <NutStatRow calories={macros.calories} protein={macros.protein} carbs={macros.carbs} fats={macros.fats} />}
                </AnimatedCard>

                <AnimatedCard delay={130}>
                  <View style={{ height: 16 }} />
                  <SectionTitle title={`Meals (${activeDayPlan.meals.length})`} />
                </AnimatedCard>

                {activeDayPlan.meals.length === 0 ? (
                  <FrostedCard><Text style={styles.noMealsText}>No meals planned for this day.</Text></FrostedCard>
                ) : (
                  activeDayPlan.meals.map((meal, idx) => (
                    <AnimatedCard key={meal.id} delay={Math.min(200 + idx * 70, 480)}>
                      <PressableScale>
                        <MealCard
                          meal={meal}
                          completed={filterMode === 'today' ? completedMealIds.has(meal.id) : undefined}
                        />
                      </PressableScale>
                    </AnimatedCard>
                  ))
                )}
              </>
            )}
          </>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.screenPadding, paddingBottom: 110 },
  loader:        { marginTop: 60 },

  /* Header area */
  headerArea: { paddingHorizontal: spacing.screenPadding, paddingBottom: 8 },
  titleRow:   { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  pageTitle:  { ...typography.sectionTitle, color: colors.white, fontSize: 24, fontWeight: '900' },
  pageSub:    { ...typography.subLabelSm, color: colors.mutedText, marginTop: 2 },
  badgeClip:    { borderRadius: radius.activePill, overflow: 'hidden', borderWidth: 1, borderColor: colors.activePillBorder },
  badgeOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.activePillBg },
  badgeInner:   { paddingHorizontal: 12, paddingVertical: 5 },
  badgeText:    { fontSize: 12, fontWeight: '700', color: colors.blackText },

  /* Nut stat row */
  nutRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },

  /* Filter pills */
  filterScroll:              { marginBottom: 8 },
  filterContent:             { gap: 8, paddingVertical: 4 },
  filterPillClip:            { borderRadius: 50, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  filterPillClipActive:      { borderColor: colors.activePillBorder },
  filterPillOverlay:         { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.08)' },
  filterPillOverlayActive:   { backgroundColor: 'rgba(255,255,255,0.15)' },
  filterPillInner:           { paddingHorizontal: 16, paddingVertical: 9 },
  filterPillText:            { fontSize: 13, fontWeight: '700', color: colors.white },
  filterPillTextActive:      { color: colors.blackText },

  /* Day chips / date strip */
  subScroll:        { marginBottom: 12, marginTop: 4 },
  subScrollContent: { paddingVertical: 4 },

  /* Date strip */
  dateStripContent: { paddingHorizontal: 4, gap: 2 },
  dateItem:         { width: 60, alignItems: 'center', paddingVertical: 4 },
  dateWeekDay:      { fontSize: 10, fontWeight: '600', color: colors.mutedText, marginBottom: 4 },
  dateBubbleClip:          { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)' },
  dateBubbleClipActive:    { borderColor: colors.activePillBorder },
  dateBubbleOverlay:       { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.08)' },
  dateBubbleOverlayActive: { backgroundColor: 'rgba(255,255,255,0.15)' },
  dateNum:          { fontSize: 16, fontWeight: '700', color: colors.white },
  dateNumActive:    { color: colors.blackText },
  dateMon:          { fontSize: 10, fontWeight: '500', color: colors.mutedText, marginTop: 4 },
  dateActive:       { color: colors.white, fontWeight: '700' },

  /* Meal card */
  mealCard:     { marginBottom: 10 },
  mealHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  mealName:     { fontSize: 16, fontWeight: '600', color: colors.white, letterSpacing: -0.2 },
  mealTimeRow:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  mealTime:     { fontSize: 12, fontWeight: '500', color: colors.mutedText },
  mealBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 },
  doneBadge:    { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.proteinBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 50 },
  doneBadgeText:{ fontSize: 11, fontWeight: '700', color: colors.proteinText },
  kcalChip:     { backgroundColor: 'rgba(125,212,248,0.2)', borderRadius: radius.kcalBadge, paddingHorizontal: 10, paddingVertical: 4 },
  kcalText:     { fontSize: 13, fontWeight: '700', color: colors.mealKcal },
  mealBody:     { flexDirection: 'row', gap: 12 },
  foodCol:      { flex: 1 },
  notesText:    { fontSize: 13, fontWeight: '400', color: colors.mutedText, fontStyle: 'italic', marginTop: 10 },

  /* DEV: test notification button */
  testNotifClip:    { borderRadius: radius.card, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', marginBottom: 12 },
  testNotifOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.08)' },
  testNotifInner:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10 },
  testNotifText:    { flex: 1, fontSize: 12, fontWeight: '700', color: colors.mutedText },

  /* Empty */
  emptyCard:    { alignItems: 'center', marginTop: 24 },
  emptyIconWrap:    { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 16, overflow: 'hidden' },
  emptyIconOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.08)' },
  emptyTitle:   { fontSize: 20, fontWeight: '700', color: colors.white, marginBottom: 8 },
  emptySub:     { fontSize: 14, fontWeight: '400', color: colors.mutedText, textAlign: 'center', lineHeight: 22 },
  noMealsText:  { color: colors.mutedText, textAlign: 'center' },
});
