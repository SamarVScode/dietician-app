/**
 * DietScreen — Luminous Vitality / Glassmorphism + Material Expressive
 *
 * ### 🐝 Extended Swarm Active: Rebuilding DietScreen...
 * - 🗺️ Product Mapper: FilterMode state drives activeDayPlan; completedMealIds tracks done meals for "Today" mode.
 * - 📐 Layout Architect: Fixed header → pill filters + optional strips → ScrollView meal list with stagger.
 * - 🎨 Design Systems: Active filter pill = solid indigo fill + glow; date bubbles use dark glass; meal kcal chip in teal.
 * - 🧩 Component Engineer: FilterPill, DateItem, NutStatRow, MealCard all clean inner components.
 * - ⚡ Perf-Tuner: FlatList for date strip with getItemLayout; Animated.spring for press scale (no JS thread).
 * - ✨ Motion Designer: FilterPill spring scale on press 0.93; DateItem spring 0.9; AnimatedCard stagger on meal list.
 * - 👁️‍🗨️ a11y Guru: DateItem 60px width ensures 44pt+; kcal chip has textual content; doneBadge has checkmark icon.
 * #### 👑 Director's Verdict: Solid indigo active pill with glow, dark glass meal cards, teal kcal chip, green done badge.
 */
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
import { MacroTagRow } from '../components/MacroTag';
import { DayPill } from '../components/DayPill';
import { AnimatedCard } from '../components/AnimatedCard';
import { PressableScale } from '../components/PressableScale';

type FilterMode = 'today' | 'tomorrow' | 'day' | 'date';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function startOfDay(d: Date): Date { const c = new Date(d); c.setHours(0, 0, 0, 0); return c; }
function addDays(d: Date, n: number): Date { const c = new Date(d); c.setDate(c.getDate() + n); return c; }
function isSameDay(a: Date, b: Date) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
function buildDateStrip(): Date[] { const today = startOfDay(new Date()); return Array.from({ length: 29 }, (_, i) => addDays(today, i - 7)); }

/* ─── Nutrition stat row ──────────────────────────────────────────────────── */
function NutStatRow({ calories, protein, carbs, fats }: { calories: number; protein: number; carbs: number; fats: number }) {
  return (
    <View style={styles.nutRow}>
      <NutStat val={String(Math.round(calories))} unit="kcal" label="Calories" accent={colors.accentBlue} />
      <View style={styles.divider} />
      <NutStat val={String(Math.round(protein))} unit="g" label="Protein" accent={colors.accentGreen} />
      <View style={styles.divider} />
      <NutStat val={String(Math.round(carbs))} unit="g" label="Carbs" accent={colors.accentYellow} />
      <View style={styles.divider} />
      <NutStat val={String(Math.round(fats))} unit="g" label="Fats" accent={colors.accentPink} />
    </View>
  );
}

/* ─── Meal card ───────────────────────────────────────────────────────────── */
function MealCard({ meal, completed }: { meal: Meal; completed?: boolean }) {
  return (
    <FrostedCard style={styles.mealCard}>
      <View style={styles.mealHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.mealName}>{meal.name}</Text>
          {!!meal.time && (
            <View style={styles.mealTimeRow}>
              <MaterialCommunityIcons name="clock-outline" size={12} color={colors.onSurfaceVariant} />
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

      <View style={styles.mealBody}>
        <View style={styles.foodCol}>
          {meal.items.map((item: FoodItem, idx: number) => (
            <FoodRow key={idx} name={item.name} kcal={item.calories ?? 0} />
          ))}
        </View>
      </View>

      {(meal.protein > 0 || meal.carbs > 0 || meal.fats > 0) && (
        <MacroTagRow protein={meal.protein} carbs={meal.carbs} fats={meal.fats} />
      )}

      {!!meal.notes && <Text style={styles.notesText}>{meal.notes}</Text>}
    </FrostedCard>
  );
}

/* ─── Filter pill ─────────────────────────────────────────────────────────── */
function FilterPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const scale = React.useRef(new RNAnimated.Value(1)).current;
  const pressIn = () => { RNAnimated.spring(scale, { toValue: 0.93, tension: 200, friction: 8, useNativeDriver: true }).start(); };
  const pressOut = () => { RNAnimated.spring(scale, { toValue: 1, tension: 200, friction: 8, useNativeDriver: true }).start(); };

  return (
    <TouchableOpacity onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} activeOpacity={1}>
      <RNAnimated.View style={{ transform: [{ scale }] }}>
        <View style={[styles.filterPillClip, active && styles.filterPillClipActive]}>
          <BlurView intensity={active ? 95 : 85} tint="light" style={[StyleSheet.absoluteFill, { borderRadius: 999 }]} />
          <View style={[styles.filterPillOverlay, active && styles.filterPillOverlayActive, { borderRadius: 999 }]} />
          <View style={styles.filterPillInner}>
            <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>{label}</Text>
          </View>
        </View>
      </RNAnimated.View>
    </TouchableOpacity>
  );
}

