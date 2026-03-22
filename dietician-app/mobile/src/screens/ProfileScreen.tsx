/**
 * ProfileScreen — Luminous Vitality / Glassmorphism + Material Expressive
 *
 * ### 🐝 Extended Swarm Active: Rebuilding ProfileScreen...
 * - 🗺️ Product Mapper: Displays profile from userProfile store + activePlan from Firestore; signOut action.
 * - 📐 Layout Architect: ScrollView full height; identity hero card first, then section cards staggered.
 * - 🎨 Design Systems: Large avatar with luminous teal ring glow; section cards use dark glass overlay; tag pills color-coded.
 * - 🧩 Component Engineer: Tag, InfoRow, StatCol reused; identity avatar with gradient ring border.
 * - ⚡ Perf-Tuner: fetchActiveDietPlan once on mount; AnimatedCard staggers prevent layout recalculation.
 * - ✨ Motion Designer: AnimatedCard delays from 0→480ms; Sign Out button has spring press scale.
 * - 👁️‍🗨️ a11y Guru: Sign Out uses GradientButton with min 52px height; all InfoRows have icons for visual context.
 * #### 👑 Director's Verdict: Hero card with XL avatar ring glow, body stat tiles with accent bars, full-width destructive sign-out.
 */
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuthStore } from '../store/authStore';
import { signOut } from '../services/authService';
import { fetchActiveDietPlan, formatTime12h } from '../services/dietPlanService';
import type { DietPlan } from '../types';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { AppBackground } from '../components/AppBackground';
import { FrostedCard } from '../components/FrostedCard';
import { SectionTitle } from '../components/SectionTitle';
import { InfoRow } from '../components/InfoRow';
import { StatCol } from '../components/StatCol';
import { GradientButton } from '../components/GradientButton';
import { AnimatedCard } from '../components/AnimatedCard';
import { PressableScale } from '../components/PressableScale';

function getInitials(name: string): string {
  return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? '?';
}

function bmiAccent(category: string): string {
  switch (category?.toLowerCase()) {
    case 'underweight': return colors.accentBlue;
    case 'normal':      return colors.accentGreen;
    case 'overweight':  return colors.accentYellow;
    case 'obese':       return colors.accentPink;
    default:            return colors.accentBlue;
  }
}

