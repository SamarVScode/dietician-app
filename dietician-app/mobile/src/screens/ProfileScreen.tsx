import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, Divider } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuthStore } from '../store/authStore';
import { signOut } from '../services/authService';
import { Colors, Typography, Spacing, Radius, Shadows } from '../theme/theme';
import { Card } from '../components/Card';
import { SectionLabel } from '../components/SectionLabel';

function getInitials(name: string): string {
  return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? '?';
}

function bmiColor(category: string): string {
  switch (category?.toLowerCase()) {
    case 'underweight': return Colors.info;
    case 'normal':      return Colors.success;
    case 'overweight':  return Colors.warning;
    case 'obese':       return Colors.error;
    default:            return Colors.primary;
  }
}

/* ─── Info row ───────────────────────────────────────── */
function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <MaterialCommunityIcons name={icon as never} size={15} color={Colors.primary} />
      </View>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
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
    return <View style={styles.centered}><Text style={{ color: Colors.textSecondary }}>Loading profile…</Text></View>;
  }

  const bmc = bmiColor(userProfile.bmiCategory);
  const hasBodyComp = userProfile.bodyFatPercent != null || userProfile.muscleMass != null || userProfile.boneMass != null || userProfile.bmr != null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Page header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Profile</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Identity card ── */}
        <Card shadow="md" style={styles.identityCard} padding={0}>
          <LinearGradient
            colors={[Colors.primary, Colors.primaryMid]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.identityGrad}
          >
            {/* Avatar circle */}
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{getInitials(userProfile.name)}</Text>
            </View>
            <Text style={styles.profileName}>{userProfile.name}</Text>
            <Text style={styles.profileUserId}>@{userProfile.userId}</Text>
          </LinearGradient>

          {/* Status pill */}
          <View style={[
            styles.statusPill,
            { backgroundColor: userProfile.status === 'active' ? '#ECFDF5' : '#FFFBEB' },
          ]}>
            <View style={[
              styles.statusDot,
              { backgroundColor: userProfile.status === 'active' ? Colors.success : Colors.warning },
            ]} />
            <Text style={[
              styles.statusText,
              { color: userProfile.status === 'active' ? '#065F46' : '#92400E' },
            ]}>
              {userProfile.status === 'active' ? 'Active Plan' : 'No Plan Assigned'}
            </Text>
          </View>
        </Card>

        {/* ── Body stats ── */}
        <SectionLabel title="Body Stats" />
        <Card shadow="sm" style={styles.statsCard} padding={0}>
          {[
            { label: 'Weight',    value: `${userProfile.weight}`, sub: 'kg',  color: Colors.primary },
            { label: 'Height',    value: `${userProfile.height}`, sub: 'cm',  color: Colors.info },
            { label: 'BMI',       value: userProfile.bmi.toFixed(1), sub: userProfile.bmiCategory, color: bmc },
            { label: 'Body Type', value: userProfile.bodyType, sub: undefined, color: Colors.primary },
          ].map(({ label, value, sub, color }, idx, arr) => (
            <React.Fragment key={label}>
              <View style={styles.statPill}>
                <Text style={[styles.statValue, { color }]}>{value}</Text>
                {!!sub && <Text style={[styles.statSub, { color, opacity: 0.7 }]}>{sub}</Text>}
                <Text style={styles.statLabel}>{label}</Text>
              </View>
              {idx < arr.length - 1 && <View style={styles.statDivider} />}
            </React.Fragment>
          ))}
        </Card>

        {/* ── Personal ── */}
        <SectionLabel title="Personal" />
        <Card shadow="sm" style={styles.card} padding={0}>
          <InfoRow icon="cake-variant-outline" label="Age" value={`${userProfile.age} yrs`} />
          <Divider style={styles.divider} />
          <InfoRow icon="gender-male-female" label="Gender" value={userProfile.gender} />
          {!!userProfile.phone && <>
            <Divider style={styles.divider} />
            <InfoRow icon="phone-outline" label="Phone" value={userProfile.phone} />
          </>}
        </Card>

        {/* ── Diet ── */}
        <SectionLabel title="Diet" />
        <Card shadow="sm" style={styles.card} padding={0}>
          <InfoRow icon="bullseye-arrow"         label="Goal"       value={userProfile.goal} />
          <Divider style={styles.divider} />
          <InfoRow icon="silverware-fork-knife"  label="Preference" value={userProfile.preference} />

          {userProfile.allergies?.length > 0 && (
            <>
              <Divider style={styles.divider} />
              <View style={styles.tagSection}>
                <Text style={styles.tagSectionLabel}>Allergies</Text>
                <View style={styles.tagRow}>
                  {userProfile.allergies.map(a => <Tag key={a} label={a} bg="#FEE2E2" color="#991B1B" />)}
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
                  {userProfile.conditions.map(c => <Tag key={c} label={c} bg="#DCFCE7" color="#166534" />)}
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
        </Card>

        {/* ── Body composition ── */}
        {hasBodyComp && (
          <>
            <SectionLabel title="Body Composition" />
            <Card shadow="sm" style={styles.card} padding={0}>
              {userProfile.bodyFatPercent != null && <>
                <InfoRow icon="percent"        label="Body Fat"    value={`${userProfile.bodyFatPercent}%`} />
                <Divider style={styles.divider} />
              </>}
              {userProfile.muscleMass != null && <>
                <InfoRow icon="arm-flex-outline" label="Muscle Mass" value={`${userProfile.muscleMass} kg`} />
                <Divider style={styles.divider} />
              </>}
              {userProfile.boneMass != null && <>
                <InfoRow icon="bone"           label="Bone Mass"  value={`${userProfile.boneMass} kg`} />
                <Divider style={styles.divider} />
              </>}
              {userProfile.bmr != null && <InfoRow icon="fire-circle" label="BMR" value={`${userProfile.bmr} kcal/day`} />}
            </Card>
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
          <Text style={styles.signOutText}>{signingOut ? 'Signing out…' : 'Sign Out'}</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered:  { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },

  pageHeader: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 14, backgroundColor: Colors.background },
  pageTitle:  { ...Typography.displaySm, color: Colors.text },

  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.xs, paddingBottom: 110 },

  /* Identity card */
  identityCard: { overflow: 'hidden', marginBottom: Spacing.lg },
  identityGrad: { alignItems: 'center', paddingTop: Spacing.xl, paddingBottom: Spacing.lg, paddingHorizontal: Spacing.lg },
  avatarCircle: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md,
  },
  avatarText:    { ...Typography.displaySm, color: '#FFFFFF' },
  profileName:   { ...Typography.headingLg, color: '#FFFFFF', marginBottom: 4 },
  profileUserId: { ...Typography.bodyMd, color: 'rgba(255,255,255,0.65)' },
  statusPill:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.md, paddingVertical: 12 },
  statusDot:     { width: 7, height: 7, borderRadius: 4 },
  statusText:    { ...Typography.labelMd },

  /* Body stats */
  statsCard:   { flexDirection: 'row', marginBottom: Spacing.lg },
  statPill:    { flex: 1, alignItems: 'center', paddingVertical: Spacing.md },
  statDivider: { width: 1, backgroundColor: Colors.surfaceVariant, marginVertical: Spacing.sm },
  statValue:   { ...Typography.headingMd, marginBottom: 2 },
  statSub:     { ...Typography.caption, fontWeight: '600', marginBottom: 3 },
  statLabel:   { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600' },

  /* Info card */
  card:     { marginBottom: Spacing.lg, overflow: 'hidden' },
  divider:  { marginHorizontal: Spacing.md, backgroundColor: Colors.surfaceVariant },
  infoRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: Spacing.md, paddingVertical: 13 },
  infoIconWrap: { width: 28, height: 28, borderRadius: Radius.sm, backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  infoLabel:{ flex: 1, ...Typography.bodyMd, color: Colors.textSecondary },
  infoValue:{ ...Typography.bodyMd, color: Colors.text, fontWeight: '700', maxWidth: '55%', textAlign: 'right' },

  /* Tags */
  tagSection:      { paddingHorizontal: Spacing.md, paddingVertical: 12 },
  tagSectionLabel: { ...Typography.labelMd, color: Colors.textSecondary, marginBottom: Spacing.sm },
  tagRow:          { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag:             { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  tagText:         { ...Typography.labelSm },

  /* Sign out */
  signOutBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.error + '44', marginTop: Spacing.xs, backgroundColor: '#FEF2F2' },
  signOutText: { ...Typography.labelLg, color: Colors.error },
});
