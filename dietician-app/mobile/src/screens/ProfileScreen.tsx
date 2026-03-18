import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, Surface, Divider } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuthStore } from '../store/authStore';
import { signOut } from '../services/authService';
import { Colors } from '../theme/theme';

function getInitials(name: string): string {
  return (
    name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ?? '?'
  );
}

function bmiColor(category: string): string {
  switch (category?.toLowerCase()) {
    case 'underweight': return '#1565C0';
    case 'normal':      return Colors.success;
    case 'overweight':  return Colors.warning;
    case 'obese':       return '#C62828';
    default:            return Colors.primary;
  }
}

/* ─── Section header ─────────────────────────────────── */
function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionLabel}>{title}</Text>;
}

/* ─── Info row ───────────────────────────────────────── */
function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <MaterialCommunityIcons name={icon as never} size={16} color={Colors.textSecondary} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

/* ─── Stat pill ──────────────────────────────────────── */
function StatPill({
  label, value, sublabel, color,
}: {
  label: string; value: string; sublabel?: string; color?: string;
}) {
  return (
    <View style={styles.statPill}>
      <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
      {!!sublabel && <Text style={[styles.statSub, color ? { color, opacity: 0.75 } : null]}>{sublabel}</Text>}
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

/* ─── Tag ────────────────────────────────────────────── */
function Tag({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <View style={[styles.tag, { backgroundColor: bg }]}>
      <Text style={[styles.tagText, { color }]}>{label}</Text>
    </View>
  );
}

/* ─── Main screen ────────────────────────────────────── */
export default function ProfileScreen() {
  const { userProfile, reset } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [signingOut, setSigningOut] = useState(false);

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
      <View style={styles.centered}>
        <Text style={{ color: Colors.textSecondary }}>Loading profile…</Text>
      </View>
    );
  }

  const bmc = bmiColor(userProfile.bmiCategory);
  const hasBodyComp =
    userProfile.bodyFatPercent != null ||
    userProfile.muscleMass != null ||
    userProfile.boneMass != null ||
    userProfile.bmr != null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Page header ── */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Profile</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View>
        {/* ── Identity card ── */}
        <Surface style={styles.identityCard} elevation={1}>
          {/* Avatar */}
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{getInitials(userProfile.name)}</Text>
          </View>

          <Text style={styles.profileName}>{userProfile.name}</Text>
          <Text style={styles.profileUserId}>@{userProfile.userId}</Text>

          {/* Status pill */}
          <View style={[
            styles.statusPill,
            { backgroundColor: userProfile.status === 'active' ? '#E8F5E9' : '#FFF3E0' },
          ]}>
            <View style={[
              styles.statusDot,
              { backgroundColor: userProfile.status === 'active' ? Colors.success : Colors.warning },
            ]} />
            <Text style={[
              styles.statusText,
              { color: userProfile.status === 'active' ? '#2E7D32' : '#E65100' },
            ]}>
              {userProfile.status === 'active' ? 'Active Plan' : 'No Plan Assigned'}
            </Text>
          </View>
        </Surface>

        {/* ── Body stats strip ── */}
        <SectionHeader title="Body Stats" />
        <Surface style={styles.statsCard} elevation={1}>
          <StatPill label="Weight" value={`${userProfile.weight}`} sublabel="kg" color={Colors.primary} />
          <View style={styles.statDivider} />
          <StatPill label="Height" value={`${userProfile.height}`} sublabel="cm" color={Colors.secondary} />
          <View style={styles.statDivider} />
          <StatPill label="BMI" value={userProfile.bmi.toFixed(1)} sublabel={userProfile.bmiCategory} color={bmc} />
          <View style={styles.statDivider} />
          <StatPill label="Body Type" value={userProfile.bodyType} color={Colors.primary} />
        </Surface>

        {/* ── Personal info ── */}
        <SectionHeader title="Personal" />
        <Surface style={styles.card} elevation={1}>
          <InfoRow icon="cake-variant-outline" label="Age" value={`${userProfile.age} yrs`} />
          <Divider style={styles.divider} />
          <InfoRow icon="gender-male-female" label="Gender" value={userProfile.gender} />
          {!!userProfile.phone && (
            <>
              <Divider style={styles.divider} />
              <InfoRow icon="phone-outline" label="Phone" value={userProfile.phone} />
            </>
          )}
        </Surface>

        {/* ── Diet info ── */}
        <SectionHeader title="Diet" />
        <Surface style={styles.card} elevation={1}>
          <InfoRow icon="bullseye-arrow" label="Goal" value={userProfile.goal} />
          <Divider style={styles.divider} />
          <InfoRow icon="silverware-fork-knife" label="Preference" value={userProfile.preference} />

          {userProfile.allergies?.length > 0 && (
            <>
              <Divider style={styles.divider} />
              <View style={styles.tagSection}>
                <Text style={styles.tagSectionLabel}>Allergies</Text>
                <View style={styles.tagRow}>
                  {userProfile.allergies.map(a => (
                    <Tag key={a} label={a} bg="#FFEBEE" color="#C62828" />
                  ))}
                </View>
              </View>
            </>
          )}

          {userProfile.conditions?.length > 0 && (
            <>
              <Divider style={styles.divider} />
              <View style={styles.tagSection}>
                <Text style={styles.tagSectionLabel}>Conditions</Text>
                <View style={styles.tagRow}>
                  {userProfile.conditions.map(c => (
                    <Tag key={c} label={c} bg="#E8F5E9" color="#2E7D32" />
                  ))}
                </View>
              </View>
            </>
          )}

          {!!userProfile.medications && (
            <>
              <Divider style={styles.divider} />
              <InfoRow icon="pill" label="Medications" value={userProfile.medications} />
            </>
          )}
        </Surface>

        {/* ── Body composition ── */}
        {hasBodyComp && (
          <>
            <SectionHeader title="Body Composition" />
            <Surface style={styles.card} elevation={1}>
              {userProfile.bodyFatPercent != null && (
                <>
                  <InfoRow icon="percent" label="Body Fat" value={`${userProfile.bodyFatPercent}%`} />
                  <Divider style={styles.divider} />
                </>
              )}
              {userProfile.muscleMass != null && (
                <>
                  <InfoRow icon="arm-flex-outline" label="Muscle Mass" value={`${userProfile.muscleMass} kg`} />
                  <Divider style={styles.divider} />
                </>
              )}
              {userProfile.boneMass != null && (
                <>
                  <InfoRow icon="bone" label="Bone Mass" value={`${userProfile.boneMass} kg`} />
                  <Divider style={styles.divider} />
                </>
              )}
              {userProfile.bmr != null && (
                <InfoRow icon="fire-circle" label="BMR" value={`${userProfile.bmr} kcal/day`} />
              )}
            </Surface>
          </>
        )}

        {/* ── Sign out ── */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleSignOut}
          disabled={signingOut}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="logout" size={16} color={Colors.error} />
          <Text style={styles.signOutText}>
            {signingOut ? 'Signing out…' : 'Sign Out'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.background },
  centered:   { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },

  /* Page header */
  pageHeader: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, backgroundColor: Colors.background },
  pageTitle:  { fontSize: 22, fontWeight: '800', color: Colors.text },

  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 110 },

  /* Identity card */
  identityCard: { borderRadius: 20, backgroundColor: Colors.surface, alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20, marginBottom: 20 },
  avatarCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText:   { fontSize: 26, fontWeight: '800', color: Colors.primary },
  profileName:  { fontSize: 18, fontWeight: '800', color: Colors.text },
  profileUserId: { fontSize: 13, color: Colors.textSecondary, marginTop: 3, marginBottom: 12 },
  statusPill:   { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  statusDot:    { width: 7, height: 7, borderRadius: 4 },
  statusText:   { fontSize: 12, fontWeight: '700' },

  /* Section label */
  sectionLabel: { fontSize: 11, fontWeight: '800', color: Colors.textSecondary, letterSpacing: 1, marginBottom: 8, marginTop: 4 },

  /* Stats strip */
  statsCard:   { flexDirection: 'row', borderRadius: 18, backgroundColor: Colors.surface, paddingVertical: 16, paddingHorizontal: 8, marginBottom: 20 },
  statPill:    { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: Colors.surfaceVariant, marginVertical: 6 },
  statValue:   { fontSize: 16, fontWeight: '800', color: Colors.text },
  statSub:     { fontSize: 9, color: Colors.textSecondary, fontWeight: '600', marginTop: 1 },
  statLabel:   { fontSize: 10, color: Colors.textSecondary, fontWeight: '600', marginTop: 3 },

  /* Info card */
  card:     { borderRadius: 18, overflow: 'hidden', backgroundColor: Colors.surface, marginBottom: 20 },
  divider:  { marginHorizontal: 16, backgroundColor: Colors.surfaceVariant },
  infoRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 13 },
  infoLabel: { flex: 1, color: Colors.textSecondary, fontSize: 13 },
  infoValue: { color: Colors.text, fontSize: 13, fontWeight: '700', maxWidth: '55%', textAlign: 'right' },

  /* Tags */
  tagSection:      { paddingHorizontal: 16, paddingVertical: 12 },
  tagSectionLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600', marginBottom: 8 },
  tagRow:          { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag:             { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  tagText:         { fontSize: 11, fontWeight: '700' },

  /* Sign out */
  signOutBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: Colors.error + '40', marginTop: 4 },
  signOutText: { color: Colors.error, fontSize: 14, fontWeight: '700' },
});