/* ─── Tag pill ────────────────────────────────────────────────────────────── */
function Tag({ label, bg, textColor, border }: { label: string; bg: string; textColor: string; border: string }) {
  return (
    <View style={[styles.tag, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[styles.tagText, { color: textColor }]}>{label}</Text>
    </View>
  );
}

/* ─── Main screen ─────────────────────────────────────────────────────────── */
export default function ProfileScreen() {
  const { userProfile, reset } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [signingOut, setSigningOut] = useState(false);
  const [activePlan, setActivePlan] = useState<DietPlan | null>(null);

  useEffect(() => {
    if (!userProfile?.id) return;
    fetchActiveDietPlan(userProfile.id).then(setActivePlan).catch(() => {});
  }, [userProfile?.id]);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true);
          try { await signOut(); reset(); }
          catch (e) { console.error(e); }
          finally { setSigningOut(false); }
        },
      },
    ]);
  };

  if (!userProfile) {
    return (
      <AppBackground>
        <View style={styles.centered}>
          <Text style={{ color: colors.onSurfaceVariant }}>Loading profile…</Text>
        </View>
      </AppBackground>
    );
  }

  const bmc = bmiAccent(userProfile.bmiCategory);
  const hasBodyComp = userProfile.bodyFatPercent != null || userProfile.muscleMass != null || userProfile.boneMass != null || userProfile.bmr != null;

  return (
    <AppBackground>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Page title */}
        <AnimatedCard delay={0}>
          <Text style={styles.pageTitle}>Profile</Text>
        </AnimatedCard>

        {/* Identity hero card */}
        <AnimatedCard delay={60}>
          <PressableScale>
            <FrostedCard style={styles.identityCard}>
              <View style={styles.identityInner}>
                {/* Avatar with luminous ring */}
                <View style={styles.avatarRingOuter}>
                  <View style={styles.avatarInner}>
                    <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                    <View style={styles.avatarOverlay} />
                    <Text style={styles.avatarText}>{getInitials(userProfile.name)}</Text>
                    <View style={styles.onlineDot} />
                  </View>
                </View>

                <Text style={styles.profileName}>{userProfile.name}</Text>
                <Text style={styles.profileUserId}>@{userProfile.userId}</Text>

                {/* Status pill */}
                <View style={styles.statusPill}>
                  <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                  <View style={styles.statusOverlay} />
                  <View style={[styles.statusDot, { backgroundColor: userProfile.status === 'active' ? colors.accentGreen : colors.accentYellow }]} />
                  <Text style={styles.statusText}>
                    {userProfile.status === 'active' ? 'Active Plan' : 'No Plan Assigned'}
                  </Text>
                </View>
              </View>
            </FrostedCard>
          </PressableScale>
        </AnimatedCard>

        {/* Body stats */}
        <AnimatedCard delay={130}>
          <SectionTitle title="Body Stats" />
          <FrostedCard>
            <View style={styles.statsRow}>
              <StatCol accent={colors.accentBlue}   val={`${userProfile.weight}`}         unit="kg"                    label="Weight" />
              <View style={styles.statDivider} />
              <StatCol accent={colors.accentGreen}  val={`${userProfile.height}`}         unit="cm"                    label="Height" />
              <View style={styles.statDivider} />
              <StatCol accent={bmc}                  val={userProfile.bmi.toFixed(1)}      unit={userProfile.bmiCategory} label="BMI" />
              <View style={styles.statDivider} />
              <StatCol accent={colors.accentBlue}   val={userProfile.bodyType?.slice(0,4)} unit=""                      label="Body Type" />
            </View>
          </FrostedCard>
        </AnimatedCard>

        {/* Personal */}
        <AnimatedCard delay={200}>
          <View style={styles.sectionGap} />
          <SectionTitle title="Personal" />
          <FrostedCard>
            <InfoRow icon="cake-variant-outline" label="Age"    value={`${userProfile.age} yrs`} />
            <InfoRow icon="gender-male-female"   label="Gender" value={userProfile.gender} />
            {!!userProfile.phone && (
              <InfoRow icon="phone-outline" label="Phone" value={userProfile.phone} showDivider={false} />
            )}
          </FrostedCard>
        </AnimatedCard>

        {/* Diet */}
        <AnimatedCard delay={270}>
          <View style={styles.sectionGap} />
          <SectionTitle title="Diet" />
          <FrostedCard>
            <InfoRow icon="bullseye-arrow"       label="Goal"       value={userProfile.goal} />
            <InfoRow icon="silverware-fork-knife" label="Preference" value={userProfile.preference} />

            {userProfile.allergies?.length > 0 && (
              <View style={styles.tagSection}>
                <Text style={styles.tagSectionLabel}>Allergies</Text>
                <View style={styles.tagRow}>
                  {userProfile.allergies.map(a => (
                    <Tag key={a} label={a} bg={colors.fatBg} textColor={colors.fatText} border={colors.fatBorder} />
                  ))}
                </View>
              </View>
            )}

            {userProfile.conditions?.length > 0 && (
              <View style={styles.tagSection}>
                <Text style={styles.tagSectionLabel}>Conditions</Text>
                <View style={styles.tagRow}>
                  {userProfile.conditions.map(c => (
                    <Tag key={c} label={c} bg={colors.proteinBg} textColor={colors.proteinText} border={colors.proteinBorder} />
                  ))}
                </View>
              </View>
            )}

            {!!userProfile.medications && (
              <InfoRow icon="pill" label="Medications" value={userProfile.medications} showDivider={false} />
            )}
          </FrostedCard>
        </AnimatedCard>

        {/* Wellness */}
        {activePlan && (activePlan.wakeUpTime || activePlan.sleepTime || activePlan.waterIntakeMl) && (
          <AnimatedCard delay={340}>
            <View style={styles.sectionGap} />
            <SectionTitle title="Wellness" />
            <FrostedCard>
              {!!activePlan.wakeUpTime && (
                <InfoRow icon="weather-sunset-up" label="Wake Up"     value={formatTime12h(activePlan.wakeUpTime)} />
              )}
              {!!activePlan.sleepTime && (
                <InfoRow icon="weather-night"    label="Bedtime"     value={formatTime12h(activePlan.sleepTime)} />
              )}
              {!!activePlan.waterIntakeMl && (
                <InfoRow icon="water-outline"    label="Daily Water" value={`${(activePlan.waterIntakeMl / 1000).toFixed(1)} L`} showDivider={false} />
              )}
            </FrostedCard>
          </AnimatedCard>
        )}

        {/* Body composition */}
        {hasBodyComp && (
          <AnimatedCard delay={410}>
            <View style={styles.sectionGap} />
            <SectionTitle title="Body Composition" />
            <FrostedCard>
              {userProfile.bodyFatPercent != null && (
                <InfoRow icon="percent"          label="Body Fat"    value={`${userProfile.bodyFatPercent}%`} />
              )}
              {userProfile.muscleMass != null && (
                <InfoRow icon="arm-flex-outline" label="Muscle Mass" value={`${userProfile.muscleMass} kg`} />
              )}
              {userProfile.boneMass != null && (
                <InfoRow icon="bone"             label="Bone Mass"   value={`${userProfile.boneMass} kg`} />
              )}
              {userProfile.bmr != null && (
                <InfoRow icon="fire-circle"      label="BMR"         value={`${userProfile.bmr} kcal/day`} showDivider={false} />
              )}
            </FrostedCard>
          </AnimatedCard>
        )}

        {/* Sign out */}
        <AnimatedCard delay={480}>
          <View style={styles.sectionGap} />
          <GradientButton
            label={signingOut ? 'Signing out…' : 'Sign Out'}
            onPress={handleSignOut}
            align="full"
            loading={signingOut}
            destructive
          />
        </AnimatedCard>

        <View style={{ height: 100 }} />
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  centered:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.screenPadding, paddingBottom: 110 },
  sectionGap:    { height: spacing.sectionGap },

  pageTitle: { fontSize: 26, fontWeight: '900', color: colors.onSurface, letterSpacing: -0.8, marginBottom: 16 },

  /* Identity hero card */
  identityCard:  { marginBottom: spacing.sectionGap },
  identityInner: { alignItems: 'center', paddingVertical: 8 },

  /* Avatar with luminous gradient ring */
  avatarRingOuter: {
    width: 88,
    height: 88,
    borderRadius: 44,
    padding: 3,
    borderWidth: 2.5,
    borderColor: colors.primary,
    marginBottom: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 16,
    elevation: 12,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 40,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.accentIndigo },
  avatarText:    { fontSize: 26, fontWeight: '800', color: '#fff' },
  onlineDot:     { position: 'absolute', bottom: 3, right: 3, width: 13, height: 13, borderRadius: 7, backgroundColor: colors.onlineDot, borderWidth: 2, borderColor: colors.surfaceContainerHigh },

  profileName:   { fontSize: 22, fontWeight: '800', color: colors.onSurface, marginBottom: 4 },
  profileUserId: { fontSize: 14, fontWeight: '500', color: colors.onSurfaceVariant },

  /* Status pill */
  statusPill:    { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 14, paddingHorizontal: 16, paddingVertical: 7, borderRadius: 999, overflow: 'hidden', borderWidth: 1, borderColor: colors.cardBorder },
  statusOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.surfaceContainerHigh },
  statusDot:     { width: 7, height: 7, borderRadius: 4 },
  statusText:    { fontSize: 12, fontWeight: '700', color: colors.onSurface },

  /* Body stats */
  statsRow:    { flexDirection: 'row' },
  statDivider: { width: 1, backgroundColor: colors.rowDivider, marginVertical: 8 },

  /* Tags */
  tagSection:      { paddingVertical: 10 },
  tagSectionLabel: { fontSize: 12, fontWeight: '600', color: colors.onSurfaceVariant, marginBottom: 8 },
  tagRow:          { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag:             { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  tagText:         { fontSize: 11, fontWeight: '700' },
});