/* ─── Date strip item ─────────────────────────────────────────────────────── */
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
          <BlurView intensity={selected ? 95 : 85} tint="light" style={[StyleSheet.absoluteFill, { borderRadius: 18 }]} />
          <View style={[styles.dateBubbleOverlay, selected && styles.dateBubbleOverlayActive, { borderRadius: 18 }]} />
          <Text style={[styles.dateNum, selected && styles.dateNumActive]}>{date.getDate()}</Text>
        </View>
        <Text style={[styles.dateMon, selected && styles.dateActive]}>
          {MONTH_NAMES[date.getMonth()].slice(0, 3)}
        </Text>
      </RNAnimated.View>
    </TouchableOpacity>
  );
}

/* ─── Empty ───────────────────────────────────────────────────────────────── */
function EmptyPlan() {
  return (
    <FrostedCard style={styles.emptyCard}>
      <View style={styles.emptyIconWrap}>
        <BlurView intensity={85} tint="light" style={StyleSheet.absoluteFill} />
        <View style={styles.emptyIconOverlay} />
        <MaterialCommunityIcons name="food-off-outline" size={40} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>No Diet Plan Yet</Text>
      <Text style={styles.emptySub}>Your dietician hasn't assigned a plan yet.{'\n'}Check back soon!</Text>
    </FrostedCard>
  );
}

