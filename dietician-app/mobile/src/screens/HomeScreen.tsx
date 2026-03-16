import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../store/authStore';
import { fetchActiveDietPlan } from '../services/dietPlanService';
import { signOut } from '../services/authService';
import { DayPlan, Meal } from '../types';

// Returns 1 (Mon) … 7 (Sun) for today
function getTodayDayNumber(): number {
  const jsDay = new Date().getDay(); // 0 = Sunday
  return jsDay === 0 ? 7 : jsDay;
}

function getTodayDayName(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' });
}

function getBmiColor(category: string): string {
  switch (category) {
    case 'Underweight': return '#f59e0b';
    case 'Normal': return '#16a34a';
    case 'Overweight': return '#f97316';
    case 'Obese': return '#dc2626';
    default: return '#6b7280';
  }
}

export default function HomeScreen() {
  const { userProfile, dietPlan, setDietPlan } = useAuthStore();
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const todayDayNumber = getTodayDayNumber();
  const todayName = getTodayDayName();

  const todayPlan: DayPlan | undefined = dietPlan?.days.find(
    (d) => d.day === todayDayNumber,
  );

  const totalCalories = todayPlan?.meals.reduce((sum, m) => sum + (m.calories || 0), 0) ?? 0;
  const totalProtein = todayPlan?.meals.reduce((sum, m) => sum + (m.protein || 0), 0) ?? 0;
  const totalCarbs = todayPlan?.meals.reduce((sum, m) => sum + (m.carbs || 0), 0) ?? 0;
  const totalFats = todayPlan?.meals.reduce((sum, m) => sum + (m.fats || 0), 0) ?? 0;

  const loadDietPlan = async () => {
    if (!userProfile) return;
    setLoadingPlan(true);
    try {
      const plan = await fetchActiveDietPlan(userProfile.id);
      setDietPlan(plan);
    } catch {
      setDietPlan(null);
    } finally {
      setLoadingPlan(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDietPlan();
    setRefreshing(false);
  };

  useEffect(() => {
    loadDietPlan();
  }, [userProfile?.id]);

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await signOut();
      useAuthStore.getState().clear();
    } finally {
      setLogoutLoading(false);
    }
  };

  if (!userProfile) {
    return (
      <SafeAreaView style={styles.centerScreen}>
        <ActivityIndicator size="large" color="#16a34a" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {userProfile.name.split(' ')[0]} 👋</Text>
          <Text style={styles.subGreeting}>Here's your plan for today</Text>
        </View>
        <TouchableOpacity
          style={[styles.logoutBtn, logoutLoading && { opacity: 0.6 }]}
          onPress={handleLogout}
          disabled={logoutLoading}
          activeOpacity={0.8}
        >
          {logoutLoading ? (
            <ActivityIndicator size="small" color="#dc2626" />
          ) : (
            <Text style={styles.logoutText}>Logout</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#16a34a" />
        }
      >
        {/* Profile Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>My Profile</Text>
          <View style={styles.profileGrid}>
            <StatItem label="Age" value={`${userProfile.age} yrs`} />
            <StatItem label="Gender" value={userProfile.gender} />
            <StatItem label="Weight" value={`${userProfile.weight} kg`} />
            <StatItem label="Height" value={`${userProfile.height} cm`} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>BMI</Text>
              <Text style={[styles.statValue, { color: getBmiColor(userProfile.bmiCategory) }]}>
                {userProfile.bmi.toFixed(1)}
              </Text>
              <Text style={[styles.bmiCategory, { color: getBmiColor(userProfile.bmiCategory) }]}>
                {userProfile.bmiCategory}
              </Text>
            </View>
            <StatItem label="Goal" value={userProfile.goal} accent />
          </View>

          {/* Diet preferences row */}
          <View style={styles.divider} />
          <View style={styles.prefRow}>
            <View style={styles.chip}>
              <Text style={styles.chipText}>{userProfile.preference}</Text>
            </View>
            {userProfile.bodyType ? (
              <View style={[styles.chip, styles.chipGray]}>
                <Text style={[styles.chipText, styles.chipTextGray]}>{userProfile.bodyType}</Text>
              </View>
            ) : null}
            {userProfile.allergies?.length > 0 && (
              <View style={[styles.chip, styles.chipRed]}>
                <Text style={[styles.chipText, styles.chipTextRed]}>
                  {userProfile.allergies.length} allerg{userProfile.allergies.length > 1 ? 'ies' : 'y'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Diet Plan Card */}
        <View style={styles.card}>
          <View style={styles.planHeader}>
            <View>
              <Text style={styles.sectionTitle}>Today's Meals</Text>
              <Text style={styles.planSubtitle}>{todayName}</Text>
            </View>
            {dietPlan && (
              <View style={styles.planBadge}>
                <Text style={styles.planBadgeText} numberOfLines={1}>
                  {dietPlan.templateName}
                </Text>
              </View>
            )}
          </View>

          {loadingPlan ? (
            <ActivityIndicator style={{ marginVertical: 24 }} color="#16a34a" />
          ) : !dietPlan ? (
            <View style={styles.emptyPlan}>
              <Text style={styles.emptyPlanIcon}>📋</Text>
              <Text style={styles.emptyPlanText}>No diet plan assigned yet.</Text>
              <Text style={styles.emptyPlanSub}>Your dietician will assign one soon.</Text>
            </View>
          ) : !todayPlan || todayPlan.meals.length === 0 ? (
            <View style={styles.emptyPlan}>
              <Text style={styles.emptyPlanIcon}>😴</Text>
              <Text style={styles.emptyPlanText}>No meals planned for today.</Text>
            </View>
          ) : (
            <>
              {/* Macro summary */}
              <View style={styles.macroRow}>
                <MacroChip label="Calories" value={`${totalCalories}`} unit="kcal" color="#f97316" />
                <MacroChip label="Protein" value={`${totalProtein}g`} unit="" color="#6366f1" />
                <MacroChip label="Carbs" value={`${totalCarbs}g`} unit="" color="#eab308" />
                <MacroChip label="Fats" value={`${totalFats}g`} unit="" color="#ec4899" />
              </View>

              {/* Meals */}
              {todayPlan.meals.map((meal) => (
                <MealCard key={meal.id} meal={meal} />
              ))}
            </>
          )}
        </View>

        {/* Conditions / Medications */}
        {(userProfile.conditions?.length > 0 || userProfile.medications) && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Health Notes</Text>
            {userProfile.conditions?.length > 0 && (
              <View style={styles.healthRow}>
                <Text style={styles.healthLabel}>Conditions</Text>
                <View style={styles.chipWrap}>
                  {userProfile.conditions.map((c) => (
                    <View key={c} style={[styles.chip, styles.chipOrange]}>
                      <Text style={[styles.chipText, styles.chipTextOrange]}>{c}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            {userProfile.medications ? (
              <View style={styles.healthRow}>
                <Text style={styles.healthLabel}>Medications</Text>
                <Text style={styles.healthValue}>{userProfile.medications}</Text>
              </View>
            ) : null}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ── Sub-components ─────────────────────────────────────────────── */

function StatItem({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, accent && styles.statValueAccent]}>{value}</Text>
    </View>
  );
}

function MacroChip({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: string;
  unit: string;
  color: string;
}) {
  return (
    <View style={[styles.macroChip, { borderColor: color + '33' }]}>
      <Text style={[styles.macroValue, { color }]}>
        {value}
        {unit}
      </Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

function MealCard({ meal }: { meal: Meal }) {
  return (
    <View style={styles.mealCard}>
      <View style={styles.mealHeader}>
        <View>
          <Text style={styles.mealName}>{meal.name}</Text>
          <Text style={styles.mealTime}>{meal.time}</Text>
        </View>
        <View style={styles.mealMacros}>
          <Text style={styles.mealCalories}>{meal.calories} kcal</Text>
          <Text style={styles.mealMacroSub}>
            P {meal.protein}g · C {meal.carbs}g · F {meal.fats}g
          </Text>
        </View>
      </View>

      <View style={styles.itemList}>
        {meal.items.map((item, idx) => (
          <View key={idx} style={styles.foodItem}>
            <View style={styles.dot} />
            <Text style={styles.foodItemText}>{item.name}</Text>
          </View>
        ))}
      </View>

      {!!meal.notes && (
        <View style={styles.noteBox}>
          <Text style={styles.noteText}>📝 {meal.notes}</Text>
        </View>
      )}
    </View>
  );
}

/* ── Styles ──────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  centerScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  greeting: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  subGreeting: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  logoutBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  logoutText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },

  /* Card */
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },

  /* Profile grid */
  profileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statItem: {
    width: '30%',
    minWidth: 90,
  },
  statLabel: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginTop: 2,
  },
  statValueAccent: {
    color: '#16a34a',
  },
  bmiCategory: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: 14,
  },
  prefRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#dcfce7',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  chipGray: {
    backgroundColor: '#f3f4f6',
  },
  chipRed: {
    backgroundColor: '#fef2f2',
  },
  chipOrange: {
    backgroundColor: '#fff7ed',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803d',
  },
  chipTextGray: {
    color: '#6b7280',
  },
  chipTextRed: {
    color: '#dc2626',
  },
  chipTextOrange: {
    color: '#c2410c',
  },

  /* Plan header */
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  planSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
    marginBottom: 12,
  },
  planBadge: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    maxWidth: 150,
  },
  planBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1d4ed8',
  },

  /* Macro row */
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 6,
  },
  macroChip: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 8,
    backgroundColor: '#fafafa',
  },
  macroValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  macroLabel: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
    fontWeight: '500',
  },

  /* Meal card */
  mealCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    backgroundColor: '#fafafa',
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  mealName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  mealTime: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '500',
    marginTop: 2,
  },
  mealMacros: {
    alignItems: 'flex-end',
  },
  mealCalories: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f97316',
  },
  mealMacroSub: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  itemList: {
    gap: 5,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#16a34a',
  },
  foodItemText: {
    fontSize: 13,
    color: '#374151',
  },
  noteBox: {
    marginTop: 10,
    backgroundColor: '#fffbeb',
    borderRadius: 8,
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#fbbf24',
  },
  noteText: {
    fontSize: 12,
    color: '#78350f',
  },

  /* Empty plan */
  emptyPlan: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  emptyPlanIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyPlanText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  emptyPlanSub: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 4,
  },

  /* Health notes */
  healthRow: {
    marginBottom: 12,
  },
  healthLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  healthValue: {
    fontSize: 14,
    color: '#374151',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
});