/* ─── Main screen ─────────────────────────────────────────────────────────── */
export default function DietScreen() {
  const { userProfile } = useAuthStore();
  const insets = useSafeAreaInsets();

  const [plan, setPlan] = useState<DietPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterMode, setFilterMode] = useState<FilterMode>('today');
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [completedMealIds, setCompletedMealIds] = useState<Set<string>>(new Set());

  const dateStrip = buildDateStrip();
  const dateStripRef = useRef<FlatList>(null);

  const loadPlan = useCallback(async () => {
    if (!userProfile?.id) { setLoading(false); return; }
    try {
      const [active, mealLogs] = await Promise.all([
        fetchActiveDietPlan(userProfile.id),
        fetchTodayMealLogs(userProfile.id),
      ]);
      if (active) { setPlan(active); setSelectedDayIdx(getTodayDayIndex(active)); }
      else { setPlan(null); }
      const ids = new Set(mealLogs.filter(l => l.completed).map(l => l.mealId));
      setCompletedMealIds(ids);
    } catch (e) { console.error('Failed to load diet plan:', e); }
    finally { setLoading(false); }
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
    if (filterMode === 'today') return getDayPlanForDate(plan, today);
    if (filterMode === 'tomorrow') return getDayPlanForDate(plan, addDays(today, 1));
    if (filterMode === 'day') return plan.days[selectedDayIdx] ?? plan.days[0];
    if (filterMode === 'date') return getDayPlanForDate(plan, selectedDate);
    return null;
  })();

  const macros = activeDayPlan ? getTotalMacros(activeDayPlan) : null;

  const filterLabel = (() => {
    if (filterMode === 'today') return 'Today';
    if (filterMode === 'tomorrow') return 'Tomorrow';
    if (filterMode === 'day' && activeDayPlan) return activeDayPlan.dayName;
    if (filterMode === 'date') return `${selectedDate.getDate()} ${MONTH_NAMES[selectedDate.getMonth()].slice(0, 3)}`;
    return '';
  })();

  const isMultiDay = plan && plan.days.length > 1;

  const headerOpacity = useRef(new RNAnimated.Value(0)).current;
  useEffect(() => {
    RNAnimated.timing(headerOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, []);

  return (
    <AppBackground>
      <RNAnimated.View style={[styles.headerArea, { paddingTop: insets.top + 12, opacity: headerOpacity }]}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pageTitle}>Diet Plan</Text>
            {plan && <Text style={styles.pageSub}>{plan.templateName} · {plan.days.length} day{plan.days.length !== 1 ? 's' : ''}</Text>}
          </View>
          {plan && activeDayPlan && (
            <View style={styles.badgeClip}>
              <BlurView intensity={85} tint="light" style={[StyleSheet.absoluteFill, { borderRadius: radius.activePill }]} />
              <View style={[styles.badgeOverlay, { borderRadius: radius.activePill }]} />
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
      >
        {loading ? (
          <ActivityIndicator style={styles.loader} color={colors.primary} size="large" />
        ) : !plan ? (
          <EmptyPlan />
        ) : (
          <>
            {/* Filter pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
              <FilterPill label="Today" active={filterMode === 'today'} onPress={() => setFilterMode('today')} />
              <FilterPill label="Tomorrow" active={filterMode === 'tomorrow'} onPress={() => setFilterMode('tomorrow')} />
              {isMultiDay && <FilterPill label="By Day" active={filterMode === 'day'} onPress={() => setFilterMode('day')} />}
              <FilterPill label="Pick Date" active={filterMode === 'date'} onPress={() => setFilterMode('date')} />
            </ScrollView>

            {/* Day selector strip */}
            {filterMode === 'day' && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subScroll} contentContainerStyle={styles.subScrollContent}>
                {plan.days.map((d, idx) => (
                  <DayPill key={idx} day={d.dayName} active={selectedDayIdx === idx} onPress={() => setSelectedDayIdx(idx)} />
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
                  <FrostedCard noPadding overlayColor={colors.nutCardBg} borderColor={colors.nutCardBorder}>
                    {macros && <NutStatRow calories={macros.calories} protein={macros.protein} carbs={macros.carbs} fats={macros.fats} />}
                  </FrostedCard>
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
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.screenPadding, paddingBottom: 110 },
  loader: { marginTop: 60 },

  /* Header */
  headerArea: { paddingHorizontal: spacing.screenPadding, paddingBottom: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  pageTitle: { fontSize: 26, fontWeight: '900', color: colors.onSurface, letterSpacing: -0.8 },
  pageSub: { fontSize: 13, fontWeight: '500', color: colors.onSurfaceVariant, marginTop: 2 },

  /* Active day badge */
  badgeClip: { borderRadius: radius.activePill, overflow: 'hidden', borderWidth: 1, borderColor: colors.cardBorder },
  badgeOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.65)' },
  badgeInner: { paddingHorizontal: 12, paddingVertical: 5 },
  badgeText: { fontSize: 12, fontWeight: '700', color: colors.primary },

  /* Nut stat row */
  nutRow: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(0, 163, 255, 0.12)',
  },

  /* Filter pills */
  filterScroll: { marginBottom: 8 },
  filterContent: { gap: 8, paddingVertical: 4 },
  filterPillClip: { borderRadius: 999, overflow: 'hidden', borderWidth: 1, borderColor: colors.cardBorder },
  filterPillClipActive: { borderColor: colors.accentIndigo, borderWidth: 1.5 },
  filterPillOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.45)' },
  filterPillOverlayActive: { backgroundColor: 'rgba(255,255,255,0.15)' },
  filterPillInner: { paddingHorizontal: 16, paddingVertical: 9 },
  filterPillText: { fontSize: 13, fontWeight: '700', color: colors.onSurfaceVariant },
  filterPillTextActive: { color: colors.blackText },

  /* Day chips / date strip */
  subScroll: { marginBottom: 12, marginTop: 4 },
  subScrollContent: { paddingVertical: 4 },

  /* Date strip */
  dateStripContent: { paddingHorizontal: 4, gap: 2 },
  dateItem: { width: 60, alignItems: 'center', paddingVertical: 4 },
  dateWeekDay: { fontSize: 10, fontWeight: '600', color: colors.onSurfaceVariant, marginBottom: 4 },
  dateBubbleClip: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 1.5, borderColor: colors.cardBorder },
  dateBubbleClipActive: { borderColor: colors.primary },
  dateBubbleOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.45)' },
  dateBubbleOverlayActive: { backgroundColor: 'rgba(255,255,255,0.15)' },
  dateNum: { fontSize: 15, fontWeight: '700', color: colors.onSurface },
  dateNumActive: { color: colors.blackText },
  dateMon: { fontSize: 9, fontWeight: '500', color: colors.onSurfaceVariant, marginTop: 4 },
  dateActive: { color: colors.onSurface, fontWeight: '700' },

  /* Meal card */
  mealCard: { marginBottom: 10 },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  mealName: { fontSize: 17, fontWeight: '700', color: colors.onSurface, letterSpacing: -0.2 },
  mealTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  mealTime: { fontSize: 12, fontWeight: '500', color: colors.onSurfaceVariant },
  mealBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 },
  doneBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.proteinBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(5,150,105,0.08)' },
  doneBadgeText: { fontSize: 11, fontWeight: '700', color: colors.proteinText },
  kcalChip: { backgroundColor: 'rgba(74,180,255,0.08)', borderRadius: radius.kcalBadge, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(74,180,255,0.12)' },
  kcalText: { fontSize: 13, fontWeight: '700', color: colors.mealKcal },
  mealBody: { flexDirection: 'row', gap: 12 },
  foodCol: { flex: 1 },
  notesText: { fontSize: 13, fontWeight: '400', color: colors.onSurfaceVariant, fontStyle: 'italic', marginTop: 10 },

  /* Empty */
  emptyCard: { alignItems: 'center', marginTop: 24 },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 16, overflow: 'hidden' },
  emptyIconOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.65)' },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.onSurface, marginBottom: 8 },
  emptySub: { fontSize: 14, fontWeight: '400', color: colors.onSurfaceVariant, textAlign: 'center', lineHeight: 22 },
  noMealsText: { color: colors.onSurfaceVariant, textAlign: 'center' },
});
